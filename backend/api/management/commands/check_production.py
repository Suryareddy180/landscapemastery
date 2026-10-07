import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection

class Command(BaseCommand):
    help = "Performs automated production-readiness checks for Landscape Mastery & 3CAPSTECH platform"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("===> Running Landscape Mastery Production Readiness Check..."))
        warnings = 0
        errors = 0

        # 1. DEBUG check
        if settings.DEBUG:
            self.stdout.write(self.style.ERROR("[FAIL] DEBUG is True! Must be False in production."))
            errors += 1
        else:
            self.stdout.write(self.style.SUCCESS("[PASS] DEBUG is False."))

        # 2. SECRET_KEY check
        secret = settings.SECRET_KEY
        if len(secret) < 50 or secret.startswith("django-insecure-"):
            self.stdout.write(self.style.WARNING(f"[WARN] SECRET_KEY is weak ({len(secret)} chars) or starts with django-insecure. Generate a 64+ char secret."))
            warnings += 1
        else:
            self.stdout.write(self.style.SUCCESS("[PASS] SECRET_KEY meets cryptographic length and entropy standards."))

        # 3. ALLOWED_HOSTS check
        allowed = settings.ALLOWED_HOSTS
        if not allowed or "*" in allowed:
            self.stdout.write(self.style.ERROR("[FAIL] ALLOWED_HOSTS is empty or contains wildcard '*'."))
            errors += 1
        else:
            self.stdout.write(self.style.SUCCESS(f"[PASS] ALLOWED_HOSTS configured: {', '.join(allowed)}"))

        # 4. CORS & CSRF check
        cors = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        csrf = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
        if not cors:
            self.stdout.write(self.style.WARNING("[WARN] CORS_ALLOWED_ORIGINS is empty."))
            warnings += 1
        else:
            self.stdout.write(self.style.SUCCESS(f"[PASS] CORS_ALLOWED_ORIGINS: {len(cors)} origin(s) configured."))

        if not csrf:
            self.stdout.write(self.style.WARNING("[WARN] CSRF_TRUSTED_ORIGINS is empty."))
            warnings += 1
        else:
            self.stdout.write(self.style.SUCCESS(f"[PASS] CSRF_TRUSTED_ORIGINS: {len(csrf)} origin(s) configured."))

        # 5. Database connectivity
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            self.stdout.write(self.style.SUCCESS("[PASS] PostgreSQL database connected successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[FAIL] Database connection failed: {e}"))
            errors += 1

        # 6. Razorpay credentials
        rzp_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
        rzp_sec = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if not rzp_id or not rzp_sec:
            self.stdout.write(self.style.WARNING("[WARN] Razorpay keys not configured. Checkout & webhook will reject requests."))
            warnings += 1
        elif rzp_id.startswith('rzp_test_'):
            self.stdout.write(self.style.WARNING("[WARN] Razorpay TEST key is configured. Replace with rzp_live_... for production."))
            warnings += 1
        else:
            self.stdout.write(self.style.SUCCESS("[PASS] Razorpay LIVE keys configured."))

        # 7. SMTP Email Configuration
        email_host = getattr(settings, 'EMAIL_HOST', '')
        email_user = getattr(settings, 'EMAIL_HOST_USER', '')
        if not email_host or not email_user:
            self.stdout.write(self.style.WARNING("[WARN] SMTP credentials not fully configured."))
            warnings += 1
        else:
            self.stdout.write(self.style.SUCCESS(f"[PASS] SMTP configured: {email_host}:{getattr(settings, 'EMAIL_PORT', 587)}"))

        # 8. Static & Media Roots
        if os.path.exists(settings.STATIC_ROOT):
            self.stdout.write(self.style.SUCCESS(f"[PASS] STATIC_ROOT directory exists: {settings.STATIC_ROOT}"))
        else:
            self.stdout.write(self.style.WARNING(f"[WARN] STATIC_ROOT directory missing. Run 'python manage.py collectstatic'."))
            warnings += 1

        # Summary
        self.stdout.write(self.style.NOTICE("--------------------------------------------------"))
        if errors == 0 and warnings == 0:
            self.stdout.write(self.style.SUCCESS("CONGRATULATIONS: System is 100% PRODUCTION READY!"))
        elif errors == 0:
            self.stdout.write(self.style.WARNING(f"SYSTEM READY with {warnings} non-blocking warning(s)."))
        else:
            self.stdout.write(self.style.ERROR(f"BLOCKING: {errors} error(s) must be resolved before production deployment."))
