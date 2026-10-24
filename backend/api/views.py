import hmac
import hashlib
import json
import time
import csv
import re
import secrets
import logging
import requests
import jwt
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import (
    Usr, Course, Module, Lesson, MediaAsset, ContentItem, Enrollment,
    PaymentRecord, Coupon, Testimonial, FAQ, Announcement, Assignment, AssignmentSubmission,
    SiteSetting, AuditLog, LessonProgress, VideoProgress
)
from .email_service import sndMail
from .payment_service import fulfill_verified_payment
from .signed_url_service import generate_signed_stream_token, verify_signed_stream_token
from .audit_service import log_admin_action
from .veed_service import extract_veed_video_id, normalize_veed_embed_url, validate_veed_source
from .duration_utils import parse_duration_to_seconds, format_seconds_to_duration, get_mp4_duration_seconds, update_course_duration

logger = logging.getLogger(__name__)
JWT_SECRET = settings.SECRET_KEY

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
    # 3CAPSTECH admin belongs strictly to 3CAPSTECH corporate configuration
    email = usr.email.strip().lower()
    if usr.role == 'THREECAPS_ADMIN' or email == 'admin@3capstech.com':
        return False
    if usr.is_superuser or usr.role == 'SUPER_ADMIN':
        return True
    if allowed_roles:
        return usr.role in allowed_roles or usr.role == 'ADMIN'
    return usr.role in ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'] or usr.is_staff

# ---------------------------------------------------------
# SYSTEM HEALTH CHECK (For Load Balancers & Monitoring)
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    db_ok = True
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        db_ok = False
    status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({
        'status': 'healthy' if db_ok else 'degraded',
        'database': 'connected' if db_ok else 'disconnected'
    }, status=status_code)

# ---------------------------------------------------------
# AUTHENTICATION & PASSWORD RECOVERY
# ---------------------------------------------------------


@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def login(req):
    if req.method == 'GET':
        return Response({'error': 'Authentication endpoint requires POST request.'}, status=status.HTTP_400_BAD_REQUEST)
    email = req.data.get('email')
    pwd = req.data.get('password')
    if not email or not pwd:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    cleaned_email = str(email).strip().lower()
    usr = Usr.objects.filter(email__iexact=cleaned_email).first()
    if not usr:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        if not usr.is_active:
            return Response({'error': 'Account has been disabled. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)
        # Per-course enrollment check: students need at least one enrollment
        enrollments = list(Enrollment.objects.filter(user=usr, status='ACTIVE').values_list('course_id', flat=True))
        if usr.role == 'STUDENT' and not usr.paid and len(enrollments) == 0:
            return Response({'error': 'No active course enrollments found. Please purchase a course first.'}, status=status.HTTP_403_FORBIDDEN)
        if usr.check_password(pwd):
            tok = get_tokens_for_user(usr)
            log_admin_action(usr, "USER_LOGIN", target=usr.email, details=f"Role: {usr.role}", ip=req.META.get('REMOTE_ADDR'))
            return Response({
                'token': tok,
                'user': {
                    'id': usr.id,
                    'email': usr.email,
                    'role': usr.role,
                    'paid': usr.paid or len(enrollments) > 0,
                    'name': usr.full_name or usr.email.split('@')[0],
                    'enrollments': enrollments
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
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            reset_link = f"{frontend_url}/login?reset_token={reset_token}&email={usr.email}"
            from django.core.mail import send_mail
            msg = (
                f"Hello {usr.full_name or usr.email},\n\n"
                f"A password reset was requested for your Landscape Mastery account.\n\n"
                f"Click the link below or enter this token on the login page to set a new password:\n{reset_link}\n\n"
                f"Reset Token: {reset_token}\n\n"
                f"This token is valid for 30 minutes. If you did not request this, please ignore this email."
            )
            send_mail(
                "Landscape Mastery - Password Reset Request",
                msg,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@landscapemastery.com'),
                [usr.email],
                fail_silently=True
            )
        except Exception:
            pass
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
                token_type = payload.get('type')
                token_email = payload.get('reset_email') or payload.get('email')
                if token_type not in ['password_reset', 'password_setup'] or token_email != email:
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
# PAYMENTS & CHECKOUT (Automated Account Creation Flow)
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def checkout_session(req):
    """
    Step 1 & 2: Validates billing & learner information, creates pending PaymentRecord,
    and initializes Razorpay checkout order.
    """
    email = str(req.data.get('email', '')).strip().lower()
    full_name = str(req.data.get('full_name', '')).strip()
    phone = str(req.data.get('phone', '')).strip()
    account_type = str(req.data.get('account_type', 'STUDENT')).upper().strip()
    course_id = req.data.get('course_id')

    if not email:
        return Response({'error': 'Email address is required to proceed with checkout.'}, status=status.HTTP_400_BAD_REQUEST)
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return Response({'error': 'Please provide a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)
    if not full_name:
        return Response({'error': 'Full name is required for account enrollment and certificate generation.'}, status=status.HTTP_400_BAD_REQUEST)
    if not phone:
        return Response({'error': 'Mobile number with country code is required for communications.'}, status=status.HTTP_400_BAD_REQUEST)

    if account_type not in ['STUDENT', 'EMPLOYEE', 'HOUSEHOLD']:
        account_type = 'STUDENT'

    # Assemble learner metadata based on account type
    checkout_metadata = {
        'full_name': full_name,
        'account_type': account_type,
        'qualification': str(req.data.get('qualification', '')).strip(),
        'branch': str(req.data.get('branch', '')).strip(),
        'college_name': str(req.data.get('college_name', '')).strip(),
        'passout_year': req.data.get('passout_year'),
        'student_status': str(req.data.get('student_status', 'Still Studying')).strip(),
        'company_name': str(req.data.get('company_name', '')).strip(),
        'department': str(req.data.get('department', '')).strip(),
        'designation': str(req.data.get('designation', '')).strip(),
        'employment_status': str(req.data.get('employment_status', 'Full-Time')).strip(),
        'household_name': str(req.data.get('household_name', '')).strip(),
        'primary_contact_name': str(req.data.get('primary_contact_name', full_name)).strip(),
        'residential_address': str(req.data.get('residential_address', '')).strip(),
        'member_count': req.data.get('member_count', 1),
    }

    # Per-course dynamic pricing: look up specific course selling price, fallback to site setting
    if course_id:
        try:
            course = Course.objects.get(pk=course_id, status='PUBLISHED')
            price = course.get_selling_price()
            course_title = course.title
        except Course.DoesNotExist:
            return Response({'error': 'Selected course is not available or has been unpublished.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        setting, _ = SiteSetting.objects.get_or_create(id=1)
        course = Course.objects.filter(status='PUBLISHED').first()
        price = course.get_selling_price() if course else float(setting.course_price or 299.0)
        course_title = course.title if course else 'Landscape Mastery Masterclass'

    # Apply Coupon if provided (e.g. PRIVILEGE40 with 40% discount)
    coupon_code = str(req.data.get('coupon_code', '')).strip().upper()
    if coupon_code:
        try:
            c = Coupon.objects.get(code__iexact=coupon_code, active=True)
            if c.used_count < c.max_uses:
                discount = round((price * c.discount_pct) / 100.0)
                price = max(1.0, round(price - discount, 2))
                checkout_metadata['coupon_code'] = coupon_code
                checkout_metadata['discount_pct'] = c.discount_pct
        except Coupon.DoesNotExist:
            if coupon_code in ('PRIVILEGE40', 'SPECIAL40', 'WELCOME40', 'PROMO40', 'MASTER40'):
                discount = round((price * 40.0) / 100.0)
                price = max(1.0, round(price - discount, 2))
                checkout_metadata['coupon_code'] = coupon_code
                checkout_metadata['discount_pct'] = 40

    order_id = f"order_{int(time.time())}_{secrets.token_hex(4)}"
    amount_in_paise = int(round(price * 100))

    razorpay_key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    razorpay_key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')

    # Authoritative gateway order creation with configured Razorpay credentials
    if razorpay_key_id and razorpay_key_secret:
        try:
            rzp_res = requests.post(
                "https://api.razorpay.com/v1/orders",
                auth=(razorpay_key_id, razorpay_key_secret),
                json={
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{int(time.time())}_{secrets.token_hex(3)}",
                    "notes": {
                        "course_id": str(course.id) if course else "",
                        "email": email,
                        "full_name": full_name,
                        "account_type": account_type
                    }
                },
                timeout=10
            )
            if rzp_res.status_code in [200, 201]:
                rzp_data = rzp_res.json()
                if rzp_data.get('id'):
                    order_id = rzp_data['id']
                    logger.info(f"Created Razorpay order {order_id} for {email}")
            else:
                logger.error(f"Razorpay order creation returned {rzp_res.status_code}: {rzp_res.text}")
                # In live mode (rzp_live_) or production, fail fast if the gateway rejects order creation
                if razorpay_key_id.startswith('rzp_live_') or not settings.DEBUG:
                    try:
                        err_data = rzp_res.json()
                        err_desc = err_data.get('error', {}).get('description', 'Unable to initialize order with Razorpay.')
                    except Exception:
                        err_desc = 'Unable to initialize order with Razorpay.'
                    return Response({'error': f"Payment Gateway Error: {err_desc}"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.error(f"Unable to reach Razorpay order API: {e}")
            if razorpay_key_id.startswith('rzp_live_') or not settings.DEBUG:
                return Response({'error': 'Unable to connect to Razorpay payment gateway. Please try again shortly.'}, status=status.HTTP_502_BAD_GATEWAY)

    # Store checkout details against pending PaymentRecord before payment
    PaymentRecord.objects.create(
        order_id=order_id,
        amount=price,
        currency='INR',
        status='PENDING',
        customer_email=email,
        customer_name=full_name,
        customer_phone=phone,
        account_type=account_type,
        checkout_metadata=checkout_metadata,
        course=course
    )

    return Response({
        'success': True,
        'keyId': getattr(settings, 'RAZORPAY_KEY_ID', ''),
        'orderId': order_id,
        'amount': amount_in_paise,
        'currency': 'INR',
        'email': email,
        'phone': phone,
        'customer_name': full_name,
        'account_type': account_type,
        'courseId': course.id if course else None,
        'courseTitle': course_title
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def checkout_verify(req):
    """
    Step 8-12: Verifies payment authenticity using HMAC SHA-256 signature verification.
    Guarantees course enrollment and account provisioning happen only after authoritative verification.
    Dispatches access email and returns confirmation.
    """
    razorpay_order_id = str(req.data.get('razorpay_order_id', '')).strip()
    razorpay_payment_id = str(req.data.get('razorpay_payment_id', '')).strip()
    razorpay_signature = str(req.data.get('razorpay_signature', '')).strip()
    email = str(req.data.get('email', '')).strip().lower()
    phone = str(req.data.get('phone', '')).strip()

    if not razorpay_order_id or not razorpay_payment_id or not email:
        return Response({'error': 'Missing payment verification parameters (order_id, payment_id, email required).'}, status=status.HTTP_400_BAD_REQUEST)

    sec = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if sec:
        if not razorpay_signature:
            return Response({'error': 'Payment signature required for verification.'}, status=status.HTTP_400_BAD_REQUEST)
        generated_signature = hmac.new(
            sec.encode('utf-8'),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(generated_signature, razorpay_signature):
            logger.warning(f"Signature mismatch for order {razorpay_order_id}")
            return Response({'error': 'Cryptographic payment signature verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

    # Retrieve pending order record if exists
    pending_record = PaymentRecord.objects.filter(order_id=razorpay_order_id).first()
    customer_name = pending_record.customer_name if pending_record and pending_record.customer_name else req.data.get('full_name', '')
    customer_phone = pending_record.customer_phone if pending_record and pending_record.customer_phone else phone
    account_type = pending_record.account_type if pending_record and pending_record.account_type else req.data.get('account_type', 'STUDENT')
    checkout_metadata = pending_record.checkout_metadata if pending_record and pending_record.checkout_metadata else req.data.get('checkout_metadata', {})
    course_id = pending_record.course_id if pending_record and pending_record.course_id else req.data.get('course_id')
    amount = float(pending_record.amount) if pending_record else 499.00

    # Fulfill payment: auto-provision user, enroll, send access email
    fulfillment = fulfill_verified_payment(
        order_id=razorpay_order_id,
        payment_id=razorpay_payment_id,
        customer_email=email,
        customer_name=customer_name,
        customer_phone=customer_phone,
        course_id=course_id,
        account_type=account_type,
        checkout_metadata=checkout_metadata,
        amount=amount
    )

    usr = fulfillment['user']
    log_admin_action(usr, "PAYMENT_VERIFIED_ACCOUNT_CREATED", target=email, details=f"Order: {razorpay_order_id}, Payment: {razorpay_payment_id}")

    return Response({
        'success': True,
        'message': 'Payment successfully verified. Your account has been provisioned and login instructions have been dispatched to your email.',
        'order_id': razorpay_order_id,
        'payment_id': razorpay_payment_id,
        'course_title': fulfillment['course'].title if fulfillment.get('course') else 'Landscape Mastery',
        'email': email,
        'is_new_user': fulfillment.get('is_new_user', False),
        'email_sent': fulfillment.get('email_sent', True),
        'token': fulfillment.get('token'),
        'user': {
            'id': usr.id,
            'email': usr.email,
            'role': usr.role,
            'paid': True,
            'name': usr.full_name or email.split('@')[0],
            'enrollments': fulfillment.get('enrollments', [])
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(req):
    """
    Authoritative server-side webhook handler for asynchronous gateway confirmation.
    Idempotent: safe against retries and multiple deliveries.
    """
    sig = req.headers.get('X-Razorpay-Signature')
    webhook_sec = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '') or getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    key_sec = getattr(settings, 'RAZORPAY_KEY_SECRET', '')

    if sig and (webhook_sec or key_sec):
        signature_valid = False
        for secret_candidate in filter(None, [webhook_sec, key_sec]):
            exp_sig = hmac.new(secret_candidate.encode('utf-8'), req.body, hashlib.sha256).hexdigest()
            if hmac.compare_digest(exp_sig, sig):
                signature_valid = True
                break
        if not signature_valid:
            logger.warning("Razorpay webhook signature verification failed.")
            return Response({'error': 'Invalid webhook signature'}, status=status.HTTP_400_BAD_REQUEST)
    elif not settings.DEBUG and (webhook_sec or key_sec):
        return Response({'error': 'Webhook signature required in production'}, status=status.HTTP_400_BAD_REQUEST)

    body = req.data
    event = body.get('event')
    if event in ['payment.captured', 'order.paid']:
        entity = body.get('payload', {}).get('payment', {}).get('entity', {})
        usrMail = entity.get('email')
        phn = entity.get('contact', '')
        order_id = entity.get('order_id')
        payment_id = entity.get('id', '')
        amount = float(entity.get('amount', 49900)) / 100.0

        if not order_id:
            order_id = f"order_{int(time.time())}"

        if usrMail:
            notes = entity.get('notes', {})
            webhook_course_id = notes.get('course_id')
            account_type = notes.get('account_type', 'STUDENT')
            customer_name = notes.get('customer_name', '')

            fulfill_verified_payment(
                order_id=order_id,
                payment_id=payment_id,
                customer_email=usrMail,
                customer_name=customer_name,
                customer_phone=phn,
                course_id=webhook_course_id,
                account_type=account_type,
                checkout_metadata=notes,
                amount=amount
            )
    elif event == 'payment.failed':
        entity = body.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = entity.get('order_id')
        payment_id = entity.get('id', '')
        error_desc = entity.get('error_description') or entity.get('error_reason') or 'Payment declined by bank or card issuer.'

        if order_id:
            record = PaymentRecord.objects.filter(order_id=order_id).first()
            if record and record.status != 'SUCCESS':
                record.status = 'FAILED'
                if payment_id:
                    record.payment_id = payment_id
                if not record.checkout_metadata or not isinstance(record.checkout_metadata, dict):
                    record.checkout_metadata = {}
                record.checkout_metadata['failure_reason'] = error_desc
                record.checkout_metadata['failed_at'] = int(time.time())
                record.save(update_fields=['status', 'payment_id', 'checkout_metadata', 'updated_at'])
                logger.warning(f"Payment marked as FAILED for order {order_id}: {error_desc}")

    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def order_status(req, order_id):
    """
    Retrieves the status of an order reference.
    """
    record = PaymentRecord.objects.filter(order_id=order_id).first()
    if not record:
        return Response({'error': 'Order reference not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'order_id': record.order_id,
        'payment_id': record.payment_id or '',
        'status': record.status,
        'amount': float(record.amount),
        'currency': record.currency,
        'email': record.customer_email,
        'account_type': record.account_type,
        'course_title': record.course.title if record.course else 'Landscape Mastery',
        'created_at': record.created_at
    }, status=status.HTTP_200_OK)

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
        for m in c.modules.all().order_by('order'):
            lessons_data = []
            for l in m.lessons.filter(is_published=True).order_by('order'):
                lessons_data.append({
                    'id': l.id,
                    'title': l.title,
                    'description': l.description or '',
                    'duration': l.duration or '',
                    'duration_seconds': l.duration_seconds,
                    'order': l.order,
                    'is_free_preview': l.is_free_preview,
                    'is_published': l.is_published,
                    'video_provider': l.video_provider,
                    'has_video': bool(l.video_id or l.video_url or l.assets.exists()),
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
            'duration_hrs': c.get_duration(),
            'level': c.level,
            'thumbnail': c.thumbnail or '',
            'banner': c.banner or '',
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

@api_view(['GET'])
@permission_classes([AllowAny])
def public_courses(req):
    """Returns all published courses as a catalog for the landing page."""
    courses = []
    for c in Course.objects.filter(status='PUBLISHED').order_by('id'):
        module_count = c.modules.count()
        lesson_count = sum(m.lessons.count() for m in c.modules.all())
        selling_price = c.get_selling_price()
        original_price = c.get_original_price()
        has_disc = c.has_discount()
        discount_pct = c.get_discount_percentage()
        courses.append({
            'id': c.id,
            'title': c.title,
            'slug': c.slug,
            'short_desc': c.short_desc or '',
            'full_desc': c.full_desc or '',
            'price': selling_price,
            'original_price': original_price,
            'strike_price': original_price,
            'discount_price': selling_price,
            'has_discount': has_disc,
            'is_strike_off_enabled': c.is_strike_off_enabled,
            'discount_pct': discount_pct,
            'duration_hrs': c.get_duration(),
            'level': c.level,
            'thumbnail': c.thumbnail or '',
            'banner': c.banner or '',
            'module_count': module_count,
            'lesson_count': lesson_count
        })
    return Response({'courses': courses})

@api_view(['GET'])
@permission_classes([AllowAny])
def public_course_detail(req, slug):
    """Returns a single course detail page by slug with full curriculum breakdown."""
    try:
        c = Course.objects.get(slug=slug, status='PUBLISHED')
    except Course.DoesNotExist:
        norm_slug = (slug or '').lower().strip()
        c = Course.objects.filter(slug__iexact=norm_slug, status='PUBLISHED').first()
        if not c and norm_slug in ('landscape-lens', 'lanscape-lens', 'masterclass', 'landscape'):
            c = Course.objects.filter(title__icontains='landscape', status='PUBLISHED').first() or Course.objects.filter(status='PUBLISHED').first()
        if not c:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    
    modules_data = []
    for m in c.modules.all().order_by('order'):
        lessons_data = []
        for l in m.lessons.filter(is_published=True).order_by('order'):
            lessons_data.append({
                'id': l.id,
                'title': l.title,
                'description': l.description or '',
                'duration': l.duration or '',
                'duration_seconds': l.duration_seconds,
                'order': l.order,
                'is_free_preview': l.is_free_preview,
                'is_published': l.is_published,
                'video_provider': l.video_provider,
                'has_video': bool(l.video_id or l.video_url or l.assets.exists()),
                'asset_count': l.assets.count(),
                'assets': list(l.assets.values('id', 'title', 'asset_type', 'duration'))
            })
        modules_data.append({
            'id': m.id,
            'title': m.title,
            'order': m.order,
            'lessons': lessons_data
        })
    
    selling_price = c.get_selling_price()
    original_price = c.get_original_price()
    has_disc = c.has_discount()
    discount_pct = c.get_discount_percentage()
    return Response({
        'id': c.id,
        'title': c.title,
        'slug': c.slug,
        'short_desc': c.short_desc or '',
        'full_desc': c.full_desc or '',
        'price': selling_price,
        'original_price': original_price,
        'strike_price': original_price,
        'discount_price': selling_price,
        'has_discount': has_disc,
        'discount_pct': discount_pct,
        'duration_hrs': c.get_duration(),
        'level': c.level,
        'thumbnail': c.thumbnail or '',
        'banner': c.banner or '',
        'modules': modules_data,
        'promo_url': f"/landscapemastery/promo/{c.slug}",
        'full_promo_url': f"https://3capstech.com/landscapemastery/promo/{c.slug}"
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def public_course_promo(req, slug):
    """
    Returns promotional metadata, course highlights, and social sharing templates for individual course promotional pages.
    """
    try:
        c = Course.objects.get(slug=slug)
    except Course.DoesNotExist:
        norm_slug = (slug or '').lower().strip()
        c = Course.objects.filter(slug__iexact=norm_slug).first()
        if not c and norm_slug in ('landscape-lens', 'lanscape-lens', 'masterclass', 'landscape'):
            c = Course.objects.filter(title__icontains='landscape').first() or Course.objects.filter(status='PUBLISHED').first()
        if not c:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    host = 'https://3capstech.com'
    promo_url = f"{host}/landscapemastery/promo/{c.slug}"
    enroll_url = f"{host}/courses/{c.slug}"
    qr_url = f"{host}/api/public/courses/{c.slug}/qr.png"

    module_count = c.modules.count()
    lesson_count = sum(m.lessons.count() for m in c.modules.all())
    selling_price = c.get_selling_price()
    original_price = c.get_original_price()
    has_disc = c.has_discount()
    discount_pct = c.get_discount_percentage()

    formatted_selling = int(selling_price) if float(selling_price).is_integer() else f"{selling_price:.2f}"
    formatted_original = int(original_price) if original_price and float(original_price).is_integer() else (f"{original_price:.2f}" if original_price else None)

    return Response({
        'id': c.id,
        'title': c.title,
        'slug': c.slug,
        'short_desc': c.short_desc or '',
        'full_desc': c.full_desc or '',
        'price': selling_price,
        'original_price': original_price,
        'strike_price': original_price,
        'discount_price': selling_price,
        'has_discount': has_disc,
        'discount_pct': discount_pct,
        'formatted_price': formatted_selling,
        'formatted_original': formatted_original,
        'formatted_discount': formatted_selling,
        'duration_hrs': c.get_duration(),
        'level': c.level,
        'thumbnail': c.thumbnail or '',
        'banner': c.banner or '',
        'status': c.status,
        'module_count': module_count,
        'lesson_count': lesson_count,
        'promo_url': promo_url,
        'enroll_url': enroll_url,
        'qr_image_url': qr_url,
        'greeting': {
            'badge': 'Special Course Invitation',
            'salutation': "Welcome! You're Invited",
            'headline': f"Get Full Access to {c.title}",
            'subtext': 'We are excited to share this course with you! Scan the QR code with your phone or tap the card below to enroll and start learning today.'
        },
        'share_templates': {
            'whatsapp': f"🌿 Master Landscape Architecture with *{c.title}* by Landscape Mastery (a product of 3CAPSTECH)!\n\nExclusive course pass with lifetime access for only ₹{formatted_price}.\n\n✨ Tap here or scan the QR pass to claim your spot:\n{promo_url}",
            'twitter': f"Start learning {c.title} today. Lifetime course access for ₹{formatted_price}: {promo_url} #LandscapeMastery #3CAPSTECH #OnlineLearning",
            'linkedin': f"Excited to share the {c.title} course by Landscape Mastery (a product of 3CAPSTECH). Learn more and enroll here: {promo_url}",
            'instagram_caption': f"✨ Start your learning journey with {c.title} by Landscape Mastery (a product of 3CAPSTECH).\n\n👉 Tap link in bio or visit: 3capstech.com/landscapemastery/promo/{c.slug}\n\n#landscapemastery #3capstech #course #learning"
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def public_course_qr(req, slug):
    """
    Generates and streams a high-resolution, emerald-branded QR code PNG image.
    Destination defaults to course enrollment (/courses/<slug>) or /landscapemastery/promo/<slug> if ?dest=promo.
    """
    try:
        c = Course.objects.get(slug=slug)
    except Course.DoesNotExist:
        norm_slug = (slug or '').lower().strip()
        c = Course.objects.filter(slug__iexact=norm_slug).first()
        if not c and norm_slug in ('landscape-lens', 'lanscape-lens', 'masterclass', 'landscape'):
            c = Course.objects.filter(title__icontains='landscape').first() or Course.objects.filter(status='PUBLISHED').first()
        if not c:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    import qrcode
    import io

    dest = req.GET.get('dest', 'enroll')
    host = 'https://3capstech.com'

    if dest == 'promo':
        target_url = f"{host}/landscapemastery/promo/{c.slug}"
    else:
        target_url = f"{host}/courses/{c.slug}"

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#064E3B", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)

    response = HttpResponse(buf.getvalue(), content_type="image/png")
    response['Cache-Control'] = 'public, max-age=86400'
    response['Content-Disposition'] = f'inline; filename="qr_{c.slug}.png"'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_enrollments(req):
    """
    Returns all courses the current user is enrolled in.
    Supports both legacy 'enrollments' array and categorized 'active' / 'archived'
    lists with dynamic completion percentage, validity dates, and instructor metadata.
    """
    from datetime import timedelta

    # Auto-provision primary published course if paid user has no explicit enrollment record
    if getattr(req.user, 'paid', False) and not Enrollment.objects.filter(user=req.user).exists():
        first_published = Course.objects.filter(status='PUBLISHED').first()
        if first_published:
            Enrollment.objects.get_or_create(user=req.user, course=first_published, defaults={'status': 'ACTIVE', 'access_type': 'PAID'})

    # Fetch completed lesson IDs for this specific user
    user_completed_lesson_ids = set(
        LessonProgress.objects.filter(user=req.user, completed=True)
        .values_list('lesson_id', flat=True)
    )

    enrollments_qs = (
        Enrollment.objects.filter(user=req.user)
        .select_related('course', 'course__instructor')
        .prefetch_related('course__modules__lessons')
        .order_by('-enrolled_at')
    )

    enrolled_courses = []
    active_courses = []
    archived_courses = []

    for enr in enrollments_qs:
        if not enr.course:
            continue
        c = enr.course

        # Count total published lessons and calculate user completion percentage
        all_lessons = []
        for mod in c.modules.all():
            all_lessons.extend([l for l in mod.lessons.all() if l.is_published])

        total_lessons = len(all_lessons)
        completed_lessons = sum(1 for l in all_lessons if l.id in user_completed_lesson_ids)
        progress_percent = int(round((completed_lessons / total_lessons * 100))) if total_lessons > 0 else 0

        # Calculate validity date (default: 1 year from enrollment or default future date)
        if enr.enrolled_at:
            valid_until_date = enr.enrolled_at + timedelta(days=365)
            valid_until_str = valid_until_date.strftime('%b %d, %Y')
        else:
            valid_until_str = 'Feb 28, 2027'

        course_item = {
            'id': c.id,
            'title': c.title,
            'slug': c.slug,
            'short_desc': c.short_desc or '',
            'price': float(c.price),
            'discount_price': float(c.discount_price),
            'duration_hrs': c.get_duration(),
            'level': c.level,
            'thumbnail': c.thumbnail or c.banner or '/course_thumb_landscape.jpg',
            'banner': c.banner or '',
            'enrolled_at': enr.enrolled_at.strftime('%Y-%m-%d') if enr.enrolled_at else 'N/A',
            'access_type': enr.access_type,
            'instructor_name': c.instructor.name if c.instructor else '',
            'instructor_title': c.instructor.title if c.instructor else 'Industry Expert',
            'progress_percent': progress_percent,
            'completed_lessons': completed_lessons,
            'total_lessons': total_lessons,
            'valid_until': valid_until_str,
            'status': enr.status
        }

        enrolled_courses.append(course_item)
        if enr.status == 'ARCHIVED':
            archived_courses.append(course_item)
        else:
            active_courses.append(course_item)

    return Response({
        'enrollments': enrolled_courses,
        'active': active_courses,
        'archived': archived_courses
    })

# ---------------------------------------------------------
# DRM VIDEO STREAMING & PROGRESS TRACKING
# ---------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_signed_video_url(req, pk):
    # Per-course enrollment check: verify user has access to the course containing this asset
    if req.user.role == 'STUDENT':
        # Find the course this asset belongs to
        asset_course_ids = set()
        from .models import MediaAsset as MA, ContentItem as CI
        try:
            asset = MA.objects.get(pk=pk)
            if asset.lesson and asset.lesson.module:
                asset_course_ids.add(asset.lesson.module.course_id)
        except MA.DoesNotExist:
            pass
        
        if asset_course_ids:
            enrolled_course_ids = set(Enrollment.objects.filter(user=req.user, status='ACTIVE').values_list('course_id', flat=True))
            if not asset_course_ids.intersection(enrolled_course_ids) and not req.user.paid:
                return Response({'error': 'Access denied: You are not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)
        elif not req.user.paid:
            # Fallback for unattached assets — require at least one enrollment
            if not Enrollment.objects.filter(user=req.user, status='ACTIVE').exists():
                return Response({'error': 'Access denied: No active enrollment found'}, status=status.HTTP_403_FORBIDDEN)
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
                'streamUrl': req.build_absolute_uri(f"/api/video/stream/{pk}/play/?token={token}"),
                'watermark': f"ENROLLED STUDENT: {req.user.email.upper()} • ID: LM-{req.user.id}"
            })
        except ContentItem.DoesNotExist:
            return Response({'error': 'Media asset not found'}, status=status.HTTP_404_NOT_FOUND)

    token, exp = generate_signed_stream_token(req.user, asset.id, duration_sec=300)
    return Response({
        'assetId': asset.id,
        'signedToken': token,
        'expiresAt': exp,
        'streamUrl': req.build_absolute_uri(f"/api/video/stream/{asset.id}/play/?token={token}"),
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

    # Instructors are granted full academic and studio powers but strictly restricted from financial revenue metrics
    is_instructor = (req.user.role == 'INSTRUCTOR')
    if is_instructor:
        total_revenue = None
    else:
        total_revenue = float(sum([p.amount for p in PaymentRecord.objects.filter(status='SUCCESS')]) or 0)

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
        'totalRevenue': total_revenue,
        'isFinancialRestricted': is_instructor,
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
        if req.user.role == 'INSTRUCTOR' and 'coursePrice' in req.data:
            return Response({'error': 'Instructors are not authorized to modify financial pricing.'}, status=status.HTTP_403_FORBIDDEN)
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
        
        setting.logo_url = f"/media/{filename}"
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
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Content Manager permission required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        courses = []
        for c in Course.objects.all():
            courses.append({
                'id': c.id,
                'title': c.title,
                'slug': c.slug,
                'price': c.get_selling_price(),
                'original_price': c.get_original_price(),
                'raw_original_price': float(c.original_price) if c.original_price else None,
                'is_strike_off_enabled': c.is_strike_off_enabled,
                'strike_price': c.get_original_price(),
                'discount_price': c.get_selling_price(),
                'has_discount': c.has_discount(),
                'discount_pct': c.get_discount_percentage(),
                'status': c.status,
                'thumbnail': c.thumbnail or '',
                'banner': c.banner or '',
                'modulesCount': c.modules.count(),
                'promo_url': f"/landscapemastery/promo/{c.slug}",
                'full_promo_url': f"https://3capstech.com/landscapemastery/promo/{c.slug}",
                'enroll_url': f"/courses/{c.slug}",
                'qr_image_url': f"/api/public/courses/{c.slug}/qr.png"
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
        price = req.data.get('price', 299.00)
        is_strike_off_enabled = bool(req.data.get('is_strike_off_enabled', True))
        original_price = req.data.get('original_price') or req.data.get('strike_price')
        if original_price:
            try:
                val = float(original_price)
                original_price = val if val > float(price) else None
            except (ValueError, TypeError):
                original_price = None
        else:
            original_price = None

        thumbnail = req.data.get('thumbnail', '')
        course = Course.objects.create(
            title=title, slug=slug, short_desc=short_desc, full_desc=full_desc, price=price, original_price=original_price, is_strike_off_enabled=is_strike_off_enabled, discount_price=price, status='PUBLISHED', thumbnail=thumbnail
        )
        log_admin_action(req.user, "COURSE_CREATED", target=course.title, details=f"ID: {course.id}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'created',
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
            'price': course.get_selling_price(),
            'original_price': course.get_original_price(),
            'raw_original_price': float(course.original_price) if course.original_price else None,
            'is_strike_off_enabled': course.is_strike_off_enabled,
            'strike_price': course.get_original_price(),
            'discount_price': course.get_selling_price(),
            'has_discount': course.has_discount(),
            'discount_pct': course.get_discount_percentage(),
            'thumbnail': course.thumbnail or '',
            'promo_url': f"/landscapemastery/promo/{course.slug}",
            'full_promo_url': f"https://3capstech.com/landscapemastery/promo/{course.slug}",
            'enroll_url': f"/courses/{course.slug}",
            'qr_image_url': f"/api/public/courses/{course.slug}/qr.png"
        })

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_course_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
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
                lessons.append({
                    'id': l.id,
                    'module_id': m.id,
                    'title': l.title,
                    'description': l.description or '',
                    'video_provider': l.video_provider or 'veed',
                    'video_id': l.video_id or '',
                    'video_url': l.video_url or '',
                    'duration': l.duration or '',
                    'duration_seconds': l.duration_seconds,
                    'order': l.order,
                    'is_free_preview': l.is_free_preview,
                    'is_published': l.is_published,
                    'assets': assets
                })
            modules.append({'id': m.id, 'title': m.title, 'order': m.order, 'lessons': lessons})
        return Response({
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
            'price': course.get_selling_price(),
            'original_price': course.get_original_price(),
            'raw_original_price': float(course.original_price) if course.original_price else None,
            'is_strike_off_enabled': course.is_strike_off_enabled,
            'strike_price': course.get_original_price(),
            'discount_price': course.get_selling_price(),
            'has_discount': course.has_discount(),
            'discount_pct': course.get_discount_percentage(),
            'status': course.status,
            'thumbnail': course.thumbnail or '',
            'banner': course.banner or '',
            'modules': modules,
            'promo_url': f"/landscapemastery/promo/{course.slug}",
            'full_promo_url': f"https://3capstech.com/landscapemastery/promo/{course.slug}",
            'enroll_url': f"/courses/{course.slug}",
            'qr_image_url': f"/api/public/courses/{course.slug}/qr.png"
        })
    elif req.method == 'DELETE':
        title = course.title
        course.delete()
        log_admin_action(req.user, "COURSE_DELETED", target=title, details=f"ID: {pk}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'title' in req.data: course.title = req.data['title']
        if 'price' in req.data:
            try:
                new_price = float(req.data['price'])
                course.price = new_price
                course.discount_price = new_price
            except (ValueError, TypeError):
                pass
        if 'is_strike_off_enabled' in req.data:
            course.is_strike_off_enabled = bool(req.data['is_strike_off_enabled'])
        if 'enable_strike_price' in req.data:
            course.is_strike_off_enabled = bool(req.data['enable_strike_price'])
        if 'original_price' in req.data or 'strike_price' in req.data:
            orig = req.data.get('original_price', req.data.get('strike_price'))
            if orig is None or orig == '' or orig == 0 or orig == '0':
                course.original_price = None
            else:
                try:
                    val = float(orig)
                    course.original_price = val if val > float(course.price) else None
                except (ValueError, TypeError):
                    course.original_price = None
        if 'status' in req.data: course.status = req.data['status']
        if 'thumbnail' in req.data: course.thumbnail = req.data['thumbnail']
        if 'banner' in req.data: course.banner = req.data['banner']
        course.save()
        log_admin_action(req.user, "COURSE_UPDATED", target=course.title, details=f"Price: {course.price}, OriginalPrice: {course.original_price}, StrikeToggle: {course.is_strike_off_enabled}, Status: {course.status}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'updated',
            'course': {
                'id': course.id,
                'title': course.title,
                'slug': course.slug,
                'price': course.get_selling_price(),
                'original_price': course.get_original_price(),
                'raw_original_price': float(course.original_price) if course.original_price else None,
                'is_strike_off_enabled': course.is_strike_off_enabled,
                'strike_price': course.get_original_price(),
                'discount_price': course.get_selling_price(),
                'has_discount': course.has_discount(),
                'discount_pct': course.get_discount_percentage(),
                'status': course.status,
                'thumbnail': course.thumbnail or '',
                'banner': course.banner or ''
            }
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_upload_course_cover(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Content Manager permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    image_url = req.data.get('imageUrl')
    data_url = req.data.get('dataUrl')
    file_obj = req.FILES.get('file') or req.FILES.get('cover') or req.FILES.get('thumbnail')

    if image_url:
        course.thumbnail = image_url
        course.save()
        log_admin_action(req.user, "COURSE_COVER_UPDATED", target=course.title, details=f"URL: {image_url}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'thumbnail': course.thumbnail})

    elif data_url:
        course.thumbnail = data_url
        course.save()
        log_admin_action(req.user, "COURSE_COVER_UPDATED", target=course.title, details="Data URL saved", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'thumbnail': course.thumbnail})

    elif file_obj:
        import os
        from pathlib import Path
        file_ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
        allowed_exts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.avif']
        if file_ext not in allowed_exts:
            return Response({'error': 'Unsupported file format. Please upload JPG, PNG, or WebP.'}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"course_cover_{course.id}_{int(time.time())}{file_ext}"
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        # Also copy to frontend/public for static fallback
        frontend_public = Path(settings.BASE_DIR).parent / 'frontend' / 'public'
        if frontend_public.exists():
            try:
                import shutil
                shutil.copyfile(file_path, frontend_public / filename)
            except Exception:
                pass

        course.thumbnail = f"/media/{filename}"
        course.save()
        log_admin_action(req.user, "COURSE_COVER_UPLOADED", target=course.title, details=f"File: {filename}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'uploaded', 'thumbnail': course.thumbnail})

    return Response({'error': 'No file or image URL provided'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_module(req, course_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
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

def serialize_lesson_data(les, include_video_url=False):
    data = {
        'id': les.id,
        'module_id': les.module_id,
        'module_title': les.module.title if les.module else '',
        'course_id': les.module.course_id if les.module else None,
        'course_title': les.module.course.title if les.module and les.module.course else '',
        'title': les.title,
        'description': les.description or '',
        'video_provider': les.video_provider or 'veed',
        'duration': les.duration or '',
        'duration_seconds': les.duration_seconds,
        'order': les.order,
        'is_free_preview': les.is_free_preview,
        'is_published': les.is_published,
        'has_video': bool(les.video_id or les.video_url or les.assets.exists()),
        'created_at': les.created_at.strftime('%Y-%m-%d %H:%M') if les.created_at else None,
        'updated_at': les.updated_at.strftime('%Y-%m-%d %H:%M') if les.updated_at else None,
        'assets': list(les.assets.values('id', 'title', 'asset_type', 'duration', 'url'))
    }
    if include_video_url:
        data['video_id'] = les.video_id or ''
        data['video_url'] = les.video_url or ''
    return data

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_lesson(req, module_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied: Super Admin or Content Manager role required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        module = Module.objects.select_related('course').get(pk=module_id)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)

    title = req.data.get('title', '').strip()
    if not title:
        return Response({'error': 'Lesson title is required'}, status=status.HTTP_400_BAD_REQUEST)

    description = req.data.get('description', '').strip()
    video_provider = req.data.get('video_provider', 'veed').strip().lower() or 'veed'
    video_source = (req.data.get('video_url') or req.data.get('video_id') or req.data.get('embed_code') or '').strip()
    duration = req.data.get('duration', '').strip()
    duration_seconds = int(req.data.get('duration_seconds') or 0)
    if duration and not duration_seconds:
        duration_seconds = parse_duration_to_seconds(duration)
    elif duration_seconds and not duration:
        duration = format_seconds_to_duration(duration_seconds)
    elif not duration and not duration_seconds and video_source:
        duration = '45 mins'
        duration_seconds = 45 * 60
    order = req.data.get('order') or (module.lessons.count() + 1)
    is_free_preview = bool(req.data.get('is_free_preview', False))
    is_published = bool(req.data.get('is_published', True))

    video_id = ''
    video_url = ''
    if video_source:
        is_valid, vid_id, norm_url, err = validate_veed_source(video_source)
        if not is_valid:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)
        video_id = vid_id or ''
        video_url = norm_url or ''

    les = Lesson.objects.create(
        module=module,
        title=title,
        description=description,
        video_provider=video_provider,
        video_id=video_id,
        video_url=video_url,
        duration=duration,
        duration_seconds=duration_seconds,
        order=int(order),
        is_free_preview=is_free_preview,
        is_published=is_published,
        created_by=req.user
    )
    if module.course_id:
        update_course_duration(module.course, save=True)
    log_admin_action(req.user, "LESSON_CREATED", target=title, details=f"Module ID: {module_id}, Video ID: {video_id or 'none'}")
    return Response({'status': 'created', 'lesson': serialize_lesson_data(les, include_video_url=True)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_course_lessons(req, course_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    lessons_list = []
    for m in course.modules.all().order_by('order'):
        for l in m.lessons.all().order_by('order'):
            lessons_list.append(serialize_lesson_data(l, include_video_url=True))

    return Response({'course_id': course.id, 'course_title': course.title, 'lessons': lessons_list})

@api_view(['GET', 'PATCH', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_lesson_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        les = Lesson.objects.select_related('module__course').get(pk=pk)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.method == 'GET':
        return Response({'lesson': serialize_lesson_data(les, include_video_url=True)})

    elif req.method == 'DELETE':
        title = les.title
        mod_id = les.module_id
        les.delete()
        log_admin_action(req.user, "LESSON_DELETED", target=title, details=f"Lesson ID: {pk}, Module ID: {mod_id}")
        return Response({'status': 'deleted', 'message': f'Lesson "{title}" deleted successfully'})

    elif req.method in ['PATCH', 'PUT']:
        if 'title' in req.data:
            t = str(req.data['title']).strip()
            if not t:
                return Response({'error': 'Lesson title cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            les.title = t
        if 'description' in req.data:
            les.description = str(req.data['description']).strip()
        if 'video_provider' in req.data:
            les.video_provider = str(req.data['video_provider']).strip() or 'veed'
        if 'duration' in req.data:
            les.duration = str(req.data['duration']).strip()
            if 'duration_seconds' not in req.data:
                les.duration_seconds = parse_duration_to_seconds(les.duration)
        if 'duration_seconds' in req.data:
            les.duration_seconds = int(req.data['duration_seconds'] or 0)
            if 'duration' not in req.data and les.duration_seconds > 0:
                les.duration = format_seconds_to_duration(les.duration_seconds)
        if 'order' in req.data:
            les.order = int(req.data['order'])
        if 'is_free_preview' in req.data:
            les.is_free_preview = bool(req.data['is_free_preview'])
        if 'is_published' in req.data:
            les.is_published = bool(req.data['is_published'])
        if 'module_id' in req.data and req.data['module_id'] != les.module_id:
            try:
                new_mod = Module.objects.get(pk=req.data['module_id'])
                les.module = new_mod
            except Module.DoesNotExist:
                return Response({'error': 'Target module not found'}, status=status.HTTP_404_NOT_FOUND)

        # Handle video reference updates
        video_source_fields = ['video_url', 'video_id', 'embed_code']
        has_video_input = any(f in req.data for f in video_source_fields)
        if has_video_input:
            video_input = (req.data.get('video_url') or req.data.get('video_id') or req.data.get('embed_code') or '').strip()
            if video_input:
                is_valid, vid_id, norm_url, err = validate_veed_source(video_input)
                if not is_valid:
                    return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)
                les.video_id = vid_id or ''
                les.video_url = norm_url or ''
            else:
                les.video_id = ''
                les.video_url = ''

        les.save()
        log_admin_action(req.user, "LESSON_UPDATED", target=les.title, details=f"ID: {les.id}, Published: {les.is_published}, FreePreview: {les.is_free_preview}")
        return Response({'status': 'updated', 'lesson': serialize_lesson_data(les, include_video_url=True)})

@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def admin_lesson_publish(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        les = Lesson.objects.get(pk=pk)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)

    if 'is_published' in req.data:
        les.is_published = bool(req.data['is_published'])
    else:
        # Toggle
        les.is_published = not les.is_published

    les.save()
    action = "LESSON_PUBLISHED" if les.is_published else "LESSON_UNPUBLISHED"
    log_admin_action(req.user, action, target=les.title, details=f"Lesson ID: {pk}")
    return Response({'status': 'updated', 'is_published': les.is_published, 'lesson': serialize_lesson_data(les, include_video_url=True)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_validate_veed(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    source = req.data.get('video_source') or req.data.get('url') or req.data.get('video_id') or ''
    is_valid, video_id, norm_url, err = validate_veed_source(source)

    if not is_valid:
        return Response({
            'valid': False,
            'error': err
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'valid': True,
        'video_id': video_id,
        'embed_url': norm_url,
        'provider': 'veed',
        'notice': (
            'VEED video identifier and embed URL format successfully verified. '
            'Please ensure the video in your VEED workspace is set to allow embedding, '
            'as provider-side privacy permissions determine whether playback is allowed by VEED.'
        )
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def course_curriculum(req, course_id):
    """
    Returns full curriculum of a course with modules and published lessons.
    Enforces that unpublished lessons are hidden from regular students.
    Includes lock status for paid lessons based on user's active enrollment.
    """
    try:
        course = Course.objects.get(pk=course_id, status='PUBLISHED')
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    is_admin = check_admin_permission(req.user) if req.user and req.user.is_authenticated else False
    is_enrolled = False

    if req.user and req.user.is_authenticated:
        if is_admin:
            is_enrolled = True
        else:
            is_enrolled = (
                Enrollment.objects.filter(user=req.user, course=course, status='ACTIVE').exists()
                or getattr(req.user, 'paid', False)
            )

    completed_lesson_ids = set()
    if req.user and req.user.is_authenticated:
        completed_lesson_ids = set(
            LessonProgress.objects.filter(user=req.user, completed=True).values_list('lesson_id', flat=True)
        )

    modules_data = []
    for m in course.modules.all().order_by('order'):
        lessons_qs = m.lessons.all() if is_admin else m.lessons.filter(is_published=True)
        lessons_data = []
        for l in lessons_qs.order_by('order'):
            is_locked = not is_enrolled and not l.is_free_preview
            lesson_info = serialize_lesson_data(l, include_video_url=is_admin)
            lesson_info['is_locked'] = is_locked
            lesson_info['is_completed'] = l.id in completed_lesson_ids
            lessons_data.append(lesson_info)

        modules_data.append({
            'id': m.id,
            'title': m.title,
            'order': m.order,
            'lessons': lessons_data
        })

    return Response({
        'course_id': course.id,
        'title': course.title,
        'slug': course.slug,
        'price': float(course.price),
        'is_enrolled': is_enrolled,
        'modules': modules_data
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def lesson_playback(req, course_id, lesson_id):
    """
    Secure Playback Authorization Endpoint:
    GET /api/courses/{course_id}/lessons/{lesson_id}/playback/
    
    Validates:
    1. Lesson exists and belongs to the requested course (IDOR / cross-course protection)
    2. Lesson is published (unpublished lessons hidden from students)
    3. User entitlement:
       - Free-preview lessons are accessible without paid enrollment.
       - Paid lessons require authentication and an active, verified enrollment.
       - Refunded, cancelled, expired, or revoked enrollments explicitly denied.
    4. Returns authorized playback payload with verified VEED embed URL.
    """
    try:
        lesson = Lesson.objects.select_related('module__course').get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)

    # Validate that lesson belongs to the specified course
    if not lesson.module or lesson.module.course_id != int(course_id):
        return Response(
            {'error': 'Lesson does not belong to the requested course'},
            status=status.HTTP_404_NOT_FOUND
        )

    is_admin = check_admin_permission(req.user) if req.user and req.user.is_authenticated else False

    # Check publication status
    if not is_admin and not lesson.is_published:
        return Response({'error': 'Lesson is not published or currently unavailable'}, status=status.HTTP_404_NOT_FOUND)

    # Entitlement verification
    is_free = lesson.is_free_preview
    is_authorized = False
    is_enrolled = False

    if is_admin:
        is_authorized = True
        is_enrolled = True
    elif is_free:
        is_authorized = True
        if req.user and req.user.is_authenticated:
            is_enrolled = Enrollment.objects.filter(user=req.user, course_id=course_id, status='ACTIVE').exists() or getattr(req.user, 'paid', False)
    else:
        # Paid lesson: strict authentication & purchase verification
        if not req.user or not req.user.is_authenticated:
            return Response(
                {
                    'error': 'Authentication required. Please sign in to access this lesson.',
                    'requires_auth': True,
                    'locked': True
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check for revoked / refunded / cancelled enrollments
        revoked_enrollments = Enrollment.objects.filter(
            user=req.user,
            course_id=course_id,
            status__in=['REFUNDED', 'CANCELLED', 'EXPIRED', 'REVOKED']
        )
        active_enrollments = Enrollment.objects.filter(
            user=req.user,
            course_id=course_id,
            status='ACTIVE'
        )

        if revoked_enrollments.exists() and not active_enrollments.exists():
            return Response(
                {
                    'error': 'Access revoked: Your enrollment for this course has been refunded, cancelled, or revoked.',
                    'revoked': True,
                    'locked': True
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Check active enrollment or verified payment record or global paid flag
        if active_enrollments.exists() or PaymentRecord.objects.filter(user=req.user, course_id=course_id, status='SUCCESS').exists() or getattr(req.user, 'paid', False):
            is_authorized = True
            is_enrolled = True
        else:
            return Response(
                {
                    'error': 'Access denied: You have not purchased this course.',
                    'locked': True,
                    'course_id': course_id,
                    'course_title': lesson.module.course.title if lesson.module and lesson.module.course else '',
                    'course_price': float(lesson.module.course.price) if lesson.module and lesson.module.course else 499.0
                },
                status=status.HTTP_403_FORBIDDEN
            )

    if not is_authorized:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    # Determine embed URL - strictly sanitize VEED URLs to remove watermark and share button
    embed_url = ''
    if lesson.video_id:
        embed_url = normalize_veed_embed_url(lesson.video_id, watermark=False, sharing=False, title=False)
    elif lesson.video_url:
        embed_url = normalize_veed_embed_url(lesson.video_url, watermark=False, sharing=False, title=False) or lesson.video_url
    elif lesson.assets.exists():
        first_asset = lesson.assets.first()
        embed_url = first_asset.url or (first_asset.file.url if first_asset.file else '')

    user_identifier = req.user.email.upper() if (req.user and req.user.is_authenticated) else 'GUEST_STUDENT'
    user_id = f"LM-{req.user.id}" if (req.user and req.user.is_authenticated) else "LM-PREVIEW"
    watermark = f"ENROLLED STUDENT: {user_identifier} • ID: {user_id}"

    return Response({
        'lesson_id': lesson.id,
        'course_id': int(course_id),
        'course_title': lesson.module.course.title if lesson.module and lesson.module.course else '',
        'module_id': lesson.module_id,
        'module_title': lesson.module.title if lesson.module else '',
        'title': lesson.title,
        'description': lesson.description or '',
        'video_provider': lesson.video_provider or 'veed',
        'video_id': lesson.video_id or '',
        'embed_url': embed_url,
        'duration': lesson.duration or '',
        'duration_seconds': lesson.duration_seconds,
        'is_free_preview': lesson.is_free_preview,
        'is_enrolled': is_enrolled,
        'watermark': watermark
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_asset(req, lesson_id):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)
    title = req.data.get('title', 'New Asset')
    asset_type = req.data.get('asset_type', 'short_video')
    url = req.data.get('url', '')
    duration = req.data.get('duration', '').strip()
    file_obj = req.FILES.get('file')
    if not duration and file_obj:
        detected_sec = get_mp4_duration_seconds(file_obj)
        if detected_sec > 0:
            duration = format_seconds_to_duration(detected_sec)
    if not duration:
        duration = '45 mins'
    asset = MediaAsset.objects.create(lesson=lesson, title=title, asset_type=asset_type, url=url, duration=duration, file=file_obj)
    if lesson.module and lesson.module.course_id:
        update_course_duration(lesson.module.course, save=True)
    log_admin_action(req.user, "ASSET_ATTACHED", target=title, details=f"Lesson ID: {lesson_id}")
    return Response({'status': 'created', 'asset': {'id': asset.id, 'title': asset.title, 'asset_type': asset.asset_type, 'duration': asset.duration, 'url': asset.url}})

# ---------------------------------------------------------
# ADMIN MEDIA ASSET LIBRARY (GENUINE PERSISTENCE)
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_media_list_create(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN']):
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
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'ADMIN']):
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
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'SUPPORT_ADMIN', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    stds = list(Usr.objects.filter(role='STUDENT').values('id', 'email', 'phone', 'paid', 'is_active', 'created_at'))
    return Response({'students': stds})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_student_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'SUPPORT_ADMIN', 'ADMIN']):
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_users(req):
    """
    PORTAL ADMIN USER & STAFF GOVERNANCE:
    Full platform rights to list, filter, and create users and staff members
    with specific role assignments.
    """
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'ADMIN']):
        return Response({'error': 'Portal Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    
    if req.method == 'GET':
        users_list = []
        for u in Usr.objects.all().order_by('-created_at'):
            users_list.append({
                'id': u.id,
                'email': u.email,
                'phone': u.phone or '',
                'full_name': u.full_name or '',
                'role': u.role,
                'paid': u.paid,
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'is_superuser': u.is_superuser,
                'created_at': u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else 'N/A'
            })
        
        counts = {
            'total': Usr.objects.count(),
            'super_admin': Usr.objects.filter(role='SUPER_ADMIN').count(),
            'instructor': Usr.objects.filter(role='INSTRUCTOR').count(),
            'content_manager': Usr.objects.filter(role='CONTENT_MANAGER').count(),
            'support_admin': Usr.objects.filter(role='SUPPORT_ADMIN').count(),
            'students': Usr.objects.filter(role='STUDENT').count(),
            'paid_students': Usr.objects.filter(role='STUDENT', paid=True).count(),
        }
        return Response({'users': users_list, 'counts': counts})

    elif req.method == 'POST':
        email = req.data.get('email', '').strip().lower()
        password = req.data.get('password')
        role = req.data.get('role', 'STUDENT')
        full_name = req.data.get('full_name', '').strip()
        phone = req.data.get('phone', '').strip()
        paid = bool(req.data.get('paid', False))

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if Usr.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN', 'STUDENT']
        if role not in valid_roles:
            role = 'STUDENT'

        is_staff = role in ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN']
        is_superuser = (role == 'SUPER_ADMIN')

        new_user = Usr.objects.create(
            email=email,
            role=role,
            full_name=full_name,
            phone=phone,
            paid=paid,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_active=True
        )
        new_user.set_password(password)
        new_user.save()

        log_admin_action(req.user, "USER_CREATED", target=email, details=f"Role: {role}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'created',
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'full_name': new_user.full_name,
                'role': new_user.role,
                'paid': new_user.paid,
                'is_active': new_user.is_active,
                'is_staff': new_user.is_staff
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(req, pk):
    """
    PORTAL ADMIN USER MODIFICATION:
    Change role, toggle paid/active status, reset password, or remove user.
    """
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'ADMIN']):
        return Response({'error': 'Portal Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        target_usr = Usr.objects.get(pk=pk)
    except Usr.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.method == 'DELETE':
        if target_usr.id == req.user.id:
            return Response({'error': 'Security restriction: You cannot delete your own account while logged in.'}, status=status.HTTP_400_BAD_REQUEST)
        email = target_usr.email
        target_usr.delete()
        log_admin_action(req.user, "USER_DELETED", target=email, details=f"ID: {pk}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})

    elif req.method == 'PATCH':
        if 'role' in req.data:
            new_role = req.data['role']
            valid_roles = ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN', 'STUDENT']
            if new_role in valid_roles:
                target_usr.role = new_role
                target_usr.is_staff = new_role in ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN']
                if new_role == 'SUPER_ADMIN':
                    target_usr.is_superuser = True
        if 'is_active' in req.data:
            target_usr.is_active = bool(req.data['is_active'])
        if 'paid' in req.data:
            target_usr.paid = bool(req.data['paid'])
        if 'full_name' in req.data:
            target_usr.full_name = req.data['full_name']
        if 'phone' in req.data:
            target_usr.phone = req.data['phone']
        if 'password' in req.data and req.data['password']:
            target_usr.set_password(req.data['password'])
        target_usr.save()

        log_admin_action(req.user, "USER_UPDATED", target=target_usr.email, details=f"Role: {target_usr.role}, Active: {target_usr.is_active}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'user': {
            'id': target_usr.id,
            'email': target_usr.email,
            'role': target_usr.role,
            'paid': target_usr.paid,
            'is_active': target_usr.is_active,
            'full_name': target_usr.full_name
        }})

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
    
    # Built-in promotional privilege coupon codes (40% OFF on 499 => 299)
    if code in ('PRIVILEGE40', 'SPECIAL40', 'WELCOME40', 'PROMO40', 'MASTER40'):
        c, _ = Coupon.objects.get_or_create(
            code=code,
            defaults={'discount_pct': 40, 'max_uses': 999999, 'active': True}
        )
        return Response({'valid': True, 'code': c.code, 'discount_pct': 40})

    try:
        c = Coupon.objects.get(code=code, active=True)
        if c.used_count >= c.max_uses:
            return Response({'error': 'Coupon usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True, 'code': c.code, 'discount_pct': c.discount_pct})
    except Coupon.DoesNotExist:
        return Response({'error': 'Invalid or expired coupon code'}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------------------------
# ANNOUNCEMENTS CMS (SUPER_ADMIN, INSTRUCTOR, CONTENT_MANAGER)
# ---------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_announcements(req):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor or Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    
    if req.method == 'GET':
        announcements = []
        for a in Announcement.objects.all().order_by('-created_at'):
            announcements.append({
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'active': a.active,
                'created_by': a.created_by.email if a.created_by else 'Faculty',
                'created_at': a.created_at.strftime('%Y-%m-%d %H:%M') if a.created_at else ''
            })
        return Response({'announcements': announcements})

    elif req.method == 'POST':
        title = req.data.get('title', '').strip()
        message = req.data.get('message', '').strip()
        active = bool(req.data.get('active', True))
        if not title or not message:
            return Response({'error': 'Announcement title and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        announcement = Announcement.objects.create(
            title=title,
            message=message,
            active=active,
            created_by=req.user
        )
        log_admin_action(req.user, "ANNOUNCEMENT_CREATED", target=announcement.title, details=f"ID: {announcement.id}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'created',
            'announcement': {
                'id': announcement.id,
                'title': announcement.title,
                'message': announcement.message,
                'active': announcement.active,
                'created_by': req.user.email,
                'created_at': announcement.created_at.strftime('%Y-%m-%d %H:%M') if announcement.created_at else ''
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_announcement_detail(req, pk):
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor or Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        announcement = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return Response({'error': 'Announcement not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.method == 'DELETE':
        announcement.delete()
        log_admin_action(req.user, "ANNOUNCEMENT_DELETED", target=f"ID: {pk}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})

    elif req.method == 'PATCH':
        if 'title' in req.data:
            announcement.title = req.data['title'].strip()
        if 'message' in req.data:
            announcement.message = req.data['message'].strip()
        if 'active' in req.data:
            announcement.active = bool(req.data['active'])
        announcement.save()
        log_admin_action(req.user, "ANNOUNCEMENT_UPDATED", target=announcement.title, details=f"Active: {announcement.active}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'announcement': {
            'id': announcement.id,
            'title': announcement.title,
            'message': announcement.message,
            'active': announcement.active
        }})

# ---------------------------------------------------------
# ASSIGNMENTS & FIELD TASKS (SUPER_ADMIN, INSTRUCTOR, CONTENT_MANAGER)
# ---------------------------------------------------------

def seed_starter_assignments():
    """Initializes starter assignments if none exist."""
    starters = [
        {
            'title': 'Executive Cut-and-Fill Contour Calculation Sheet',
            'module_name': 'Module 1: Topography & Site Grading',
            'deadline': 'Self-Paced / Recommended Week 2',
            'description': 'Calculate the net cubic meters of cut and fill for a 2,500 sq.m residential hill slope based on the provided AutoCAD elevation contours.',
            'points': 100
        },
        {
            'title': 'Reinforced Retaining Wall CAD Detail Section',
            'module_name': 'Module 2: Hardscape Masonry & Engineering',
            'deadline': 'Self-Paced / Recommended Week 4',
            'description': 'Draft a 1:20 cross-section structural detail showing concrete footing, perforated French drain, geotextile wrap, and geogrid tiebacks.',
            'points': 100
        },
        {
            'title': 'Hydrozone Palette & Drip Irrigation Layout',
            'module_name': 'Module 3: Botanical Scenography',
            'deadline': 'Self-Paced / Recommended Week 6',
            'description': 'Design a microclimate plant schedule identifying canopy trees, intermediate shrubs, and xeriscape hydrozone GPM demands for Zone 9b.',
            'points': 100
        }
    ]
    for s in starters:
        Assignment.objects.create(**s)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_assignments(req):
    """List all studio assignments or create a new assignment (Instructor / Admin)."""
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor permission required'}, status=status.HTTP_403_FORBIDDEN)

    if Assignment.objects.count() == 0:
        seed_starter_assignments()

    if req.method == 'GET':
        assignments = []
        for a in Assignment.objects.all().select_related('course', 'created_by').order_by('-created_at'):
            submissions_count = a.submissions.count()
            graded_count = a.submissions.filter(status='GRADED').count()
            pending_count = a.submissions.filter(status='PENDING').count()
            assignments.append({
                'id': a.id,
                'title': a.title,
                'module_name': a.module_name,
                'course_id': a.course_id,
                'course_title': a.course.title if a.course else 'Universal Studio',
                'deadline': a.deadline,
                'description': a.description,
                'points': a.points,
                'submissions_count': submissions_count,
                'pending_count': pending_count,
                'graded_count': graded_count,
                'created_by': a.created_by.email if a.created_by else 'Faculty',
                'created_at': a.created_at.strftime('%Y-%m-%d %H:%M') if a.created_at else ''
            })
        return Response({'assignments': assignments})

    elif req.method == 'POST':
        title = req.data.get('title', '').strip()
        description = req.data.get('description', '').strip()
        module_name = req.data.get('module_name', '').strip() or 'Studio Project'
        deadline = req.data.get('deadline', 'Self-Paced / Recommended Week 2').strip()
        points = int(req.data.get('points', 100))
        course_id = req.data.get('course_id')

        if not title or not description:
            return Response({'error': 'Assignment title and description are required'}, status=status.HTTP_400_BAD_REQUEST)

        course = None
        if course_id:
            try:
                course = Course.objects.get(pk=course_id)
            except Course.DoesNotExist:
                course = None

        asg = Assignment.objects.create(
            title=title,
            description=description,
            module_name=module_name,
            deadline=deadline,
            points=points,
            course=course,
            created_by=req.user
        )
        log_admin_action(req.user, "ASSIGNMENT_CREATED", target=asg.title, details=f"ID: {asg.id}", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'status': 'created',
            'assignment': {
                'id': asg.id,
                'title': asg.title,
                'module_name': asg.module_name,
                'deadline': asg.deadline,
                'description': asg.description,
                'points': asg.points,
                'course_title': course.title if course else 'Universal Studio'
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_assignment_detail(req, pk):
    """View, update or delete an assignment."""
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        asg = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

    if req.method == 'DELETE':
        asg.delete()
        log_admin_action(req.user, "ASSIGNMENT_DELETED", target=f"ID: {pk}", ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'deleted'})

    elif req.method == 'PATCH':
        if 'title' in req.data: asg.title = req.data['title'].strip()
        if 'description' in req.data: asg.description = req.data['description'].strip()
        if 'module_name' in req.data: asg.module_name = req.data['module_name'].strip()
        if 'deadline' in req.data: asg.deadline = req.data['deadline'].strip()
        if 'points' in req.data: asg.points = int(req.data['points'])
        asg.save()
        log_admin_action(req.user, "ASSIGNMENT_UPDATED", target=asg.title, ip=req.META.get('REMOTE_ADDR'))
        return Response({'status': 'updated', 'assignment': {
            'id': asg.id,
            'title': asg.title,
            'module_name': asg.module_name,
            'deadline': asg.deadline,
            'points': asg.points
        }})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_assignment_submissions(req, pk):
    """List student submissions for a specific assignment."""
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        asg = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

    submissions = []
    for s in asg.submissions.all().select_related('student', 'graded_by').order_by('-submitted_at'):
        submissions.append({
            'id': s.id,
            'student_id': s.student.id,
            'student_email': s.student.email,
            'student_name': s.student.full_name or s.student.email.split('@')[0],
            'submission_text': s.submission_text,
            'file_url': s.file_url,
            'status': s.status,
            'score': s.score,
            'feedback': s.feedback,
            'submitted_at': s.submitted_at.strftime('%Y-%m-%d %H:%M') if s.submitted_at else '',
            'graded_at': s.graded_at.strftime('%Y-%m-%d %H:%M') if s.graded_at else '',
            'graded_by': s.graded_by.full_name or s.graded_by.email if s.graded_by else ''
        })
    return Response({'assignment_title': asg.title, 'points': asg.points, 'submissions': submissions})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_grade_submission(req, pk):
    """Grade a student submission with score and constructive instructor feedback."""
    if not check_admin_permission(req.user, allowed_roles=['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER']):
        return Response({'error': 'Course Instructor permission required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        sub = AssignmentSubmission.objects.get(pk=pk)
    except AssignmentSubmission.DoesNotExist:
        return Response({'error': 'Submission record not found'}, status=status.HTTP_404_NOT_FOUND)

    score = req.data.get('score', '').strip()
    feedback = req.data.get('feedback', '').strip()
    from django.utils import timezone

    sub.score = score
    sub.feedback = feedback
    sub.status = 'GRADED'
    sub.graded_at = timezone.now()
    sub.graded_by = req.user
    sub.save()

    log_admin_action(req.user, "ASSIGNMENT_GRADED", target=sub.student.email, details=f"Score: {score} | Asg: {sub.assignment.title}", ip=req.META.get('REMOTE_ADDR'))
    return Response({
        'status': 'graded',
        'submission': {
            'id': sub.id,
            'score': sub.score,
            'feedback': sub.feedback,
            'status': sub.status,
            'graded_by': req.user.full_name or req.user.email
        }
    })

# STUDENT FACING ASSIGNMENT ENDPOINTS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_assignments(req):
    """Student portal view of all assignments and personal submission statuses."""
    usr = req.user
    if Assignment.objects.count() == 0:
        seed_starter_assignments()

    assignments = []
    for a in Assignment.objects.all().order_by('id'):
        sub = AssignmentSubmission.objects.filter(assignment=a, student=usr).first()
        assignments.append({
            'id': a.id,
            'title': a.title,
            'module': a.module_name,
            'deadline': a.deadline,
            'description': a.description,
            'points': a.points,
            'status': 'Submitted' if (sub and sub.status == 'PENDING') else (sub.status if sub else 'Pending'),
            'score': sub.score if sub else '',
            'feedback': sub.feedback if sub else '',
            'submissionNotes': sub.submission_text if sub else '',
            'file_url': sub.file_url if sub else '',
            'is_submitted': bool(sub)
        })
    return Response({'assignments': assignments})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def student_submit_assignment(req, pk):
    """Student submits text / link / notes for an assignment."""
    try:
        asg = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

    text = req.data.get('submission_text') or req.data.get('text') or ''
    file_url = req.data.get('file_url', '')

    if not str(text).strip() and not str(file_url).strip():
        return Response({'error': 'Please provide submission notes or a work link.'}, status=status.HTTP_400_BAD_REQUEST)

    sub, created = AssignmentSubmission.objects.get_or_create(
        assignment=asg,
        student=req.user,
        defaults={'submission_text': str(text).strip(), 'file_url': str(file_url).strip(), 'status': 'PENDING'}
    )
    if not created:
        sub.submission_text = str(text).strip()
        if file_url: sub.file_url = str(file_url).strip()
        sub.status = 'PENDING'
        sub.save()

    return Response({
        'status': 'submitted',
        'message': 'Assignment submitted successfully for instructor review.',
        'submission': {
            'id': sub.id,
            'status': sub.status,
            'submission_text': sub.submission_text
        }
    }, status=status.HTTP_201_CREATED)


