import os
from django.core.mail import send_mail
from django.conf import settings

def sndMail(usrMail, phn):
    frontend_url = getattr(settings, 'FRONTEND_URL', os.environ.get('FRONTEND_URL', 'http://localhost:3000')).rstrip('/')
    msg = (
        f"Your Landscape Mastery account is ready.\n\n"
        f"Email: {usrMail}\n"
        f"Temporary Password: {phn}\n\n"
        f"Login at: {frontend_url}/login\n\n"
        f"Please change your password upon logging in."
    )
    try:
        send_mail(
            "Landscape Mastery Access",
            msg,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@landscapemastery.com'),
            [usrMail],
            fail_silently=True
        )
        return True
    except Exception:
        return False
