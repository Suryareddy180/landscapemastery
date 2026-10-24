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
                'email': 'nani.reddy225@gmail.com',
                'password': os.environ.get('NANI_ADMIN_PASSWORD', 'Mypswd@225'),
                'name': 'Nani Reddy (Super Admin)',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 94409 99908'
            },
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
                'password': os.environ.get('MD_ADMIN_PASSWORD', 'Mypswd@225'),
                'name': 'Managing Director (3CAPSTECH)',
                'role': 'THREECAPS_ADMIN',
                'is_staff': True,
                'is_superuser': False,
                'phone': '+91 94409 99908'
            },
            {
                'email': 'admin@3capstech.com',
                'password': os.environ.get('CORP_ADMIN_PASSWORD', 'Admin@3capstech2026!'),
                'name': '3CAPSTECH Super Admin',
                'role': 'THREECAPS_ADMIN',
                'is_staff': True,
                'is_superuser': False,
                'phone': '+91 94409 99908'
            },
            {
                'email': 'shruthi.frg@gmail.com',
                'password': os.environ.get('SHRUTHI_INSTRUCTOR_PASSWORD', 'pass@LM'),
                'name': 'Shruthi (Course Instructor)',
                'role': 'INSTRUCTOR',
                'is_staff': True,
                'is_superuser': False,
                'phone': '+91 94409 99908'
            },
            {
                'email': 'krupali.frg@gmail.com',
                'password': os.environ.get('KRUPALI_INSTRUCTOR_PASSWORD', 'pass@LM'),
                'name': 'Krupali (Course Instructor)',
                'role': 'INSTRUCTOR',
                'is_staff': True,
                'is_superuser': False,
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
            user.save()

            try:
                from company.models import UserProfile, CommunityMemberProfile
                UserProfile.objects.get_or_create(user=user, defaults={'full_name': user.full_name})
                CommunityMemberProfile.objects.update_or_create(
                    user=user,
                    defaults={'custom_role_title': 'Course Instructor' if user.role == 'INSTRUCTOR' else 'Administrator'}
                )
            except Exception:
                pass

            action = "Created new" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"[{action}] Admin account: {user.email} (Role: {user.role}, Staff: {user.is_staff}, Superuser: {user.is_superuser})"
            ))

        # -----------------------------------------------------------------
        # Ensure Test Paid Student account for portal testing & verification
        # -----------------------------------------------------------------
        student_email = 'student@landscapemastery.com'
        student_pwd = os.environ.get('STUDENT_TEST_PASSWORD', 'Student@Mastery2026!')
        student, s_created = Usr.objects.get_or_create(email=student_email)
        student.set_password(student_pwd)
        student.role = 'STUDENT'
        student.is_staff = False
        student.is_superuser = False
        student.paid = True
        student.is_active = True
        student.full_name = 'Elena Rostova, AIA'
        student.phone = '+91 98765 43210'
        student.save()
        s_action = "Created new" if s_created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"[{s_action}] Test Paid Student: {student.email} (Role: {student.role}, Paid: {student.paid})"
        ))

        # -----------------------------------------------------------------
        # Rectify course spelling: Ensure 'LANDSCAPE LENS' (not LANSCAPE)
        # -----------------------------------------------------------------
        from api.models import Course, SiteSetting
        for c in Course.objects.all():
            updated = False
            if c.title and ('LANSCAPE' in c.title or 'lanscape' in c.title):
                c.title = c.title.replace('LANSCAPE', 'LANDSCAPE').replace('lanscape', 'landscape')
                updated = True
            if c.slug and 'lanscape' in c.slug:
                c.slug = c.slug.replace('lanscape', 'landscape')
                updated = True
            # Standardize base tuition to ₹499 (40% discount applies on 499 => 299)
            if float(c.price or 0) < 499.0:
                c.price = 499.00
                updated = True
            if float(c.discount_price or 0) < 499.0:
                c.discount_price = 499.00
                updated = True
            if c.original_price and float(c.original_price) <= 499.0:
                c.original_price = None  # ₹499 is base tuition, not strike-off
                updated = True
            if updated:
                c.save()
                self.stdout.write(self.style.SUCCESS(f"[Rectified] Course #{c.id} updated to '{c.title}' (Price: Rs. {c.price})"))

        setting, _ = SiteSetting.objects.get_or_create(id=1)
        if float(setting.course_price or 0) < 499.0:
            setting.course_price = 499.00
            setting.save()
            self.stdout.write(self.style.SUCCESS("[Rectified] SiteSetting course_price set to Rs. 499.00"))

        self.stdout.write(self.style.SUCCESS("[OK] Production administrator accounts verified."))

