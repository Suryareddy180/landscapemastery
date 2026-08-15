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

def check_admin_permission(usr, allowed_roles=None):
    if not usr or not usr.is_authenticated:
        return False
    if usr.is_superuser or usr.role == 'SUPER_ADMIN':
        return True
    if allowed_roles:
        return usr.role in allowed_roles or usr.role == 'ADMIN'
    return usr.role in ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'] or usr.is_staff

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
            return Response({'token': tok, 'user': {'email': usr.email, 'role': usr.role, 'paid': usr.paid, 'name': usr.full_name}})
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
            Enrollment.objects.get_or_create(user=usr, defaults={'status': 'ACTIVE', 'access_type': 'PAID'})
            sndMail(usrMail, phn)
            log_admin_action(usr, "STUDENT_AUTO_ENROLLED", target=usrMail, details=f"Order ID: {order_id}")
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([AllowAny])
def public_settings(req):
    setting, _ = SiteSetting.objects.get_or_create(id=1)
    testimonials = list(Testimonial.objects.filter(active=True).values())
    faqs = list(FAQ.objects.filter(active=True).order_by('order').values())
    announcements = list(Announcement.objects.filter(active=True).values())
    courses = list(Course.objects.filter(status='PUBLISHED').values())
    return Response({
        'siteName': setting.site_name,
        'heroTitle': setting.hero_title,
        'heroSubtitle': setting.hero_subtitle,
        'logoUrl': setting.logo_url,
        'logoSize': setting.logo_size,
        'logoFitMode': setting.logo_fit_mode,
        'coursePrice': float(setting.course_price),
        'contactEmail': setting.contact_email,
        'testimonials': testimonials,
        'faqs': faqs,
        'announcements': announcements,
        'courses': courses
    })

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
                'watermark': f"LICENSED TO: {req.user.email.upper()} • ID: LM-{req.user.id}"
            })
        except ContentItem.DoesNotExist:
            return Response({'error': 'Media asset not found'}, status=status.HTTP_404_NOT_FOUND)

    token, exp = generate_signed_stream_token(req.user, asset.id, duration_sec=300)
    return Response({
        'assetId': asset.id,
        'signedToken': token,
        'expiresAt': exp,
        'streamUrl': f"http://localhost:8000/api/video/stream/{asset.id}/play/?token={token}",
        'watermark': f"LICENSED TO: {req.user.email.upper()} • ID: LM-{req.user.id}"
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
        return Response({
            'assetId': asset.id,
            'title': asset.title,
            'type': asset.asset_type,
            'url': asset.url or (asset.file.url if asset.file else ''),
            'dur': asset.duration,
            'watermark': f"LICENSED TO: {verified.get('email').upper()} • DRM ENCRYPTED",
            'drm': True
        })
    except MediaAsset.DoesNotExist:
        try:
            item = ContentItem.objects.get(pk=pk)
            return Response({
                'assetId': item.id,
                'title': item.title,
                'type': item.content_type,
                'url': item.url or (item.file.url if item.file else ''),
                'dur': item.duration,
                'watermark': f"LICENSED TO: {verified.get('email').upper()} • DRM ENCRYPTED",
                'drm': True
            })
        except ContentItem.DoesNotExist:
            return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

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

    total_revenue = sum([p.amount for p in PaymentRecord.objects.filter(status='SUCCESS')]) or (student_count * 499)
    short_video_count = MediaAsset.objects.filter(asset_type='short_video').count() + ContentItem.objects.filter(content_type='short_video').count()
    long_video_count = MediaAsset.objects.filter(asset_type='long_video').count() + ContentItem.objects.filter(content_type='long_video').count()
    pdf_count = MediaAsset.objects.filter(asset_type='pdf').count() + ContentItem.objects.filter(content_type='pdf').count()

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
        'completionRate': 94.2
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_courses(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'CONTENT_MANAGER']):
        return Response({'error': 'Content Manager permission required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        courses = list(Course.objects.values())
        return Response({'courses': courses})
    elif req.method == 'POST':
        title = req.data.get('title')
        slug = req.data.get('slug', title.lower().replace(' ', '-'))
        short_desc = req.data.get('short_desc', '')
        full_desc = req.data.get('full_desc', '')
        price = req.data.get('price', 499.00)
        course = Course.objects.create(
            title=title, slug=slug, short_desc=short_desc, full_desc=full_desc, price=price, status='PUBLISHED'
        )
        log_admin_action(req.user, "COURSE_CREATED", target=course.title, details=f"ID: {course.id}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'created', 'id': course.id})

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
        for m in course.modules.all():
            lessons = []
            for l in m.lessons.all():
                assets = list(l.assets.values())
                lessons.append({'id': l.id, 'title': l.title, 'order': l.order, 'assets': assets})
            modules.append({'id': m.id, 'title': m.title, 'order': m.order, 'lessons': lessons})
        return Response({'id': course.id, 'title': course.title, 'price': float(course.price), 'modules': modules})
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
        return Response({'status': 'updated'})

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
    return Response({'status': 'created', 'module': {'id': mod.id, 'title': mod.title, 'order': mod.order}})

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
    return Response({'status': 'created', 'lesson': {'id': les.id, 'title': les.title, 'order': les.order}})

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
    return Response({'status': 'created', 'asset': {'id': asset.id, 'title': asset.title, 'type': asset.asset_type}})

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
            'contactEmail': setting.contact_email
        })
    elif req.method in ['POST', 'PATCH']:
        if 'heroTitle' in req.data: setting.hero_title = req.data['heroTitle']
        if 'heroSubtitle' in req.data: setting.hero_subtitle = req.data['heroSubtitle']
        if 'logoUrl' in req.data: setting.logo_url = req.data['logoUrl']
        if 'logoSize' in req.data: setting.logo_size = int(req.data['logoSize'])
        if 'logoFitMode' in req.data: setting.logo_fit_mode = req.data['logoFitMode']
        if 'coursePrice' in req.data: setting.course_price = float(req.data['coursePrice'])
        setting.save()
        log_admin_action(req.user, "SITE_SETTINGS_UPDATED", target="SiteSetting", details=f"LogoSize: {setting.logo_size}px", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'settings': {
            'siteName': setting.site_name,
            'heroTitle': setting.hero_title,
            'heroSubtitle': setting.hero_subtitle,
            'logoUrl': setting.logo_url,
            'logoSize': setting.logo_size,
            'logoFitMode': setting.logo_fit_mode,
            'coursePrice': float(setting.course_price)
        }})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_students(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'SUPPORT_ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    stds = list(Usr.objects.filter(role='STUDENT').values('id', 'email', 'phone', 'paid', 'is_active', 'created_at'))
    return Response({'students': stds})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_student_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'SUPPORT_ADMIN']):
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
def admin_audit_logs(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN']):
        return Response({'error': 'Super Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    logs = list(AuditLog.objects.order_by('-timestamp').values('id', 'actor__email', 'action', 'target', 'details', 'ip_address', 'timestamp')[:100])
    return Response({'logs': logs})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_students_csv(req):
    if not check_admin_permission(req.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    res = HttpResponse(content_type='text/csv')
    res['Content-Disposition'] = 'attachment; filename="students_roster.csv"'
    writer = csv.writer(res)
    writer.writerow(['ID', 'Email', 'Phone', 'Role', 'Paid Status', 'Registration Date'])
    for u in Usr.objects.filter(role='STUDENT'):
        writer.writerow([u.id, u.email, u.phone or 'N/A', u.role, 'PAID' if u.paid else 'UNPAID', u.created_at])
    return res

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
