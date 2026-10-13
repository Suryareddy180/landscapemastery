import os
import uuid
import time
import datetime
import re
from PIL import Image
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Usr, UserProfile
from .views import get_tokens_for_user
from .audit_service import log_admin_action

MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/pjpeg'}
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

def validate_password_strength(password):
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one numeric digit (0-9)."
    return True, ""

def serialize_profile(usr):
    profile, _ = UserProfile.objects.get_or_create(user=usr)
    avatar_url = None
    if profile.avatar:
        try:
            avatar_url = profile.avatar.url
        except Exception:
            avatar_url = None

    data = {
        'id': usr.id,
        'email': usr.email,
        'phone': usr.phone or '',
        'full_name': usr.full_name or '',
        'role': usr.role,
        'is_active': usr.is_active,
        'created_at': usr.created_at.isoformat() if usr.created_at else None,
        'dob': profile.dob.isoformat() if profile.dob else None,
        'avatar': avatar_url,
        'email_verified': profile.email_verified,
        'phone_verified': profile.phone_verified,
    }

    if usr.role == 'STUDENT':
        data.update({
            'qualification': profile.qualification or '',
            'branch': profile.branch or '',
            'passout_year': profile.passout_year,
            'college_name': profile.college_name or '',
            'student_status': profile.student_status or 'Still Studying',
            'student_id': profile.student_id or f"STU-{usr.id:04d}",
        })
    elif usr.role == 'EMPLOYEE' or usr.role in ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN']:
        data.update({
            'employee_id': profile.employee_id or f"EMP-{usr.id:04d}",
            'company_name': profile.company_name or '3CAPSTECH',
            'department': profile.department or '',
            'designation': profile.designation or '',
            'employment_status': profile.employment_status or 'Full-Time',
        })
    elif usr.role == 'HOUSEHOLD':
        data.update({
            'household_name': profile.household_name or '',
            'household_id': profile.household_id or f"HH-{usr.id:04d}",
            'primary_contact_name': profile.primary_contact_name or usr.full_name or '',
            'residential_address': profile.residential_address or '',
            'member_count': profile.member_count or 1,
        })
    else:
        data.update({
            'qualification': profile.qualification or '',
            'branch': profile.branch or '',
            'passout_year': profile.passout_year,
            'college_name': profile.college_name or '',
            'student_status': profile.student_status or '',
            'student_id': profile.student_id or '',
            'employee_id': profile.employee_id or '',
            'company_name': profile.company_name or '',
            'department': profile.department or '',
            'designation': profile.designation or '',
            'employment_status': profile.employment_status or '',
            'household_name': profile.household_name or '',
            'household_id': profile.household_id or '',
            'primary_contact_name': profile.primary_contact_name or '',
            'residential_address': profile.residential_address or '',
            'member_count': profile.member_count or 1,
        })

    return data


# ---------------------------------------------------------
# PROFILE RETRIEVAL & UPDATE (GET / PATCH)
# ---------------------------------------------------------

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(req):
    usr = req.user
    profile, _ = UserProfile.objects.get_or_create(user=usr)

    if req.method == 'GET':
        return Response(serialize_profile(usr), status=status.HTTP_200_OK)

    if req.method == 'PATCH':
        data = req.data

        # 1. Full Name
        if 'full_name' in data:
            name = str(data.get('full_name', '')).strip()
            if not name:
                return Response({'error': 'Full name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            usr.full_name = name

        # 2. Phone
        if 'phone' in data:
            phone_val = str(data.get('phone', '')).strip()
            if not phone_val:
                return Response({'error': 'Mobile number cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            usr.phone = phone_val

        # 3. Email (If updated, require re-verification)
        if 'email' in data:
            new_email = str(data.get('email', '')).strip().lower()
            if new_email and new_email != usr.email.lower():
                if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
                    return Response({'error': 'Please provide a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)
                if Usr.objects.filter(email__iexact=new_email).exclude(id=usr.id).exists():
                    return Response({'error': 'This email is already in use by another account.'}, status=status.HTTP_400_BAD_REQUEST)
                usr.email = new_email
                profile.email_verified = False

        # 4. Date of Birth
        if 'dob' in data:
            dob_val = data.get('dob')
            if dob_val and str(dob_val).strip() != '':
                try:
                    parsed_dob = datetime.date.fromisoformat(str(dob_val).strip())
                    if parsed_dob > datetime.date.today():
                        return Response({'error': 'Date of birth cannot be in the future.'}, status=status.HTTP_400_BAD_REQUEST)
                    profile.dob = parsed_dob
                except ValueError:
                    return Response({'error': 'Invalid date format for Date of Birth. Expected YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                profile.dob = None

        # 5. Student Specific Fields
        if usr.role == 'STUDENT':
            if 'qualification' in data:
                profile.qualification = str(data.get('qualification', '')).strip()
            if 'branch' in data:
                profile.branch = str(data.get('branch', '')).strip()
            if 'college_name' in data:
                profile.college_name = str(data.get('college_name', '')).strip()
            if 'student_status' in data:
                profile.student_status = str(data.get('student_status', '')).strip()
            if 'passout_year' in data:
                py = data.get('passout_year')
                if py is not None and str(py).strip() != '':
                    try:
                        py_int = int(py)
                        if py_int < 1950 or py_int > 2040:
                            return Response({'error': 'Passout year must be between 1950 and 2040.'}, status=status.HTTP_400_BAD_REQUEST)
                        profile.passout_year = py_int
                    except (ValueError, TypeError):
                        return Response({'error': 'Passout year must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    profile.passout_year = None
            if 'student_id' in data and not profile.student_id:
                profile.student_id = str(data.get('student_id', '')).strip()

        # 6. Employee Specific Fields
        elif usr.role == 'EMPLOYEE' or usr.role in ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN']:
            if 'company_name' in data:
                profile.company_name = str(data.get('company_name', '')).strip()
            if 'department' in data:
                profile.department = str(data.get('department', '')).strip()
            if 'designation' in data:
                profile.designation = str(data.get('designation', '')).strip()
            if 'employment_status' in data:
                profile.employment_status = str(data.get('employment_status', '')).strip()
            if 'employee_id' in data and not profile.employee_id:
                profile.employee_id = str(data.get('employee_id', '')).strip()

        # 7. Household Specific Fields
        elif usr.role == 'HOUSEHOLD':
            if 'household_name' in data:
                profile.household_name = str(data.get('household_name', '')).strip()
            if 'primary_contact_name' in data:
                profile.primary_contact_name = str(data.get('primary_contact_name', '')).strip()
            if 'residential_address' in data:
                profile.residential_address = str(data.get('residential_address', '')).strip()
            if 'member_count' in data:
                mc = data.get('member_count')
                if mc is not None and str(mc).strip() != '':
                    try:
                        mc_int = int(mc)
                        if mc_int < 1 or mc_int > 100:
                            return Response({'error': 'Number of household members must be between 1 and 100.'}, status=status.HTTP_400_BAD_REQUEST)
                        profile.member_count = mc_int
                    except (ValueError, TypeError):
                        return Response({'error': 'Household member count must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    profile.member_count = 1
            if 'household_id' in data and not profile.household_id:
                profile.household_id = str(data.get('household_id', '')).strip()

        # Save both records
        usr.save()
        profile.save()

        log_admin_action(usr, "USER_PROFILE_UPDATED", target=usr.email, details="User updated profile details", ip=req.META.get('REMOTE_ADDR'))
        return Response({
            'message': 'Profile updated successfully.',
            'profile': serialize_profile(usr)
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# PROFILE PICTURE UPLOAD & REMOVE
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_picture(req):
    usr = req.user
    profile, _ = UserProfile.objects.get_or_create(user=usr)

    file_obj = req.FILES.get('avatar') or req.FILES.get('picture') or req.FILES.get('image')
    if not file_obj:
        return Response({'error': 'No image file provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. File Size Validation
    if file_obj.size > MAX_AVATAR_SIZE:
        return Response({'error': f'Image size exceeds the maximum allowed limit of 5 MB (Current size: {round(file_obj.size / (1024*1024), 2)} MB).'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Extension Validation
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return Response({'error': f'Unsupported file extension {ext}. Allowed formats: JPG, JPEG, PNG, WebP.'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. MIME Content Type Validation
    if file_obj.content_type not in ALLOWED_MIME_TYPES:
        return Response({'error': f'Invalid image MIME type ({file_obj.content_type}). Please upload a genuine JPG, PNG, or WebP image.'}, status=status.HTTP_400_BAD_REQUEST)

    # 4. Deep Image Verification with Pillow
    try:
        img = Image.open(file_obj)
        img.verify()
        file_obj.seek(0)
    except Exception:
        return Response({'error': 'File corrupted or not a valid image.'}, status=status.HTTP_400_BAD_REQUEST)

    # 5. Safe Filename Generation
    safe_filename = f"avatar_usr_{usr.id}_{uuid.uuid4().hex[:12]}{ext}"

    # Remove previous avatar file if exists
    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass

    profile.avatar.save(safe_filename, file_obj, save=True)
    log_admin_action(usr, "USER_AVATAR_UPDATED", target=usr.email, details=f"Uploaded {safe_filename}", ip=req.META.get('REMOTE_ADDR'))

    return Response({
        'message': 'Profile picture uploaded successfully.',
        'avatar_url': profile.avatar.url,
        'profile': serialize_profile(usr)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture(req):
    usr = req.user
    profile, _ = UserProfile.objects.get_or_create(user=usr)

    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass
        profile.avatar = None
        profile.save()

    log_admin_action(usr, "USER_AVATAR_REMOVED", target=usr.email, details="Avatar removed and restored default", ip=req.META.get('REMOTE_ADDR'))
    return Response({
        'message': 'Profile picture removed successfully.',
        'avatar_url': None,
        'profile': serialize_profile(usr)
    }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(req):
    usr = req.user
    current_pwd = req.data.get('current_password')
    new_pwd = req.data.get('new_password')
    confirm_pwd = req.data.get('confirm_password')

    if not current_pwd or not new_pwd or not confirm_pwd:
        return Response({'error': 'Current password, new password, and confirmation are all required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not usr.check_password(current_pwd):
        return Response({'error': 'Current password is incorrect. Please verify your credentials.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_pwd != confirm_pwd:
        return Response({'error': 'New password and confirmation password do not match.'}, status=status.HTTP_400_BAD_REQUEST)

    valid, err_msg = validate_password_strength(new_pwd)
    if not valid:
        return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

    usr.set_password(new_pwd)
    usr.save()

    # Re-issue refreshed JWT so user remains authenticated smoothly
    new_token = get_tokens_for_user(usr)
    log_admin_action(usr, "USER_PASSWORD_CHANGED", target=usr.email, details="User changed their account password", ip=req.META.get('REMOTE_ADDR'))

    return Response({
        'message': 'Password has been successfully changed.',
        'token': new_token
    }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# DELETE ACCOUNT
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(req):
    usr = req.user
    pwd = req.data.get('password')
    acknowledge = req.data.get('acknowledge')

    if not acknowledge:
        return Response({
            'error': 'You must explicitly acknowledge that deleting your account will remove your access to courses and resources.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not pwd:
        return Response({'error': 'Your current password is required to verify identity before deleting the account.'}, status=status.HTTP_400_BAD_REQUEST)

    if not usr.check_password(pwd):
        return Response({'error': 'Incorrect password. Account deletion aborted for security.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Clean avatar file if exists
    profile, _ = UserProfile.objects.get_or_create(user=usr)
    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass
        profile.avatar = None
        profile.save()

    # 2. Deactivate user and anonymize personal details to safely preserve foreign key references
    # in financial PaymentRecords, audit logs, and enrollments
    original_id = usr.id
    original_email = usr.email
    usr.is_active = False
    usr.email = f"deleted_{original_id}_{int(time.time())}@anonymized.local"
    usr.phone = ''
    usr.full_name = f"Deleted User #{original_id}"
    usr.set_unusable_password()
    usr.save()

    log_admin_action(None, "USER_ACCOUNT_DELETED", target=str(original_id), details=f"Self-service account deletion by {original_email}", ip=req.META.get('REMOTE_ADDR'))

    return Response({
        'message': 'Your account has been successfully deleted and access revoked.'
    }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# REGISTRATION ENDPOINTS (Blocked: Automated Payment Only)
# ---------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(req):
    """
    Public registration is explicitly disabled.
    All user accounts (Student, Employee, Household) are automatically provisioned
    exclusively upon verified course payment or administrative staff provisioning.
    """
    return Response({
        'error': 'Direct public registration is disabled. Accounts are automatically provisioned upon verified course payment checkout or authorized administrative invitation.'
    }, status=status.HTTP_403_FORBIDDEN)

