import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Usr

JWT_SECRET = settings.SECRET_KEY

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
            if not usr.is_active:
                raise AuthenticationFailed('User account is disabled.')
            return (usr, token)
        except Usr.DoesNotExist:
            raise AuthenticationFailed('User not found.')
        except AuthenticationFailed:
            raise
        except Exception:
            raise AuthenticationFailed('Invalid or expired authentication token')
