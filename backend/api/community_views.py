import json
from django.utils import timezone
from django.db.models import Count, Q
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Usr, AuditLog, CommunityChannel, CommunityMessage, CommunityMemberProfile
from .views import check_admin_permission

DEFAULT_CHANNELS = [
    {
        'slug': 'general-architecture',
        'name': 'general-architecture',
        'topic': 'Landscape spatial design, zoning regulations, and master planning concepts',
        'pinned_announcement': '📌 Welcome to the 2026 Studio! Share portfolio drafts, field challenges, and project milestones.',
        'is_active': True,
        'is_read_only': False
    },
    {
        'slug': 'site-grading-swales',
        'name': 'site-grading-swales',
        'topic': 'Topographical contours, cut-and-fill balance, and stormwater management',
        'pinned_announcement': '📌 Tip: Always verify benchmark elevation before calculating run-to-rise swale invert depths.',
        'is_active': True,
        'is_read_only': False
    },
    {
        'slug': 'hardscape-masonry',
        'name': 'hardscape-masonry',
        'topic': 'Dry-stack vs mortared stone, retaining wall footers, and geogrid ties',
        'pinned_announcement': '📌 Specification: Hydrostatic weep holes must be set at 6-8ft intervals with crushed washed gravel backfill.',
        'is_active': True,
        'is_read_only': False
    },
    {
        'slug': 'botanical-lighting',
        'name': 'botanical-lighting',
        'topic': 'Xeriscaping, native plant matrices, micro-climates, and low-voltage lumen schemes',
        'pinned_announcement': '📌 Recommended Kelvin: 2700K warm white for foliage uplighting, 3000K for stone column washes.',
        'is_active': True,
        'is_read_only': False
    },
    {
        'slug': 'ask-instructors',
        'name': 'ask-instructors',
        'topic': 'Direct Q&A with masterclass faculty and licensed landscape architects',
        'pinned_announcement': '📌 Instructors host live studio critique sessions every Tuesday & Thursday at 6:00 PM EST.',
        'is_active': True,
        'is_read_only': False
    }
]

def ensure_default_channels():
    if CommunityChannel.objects.count() == 0:
        for ch in DEFAULT_CHANNELS:
            CommunityChannel.objects.get_or_create(
                slug=ch['slug'],
                defaults=ch
            )

def serialize_message(msg):
    author = msg.user
    profile = getattr(author, 'profile', None)
    comm_profile = getattr(author, 'community_profile', None)
    
    avatar = None
    if profile and profile.avatar:
        avatar = profile.avatar.url
    
    is_staff_mod = author.role in ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN'] or author.is_staff
    display_role = comm_profile.custom_role_title if (comm_profile and comm_profile.custom_role_title) else (
        'Course Instructor' if author.role == 'INSTRUCTOR' else (
            'Lead Faculty' if author.role in ['SUPER_ADMIN', 'CONTENT_MANAGER'] else (
                'Staff Architect' if is_staff_mod else 'Student Architect'
            )
        )
    )

    return {
        'id': msg.id,
        'channel_slug': msg.channel.slug,
        'sender': author.full_name or author.email.split('@')[0],
        'sender_email': author.email,
        'sender_id': author.id,
        'role': display_role,
        'user_role': author.role,
        'is_moderator': is_staff_mod,
        'avatar': avatar or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        'text': msg.content,
        'time': msg.created_at.strftime('%I:%M %p') if msg.created_at else '',
        'created_at': msg.created_at.isoformat() if msg.created_at else None,
        'is_pinned': msg.is_pinned,
        'is_flagged': msg.is_flagged,
        'flagged_count': msg.flagged_count,
        'reactions': msg.reactions or {}
    }

# =========================================================================
# PUBLIC / STUDENT COMMUNITY API
# =========================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_community_channels(request):
    """Returns active community channels with message counts and member stats."""
    ensure_default_channels()
    channels = CommunityChannel.objects.filter(is_active=True).annotate(
        msg_count=Count('messages', filter=Q(messages__is_deleted=False))
    )

    result = []
    for c in channels:
        result.append({
            'id': c.slug,
            'slug': c.slug,
            'name': c.name,
            'topic': c.topic,
            'pinned': c.pinned_announcement,
            'is_read_only': c.is_read_only,
            'message_count': c.msg_count,
            'membersCount': 200 + (c.msg_count * 3)
        })

    return Response({'channels': result}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_channel_messages(request, slug):
    """Returns messages for a specific channel."""
    ensure_default_channels()
    try:
        channel = CommunityChannel.objects.get(slug=slug, is_active=True)
    except CommunityChannel.DoesNotExist:
        return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

    messages = channel.messages.filter(is_deleted=False).select_related('user', 'user__profile').order_by('created_at')[:100]
    serialized = [serialize_message(m) for m in messages]

    return Response({
        'channel': {
            'slug': channel.slug,
            'name': channel.name,
            'topic': channel.topic,
            'pinned': channel.pinned_announcement,
            'is_read_only': channel.is_read_only
        },
        'messages': serialized
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_channel_message(request, slug):
    """Allows authenticated students or staff to post in the community channel."""
    ensure_default_channels()
    try:
        channel = CommunityChannel.objects.get(slug=slug, is_active=True)
    except CommunityChannel.DoesNotExist:
        return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

    usr = request.user
    comm_profile, _ = CommunityMemberProfile.objects.get_or_create(user=usr)

    if comm_profile.is_muted:
        reason = comm_profile.mute_reason or 'Your account has been temporarily muted by studio moderators.'
        return Response({'error': f'Cannot post: {reason}'}, status=status.HTTP_403_FORBIDDEN)

    is_mod = check_admin_permission(usr, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN'])
    if channel.is_read_only and not is_mod:
        return Response({'error': 'This channel is read-only for students. Only faculty and managers can post.'}, status=status.HTTP_403_FORBIDDEN)

    content = request.data.get('content') or request.data.get('text')
    if not content or not str(content).strip():
        return Response({'error': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

    msg = CommunityMessage.objects.create(
        channel=channel,
        user=usr,
        content=str(content).strip(),
        reactions={}
    )

    return Response({
        'message': 'Message posted successfully',
        'data': serialize_message(msg)
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def react_message(request, message_id):
    """Toggle or increment emoji reaction on a message."""
    try:
        msg = CommunityMessage.objects.get(id=message_id, is_deleted=False)
    except CommunityMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    emoji = request.data.get('emoji', '👍')
    reactions = msg.reactions or {}
    current = reactions.get(emoji, 0)
    reactions[emoji] = current + 1
    msg.reactions = reactions
    msg.save(update_fields=['reactions', 'updated_at'])

    return Response({'status': 'ok', 'reactions': msg.reactions}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def flag_message(request, message_id):
    """Report a message for moderator review."""
    try:
        msg = CommunityMessage.objects.get(id=message_id, is_deleted=False)
    except CommunityMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    msg.is_flagged = True
    msg.flagged_count = (msg.flagged_count or 0) + 1
    reason = request.data.get('reason', 'Reported by community member')
    if reason:
        msg.moderation_note = f"{msg.moderation_note}; {reason}".strip('; ')
    msg.save(update_fields=['is_flagged', 'flagged_count', 'moderation_note', 'updated_at'])

    return Response({'status': 'reported', 'flagged_count': msg.flagged_count}, status=status.HTTP_200_OK)


# =========================================================================
# COMMUNITY MANAGEMENT API (SUPER_ADMIN & CONTENT_MANAGER EXCLUSIVE)
# =========================================================================

def verify_community_manager(user):
    """Validates that user has SUPER_ADMIN, INSTRUCTOR, or CONTENT_MANAGER rights."""
    return check_admin_permission(user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_community_overview(request):
    """Overview metrics for Super Admin and Content Manager."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied. Content Manager or Super Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    ensure_default_channels()
    total_channels = CommunityChannel.objects.count()
    active_channels = CommunityChannel.objects.filter(is_active=True).count()
    total_messages = CommunityMessage.objects.filter(is_deleted=False).count()
    flagged_messages = CommunityMessage.objects.filter(is_flagged=True, is_deleted=False).count()
    muted_members = CommunityMemberProfile.objects.filter(is_muted=True).count()
    total_active_participants = CommunityMessage.objects.values('user').distinct().count()

    recent_flagged = CommunityMessage.objects.filter(is_flagged=True, is_deleted=False).select_related('user', 'channel').order_by('-updated_at')[:10]

    return Response({
        'stats': {
            'total_channels': total_channels,
            'active_channels': active_channels,
            'total_messages': total_messages,
            'flagged_messages': flagged_messages,
            'muted_members': muted_members,
            'active_participants': total_active_participants
        },
        'flagged_queue': [
            {
                'id': m.id,
                'channel': m.channel.name,
                'sender': m.user.email,
                'content': m.content,
                'flagged_count': m.flagged_count,
                'moderation_note': m.moderation_note,
                'created_at': m.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for m in recent_flagged
        ]
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_channels_list_create(request):
    """List or create channels (Content Manager & Super Admin)."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied. Content Manager or Super Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    ensure_default_channels()

    if request.method == 'GET':
        channels = CommunityChannel.objects.annotate(
            msg_count=Count('messages', filter=Q(messages__is_deleted=False))
        ).order_by('slug')

        data = []
        for c in channels:
            data.append({
                'id': c.id,
                'slug': c.slug,
                'name': c.name,
                'topic': c.topic,
                'pinned_announcement': c.pinned_announcement,
                'is_active': c.is_active,
                'is_read_only': c.is_read_only,
                'message_count': c.msg_count,
                'created_at': c.created_at.strftime('%Y-%m-%d')
            })
        return Response({'channels': data}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Channel name is required'}, status=status.HTTP_400_BAD_REQUEST)

        raw_slug = request.data.get('slug') or slugify(name)
        slug = slugify(raw_slug)

        if CommunityChannel.objects.filter(slug=slug).exists():
            return Response({'error': f'Channel with slug #{slug} already exists'}, status=status.HTTP_400_BAD_REQUEST)

        ch = CommunityChannel.objects.create(
            slug=slug,
            name=name,
            topic=request.data.get('topic', ''),
            pinned_announcement=request.data.get('pinned_announcement', ''),
            is_active=request.data.get('is_active', True),
            is_read_only=request.data.get('is_read_only', False),
            created_by=request.user
        )

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_CHANNEL_CREATED',
            target=f"#{slug}",
            details=f"Created channel {name} ({slug})"
        )

        return Response({
            'message': 'Channel created successfully',
            'channel': {
                'id': ch.id,
                'slug': ch.slug,
                'name': ch.name,
                'topic': ch.topic,
                'pinned_announcement': ch.pinned_announcement,
                'is_active': ch.is_active,
                'is_read_only': ch.is_read_only
            }
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_channel_detail(request, slug):
    """Update or delete channel (Content Manager & Super Admin)."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied. Content Manager or Super Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        ch = CommunityChannel.objects.get(slug=slug)
    except CommunityChannel.DoesNotExist:
        return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        if 'name' in request.data:
            ch.name = request.data['name']
        if 'topic' in request.data:
            ch.topic = request.data['topic']
        if 'pinned_announcement' in request.data:
            ch.pinned_announcement = request.data['pinned_announcement']
        if 'is_active' in request.data:
            ch.is_active = bool(request.data['is_active'])
        if 'is_read_only' in request.data:
            ch.is_read_only = bool(request.data['is_read_only'])
        ch.save()

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_CHANNEL_UPDATED',
            target=f"#{slug}",
            details=f"Updated channel #{slug}"
        )

        return Response({'message': 'Channel updated successfully'}, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        ch_name = ch.name
        ch.delete()

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_CHANNEL_DELETED',
            target=f"#{slug}",
            details=f"Deleted channel {ch_name} (#{slug})"
        )

        return Response({'message': f'Channel #{slug} deleted'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_messages_list(request):
    """List messages across channels with search and filters."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    qs = CommunityMessage.objects.filter(is_deleted=False).select_related('user', 'channel')

    channel_slug = request.GET.get('channel')
    if channel_slug:
        qs = qs.filter(channel__slug=channel_slug)

    flagged_only = request.GET.get('flagged_only')
    if flagged_only == 'true':
        qs = qs.filter(is_flagged=True)

    query = request.GET.get('q')
    if query:
        qs = qs.filter(Q(content__icontains=query) | Q(user__email__icontains=query))

    messages = qs.order_by('-created_at')[:80]
    return Response({
        'messages': [
            {
                'id': m.id,
                'channel_slug': m.channel.slug,
                'channel_name': m.channel.name,
                'sender_email': m.user.email,
                'sender_name': m.user.full_name or m.user.email.split('@')[0],
                'content': m.content,
                'is_pinned': m.is_pinned,
                'is_flagged': m.is_flagged,
                'flagged_count': m.flagged_count,
                'moderation_note': m.moderation_note,
                'created_at': m.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for m in messages
        ]
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_moderate_message(request, message_id):
    """Pin, delete, or dismiss flags on a message."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        msg = CommunityMessage.objects.get(id=message_id)
    except CommunityMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action') # 'delete', 'pin', 'unpin', 'dismiss_flag'

    if action == 'delete':
        msg.is_deleted = True
        msg.deleted_by = request.user
        msg.deleted_at = timezone.now()
        msg.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_MESSAGE_DELETED',
            target=f"Msg #{msg.id}",
            details=f"Deleted message from {msg.user.email} in #{msg.channel.slug}"
        )
        return Response({'message': 'Message removed by moderator'}, status=status.HTTP_200_OK)

    elif action == 'pin':
        msg.is_pinned = True
        msg.save(update_fields=['is_pinned', 'updated_at'])
        return Response({'message': 'Message pinned'}, status=status.HTTP_200_OK)

    elif action == 'unpin':
        msg.is_pinned = False
        msg.save(update_fields=['is_pinned', 'updated_at'])
        return Response({'message': 'Message unpinned'}, status=status.HTTP_200_OK)

    elif action == 'dismiss_flag':
        msg.is_flagged = False
        msg.flagged_count = 0
        msg.moderation_note = 'Flag dismissed by moderator'
        msg.save(update_fields=['is_flagged', 'flagged_count', 'moderation_note', 'updated_at'])
        return Response({'message': 'Flag dismissed'}, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_members_list(request):
    """List community participants with moderation controls."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    users = Usr.objects.filter(is_active=True).select_related('profile', 'community_profile').annotate(
        comm_msg_count=Count('community_messages', filter=Q(community_messages__is_deleted=False))
    ).order_by('-comm_msg_count', '-created_at')[:100]

    data = []
    for u in users:
        comm_prof = getattr(u, 'community_profile', None)
        data.append({
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name or '',
            'role': u.role,
            'is_staff': u.is_staff,
            'custom_role_title': comm_prof.custom_role_title if comm_prof else '',
            'is_muted': comm_prof.is_muted if comm_prof else False,
            'mute_reason': comm_prof.mute_reason if comm_prof else '',
            'messages_count': u.comm_msg_count
        })

    return Response({'members': data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_moderate_member(request, user_id):
    """Mute/unmute student or set custom role badge."""
    if not verify_community_manager(request.user):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_usr = Usr.objects.get(id=user_id)
    except Usr.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    comm_prof, _ = CommunityMemberProfile.objects.get_or_create(user=target_usr)
    action = request.data.get('action') # 'mute', 'unmute', 'update_title'

    if action == 'mute':
        reason = request.data.get('reason', 'Community guidelines violation')
        comm_prof.is_muted = True
        comm_prof.mute_reason = reason
        comm_prof.save()

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_MEMBER_MUTED',
            target=target_usr.email,
            details=f"Muted {target_usr.email}: {reason}"
        )
        return Response({'message': f'Member {target_usr.email} muted'}, status=status.HTTP_200_OK)

    elif action == 'unmute':
        comm_prof.is_muted = False
        comm_prof.mute_reason = ''
        comm_prof.save()

        AuditLog.objects.create(
            actor=request.user,
            action='COMMUNITY_MEMBER_UNMUTED',
            target=target_usr.email,
            details=f"Unmuted {target_usr.email}"
        )
        return Response({'message': f'Member {target_usr.email} unmuted'}, status=status.HTTP_200_OK)

    elif action == 'update_title':
        title = request.data.get('custom_role_title', '')
        comm_prof.custom_role_title = title
        comm_prof.save()

        return Response({'message': f'Role badge updated to "{title}"'}, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
