import logging
from django.core.management.base import BaseCommand
from api.models import Usr, Course, Enrollment, PaymentRecord
from api.payment_service import send_account_access_email, generate_temporary_password

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Resend course access credentials and instructions email to registered students'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Target specific student email to resend credentials'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Send credentials to all registered students, even if already marked sent'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=None,
            help='Specific temporary password to set (defaults to secure 8-character random password)'
        )

    def handle(self, *args, **options):
        target_email = options.get('email')
        send_all = options.get('all', False)
        forced_password = options.get('password')

        # Determine recipient users
        if target_email:
            clean_email = target_email.strip().lower()
            students = Usr.objects.filter(email=clean_email)
            if not students.exists():
                self.stdout.write(self.style.ERROR(f"User with email '{clean_email}' not found."))
                return
        else:
            # All students or users with paid enrollments / successful payments
            student_roles = ['STUDENT', 'EMPLOYEE', 'HOUSEHOLD']
            students = Usr.objects.filter(role__in=student_roles).distinct()

        self.stdout.write(self.style.NOTICE(f"Processing credential dispatch for {students.count()} student(s)..."))

        dispatched_count = 0
        error_count = 0

        for user in students:
            # Check enrollment and course title
            enrollments = Enrollment.objects.filter(user=user).select_related('course')
            if enrollments.exists():
                course_titles = [e.course.title for e in enrollments if e.course]
                course_title = ", ".join(course_titles) if course_titles else "Landscape Lens Masterclass"
            else:
                first_course = Course.objects.filter(status='PUBLISHED').first()
                course_title = first_course.title if first_course else "Landscape Lens Masterclass"
                # Ensure student has an enrollment record
                if first_course:
                    Enrollment.objects.get_or_create(
                        user=user,
                        course=first_course,
                        defaults={'status': 'ACTIVE', 'access_type': 'PAID'}
                    )

            # Check payment record
            payment_rec = PaymentRecord.objects.filter(
                customer_email__iexact=user.email,
                status='SUCCESS'
            ).order_by('-created_at').first()

            if not payment_rec:
                payment_rec = PaymentRecord.objects.filter(
                    user=user,
                    status='SUCCESS'
                ).order_by('-created_at').first()

            order_ref = payment_rec.order_id if payment_rec else f"ENR_{user.id}"

            # Set a clear, secure temporary password so student can log in immediately
            temp_password = forced_password or generate_temporary_password(8)
            user.set_password(temp_password)
            user.paid = True
            user.is_active = True
            user.save()

            self.stdout.write(f"-> Dispatching access email to: {user.email} (Name: {user.full_name or user.email})")

            # Dispatch branded transactional email
            success, err_msg = send_account_access_email(
                user=user,
                course_title=course_title,
                payment_reference=order_ref,
                temporary_password=temp_password,
                is_new_user=True
            )

            if success:
                dispatched_count += 1
                self.stdout.write(self.style.SUCCESS(f"   [SUCCESS] Delivered to {user.email} (Temp Pass: {temp_password})"))
                if payment_rec:
                    payment_rec.email_sent = True
                    payment_rec.email_error = ""
                    payment_rec.save()
            else:
                error_count += 1
                self.stdout.write(self.style.ERROR(f"   [FAILED] Delivery to {user.email} failed: {err_msg}"))
                if payment_rec:
                    payment_rec.email_error = err_msg
                    payment_rec.save()

        self.stdout.write(self.style.SUCCESS(
            f"\nCompleted! Successfully sent: {dispatched_count} | Errors: {error_count}"
        ))
