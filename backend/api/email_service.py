from django.core.mail import send_mail
from django.conf import settings

def sndMail(usrMail, phn):
    msg = f"Your Landscape Mastery account is ready.\nEmail: {usrMail}\nPassword: {phn}\nLogin at http://localhost:3000/login"
    try:
        send_mail("Landscape Mastery Access", msg, getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@landscapemastery.com'), [usrMail], fail_silently=True)
        return True
    except:
        return False
