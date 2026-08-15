import hmac
import hashlib
import json
import time
import jwt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Usr, ContentItem, SiteSetting
from .email_service import sndMail

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'django-insecure-development-key-landscape-mastery-portal')

def get_tokens_for_user(usr):
    payload = {
        'usr_id': usr.id,
        'email': usr.email,
        'role': usr.role,
        'paid': usr.paid,
        'exp': int(time.time()) + 86400
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

@api_view(['POST'])
@permission_classes([AllowAny])
def login(req):
    email = req.data.get('email')
    pwd = req.data.get('password')
    if not email or not pwd:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        usr = Usr.objects.get(email=email)
        if usr.role == 'STUDENT' and not usr.paid:
            return Response({'error': 'Payment required to access course content'}, status=status.HTTP_403_FORBIDDEN)
        if usr.check_password(pwd):
            tok = get_tokens_for_user(usr)
            return Response({'token': tok, 'user': {'email': usr.email, 'role': usr.role, 'paid': usr.paid}})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except Usr.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(req):
    sig = req.headers.get('X-Razorpay-Signature')
    sec = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if sec and sig:
        exp_sig = hmac.new(sec.encode('utf-8'), req.body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(exp_sig, sig):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    body = req.data
    event = body.get('event')
    if event == 'payment.captured':
        entity = body.get('payload', {}).get('payment', {}).get('entity', {})
        usrMail = entity.get('email')
        phn = entity.get('contact')
        if usrMail and phn:
            usr, created = Usr.objects.get_or_create(email=usrMail, defaults={'phone': phn, 'role': 'STUDENT', 'paid': True})
            usr.set_password(phn)
            usr.phone = phn
            usr.paid = True
            usr.save()
            sndMail(usrMail, phn)
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([AllowAny])
def public_settings(req):
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    return Response({
        'heroTitle': setting.hero_title,
        'heroSubtitle': setting.hero_subtitle,
        'logoSize': setting.logo_size,
        'logoFitMode': setting.logo_fit_mode,
        'coursePrice': float(setting.course_price)
    })

@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_settings(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    if req.method == 'GET':
        return Response({
            'heroTitle': setting.hero_title,
            'heroSubtitle': setting.hero_subtitle,
            'logoSize': setting.logo_size,
            'logoFitMode': setting.logo_fit_mode,
            'coursePrice': float(setting.course_price)
        })
    elif req.method in ['POST', 'PATCH']:
        if 'heroTitle' in req.data:
            setting.hero_title = req.data['heroTitle']
        if 'heroSubtitle' in req.data:
            setting.hero_subtitle = req.data['heroSubtitle']
        if 'logoSize' in req.data:
            setting.logo_size = int(req.data['logoSize'])
        if 'logoFitMode' in req.data:
            setting.logo_fit_mode = req.data['logoFitMode']
        if 'coursePrice' in req.data:
            setting.course_price = float(req.data['coursePrice'])
        setting.save()
        return Response({'status': 'updated', 'settings': {
            'heroTitle': setting.hero_title,
            'heroSubtitle': setting.hero_subtitle,
            'logoSize': setting.logo_size,
            'logoFitMode': setting.logo_fit_mode,
            'coursePrice': float(setting.course_price)
        }})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    student_count = Usr.objects.filter(role='STUDENT', paid=True).count()
    total_revenue = student_count * 499
    short_video_count = ContentItem.objects.filter(content_type='short_video').count()
    long_video_count = ContentItem.objects.filter(content_type='long_video').count()
    pdf_count = ContentItem.objects.filter(content_type='pdf').count()
    return Response({
        'studentCount': student_count,
        'totalRevenue': total_revenue,
        'shortVideoCount': short_video_count,
        'longVideoCount': long_video_count,
        'pdfCount': pdf_count,
        'totalContent': short_video_count + long_video_count + pdf_count
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_content(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        items = list(ContentItem.objects.values())
        return Response({'content': items})
    elif req.method == 'POST':
        title = req.data.get('title')
        content_type = req.data.get('content_type', 'short_video')
        url = req.data.get('url', '')
        cost = req.data.get('cost', 0)
        duration = req.data.get('duration', '45 mins')
        description = req.data.get('description', '')
        file_obj = req.FILES.get('file')
        item = ContentItem.objects.create(
            title=title,
            content_type=content_type,
            url=url,
            cost=cost,
            duration=duration,
            description=description,
            file=file_obj
        )
        return Response({'status': 'created', 'id': item.id})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_content_detail(req, pk):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        item = ContentItem.objects.get(pk=pk)
    except ContentItem.DoesNotExist:
        return Response({'error': 'Content item not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        item.delete()
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'title' in req.data:
            item.title = req.data['title']
        if 'content_type' in req.data:
            item.content_type = req.data['content_type']
        if 'url' in req.data:
            item.url = req.data['url']
        if 'cost' in req.data:
            item.cost = req.data['cost']
        if 'duration' in req.data:
            item.duration = req.data['duration']
        if 'description' in req.data:
            item.description = req.data['description']
        item.save()
        return Response({'status': 'updated'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_students(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    stds = list(Usr.objects.filter(role='STUDENT').values('email', 'phone', 'paid', 'created_at'))
    return Response({'students': stds})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_stream(req, pk):
    if req.user.role == 'STUDENT' and not req.user.paid:
        return Response({'error': 'Strict Access Denied: Payment required'}, status=status.HTTP_403_FORBIDDEN)
    if req.user.role not in ['STUDENT', 'ADMIN']:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        item = ContentItem.objects.get(pk=pk)
    except ContentItem.DoesNotExist:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'id': item.id,
        'title': item.title,
        'type': item.content_type,
        'url': item.url or (item.file.url if item.file else ''),
        'dur': item.duration,
        'watermark': f"LICENSED TO: {req.user.email.upper()}",
        'drm': True
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def checkout_session(req):
    email = req.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    order_id = 'order_' + str(int(time.time()))
    return Response({
        'success': True,
        'keyId': getattr(settings, 'RAZORPAY_KEY_ID', ''),
        'orderId': order_id,
        'amount': 49900,
        'currency': 'INR',
        'email': email
    })
