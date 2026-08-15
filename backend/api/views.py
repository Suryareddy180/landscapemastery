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
from .models import Usr, Vid
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_videos(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    if req.method == 'GET':
        vids = list(Vid.objects.values())
        return Response({'videos': vids})
    elif req.method == 'POST':
        title = req.data.get('title')
        cost = req.data.get('cost', 0)
        file_obj = req.FILES.get('file')
        url = req.data.get('url')
        vid = Vid.objects.create(title=title, cost=cost, file=file_obj, url=url)
        return Response({'status': 'created', 'id': vid.id})

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_video_detail(req, pk):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        vid = Vid.objects.get(pk=pk)
    except Vid.DoesNotExist:
        return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
    if req.method == 'DELETE':
        vid.delete()
        return Response({'status': 'deleted'})
    elif req.method == 'PATCH':
        if 'cost' in req.data:
            vid.cost = req.data['cost']
        if 'title' in req.data:
            vid.title = req.data['title']
        vid.save()
        return Response({'status': 'updated'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_students(req):
    if req.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    stds = list(Usr.objects.filter(role='STUDENT').values('email', 'phone', 'paid'))
    return Response({'students': stds})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_stream(req, pk):
    if req.user.role == 'STUDENT' and not req.user.paid:
        return Response({'error': 'Strict Access Denied: Payment required'}, status=status.HTTP_403_FORBIDDEN)
    if req.user.role not in ['STUDENT', 'ADMIN']:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    try:
        vid = Vid.objects.get(pk=pk)
    except Vid.DoesNotExist:
        return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'id': vid.id,
        'title': vid.title,
        'url': vid.url or (vid.file.url if vid.file else ''),
        'dur': vid.dur,
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
