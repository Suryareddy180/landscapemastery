import os
from django.core.management.base import BaseCommand
from api.models import Usr

class Command(BaseCommand):
    help = 'Ensures the primary production Super Admin account exists with full permissions.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default=os.environ.get('ADMIN_EMAIL', 'md.3capstech@gmail.com'), help='Admin email address')
        parser.add_argument('--password', type=str, default=os.environ.get('ADMIN_PASSWORD', ''), help='Admin password (optional if account already exists)')
        parser.add_argument('--name', type=str, default='Managing Director (3CAPSTECH)', help='Full name')
        parser.add_argument('--phone', type=str, default='+91 94409 99908', help='Phone number')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password'] or os.environ.get('ADMIN_PASSWORD', '')
        name = options['name']
        phone = options['phone']

        user, created = Usr.objects.get_or_create(email=email)
        if password:
            user.set_password(password)
        elif created:
            default_fallback = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'LandscapeAdmin2026!')
            user.set_password(default_fallback)

        user.role = 'SUPER_ADMIN'
        user.is_staff = True
        user.is_superuser = True
        user.paid = True
        user.is_active = True
        user.full_name = name
        user.phone = phone
        user.save()

        action = "Created new" if created else "Updated permissions for existing"
        self.stdout.write(self.style.SUCCESS(
            f"Successfully {action} production Super Admin:\n"
            f"  Email: {user.email}\n"
            f"  Role: {user.role}\n"
            f"  Staff: {user.is_staff}\n"
            f"  Superuser: {user.is_superuser}\n"
            f"  Status: Active & Lifetime Paid"
        ))
