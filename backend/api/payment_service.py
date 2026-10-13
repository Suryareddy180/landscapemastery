import os
import re
import string
import secrets
import logging
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils.html import escape

from .models import Usr, UserProfile, Course, Enrollment, PaymentRecord, SiteSetting

logger = logging.getLogger(__name__)

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'lm-secret-production-key-2026')


def generate_secure_temporary_password(length=8) -> str:
    """
    Generates a cryptographically secure, random temporary password.
    Requirements:
    - Exactly 8 characters (or specified length >= 8).
    - At least one uppercase letter (A-Z).
    - At least one lowercase letter (a-z).
    - At least one numeric digit (0-9).
    - Uses secrets module exclusively.
    - Never derived from user identifiers.
    """
    if length < 8:
        length = 8

    # Guarantee at least 1 uppercase, 1 lowercase, 1 digit
    upper = secrets.choice(string.ascii_uppercase)
    lower = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)

    # Remaining characters from combined pool
    allowed_chars = string.ascii_letters + string.digits
    remaining = [secrets.choice(allowed_chars) for _ in range(length - 3)]

    # Combine and shuffle cryptographically
    pwd_chars = [upper, lower, digit] + remaining
    secrets.SystemRandom().shuffle(pwd_chars)
    return ''.join(pwd_chars)


def generate_password_setup_token(user: Usr) -> str:
    """Generates a short-lived (24h), single-use password setup JWT."""
    payload = {
        'type': 'password_setup',
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def send_account_access_email(
    user: Usr,
    course_title: str,
    payment_reference: str,
    temporary_password: str = None,
    is_new_user: bool = True
) -> tuple[bool, str]:
    """
    Sends the official account access / payment confirmation email using the exact template.
    Returns (success: bool, error_msg: str).
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', os.environ.get('FRONTEND_URL', 'https://3capstech.com')).rstrip('/')
    login_url = f"{frontend_url}/login"
    
    setup_token = generate_password_setup_token(user) if is_new_user else None
    setup_url = f"{login_url}?token={setup_token}&email={user.email}" if setup_token else login_url

    full_name = user.full_name or user.email.split('@')[0]
    email = user.email
    purchase_name = course_title or "Landscape Mastery Architectural Masterclass"
    app_name = "Landscape Mastery"

    subject = "Your Payment Is Successful — Your Account Access Details"

    if is_new_user and temporary_password:
        access_instructions_text = (
            f"Account access\n\n"
            f"- Login URL: {login_url}\n"
            f"- Temporary Password: {temporary_password}\n\n"
            f"Alternatively, if using password setup:\n\n"
            f"- Set Your Password: {setup_url}\n\n"
            f"For security reasons, change your temporary password immediately after your first login. Never share your credentials with anyone.\n"
        )
        access_instructions_html = f"""
        <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1c1917; font-size: 15px; font-weight: bold;">Account Access Credentials</h3>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Login URL:</strong> <a href="{login_url}" style="color: #065f46; font-weight: bold;">{login_url}</a></p>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Temporary Password:</strong> <code style="background: #e7e5e4; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; letter-spacing: 1px;">{escape(temporary_password)}</code></p>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #d6d3d1;">
            <p style="margin: 4px 0; font-size: 12px; color: #57534e;">Alternatively, set your password directly via one-click link:</p>
            <p style="margin: 6px 0;"><a href="{setup_url}" style="display: inline-block; background: #064e3b; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: bold;">Set Your Password Now &rarr;</a></p>
          </div>
          <p style="margin-top: 12px; font-size: 11px; color: #78716c;">For security reasons, change your temporary password immediately after your first login. Never share your credentials with anyone.</p>
        </div>
        """
    else:
        access_instructions_text = (
            f"Account access\n\n"
            f"- Login URL: {login_url}\n"
            f"Your course access has been added to your existing account. Please sign in with your existing password.\n"
        )
        access_instructions_html = f"""
        <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1c1917; font-size: 15px; font-weight: bold;">Course Activated On Your Existing Account</h3>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Login URL:</strong> <a href="{login_url}" style="color: #065f46; font-weight: bold;">{login_url}</a></p>
          <p style="margin-top: 10px; font-size: 12px; color: #57534e;">Your purchased course is now active. Simply log in with your existing account credentials to begin learning immediately.</p>
        </div>
        """

    plain_message = (
        f"Hello {full_name},\n\n"
        f"Thank you for your payment.\n\n"
        f"Your payment has been successfully verified, and your account has been created or updated.\n\n"
        f"Your account details\n\n"
        f"- Name: {full_name}\n"
        f"- Email / Login ID: {email}\n"
        f"- Purchased Course or Service: {purchase_name}\n"
        f"- Payment Reference: {payment_reference}\n\n"
        f"{access_instructions_text}\n"
        f"If you did not make this purchase, contact our support team at contact@landscapemastery.com.\n\n"
        f"Thank you,\n"
        f"{app_name} Support Team\n"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="border-bottom: 2px solid #064e3b; padding-bottom: 14px; margin-bottom: 20px;">
        <h2 style="color: #064e3b; margin: 0; font-size: 20px;">{app_name}</h2>
        <span style="font-size: 11px; text-transform: uppercase; color: #78716c; letter-spacing: 1px;">Official Enrollment &amp; Payment Confirmation</span>
      </div>

      <p style="font-size: 14px;">Hello <strong>{escape(full_name)}</strong>,</p>
      <p style="font-size: 14px;">Thank you for your payment.</p>
      <p style="font-size: 14px;">Your payment has been successfully verified, and your account has been created or updated.</p>

      <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin: 18px 0;">
        <h3 style="margin-top: 0; color: #1c1917; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Details</h3>
        <ul style="padding-left: 20px; margin: 8px 0; font-size: 13px;">
          <li style="margin-bottom: 6px;"><strong>Name:</strong> {escape(full_name)}</li>
          <li style="margin-bottom: 6px;"><strong>Email / Login ID:</strong> {escape(email)}</li>
          <li style="margin-bottom: 6px;"><strong>Purchased Course or Service:</strong> {escape(purchase_name)}</li>
          <li style="margin-bottom: 6px;"><strong>Payment Reference:</strong> <code style="font-family: monospace;">{escape(payment_reference)}</code></li>
        </ul>
      </div>

      {access_instructions_html}

      <p style="font-size: 12px; color: #78716c; margin-top: 24px;">If you did not make this purchase, contact our support team immediately at <a href="mailto:contact@landscapemastery.com" style="color: #065f46;">contact@landscapemastery.com</a>.</p>

      <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 12px; color: #a8a29e;">
        Thank you,<br>
        <strong>{app_name} Support Team</strong>
      </div>
    </body>
    </html>
    """

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@landscapemastery.com')

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Account access email successfully dispatched to {email} for payment {payment_reference}")
        return True, ""
    except Exception as e:
        logger.error(f"Email delivery failed for {email}: {e}")
        return False, str(e)


def fulfill_verified_payment(
    order_id: str,
    payment_id: str,
    customer_email: str,
    customer_name: str = "",
    customer_phone: str = "",
    course_id: int = None,
    account_type: str = "STUDENT",
    checkout_metadata: dict = None,
    amount: float = 499.00
) -> dict:
    """
    Authoritative, idempotent payment fulfillment engine.
    - Resolves or creates Usr (STUDENT, EMPLOYEE, HOUSEHOLD).
    - If new user, generates cryptographically secure 8-character temporary password.
    - Saves profile metadata.
    - Enrolls user into Course.
    - Updates/creates PaymentRecord to SUCCESS.
    - Dispatches access email.
    - Idempotent against duplicate webhooks or concurrent callback requests.
    """
    clean_email = customer_email.strip().lower()
    checkout_metadata = checkout_metadata or {}
    account_type = account_type.upper().strip() if account_type else "STUDENT"
    if account_type not in ['STUDENT', 'EMPLOYEE', 'HOUSEHOLD']:
        account_type = 'STUDENT'

    # Resolve target course
    target_course = None
    if course_id:
        try:
            target_course = Course.objects.get(pk=course_id, status='PUBLISHED')
        except Course.DoesNotExist:
            target_course = Course.objects.filter(status='PUBLISHED').first()
    else:
        target_course = Course.objects.filter(status='PUBLISHED').first()

    course_title = target_course.title if target_course else "Landscape Mastery Course"

    with transaction.atomic():
        # 1. Fetch or create PaymentRecord
        payment_record, p_created = PaymentRecord.objects.select_for_update().get_or_create(
            order_id=order_id,
            defaults={
                'payment_id': payment_id,
                'amount': amount,
                'currency': 'INR',
                'status': 'PENDING',
                'customer_email': clean_email,
                'customer_name': customer_name,
                'customer_phone': customer_phone,
                'account_type': account_type,
                'checkout_metadata': checkout_metadata,
                'course': target_course
            }
        )

        # Idempotency check: if this order was already fulfilled successfully, return cached result
        if not p_created and payment_record.status == 'SUCCESS' and payment_record.user:
            existing_user = payment_record.user
            from .views import get_tokens_for_user
            token = get_tokens_for_user(existing_user)
            enrollments = list(Enrollment.objects.filter(user=existing_user, status='ACTIVE').values_list('course_id', flat=True))
            return {
                'success': True,
                'already_processed': True,
                'is_new_user': False,
                'user': existing_user,
                'course': target_course,
                'token': token,
                'enrollments': enrollments,
                'payment_record': payment_record
            }

        # 2. Look up or create user by normalized email
        usr = Usr.objects.filter(email__iexact=clean_email).first()
        is_new_user = False
        temporary_password = None

        if not usr:
            is_new_user = True
            temporary_password = generate_secure_temporary_password(8)

            usr = Usr.objects.create_user(
                email=clean_email,
                password=temporary_password,
                full_name=customer_name or clean_email.split('@')[0],
                phone=customer_phone or None,
                role=account_type,
                paid=True
            )
            logger.info(f"Auto-created new {account_type} account for {clean_email} upon verified payment.")
        else:
            # Existing account: ensure paid flag is true and populate missing identity fields
            usr.paid = True
            if customer_name and (not usr.full_name or usr.full_name == usr.email.split('@')[0]):
                usr.full_name = customer_name
            if customer_phone and not usr.phone:
                usr.phone = customer_phone
            usr.save()
            logger.info(f"Attached verified payment to existing account: {clean_email}")

        # 3. Populate role-specific profile fields
        profile, _ = UserProfile.objects.get_or_create(user=usr)

        if account_type == 'STUDENT':
            if checkout_metadata.get('qualification'):
                profile.qualification = checkout_metadata['qualification']
            if checkout_metadata.get('branch'):
                profile.branch = checkout_metadata['branch']
            if checkout_metadata.get('college_name'):
                profile.college_name = checkout_metadata['college_name']
            if checkout_metadata.get('student_status'):
                profile.student_status = checkout_metadata['student_status']
            if checkout_metadata.get('passout_year'):
                try:
                    profile.passout_year = int(checkout_metadata['passout_year'])
                except (ValueError, TypeError):
                    pass
            if not profile.student_id:
                profile.student_id = f"STU-{usr.id:04d}"

        elif account_type == 'EMPLOYEE':
            if checkout_metadata.get('company_name'):
                profile.company_name = checkout_metadata['company_name']
            if checkout_metadata.get('department'):
                profile.department = checkout_metadata['department']
            if checkout_metadata.get('designation'):
                profile.designation = checkout_metadata['designation']
            if checkout_metadata.get('employment_status'):
                profile.employment_status = checkout_metadata['employment_status']
            if not profile.employee_id:
                profile.employee_id = f"EMP-{usr.id:04d}"

        elif account_type == 'HOUSEHOLD':
            if checkout_metadata.get('household_name'):
                profile.household_name = checkout_metadata['household_name']
            if checkout_metadata.get('primary_contact_name'):
                profile.primary_contact_name = checkout_metadata['primary_contact_name']
            if checkout_metadata.get('residential_address'):
                profile.residential_address = checkout_metadata['residential_address']
            if checkout_metadata.get('member_count'):
                try:
                    profile.member_count = int(checkout_metadata['member_count'])
                except (ValueError, TypeError):
                    pass
            if not profile.household_id:
                profile.household_id = f"HH-{usr.id:04d}"

        profile.save()

        # 4. Create / Activate Course Enrollment
        if target_course:
            Enrollment.objects.get_or_create(
                user=usr,
                course=target_course,
                defaults={'status': 'ACTIVE', 'access_type': 'PAID'}
            )

        # 5. Update PaymentRecord to SUCCESS
        payment_record.user = usr
        payment_record.course = target_course
        payment_record.payment_id = payment_id
        payment_record.amount = amount
        payment_record.status = 'SUCCESS'
        payment_record.customer_name = customer_name or usr.full_name
        payment_record.customer_email = clean_email
        payment_record.customer_phone = customer_phone or usr.phone
        payment_record.account_type = account_type
        if checkout_metadata:
            payment_record.checkout_metadata = checkout_metadata
        payment_record.save()

    # 6. Dispatch account access email (Outside transaction so DB state is safely committed)
    email_success, email_err = send_account_access_email(
        user=usr,
        course_title=course_title,
        payment_reference=payment_id or order_id,
        temporary_password=temporary_password,
        is_new_user=is_new_user
    )

    # Save email status safely
    try:
        payment_record.email_sent = email_success
        payment_record.email_error = email_err if not email_success else ""
        payment_record.save(update_fields=['email_sent', 'email_error'])
    except Exception:
        pass

    from .views import get_tokens_for_user
    token = get_tokens_for_user(usr)
    enrollments = list(Enrollment.objects.filter(user=usr, status='ACTIVE').values_list('course_id', flat=True))

    return {
        'success': True,
        'already_processed': False,
        'is_new_user': is_new_user,
        'user': usr,
        'course': target_course,
        'token': token,
        'enrollments': enrollments,
        'payment_record': payment_record,
        'email_sent': email_success
    }
