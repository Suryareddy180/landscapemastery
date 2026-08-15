import time
import hmac
import hashlib
import jwt
from django.conf import settings

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'django-insecure-development-key-landscape-mastery-portal')

def generate_signed_stream_token(usr, asset_id, duration_sec=300):
    exp_time = int(time.time()) + duration_sec
    payload = {
        'usr_id': usr.id,
        'email': usr.email,
        'asset_id': asset_id,
        'exp': exp_time,
        'type': 'signed_stream'
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token, exp_time

def verify_signed_stream_token(token, asset_id):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        if payload.get('type') != 'signed_stream':
            return None
        if int(payload.get('asset_id')) != int(asset_id):
            return None
        return payload
    except Exception as e:
        return None
