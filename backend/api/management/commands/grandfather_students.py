from django.core.management.base import BaseCommand
from api.models import Usr, Course, Enrollment


class Command(BaseCommand):
    help = 'Grandfather existing paid students by enrolling them in all published courses'

    def handle(self, *args, **options):
        paid_students = Usr.objects.filter(role='STUDENT', paid=True)
        published_courses = Course.objects.filter(status='PUBLISHED')

        if not published_courses.exists():
            self.stdout.write(self.style.WARNING('No published courses found.'))
            return

        created_count = 0
        for student in paid_students:
            for course in published_courses:
                _, created = Enrollment.objects.get_or_create(
                    user=student,
                    course=course,
                    defaults={'status': 'ACTIVE', 'access_type': 'PAID'}
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Grandfathered {paid_students.count()} paid students across {published_courses.count()} courses. '
            f'Created {created_count} new enrollment records.'
        ))
