import os
from django.core.management.base import BaseCommand
from api.models import Usr

class Command(BaseCommand):
    help = 'Ensures production Super Admin accounts exist with full permissions.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='', help='Admin email address')
        parser.add_argument('--password', type=str, default='', help='Admin password')
        parser.add_argument('--name', type=str, default='', help='Full name')
        parser.add_argument('--phone', type=str, default='+91 94409 99908', help='Phone number')

    def handle(self, *args, **options):
        # Default production admins list
        default_admins = [
            {
                'email': 'admin@landscapemastery.com',
                'password': os.environ.get('LM_ADMIN_PASSWORD', 'Admin@Landscape2026!'),
                'name': 'Chief Architect & Director',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 94409 99908'
            },
            {
                'email': 'md.3capstech@gmail.com',
                'password': os.environ.get('MD_ADMIN_PASSWORD', os.environ.get('ADMIN_PASSWORD', 'LandscapeAdmin2026!')),
                'name': 'Managing Director (3CAPSTECH)',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 94409 99908'
            },
            {
                'email': 'admin@3capstech.com',
                'password': os.environ.get('CORP_ADMIN_PASSWORD', 'Admin@3capstech2026!'),
                'name': '3CAPSTECH Super Admin',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 94409 99908'
            }
        ]

        # If specific email passed via CLI
        cli_email = options.get('email', '').strip().lower()
        if cli_email:
            cli_pwd = options.get('password') or os.environ.get('ADMIN_PASSWORD', 'LandscapeAdmin2026!')
            cli_name = options.get('name') or 'Production Administrator'
            default_admins.insert(0, {
                'email': cli_email,
                'password': cli_pwd,
                'name': cli_name,
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': options.get('phone', '+91 94409 99908')
            })

        for adm in default_admins:
            email = adm['email'].strip().lower()
            user, created = Usr.objects.get_or_create(email=email)
            if adm.get('password'):
                user.set_password(adm['password'])
            
            user.role = adm.get('role', 'SUPER_ADMIN')
            user.is_staff = adm.get('is_staff', True)
            user.is_superuser = adm.get('is_superuser', True)
            user.paid = True
            user.is_active = True
            user.full_name = adm.get('name', 'Admin')
            user.phone = adm.get('phone', '+91 94409 99908')
            user.save()

            action = "Created new" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"[{action}] Admin account: {user.email} (Role: {user.role}, Staff: {user.is_staff}, Superuser: {user.is_superuser})"
            ))
