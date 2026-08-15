import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Usr

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'django-insecure-development-key-landscape-mastery-portal')

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        token = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif 'token' in request.query_params:
            token = request.query_params.get('token')

        if not token:
            return None

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            usr_id = payload.get('usr_id')
            if not usr_id:
                return None
            usr = Usr.objects.get(id=usr_id)
            return (usr, token)
        except Exception:
            raise AuthenticationFailed('Invalid or expired authentication token')
