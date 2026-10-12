import os
from django.core.management.base import BaseCommand
from api.models import Usr, Course, Module, Lesson, Enrollment, PaymentRecord

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
        # Ensure Flagship "Landscape Lens" Course and VEED embed lesson
        # -----------------------------------------------------------------
        lens_slug = "landscape-lens"
        lens_course, c_created = Course.objects.get_or_create(
            slug=lens_slug,
            defaults={
                'title': "Landscape Lens",
                'short_desc': "Learn to see every space through the eyes of a landscape designer.",
                'full_desc': (
                    "Landscape Lens is a beginner-friendly course that introduces the fundamentals of "
                    "landscape architecture, the landscape design process, specialized landscape fields, "
                    "and indoor plant selection and maintenance.\n\n"
                    "Through practical examples and guided observation, learners will explore how sunlight, "
                    "climate, soil, water, pathways, seating, greenery, and human movement influence the "
                    "way a space is designed.\n\n"
                    "The course walks learners through the major stages of landscape design, from site analysis "
                    "and conceptual planning to detailed drawings, 3D visualization, working drawings, and execution. "
                    "It also introduces specialized areas such as landscape urbanism, historic preservation, "
                    "landscape ecology, sustainable design, and therapeutic landscapes.\n\n"
                    "In the indoor plants module, learners will discover how to choose plants for different indoor "
                    "environments, identify suitable species, and care for them through watering, light management, "
                    "and routine maintenance."
                ),
                'price': 499.00,
                'discount_price': 499.00,
                'duration_hrs': "2.5 hrs",
                'level': "Beginner to Intermediate",
                'status': "PUBLISHED",
                'thumbnail': "/lm_logo.png",
                'banner': "/lm_logo.png"
            }
        )
        if not c_created:
            lens_course.title = "Landscape Lens"
            lens_course.status = "PUBLISHED"
            lens_course.save()

        # Module 1
        lens_mod, _ = Module.objects.get_or_create(
            course=lens_course,
            title="Module 1: Seeing Space Through Landscape Architecture",
            defaults={'order': 1}
        )

        # Lesson with VEED video (watermark=0, sharing=0, title=0 for privacy and security)
        veed_id = "da580287-a62a-41dd-8c97-8e1b4192e9dd"
        veed_url = f"https://www.veed.io/embed/{veed_id}?watermark=0&color=10b981&sharing=0&title=0"
        lens_lesson, l_created = Lesson.objects.get_or_create(
            module=lens_mod,
            title="Landscape Lens - Masterclass Video",
            defaults={
                'description': "Learn to see every space through the eyes of a landscape designer.",
                'video_provider': 'veed',
                'video_id': veed_id,
                'video_url': veed_url,
                'duration': "Full Masterclass",
                'order': 1,
                'is_published': True,
                'is_free_preview': False
            }
        )
        if not l_created:
            lens_lesson.video_id = veed_id
            lens_lesson.video_url = veed_url
            lens_lesson.is_published = True
            lens_lesson.save()

        # Auto-enroll test student in all published courses
        for course in Course.objects.filter(status='PUBLISHED'):
            Enrollment.objects.get_or_create(
                user=student,
                course=course,
                defaults={'status': 'ACTIVE', 'access_type': 'PAID'}
            )
            PaymentRecord.objects.get_or_create(
                order_id=f"order_student_{student.id}_{course.id}",
                defaults={
                    'user': student,
                    'course': course,
                    'payment_id': f"pay_student_{student.id}_{course.id}",
                    'amount': course.price,
                    'currency': 'INR',
                    'status': 'SUCCESS'
                }
            )
        self.stdout.write(self.style.SUCCESS("[OK] Paid student enrollments & courses synchronized."))
