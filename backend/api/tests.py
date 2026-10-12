import hmac
import hashlib
import time
import jwt
from django.test import TestCase
from django.conf import settings
from rest_framework.test import APIClient
from api.models import Usr, Course, Enrollment, PaymentRecord, SiteSetting, Module, Lesson
from api.signed_url_service import generate_signed_stream_token, verify_signed_stream_token
from api.veed_service import extract_veed_video_id, normalize_veed_embed_url, validate_veed_source

class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('database'), 'connected')

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = 'SecureTestPass123!'
        self.user = Usr.objects.create_user(
            email='teststudent@landscapemastery.com',
            password=self.password,
            full_name='Test Student',
            role='STUDENT',
            paid=True,
            is_active=True
        )

    def test_login_success(self):
        response = self.client.post('/api/login/', {
            'email': self.user.email,
            'password': self.password
        }, format='json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['email'], self.user.email)
        self.assertTrue(data['user']['paid'])

    def test_login_invalid_password(self):
        response = self.client.post('/api/login/', {
            'email': self.user.email,
            'password': 'WrongPassword999!'
        }, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.json())

    def test_login_disabled_account(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post('/api/login/', {
            'email': self.user.email,
            'password': self.password
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertIn('error', response.json())

    def test_login_unpaid_student_without_enrollment(self):
        unpaid_user = Usr.objects.create_user(
            email='unpaid@landscapemastery.com',
            password=self.password,
            role='STUDENT',
            paid=False
        )
        response = self.client.post('/api/login/', {
            'email': unpaid_user.email,
            'password': self.password
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertIn('purchase', response.json().get('error', '').lower())

class SignedUrlServiceTests(TestCase):
    def setUp(self):
        self.user = Usr.objects.create_user(
            email='streamer@landscapemastery.com',
            password='Password123!',
            role='STUDENT',
            paid=True
        )
        self.asset_id = 42

    def test_generate_and_verify_valid_token(self):
        token, exp_time = generate_signed_stream_token(self.user, self.asset_id, duration_sec=300)
        self.assertIsNotNone(token)
        self.assertGreater(exp_time, int(time.time()))

        payload = verify_signed_stream_token(token, self.asset_id)
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get('usr_id'), self.user.id)
        self.assertEqual(payload.get('asset_id'), self.asset_id)
        self.assertEqual(payload.get('type'), 'signed_stream')

    def test_verify_rejects_wrong_asset_id(self):
        token, _ = generate_signed_stream_token(self.user, self.asset_id, duration_sec=300)
        payload = verify_signed_stream_token(token, asset_id=999)
        self.assertIsNone(payload)

    def test_verify_rejects_tampered_token(self):
        payload = verify_signed_stream_token('invalid.jwt.token', self.asset_id)
        self.assertIsNone(payload)

class PublicSettingsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        SiteSetting.objects.get_or_create(
            id=1,
            defaults={'hero_title': 'Master Architecture', 'course_price': 499.00}
        )
        Course.objects.create(
            title='Executive Landscape Design',
            slug='executive-landscape-design',
            status='PUBLISHED',
            price=499.00,
            discount_price=499.00
        )

    def test_public_settings_endpoint(self):
        response = self.client.get('/api/public/settings/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('heroTitle', data)
        self.assertIn('courses', data)
        self.assertGreaterEqual(len(data['courses']), 1)

class CheckoutVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.course = Course.objects.create(
            title='Production Masterclass',
            slug='production-masterclass',
            status='PUBLISHED',
            price=499.00,
            discount_price=499.00
        )
        self.secret = 'test_secret_for_payment_verification_12345'

    def test_checkout_verification_with_valid_signature(self):
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            order_id = 'order_test_12345'
            payment_id = 'pay_test_67890'
            email = 'paidstudent@landscapemastery.com'

            # Generate HMAC SHA256 signature
            signature = hmac.new(
                self.secret.encode('utf-8'),
                f"{order_id}|{payment_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            response = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
                'email': email,
                'course_id': self.course.id
            }, format='json')

            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data.get('success'))
            self.assertTrue(data['user']['paid'])

            # Verify User, Enrollment, and PaymentRecord in DB
            user = Usr.objects.get(email=email)
            self.assertTrue(user.paid)
            self.assertTrue(Enrollment.objects.filter(user=user, course=self.course, status='ACTIVE').exists())
            self.assertTrue(PaymentRecord.objects.filter(order_id=order_id, status='SUCCESS').exists())

    def test_checkout_verification_rejects_invalid_signature(self):
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            response = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': 'order_123',
                'razorpay_payment_id': 'pay_456',
                'razorpay_signature': 'invalid_forged_signature_hash',
                'email': 'hacker@example.com'
            }, format='json')

            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.json())

class VeedServiceUnitTests(TestCase):
    def setUp(self):
        self.valid_uuid = '8317ab9c-7a4f-4088-bdcb-06cc3b04399a'
        self.actual_veed_url = f"https://www.veed.io/embed/{self.valid_uuid}?watermark=1&color=&sharing=1&title=1"
        self.actual_iframe = f'<iframe src="{self.actual_veed_url}" width="100%" height="100%" allowfullscreen></iframe>'

    def test_extract_video_id_from_raw_uuid(self):
        vid = extract_veed_video_id(self.valid_uuid)
        self.assertEqual(vid, self.valid_uuid)

    def test_extract_video_id_from_embed_url(self):
        vid = extract_veed_video_id(self.actual_veed_url)
        self.assertEqual(vid, self.valid_uuid)

    def test_extract_video_id_from_view_url(self):
        view_url = f"https://www.veed.io/view/{self.valid_uuid}"
        vid = extract_veed_video_id(view_url)
        self.assertEqual(vid, self.valid_uuid)

    def test_extract_video_id_from_iframe_snippet(self):
        vid = extract_veed_video_id(self.actual_iframe)
        self.assertEqual(vid, self.valid_uuid)

    def test_reject_arbitrary_or_unapproved_urls(self):
        invalid_urls = [
            'https://evil-hacker.com/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a',
            'https://youtube.com/watch?v=dQw4w9WgXcQ',
            'javascript:alert(1)',
            '<script>alert("xss")</script>',
            'not-a-url-at-all'
        ]
        for url in invalid_urls:
            is_valid, vid_id, norm_url, err = validate_veed_source(url)
            self.assertFalse(is_valid, f"Should reject invalid input: {url}")
            self.assertIsNotNone(err)

    def test_normalize_veed_embed_url(self):
        normalized = normalize_veed_embed_url(self.valid_uuid)
        self.assertTrue(normalized.startswith(f"https://www.veed.io/embed/{self.valid_uuid}"))
        # By default, watermark and sharing are disabled for student privacy and content security
        self.assertIn("watermark=0", normalized)
        self.assertIn("sharing=0", normalized)
        self.assertIn("title=0", normalized)

        # Explicit overrides test
        explicit = normalize_veed_embed_url(self.valid_uuid, watermark=True, sharing=True, title=True)
        self.assertIn("watermark=1", explicit)
        self.assertIn("sharing=1", explicit)
        self.assertIn("title=1", explicit)

    def test_validate_veed_source_success(self):
        is_valid, vid_id, norm_url, err = validate_veed_source(self.actual_veed_url)
        self.assertTrue(is_valid)
        self.assertEqual(vid_id, self.valid_uuid)
        self.assertIn(self.valid_uuid, norm_url)
        self.assertIsNone(err)

class SuperAdminLessonManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usr.objects.create_superuser(
            email='superadmin@landscapemastery.com',
            password='AdminPassword123!',
            role='SUPER_ADMIN'
        )
        self.student = Usr.objects.create_user(
            email='regularstudent@landscapemastery.com',
            password='StudentPassword123!',
            role='STUDENT',
            paid=False
        )
        self.course = Course.objects.create(
            title='Landscape Architecture Pro',
            slug='landscape-architecture-pro',
            status='PUBLISHED',
            price=499.00
        )
        self.module = Module.objects.create(
            course=self.course,
            title='Module 1: Site Topography',
            order=1
        )
        self.veed_id = '8317ab9c-7a4f-4088-bdcb-06cc3b04399a'
        self.veed_url = f"https://www.veed.io/embed/{self.veed_id}?watermark=1&color=&sharing=1&title=1"

        # Generate JWT tokens
        self.admin_token = jwt.encode(
            {'usr_id': self.admin.id, 'email': self.admin.email, 'role': self.admin.role, 'exp': int(time.time()) + 86400},
            settings.SECRET_KEY, algorithm='HS256'
        )
        self.student_token = jwt.encode(
            {'usr_id': self.student.id, 'email': self.student.email, 'role': self.student.role, 'exp': int(time.time()) + 86400},
            settings.SECRET_KEY, algorithm='HS256'
        )

    def test_admin_can_create_lesson_with_veed_reference(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.post(f'/api/admin/modules/{self.module.id}/lessons/', {
            'title': 'Grading & Surface Drainage',
            'description': 'Comprehensive masterclass on contour grading.',
            'video_provider': 'veed',
            'video_url': self.veed_url,
            'duration': '45 mins',
            'order': 1,
            'is_free_preview': False,
            'is_published': True
        }, format='json')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'created')
        lesson_data = data.get('lesson')
        self.assertEqual(lesson_data['title'], 'Grading & Surface Drainage')
        self.assertEqual(lesson_data['video_id'], self.veed_id)
        self.assertIn('https://www.veed.io/embed/', lesson_data['video_url'])
        self.assertTrue(lesson_data['is_published'])
        self.assertFalse(lesson_data['is_free_preview'])

    def test_admin_can_update_lesson(self):
        lesson = Lesson.objects.create(
            module=self.module,
            title='Initial Lesson',
            order=1,
            video_provider='veed',
            is_published=False
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.patch(f'/api/admin/lessons/{lesson.id}/', {
            'title': 'Updated Lesson Title',
            'video_url': self.veed_id,  # Raw UUID accepted and normalized
            'is_published': True,
            'is_free_preview': True
        }, format='json')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['lesson']['title'], 'Updated Lesson Title')
        self.assertEqual(data['lesson']['video_id'], self.veed_id)
        self.assertTrue(data['lesson']['is_published'])
        self.assertTrue(data['lesson']['is_free_preview'])

    def test_admin_can_toggle_publish(self):
        lesson = Lesson.objects.create(
            module=self.module,
            title='Draft Lesson',
            is_published=False
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.patch(f'/api/admin/lessons/{lesson.id}/publish/', {
            'is_published': True
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['is_published'])

    def test_admin_can_delete_lesson(self):
        lesson = Lesson.objects.create(
            module=self.module,
            title='Lesson to Delete'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.delete(f'/api/admin/lessons/{lesson.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Lesson.objects.filter(id=lesson.id).exists())

    def test_student_cannot_manage_lessons(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        # Attempt create
        res_create = self.client.post(f'/api/admin/modules/{self.module.id}/lessons/', {
            'title': 'Hacked Lesson'
        }, format='json')
        self.assertEqual(res_create.status_code, 403)

        # Attempt update
        lesson = Lesson.objects.create(module=self.module, title='Existing Lesson')
        res_update = self.client.patch(f'/api/admin/lessons/{lesson.id}/', {
            'title': 'Defaced Title'
        }, format='json')
        self.assertEqual(res_update.status_code, 403)

        # Attempt delete
        res_delete = self.client.delete(f'/api/admin/lessons/{lesson.id}/')
        self.assertEqual(res_delete.status_code, 403)

    def test_admin_validate_veed_endpoint(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # Valid VEED source
        res_valid = self.client.post('/api/admin/veed/validate/', {
            'video_source': self.veed_url
        }, format='json')
        self.assertEqual(res_valid.status_code, 200)
        self.assertTrue(res_valid.json()['valid'])
        self.assertEqual(res_valid.json()['video_id'], self.veed_id)

        # Invalid source
        res_invalid = self.client.post('/api/admin/veed/validate/', {
            'video_source': 'https://vimeo.com/123456'
        }, format='json')
        self.assertEqual(res_invalid.status_code, 400)
        self.assertFalse(res_invalid.json()['valid'])

class SecurePlaybackAuthorizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.course_a = Course.objects.create(
            title='Course A: Landscape Design',
            slug='course-a',
            status='PUBLISHED',
            price=499.00
        )
        self.course_b = Course.objects.create(
            title='Course B: Urban Ecology',
            slug='course-b',
            status='PUBLISHED',
            price=499.00
        )
        self.module_a = Module.objects.create(course=self.course_a, title='Module A', order=1)
        self.module_b = Module.objects.create(course=self.course_b, title='Module B', order=1)

        self.veed_id = '8317ab9c-7a4f-4088-bdcb-06cc3b04399a'
        self.veed_url = f"https://www.veed.io/embed/{self.veed_id}?watermark=1&color=&sharing=1&title=1"

        # Paid Lesson in Course A
        self.paid_lesson = Lesson.objects.create(
            module=self.module_a,
            title='Paid Lesson 1',
            video_provider='veed',
            video_id=self.veed_id,
            video_url=self.veed_url,
            is_free_preview=False,
            is_published=True
        )

        # Free Preview Lesson in Course A
        self.preview_lesson = Lesson.objects.create(
            module=self.module_a,
            title='Free Preview Lesson',
            video_provider='veed',
            video_id=self.veed_id,
            video_url=self.veed_url,
            is_free_preview=True,
            is_published=True
        )

        # Unpublished Lesson in Course A
        self.draft_lesson = Lesson.objects.create(
            module=self.module_a,
            title='Draft Lesson',
            video_provider='veed',
            video_id=self.veed_id,
            video_url=self.veed_url,
            is_free_preview=False,
            is_published=False
        )

        # Enrolled Student in Course A
        self.enrolled_student = Usr.objects.create_user(
            email='enrolled@landscapemastery.com',
            password='Password123!',
            role='STUDENT',
            paid=False
        )
        Enrollment.objects.create(
            user=self.enrolled_student,
            course=self.course_a,
            status='ACTIVE'
        )

        # Non-Enrolled Student
        self.non_enrolled_student = Usr.objects.create_user(
            email='nonenrolled@landscapemastery.com',
            password='Password123!',
            role='STUDENT',
            paid=False
        )

        # Revoked Student in Course A
        self.revoked_student = Usr.objects.create_user(
            email='revoked@landscapemastery.com',
            password='Password123!',
            role='STUDENT',
            paid=False
        )
        Enrollment.objects.create(
            user=self.revoked_student,
            course=self.course_a,
            status='REFUNDED'
        )

        # Tokens
        self.enrolled_token = jwt.encode(
            {'usr_id': self.enrolled_student.id, 'email': self.enrolled_student.email, 'role': 'STUDENT', 'exp': int(time.time()) + 86400},
            settings.SECRET_KEY, algorithm='HS256'
        )
        self.non_enrolled_token = jwt.encode(
            {'usr_id': self.non_enrolled_student.id, 'email': self.non_enrolled_student.email, 'role': 'STUDENT', 'exp': int(time.time()) + 86400},
            settings.SECRET_KEY, algorithm='HS256'
        )
        self.revoked_token = jwt.encode(
            {'usr_id': self.revoked_student.id, 'email': self.revoked_student.email, 'role': 'STUDENT', 'exp': int(time.time()) + 86400},
            settings.SECRET_KEY, algorithm='HS256'
        )

    def test_enrolled_student_can_access_paid_playback(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.enrolled_token}')
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.paid_lesson.id}/playback/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['lesson_id'], self.paid_lesson.id)
        self.assertEqual(data['video_id'], self.veed_id)
        self.assertIn('https://www.veed.io/embed/', data['embed_url'])
        self.assertTrue(data['is_enrolled'])
        self.assertIn('ENROLLED STUDENT', data['watermark'])

    def test_non_enrolled_student_denied_paid_playback(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.non_enrolled_token}')
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.paid_lesson.id}/playback/')
        self.assertEqual(res.status_code, 403)
        data = res.json()
        self.assertTrue(data.get('locked'))
        self.assertNotIn('embed_url', data)

    def test_unauthenticated_user_denied_paid_playback(self):
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.paid_lesson.id}/playback/')
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertTrue(data.get('requires_auth'))
        self.assertNotIn('embed_url', data)

    def test_free_preview_accessible_without_enrollment(self):
        # Unauthenticated user accessing free preview
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.preview_lesson.id}/playback/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['is_free_preview'])
        self.assertEqual(data['video_id'], self.veed_id)
        self.assertIn('https://www.veed.io/embed/', data['embed_url'])

    def test_unpublished_lesson_inaccessible_to_students(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.enrolled_token}')
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.draft_lesson.id}/playback/')
        self.assertEqual(res.status_code, 404)

    def test_cross_course_access_rejected_idor_protection(self):
        # Request lesson belonging to Course A using Course B ID
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.enrolled_token}')
        res = self.client.get(f'/api/courses/{self.course_b.id}/lessons/{self.paid_lesson.id}/playback/')
        self.assertEqual(res.status_code, 404)
        self.assertIn('does not belong', res.json().get('error', ''))

    def test_refunded_or_revoked_enrollment_denied(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.revoked_token}')
        res = self.client.get(f'/api/courses/{self.course_a.id}/lessons/{self.paid_lesson.id}/playback/')
        self.assertEqual(res.status_code, 403)
        self.assertTrue(res.json().get('revoked'))

