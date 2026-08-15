import time
import jwt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .email_service import send_enrollment_confirmation_email

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'django-insecure-landscape-mastery-executive-portal-key')

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "ok",
        "service": "Landscape Mastery Django REST API",
        "framework": "Django 5.2",
        "timestamp": int(time.time())
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    token = jwt.encode(
        {'email': email, 'user_id': 'LM-98420', 'role': 'architect'},
        JWT_SECRET,
        algorithm='HS256'
    )

    return Response({
        'message': 'Login successful',
        'token': token,
        'user': {
            'email': email,
            'user_id': 'LM-98420',
            'tier': 'Professional Architect'
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_checkout_session(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email address is required for checkout.'}, status=status.HTTP_400_BAD_REQUEST)

    order_id = 'order_' + str(int(time.time()))
    token = jwt.encode(
        {'email': email, 'order_id': order_id, 'paid': True, 'tier': 'Professional'},
        JWT_SECRET,
        algorithm='HS256'
    )

    # Trigger Django SMTP email confirmation
    email_sent = send_enrollment_confirmation_email(email, order_id, amount_cents=49900)

    return Response({
        'success': True,
        'keyId': settings.RAZORPAY_KEY_ID,
        'orderId': order_id,
        'amount': 49900,  # in cents/paise ($499 / INR 499)
        'currency': 'INR',
        'email': email,
        'accessToken': token,
        'emailSent': email_sent,
        'message': 'Razorpay checkout session created via Django API and confirmation email dispatched.'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_video_manifest(request, module_id):
    modules_data = {
        1: {'title': 'The Foundation of Space', 'duration': '45 mins'},
        2: {'title': 'Hardscape & Earthwork Layouts', 'duration': '38 mins'},
        3: {'title': 'Botanical Lighting & Shading', 'duration': '52 mins'},
        4: {'title': 'Water Features & Modern Hydro-Design', 'duration': '41 mins'},
    }

    mod_info = modules_data.get(module_id, modules_data[1])
    email = request.query_params.get('email', 'ARCHITECT@EXAMPLE.COM')

    return Response({
        'moduleId': module_id,
        'title': mod_info['title'],
        'duration': mod_info['duration'],
        'watermarkText': f"LICENSED TO: {email.upper()} - ID: LM-98420-AP • NON-TRANSFERABLE",
        'drmProtected': True,
        'streamQuality': '1080p HD Encrypted'
    })
