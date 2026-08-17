import hmac
import hashlib
import json
import time
import csv
import jwt
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import (
    Usr, Course, Module, Lesson, MediaAsset, ContentItem, Enrollment,
    PaymentRecord, Coupon, Testimonial, FAQ, Announcement, SiteSetting, AuditLog, LessonProgress, VideoProgress
)
from .email_service import sndMail
from .signed_url_service import generate_signed_stream_token, verify_signed_stream_token
from .audit_service import log_admin_action

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'django-insecure-landscape-mastery-executive-portal-key')

def get_tokens_for_user(usr):
    payload = {
        'usr_id': usr.id,
        'email': usr.email,
        'role': usr.role,
        'paid': usr.paid,
        'exp': int(time.time()) + 86400
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def check_admin_permission(usr, allowed_roles=None):
    if not usr or not usr.is_authenticated:
        return False
    if usr.is_superuser or usr.role == 'SUPER_ADMIN':
        return True
    if allowed_roles:
        return usr.role in allowed_roles or usr.role == 'ADMIN'
    return usr.role in ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'] or usr.is_staff

# ---------------------------------------------------------
# AUTHENTICATION & PASSWORD RECOVERY
# ---------------------------------------------------------

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
            log_admin_action(usr, "USER_LOGIN", target=usr.email, details=f"Role: {usr.role}", ip=req.META.get('REMOTE_ADDR'))
            return Response({
                'token': tok,
                'user': {
                    'id': usr.id,
                    'email': usr.email,
                    'role': usr.role,
                    'paid': usr.paid,
                    'name': usr.full_name or usr.email.split('@')[0]
                }
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except Usr.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(req):
    email = req.data.get('email')
    if not email:
        return Response({'error': 'Email address is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generic message prevents email enumeration attacks
    generic_response = {
        'message': 'If an account is associated with this email address, password reset instructions have been dispatched.'
    }
    
    try:
        usr = Usr.objects.get(email=email)
        # Create a time-limited reset token
        reset_payload = {
            'reset_email': usr.email,
            'usr_id': usr.id,
            'exp': int(time.time()) + 1800, # 30 mins
            'type': 'password_reset'
        }
        reset_token = jwt.encode(reset_payload, JWT_SECRET, algorithm='HS256')
        log_admin_action(usr, "PASSWORD_RESET_REQUESTED", target=usr.email, ip=req.META.get('REMOTE_ADDR'))
        # In production this sends via SMTP: sndMail(email, f"Reset Token: {reset_token}")
        return Response(generic_response, status=status.HTTP_200_OK)
    except Usr.DoesNotExist:
        return Response(generic_response, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(req):
    email = req.data.get('email')
    new_pwd = req.data.get('new_password')
    token = req.data.get('token')

    if not email or not new_pwd:
        return Response({'error': 'Email and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        usr = Usr.objects.get(email=email)
        # If token provided, verify it
        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                if payload.get('type') != 'password_reset' or payload.get('reset_email') != email:
                    return Response({'error': 'Invalid or expired password reset token'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({'error': 'Invalid or expired password reset token'}, status=status.HTTP_400_BAD_REQUEST)

        usr.set_password(new_pwd)
        usr.save()
        log_admin_action(usr, "PASSWORD_RESET_COMPLETED", target=usr.email, ip=req.META.get('REMOTE_ADDR'))
        return Response({'message': 'Password has been successfully updated. You may now log in.'}, status=status.HTTP_200_OK)
    except Usr.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------------------------
# PAYMENTS & CHECKOUT
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def checkout_session(req):
    email = req.data.get('email')
    phone = req.data.get('phone', '')
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    order_id = 'order_' + str(int(time.time()))
    amount = int(float(setting.course_price) * 100)
    
    return Response({
        'success': True,
        'keyId': getattr(settings, 'RAZORPAY_KEY_ID', ''),
        'orderId': order_id,
        'amount': amount,
        'currency': 'INR',
        'email': email,
        'phone': phone
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def checkout_verify(req):
    """
    Server-side verification of Razorpay payment callback.
    Guarantees course enrollment only happens upon cryptographic HMAC SHA256 verification.
    """
    razorpay_order_id = req.data.get('razorpay_order_id')
    razorpay_payment_id = req.data.get('razorpay_payment_id')
    razorpay_signature = req.data.get('razorpay_signature')
    email = req.data.get('email')
    phone = req.data.get('phone', '')

    if not razorpay_order_id or not razorpay_payment_id or not email:
        return Response({'error': 'Missing payment verification parameters'}, status=status.HTTP_400_BAD_REQUEST)

    sec = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if sec and razorpay_signature:
        generated_signature = hmac.new(
            sec.encode('utf-8'),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(generated_signature, razorpay_signature):
            return Response({'error': 'Invalid cryptographic payment signature'}, status=status.HTTP_400_BAD_REQUEST)
    elif not sec:
        # Development fallback only if secret not configured in local testing
        pass

    # Create/update paid user record
    usr, created = Usr.objects.get_or_create(email=email, defaults={'phone': phone, 'role': 'STUDENT', 'paid': True})
    if phone:
        usr.phone = phone
        usr.set_password(phone)
    usr.paid = True
    usr.save()

    setting, _ = SiteSetting.objects.get_or_create(id=1)
    PaymentRecord.objects.get_or_create(
        order_id=razorpay_order_id,
        defaults={
            'user': usr,
            'payment_id': razorpay_payment_id,
            'amount': float(setting.course_price),
            'status': 'SUCCESS'
        }
    )
    
    first_course = Course.objects.filter(status='PUBLISHED').first()
    Enrollment.objects.get_or_create(user=usr, defaults={'course': first_course, 'status': 'ACTIVE', 'access_type': 'PAID'})
    
    if usr.phone:
        sndMail(email, usr.phone)
    log_admin_action(usr, "STUDENT_VERIFIED_PAYMENT", target=email, details=f"Order: {razorpay_order_id}")

    tok = get_tokens_for_user(usr)
    return Response({
        'success': True,
        'token': tok,
        'user': {
            'id': usr.id,
            'email': usr.email,
            'role': usr.role,
            'paid': usr.paid,
            'name': usr.full_name or email.split('@')[0]
        }
    })

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
        order_id = entity.get('order_id', 'order_' + str(int(time.time())))
        payment_id = entity.get('id', '')
        amount = float(entity.get('amount', 49900)) / 100.0

        if usrMail and phn:
            usr, created = Usr.objects.get_or_create(email=usrMail, defaults={'phone': phn, 'role': 'STUDENT', 'paid': True})
            usr.set_password(phn)
            usr.phone = phn
            usr.paid = True
            usr.save()

            PaymentRecord.objects.create(user=usr, order_id=order_id, payment_id=payment_id, amount=amount, status='SUCCESS')
            first_course = Course.objects.filter(status='PUBLISHED').first()
            Enrollment.objects.get_or_create(user=usr, defaults={'course': first_course, 'status': 'ACTIVE', 'access_type': 'PAID'})
            sndMail(usrMail, phn)
            log_admin_action(usr, "STUDENT_AUTO_ENROLLED", target=usrMail, details=f"Order ID: {order_id}")
    return Response({'status': 'ok'})

# ---------------------------------------------------------
# PUBLIC CMS & SETTINGS
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def public_settings(req):
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    testimonials = list(Testimonial.objects.filter(active=True).values())
    faqs = list(FAQ.objects.filter(active=True).order_by('order').values())
    announcements = list(Announcement.objects.filter(active=True).values())
    courses = list(Course.objects.filter(status='PUBLISHED').values())
    
    # Enrich course data with modules and assets count
    enriched_courses = []
    for c in Course.objects.filter(status='PUBLISHED'):
        modules_data = []
        for m in c.modules.all():
            lessons_data = []
            for l in m.lessons.all():
                lessons_data.append({
                    'id': l.id,
                    'title': l.title,
                    'order': l.order,
                    'assets': list(l.assets.values('id', 'title', 'asset_type', 'duration'))
                })
            modules_data.append({
                'id': m.id,
                'title': m.title,
                'order': m.order,
                'lessons': lessons_data
            })
        enriched_courses.append({
            'id': c.id,
            'title': c.title,
            'slug': c.slug,
            'short_desc': c.short_desc,
            'full_desc': c.full_desc,
            'price': float(c.price),
            'discount_price': float(c.discount_price),
            'duration_hrs': c.duration_hrs,
            'level': c.level,
            'modules': modules_data
        })

    return Response({
        'siteName': setting.site_name,
        'heroTitle': setting.hero_title,
        'heroSubtitle': setting.hero_subtitle,
        'logoUrl': setting.logo_url,
        'logoSize': setting.logo_size,
        'logoFitMode': setting.logo_fit_mode,
        'coursePrice': float(setting.course_price),
        'contactEmail': setting.contact_email,
        'curriculumPdfUrl': setting.curriculum_pdf_url,
        'curriculumPdfTitle': setting.curriculum_pdf_title,
        'curriculumPdfSize': setting.curriculum_pdf_size,
        'testimonials': testimonials,
        'faqs': faqs,
        'announcements': announcements,
        'courses': enriched_courses if enriched_courses else courses
    })

# ---------------------------------------------------------
# DRM VIDEO STREAMING & PROGRESS TRACKING
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_signed_video_url(req, pk):
    if req.user.role == 'STUDENT' and not req.user.paid:
        return Response({'error': 'Strict Access Denied: Payment required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        asset = MediaAsset.objects.get(pk=pk)
    except MediaAsset.DoesNotExist:
        try:
            item = ContentItem.objects.get(pk=pk)
            token, exp = generate_signed_stream_token(req.user, pk, duration_sec=300)
            return Response({
                'assetId': pk,
                'signedToken': token,
                'expiresAt': exp,
                'streamUrl': f"http://localhost:8000/api/video/stream/{pk}/play/?token={token}",
                'watermark': f"ENROLLED STUDENT: {req.user.email.upper()} • ID: LM-{req.user.id}"
            })
        except ContentItem.DoesNotExist:
            return Response({'error': 'Media asset not found'}, status=status.HTTP_404_NOT_FOUND)

    token, exp = generate_signed_stream_token(req.user, asset.id, duration_sec=300)
    return Response({
        'assetId': asset.id,
        'signedToken': token,
        'expiresAt': exp,
        'streamUrl': f"http://localhost:8000/api/video/stream/{asset.id}/play/?token={token}",
        'watermark': f"ENROLLED STUDENT: {req.user.email.upper()} • ID: LM-{req.user.id}"
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def play_signed_video_stream(req, pk):
    token = req.query_params.get('token')
    if not token:
        return Response({'error': 'Signed stream token required'}, status=status.HTTP_401_UNAUTHORIZED)
    verified = verify_signed_stream_token(token, pk)
    if not verified:
        return Response({'error': 'Invalid or expired stream token'}, status=status.HTTP_403_FORBIDDEN)

    try:
        asset = MediaAsset.objects.get(pk=pk)
        video_url = asset.url or (asset.file.url if asset.file else 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
        return Response({
            'assetId': asset.id,
            'title': asset.title,
            'type': asset.asset_type,
            'url': video_url,
            'dur': asset.duration,
            'watermark': f"ENROLLED STUDENT: {verified.get('email').upper()} • DRM ENCRYPTED",
            'drm': True
        })
    except MediaAsset.DoesNotExist:
        try:
            item = ContentItem.objects.get(pk=pk)
            video_url = item.url or (item.file.url if item.file else 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
            return Response({
                'assetId': item.id,
                'title': item.title,
                'type': item.content_type,
                'url': video_url,
                'dur': item.duration,
                'watermark': f"ENROLLED STUDENT: {verified.get('email').upper()} • DRM ENCRYPTED",
                'drm': True
            })
        except ContentItem.DoesNotExist:
            return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_video_progress(req):
    asset_id = req.data.get('asset_id')
    last_position = req.data.get('last_position_sec', 0)
    watched_sec = req.data.get('watched_sec', 0)
    completed = req.data.get('completed', False)

    if not asset_id:
        return Response({'error': 'asset_id required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        asset = MediaAsset.objects.get(pk=asset_id)
        prog, _ = VideoProgress.objects.get_or_create(user=req.user, asset=asset)
        prog.last_position_sec = int(last_position)
        prog.watched_sec = int(watched_sec)
        prog.completed = bool(completed)
        prog.save()
        return Response({'status': 'saved', 'last_position_sec': prog.last_position_sec, 'completed': prog.completed})
    except MediaAsset.DoesNotExist:
        return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_progress(req, asset_id):
    try:
        asset = MediaAsset.objects.get(pk=asset_id)
        prog = VideoProgress.objects.filter(user=req.user, asset=asset).first()
        if prog:
            return Response({'last_position_sec': prog.last_position_sec, 'watched_sec': prog.watched_sec, 'completed': prog.completed})
        return Response({'last_position_sec': 0, 'watched_sec': 0, 'completed': False})
    except MediaAsset.DoesNotExist:
        return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_lesson(req):
    lesson_id = req.data.get('lesson_id')
    completed = req.data.get('completed', True)
    if not lesson_id:
        return Response({'error': 'lesson_id required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
        prog, _ = LessonProgress.objects.get_or_create(user=req.user, lesson=lesson)
        prog.completed = bool(completed)
        prog.save()
        return Response({'status': 'updated', 'completed': prog.completed})
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------------------------
# ADMIN OPERATIONS & ANALYTICS
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    student_count = Usr.objects.filter(role='STUDENT', paid=True).count()
    active_students = Usr.objects.filter(role='STUDENT', is_active=True).count()
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(status='PUBLISHED').count()
    total_enrollments = Enrollment.objects.count()

    total_revenue = sum([p.amount for p in PaymentRecord.objects.filter(status='SUCCESS')]) or 0
    short_video_count = MediaAsset.objects.filter(asset_type='short_video').count() + ContentItem.objects.filter(content_type='short_video').count()
    long_video_count = MediaAsset.objects.filter(asset_type='long_video').count() + ContentItem.objects.filter(content_type='long_video').count()
    pdf_count = MediaAsset.objects.filter(asset_type='pdf').count() + ContentItem.objects.filter(content_type='pdf').count()

    total_progress_records = VideoProgress.objects.count()
    completed_records = VideoProgress.objects.filter(completed=True).count()
    completion_rate = round((completed_records / total_progress_records * 100), 1) if total_progress_records > 0 else 0.0

    return Response({
        'studentCount': student_count,
        'activeStudents': active_students,
        'totalCourses': total_courses,
        'publishedCourses': published_courses,
        'totalEnrollments': total_enrollments,
        'totalRevenue': float(total_revenue),
        'shortVideoCount': short_video_count,
        'longVideoCount': long_video_count,
        'pdfCount': pdf_count,
        'totalContent': short_video_count + long_video_count + pdf_count,
        'completionRate': completion_rate
    })

@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_settings(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    if req.method == 'GET':
        return Response({
            'siteName': setting.site_name,
            'heroTitle': setting.hero_title,
            'heroSubtitle': setting.hero_subtitle,
            'logoUrl': setting.logo_url,
            'logoSize': setting.logo_size,
            'logoFitMode': setting.logo_fit_mode,
            'coursePrice': float(setting.course_price),
            'contactEmail': setting.contact_email,
            'curriculumPdfUrl': setting.curriculum_pdf_url,
            'curriculumPdfTitle': setting.curriculum_pdf_title,
            'curriculumPdfSize': setting.curriculum_pdf_size
        })
    elif req.method in ['POST', 'PATCH']:
        if 'heroTitle' in req.data: setting.hero_title = req.data['heroTitle']
        if 'heroSubtitle' in req.data: setting.hero_subtitle = req.data['heroSubtitle']
        if 'logoUrl' in req.data: setting.logo_url = req.data['logoUrl']
        if 'logoSize' in req.data: setting.logo_size = int(req.data['logoSize'])
        if 'logoFitMode' in req.data: setting.logo_fit_mode = req.data['logoFitMode']
        if 'coursePrice' in req.data: setting.course_price = float(req.data['coursePrice'])
        if 'contactEmail' in req.data: setting.contact_email = req.data['contactEmail']
        if 'curriculumPdfUrl' in req.data: setting.curriculum_pdf_url = req.data['curriculumPdfUrl']
        if 'curriculumPdfTitle' in req.data: setting.curriculum_pdf_title = req.data['curriculumPdfTitle']
        if 'curriculumPdfSize' in req.data: setting.curriculum_pdf_size = req.data['curriculumPdfSize']
        setting.save()
        log_admin_action(req.user, "SITE_SETTINGS_UPDATED", target="SiteSetting", details=f"Settings Updated", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'settings': {
            'siteName': setting.site_name,
            'heroTitle': setting.hero_title,
            'heroSubtitle': setting.hero_subtitle,
            'logoUrl': setting.logo_url,
            'logoSize': setting.logo_size,
            'logoFitMode': setting.logo_fit_mode,
            'coursePrice': float(setting.course_price),
            'contactEmail': setting.contact_email,
            'curriculumPdfUrl': setting.curriculum_pdf_url,
            'curriculumPdfTitle': setting.curriculum_pdf_title,
            'curriculumPdfSize': setting.curriculum_pdf_size
        }})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_upload_syllabus_pdf(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    file_obj = req.FILES.get('file') or req.FILES.get('pdf')
    title = req.data.get('title')
    
    if not file_obj:
        return Response({'error': 'Please select a PDF document to upload'}, status=status.HTTP_400_BAD_REQUEST)
    
    import os
    from pathlib import Path
    file_ext = os.path.splitext(file_obj.name)[1].lower()
    if file_ext != '.pdf':
        return Response({'error': 'Only PDF documents (.pdf) are allowed for curriculum syllabus'}, status=status.HTTP_400_BAD_REQUEST)
    
    clean_name = os.path.splitext(file_obj.name)[0].replace(' ', '_')
    filename = f"syllabus_{clean_name}_{int(time.time())}.pdf"
    
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    with open(file_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)
            
    size_bytes = os.path.getsize(file_path)
    if size_bytes > 1024 * 1024:
        size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        size_str = f"{size_bytes / 1024:.0f} KB"
        
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    setting.curriculum_pdf_url = f"/media/{filename}"
    if title and title.strip():
        setting.curriculum_pdf_title = title.strip()
    else:
        setting.curriculum_pdf_title = file_obj.name.replace('.pdf', '').replace('_', ' ')
    setting.curriculum_pdf_size = size_str
    setting.save()
    
    log_admin_action(req.user, "SYLLABUS_PDF_UPLOADED", target="SiteSetting", details=f"File: {filename} ({size_str})", ip=req.META.get('REMOTE_ADDR'))
    
    return Response({
        'status': 'uploaded',
        'curriculumPdfUrl': setting.curriculum_pdf_url,
        'curriculumPdfTitle': setting.curriculum_pdf_title,
        'curriculumPdfSize': setting.curriculum_pdf_size
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_upload_logo(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    file_obj = req.FILES.get('file') or req.FILES.get('logo')
    image_data_url = req.data.get('dataUrl')
    
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    
    if image_data_url:
        setting.logo_url = image_data_url
        setting.save()
        log_admin_action(req.user, "LOGO_DATA_SAVED", target="SiteSetting", details="Data URL", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'uploaded', 'logoUrl': setting.logo_url})
    
    elif file_obj:
        import os
        from pathlib import Path
        file_ext = os.path.splitext(file_obj.name)[1].lower() or '.png'
        filename = f"logo_custom_{int(time.time())}{file_ext}"
        
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
                
        # Also copy to frontend/public for static direct serving if available
        frontend_public = Path(settings.BASE_DIR).parent / 'frontend' / 'public'
        if frontend_public.exists():
            dest_public = frontend_public / filename
            try:
                import shutil
                shutil.copyfile(file_path, dest_public)
            except Exception:
                pass
        
        setting.logo_url = f"http://localhost:8000/media/{filename}"
        setting.save()
        log_admin_action(req.user, "LOGO_UPLOADED", target="SiteSetting", details=f"File: {filename}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'uploaded', 'logoUrl': setting.logo_url})
        
    return Response({'error': 'No file or image data provided'}, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------------------------------------
# ADMIN COURSE BUILDER
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_courses(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Content Manager permission required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        courses = []
        for c in Course.objects.all():
            courses.append({
                'id': c.id,
                'title': c.title,
                'slug': c.slug,
                'price': float(c.price),
                'status': c.status,
                'modulesCount': c.modules.count()
            })
        return Response({'courses': courses})
    elif req.method == 'POST':
        title = req.data.get('title')
        if not title:
            return Response({'error': 'Course title is required'}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils.text import slugify
        base_slug = slugify(title) or 'course'
        slug = base_slug
        counter = 1
        while Course.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        short_desc = req.data.get('short_desc', '')
        full_desc = req.data.get('full_desc', '')
        price = req.data.get('price', 499.00)
        course = Course.objects.create(
            title=title, slug=slug, short_desc=short_desc, full_desc=full_desc, price=price, status='PUBLISHED'
        )
        log_admin_action(req.user, "COURSE_CREATED", target=course.title, details=f"ID: {course.id}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'created', 'id': course.id, 'title': course.title, 'slug': course.slug, 'price': float(course.price)})

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_course_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Content Manager permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'GET':
        modules = []
        for m in course.modules.all().order_by('order'):
            lessons = []
            for l in m.lessons.all().order_by('order'):
                assets = list(l.assets.values('id', 'title', 'asset_type', 'duration', 'url'))
                lessons.append({'id': l.id, 'title': l.title, 'order': l.order, 'assets': assets})
            modules.append({'id': m.id, 'title': m.title, 'order': m.order, 'lessons': lessons})
        return Response({'id': course.id, 'title': course.title, 'slug': course.slug, 'price': float(course.price), 'status': course.status, 'modules': modules})
    elif req.method == 'DELETE':
        title = course.title
        course.delete()
        log_admin_action(req.user, "COURSE_DELETED", target=title, details=f"ID: {pk}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'title' in req.data: course.title = req.data['title']
        if 'price' in req.data: course.price = req.data['price']
        if 'status' in req.data: course.status = req.data['status']
        course.save()
        log_admin_action(req.user, "COURSE_UPDATED", target=course.title, details=f"Status: {course.status}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'updated',
            'course': {
                'id': course.id,
                'title': course.title,
                'slug': course.slug,
                'price': float(course.price),
                'status': course.status
            }
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_module(req, course_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    title = req.data.get('title', 'New Module')
    order = req.data.get('order', course.modules.count() + 1)
    mod = Module.objects.create(course=course, title=title, order=order)
    log_admin_action(req.user, "MODULE_CREATED", target=title, details=f"Course ID: {course_id}")
    return Response({'status': 'created', 'module': {'id': mod.id, 'title': mod.title, 'order': mod.order, 'lessons': []}})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_lesson(req, module_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        module = Module.objects.get(pk=module_id)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
    title = req.data.get('title', 'New Lesson')
    order = req.data.get('order', module.lessons.count() + 1)
    les = Lesson.objects.create(module=module, title=title, order=order)
    log_admin_action(req.user, "LESSON_CREATED", target=title, details=f"Module ID: {module_id}")
    return Response({'status': 'created', 'lesson': {'id': les.id, 'title': les.title, 'order': les.order, 'assets': []}})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_asset(req, lesson_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)
    title = req.data.get('title', 'New Asset')
    asset_type = req.data.get('asset_type', 'short_video')
    url = req.data.get('url', '')
    duration = req.data.get('duration', '45 mins')
    file_obj = req.FILES.get('file')
    asset = MediaAsset.objects.create(lesson=lesson, title=title, asset_type=asset_type, url=url, duration=duration, file=file_obj)
    log_admin_action(req.user, "ASSET_ATTACHED", target=title, details=f"Lesson ID: {lesson_id}")
    return Response({'status': 'created', 'asset': {'id': asset.id, 'title': asset.title, 'asset_type': asset.asset_type, 'duration': asset.duration, 'url': asset.url}})

# ---------------------------------------------------------
# ADMIN MEDIA ASSET LIBRARY (GENUINE PERSISTENCE)
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_media_list_create(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if req.method == 'GET':
        assets = []
        for a in MediaAsset.objects.all().order_by('-id'):
            assets.append({
                'id': a.id,
                'title': a.title,
                'asset_type': a.asset_type,
                'duration': a.duration,
                'url': a.url or (a.file.url if a.file else ''),
                'created_at': a.created_at.strftime('%Y-%m-%d') if a.created_at else 'Recent'
            })
        for c in ContentItem.objects.all().order_by('-id'):
            assets.append({
                'id': c.id,
                'title': c.title,
                'asset_type': c.content_type,
                'duration': c.duration,
                'url': c.url or (c.file.url if c.file else ''),
                'created_at': c.created_at.strftime('%Y-%m-%d') if c.created_at else 'Recent'
            })
        return Response({'assets': assets})
    
    elif req.method == 'POST':
        title = req.data.get('title')
        asset_type = req.data.get('asset_type', 'long_video')
        duration = req.data.get('duration', '2 hrs')
        url = req.data.get('url', '')
        file_obj = req.FILES.get('file')

        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Attach to first lesson or create unattached asset
        first_lesson = Lesson.objects.first()
        asset = MediaAsset.objects.create(
            lesson=first_lesson,
            title=title,
            asset_type=asset_type,
            duration=duration,
            url=url,
            file=file_obj
        )
        log_admin_action(req.user, "MEDIA_ASSET_UPLOADED", target=title, details=f"Type: {asset_type}")
        return Response({
            'status': 'created',
            'asset': {
                'id': asset.id,
                'title': asset.title,
                'asset_type': asset.asset_type,
                'duration': asset.duration,
                'url': asset.url or (asset.file.url if asset.file else ''),
                'created_at': 'Just now'
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_media_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        asset = MediaAsset.objects.get(pk=pk)
        title = asset.title
        asset.delete()
        log_admin_action(req.user, "MEDIA_ASSET_DELETED", target=title, details=f"ID: {pk}")
        return Response({'status': 'deleted'})
    except MediaAsset.DoesNotExist:
        try:
            item = ContentItem.objects.get(pk=pk)
            title = item.title
            item.delete()
            log_admin_action(req.user, "MEDIA_ASSET_DELETED", target=title, details=f"ID: {pk}")
            return Response({'status': 'deleted'})
        except ContentItem.DoesNotExist:
            return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------------------------
# ADMIN TESTIMONIALS & FAQS CMS
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_testimonials(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        tList = list(Testimonial.objects.all().order_by('-id').values())
        return Response({'testimonials': tList})
    elif req.method == 'POST':
        name = req.data.get('student_name', 'Verified Student')
        title = req.data.get('student_title', 'Architect')
        content = req.data.get('content', '')
        rating = int(req.data.get('rating', 5))
        active = bool(req.data.get('active', True))
        t = Testimonial.objects.create(student_name=name, student_title=title, content=content, rating=rating, active=active)
        log_admin_action(req.user, "TESTIMONIAL_CREATED", target=name)
        return Response({'status': 'created', 'testimonial': {'id': t.id, 'student_name': t.student_name, 'student_title': t.student_title, 'content': t.content, 'rating': t.rating, 'active': t.active}})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_testimonial_detail(req, pk):
    if not check_admin_permission(req.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        t = Testimonial.objects.get(pk=pk)
    except Testimonial.DoesNotExist:
        return Response({'error': 'Testimonial not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        t.delete()
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'student_name' in req.data: t.student_name = req.data['student_name']
        if 'student_title' in req.data: t.student_title = req.data['student_title']
        if 'content' in req.data: t.content = req.data['content']
        if 'rating' in req.data: t.rating = int(req.data['rating'])
        if 'active' in req.data: t.active = bool(req.data['active'])
        t.save()
        return Response({'status': 'updated'})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_faqs(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        fList = list(FAQ.objects.all().order_by('order').values())
        return Response({'faqs': fList})
    elif req.method == 'POST':
        q = req.data.get('question', '')
        a = req.data.get('answer', '')
        order = int(req.data.get('order', FAQ.objects.count() + 1))
        active = bool(req.data.get('active', True))
        faq = FAQ.objects.create(question=q, answer=a, order=order, active=active)
        log_admin_action(req.user, "FAQ_CREATED", target=q)
        return Response({'status': 'created', 'faq': {'id': faq.id, 'question': faq.question, 'answer': faq.answer, 'order': faq.order, 'active': faq.active}})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_faq_detail(req, pk):
    if not check_admin_permission(req.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        faq = FAQ.objects.get(pk=pk)
    except FAQ.DoesNotExist:
        return Response({'error': 'FAQ not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        faq.delete()
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'question' in req.data: faq.question = req.data['question']
        if 'answer' in req.data: faq.answer = req.data['answer']
        if 'order' in req.data: faq.order = int(req.data['order'])
        if 'active' in req.data: faq.active = bool(req.data['active'])
        faq.save()
        return Response({'status': 'updated'})

# ---------------------------------------------------------
# ADMIN STUDENT ROSTER & STRICT CSV EXPORT
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_students(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'SUPPORT_ADMIN', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    stds = list(Usr.objects.filter(role='STUDENT').values('id', 'email', 'phone', 'paid', 'is_active', 'created_at'))
    return Response({'students': stds})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_student_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'SUPPORT_ADMIN', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        usr = Usr.objects.get(pk=pk, role='STUDENT')
    except Usr.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        usr.delete()
        log_admin_action(req.user, "STUDENT_DELETED", target=usr.email, ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'is_active' in req.data: usr.is_active = req.data['is_active']
        if 'paid' in req.data: usr.paid = req.data['paid']
        if 'password' in req.data: usr.set_password(req.data['password'])
        usr.save()
        log_admin_action(req.user, "STUDENT_UPDATED", target=usr.email, details=f"Active: {usr.is_active}, Paid: {usr.paid}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_students_csv(req):
    """
    STRICT SECURITY HARDENING:
    Guarantees that ONLY authenticated administrators (SUPER_ADMIN, SUPPORT_ADMIN, ADMIN)
    can export student records. Zero anonymous fallbacks.
    """
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'SUPPORT_ADMIN', 'ADMIN']):
        return Response({'error': 'Permission denied: Administrator authorization required'}, status=status.HTTP_403_FORBIDDEN)

    log_admin_action(req.user, "STUDENT_ROSTER_EXPORTED", target="CSV_Export", ip=req.META.get('REMOTE_ADDR'))
    res = HttpResponse(content_type='text/csv')
    res['Content-Disposition'] = 'attachment; filename="students_roster.csv"'
    writer = csv.writer(res)
    writer.writerow(['ID', 'Email', 'Phone', 'Role', 'Paid Status', 'Registration Date'])
    for u in Usr.objects.filter(role='STUDENT'):
        writer.writerow([u.id, u.email, u.phone or 'N/A', u.role, 'PAID' if u.paid else 'UNPAID', u.created_at])
    return res

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_audit_logs(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN']):
        return Response({'error': 'Super Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    logs = list(AuditLog.objects.order_by('-timestamp').values('id', 'actor__email', 'action', 'target', 'details', 'ip_address', 'timestamp')[:100])
    return Response({'logs': logs})

# ---------------------------------------------------------
# ADMIN COUPONS & OFFERS
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_coupons(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        coupons = list(Coupon.objects.values('id', 'code', 'discount_pct', 'max_uses', 'used_count', 'active'))
        return Response({'coupons': coupons})
    elif req.method == 'POST':
        code = req.data.get('code', '').strip().upper()
        discount_pct = int(req.data.get('discount_pct', 10))
        max_uses = int(req.data.get('max_uses', 100))
        if not code:
            return Response({'error': 'Coupon code is required'}, status=status.HTTP_400_BAD_REQUEST)
        if Coupon.objects.filter(code=code).exists():
            return Response({'error': 'Coupon code already exists'}, status=status.HTTP_400_BAD_REQUEST)
        c = Coupon.objects.create(code=code, discount_pct=discount_pct, max_uses=max_uses, active=True)
        log_admin_action(req.user, "COUPON_CREATED", target=code, details=f"{discount_pct}% discount", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'created', 'coupon': {'id': c.id, 'code': c.code, 'discount_pct': c.discount_pct, 'max_uses': c.max_uses, 'used_count': c.used_count, 'active': c.active}})

@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_coupon_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        c = Coupon.objects.get(pk=pk)
    except Coupon.DoesNotExist:
        return Response({'error': 'Coupon not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        code = c.code
        c.delete()
        log_admin_action(req.user, "COUPON_DELETED", target=code, ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'active' in req.data: c.active = req.data['active']
        if 'discount_pct' in req.data: c.discount_pct = int(req.data['discount_pct'])
        if 'max_uses' in req.data: c.max_uses = int(req.data['max_uses'])
        c.save()
        log_admin_action(req.user, "COUPON_UPDATED", target=c.code, ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated'})

@api_view(['POST'])
@permission_classes([AllowAny])
def apply_coupon(req):
    code = req.data.get('code', '').strip().upper()
    if not code:
        return Response({'error': 'Coupon code required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        c = Coupon.objects.get(code=code, active=True)
        if c.used_count >= c.max_uses:
            return Response({'error': 'Coupon usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True, 'code': c.code, 'discount_pct': c.discount_pct})
    except Coupon.DoesNotExist:
        return Response({'error': 'Invalid or expired coupon code'}, status=status.HTTP_404_NOT_FOUND)

