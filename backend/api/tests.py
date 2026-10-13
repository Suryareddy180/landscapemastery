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


class UniversalProfileManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student_pwd = "StudentPass123!"
        self.student = Usr.objects.create_user(
            email="surya.student@example.com",
            password=self.student_pwd,
            full_name="Surya Prakash Reddy Nallimilli",
            phone="+918074290125",
            role="STUDENT",
            paid=True,
            is_active=True
        )

        self.employee_pwd = "EmployeePass123!"
        self.employee = Usr.objects.create_user(
            email="rajesh.employee@example.com",
            password=self.employee_pwd,
            full_name="Rajesh Kumar",
            phone="+919876543210",
            role="EMPLOYEE",
            paid=False,
            is_active=True
        )

        self.household_pwd = "HouseholdPass123!"
        self.household = Usr.objects.create_user(
            email="sharma.family@example.com",
            password=self.household_pwd,
            full_name="Anil Sharma",
            phone="+919123456789",
            role="HOUSEHOLD",
            paid=False,
            is_active=True
        )

        from api.views import get_tokens_for_user
        self.student_token = get_tokens_for_user(self.student)
        self.employee_token = get_tokens_for_user(self.employee)
        self.household_token = get_tokens_for_user(self.household)

    def test_unauthenticated_profile_access_denied(self):
        res = self.client.get('/api/profile/')
        self.assertIn(res.status_code, [401, 403])
        res = self.client.patch('/api/profile/', {'full_name': 'Hacker'})
        self.assertIn(res.status_code, [401, 403])

    def test_student_profile_fetch_and_update(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['role'], 'STUDENT')
        self.assertEqual(data['email'], self.student.email)
        self.assertIn('qualification', data)
        self.assertIn('branch', data)
        self.assertIn('passout_year', data)
        self.assertIn('college_name', data)
        self.assertIn('student_status', data)

        # Update Student Profile with required fields
        patch_payload = {
            'full_name': 'Surya Prakash Reddy Nallimilli',
            'phone': '+91 8074290125',
            'dob': '2005-01-14',
            'qualification': 'B.Tech',
            'branch': 'AI & DS',
            'passout_year': 2026,
            'college_name': 'Sri Vasavi Engineering College',
            'student_status': 'Still Studying'
        }
        patch_res = self.client.patch('/api/profile/', patch_payload, format='json')
        self.assertEqual(patch_res.status_code, 200)
        updated = patch_res.json()['profile']
        self.assertEqual(updated['qualification'], 'B.Tech')
        self.assertEqual(updated['branch'], 'AI & DS')
        self.assertEqual(updated['passout_year'], 2026)
        self.assertEqual(updated['college_name'], 'Sri Vasavi Engineering College')
        self.assertEqual(updated['student_status'], 'Still Studying')
        self.assertEqual(updated['dob'], '2005-01-14')

    def test_employee_profile_fetch_and_update(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.employee_token}')
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['role'], 'EMPLOYEE')
        self.assertIn('company_name', data)
        self.assertIn('department', data)
        self.assertIn('designation', data)
        self.assertIn('employment_status', data)

        # Update Employee Profile
        patch_payload = {
            'company_name': '3CAPSTECH Solutions Pvt Ltd',
            'department': 'Cloud Architecture',
            'designation': 'Senior Solutions Architect',
            'employment_status': 'Full-Time',
            'dob': '1995-06-20'
        }
        patch_res = self.client.patch('/api/profile/', patch_payload, format='json')
        self.assertEqual(patch_res.status_code, 200)
        updated = patch_res.json()['profile']
        self.assertEqual(updated['company_name'], '3CAPSTECH Solutions Pvt Ltd')
        self.assertEqual(updated['department'], 'Cloud Architecture')
        self.assertEqual(updated['designation'], 'Senior Solutions Architect')
        self.assertEqual(updated['employment_status'], 'Full-Time')

    def test_household_profile_fetch_and_update(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.household_token}')
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['role'], 'HOUSEHOLD')
        self.assertIn('household_name', data)
        self.assertIn('primary_contact_name', data)
        self.assertIn('residential_address', data)
        self.assertIn('member_count', data)

        # Update Household Profile
        patch_payload = {
            'household_name': 'Sharma Villa',
            'primary_contact_name': 'Anil Sharma',
            'residential_address': 'Flat 402, Green Meadows, Hyderabad',
            'member_count': 4
        }
        patch_res = self.client.patch('/api/profile/', patch_payload, format='json')
        self.assertEqual(patch_res.status_code, 200)
        updated = patch_res.json()['profile']
        self.assertEqual(updated['household_name'], 'Sharma Villa')
        self.assertEqual(updated['residential_address'], 'Flat 402, Green Meadows, Hyderabad')
        self.assertEqual(updated['member_count'], 4)

    def test_future_dob_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.patch('/api/profile/', {'dob': '2099-12-31'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('future', res.json().get('error', '').lower())

    def test_invalid_passout_year_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.patch('/api/profile/', {'passout_year': 1899}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('passout year', res.json().get('error', '').lower())

    def test_avatar_upload_and_removal(self):
        from io import BytesIO
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')

        # Create valid PNG in memory
        img_io = BytesIO()
        img = Image.new('RGB', (100, 100), color='green')
        img.save(img_io, format='PNG')
        img_io.seek(0)
        valid_file = SimpleUploadedFile("avatar.png", img_io.read(), content_type="image/png")

        res = self.client.post('/api/profile/upload-picture/', {'avatar': valid_file}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.json().get('avatar_url'))

        # Remove picture
        del_res = self.client.delete('/api/profile/picture/')
        self.assertEqual(del_res.status_code, 200)
        self.assertIsNone(del_res.json().get('avatar_url'))

    def test_change_password_flow(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')

        # Wrong current password
        bad_cur = self.client.post('/api/profile/change-password/', {
            'current_password': 'IncorrectCurrentPassword1!',
            'new_password': 'NewSecurePass2026!',
            'confirm_password': 'NewSecurePass2026!'
        }, format='json')
        self.assertEqual(bad_cur.status_code, 400)
        self.assertIn('incorrect', bad_cur.json().get('error', '').lower())

        # Password mismatch
        mismatch = self.client.post('/api/profile/change-password/', {
            'current_password': self.student_pwd,
            'new_password': 'NewSecurePass2026!',
            'confirm_password': 'MismatchPass2026!'
        }, format='json')
        self.assertEqual(mismatch.status_code, 400)

        # Weak password (no number)
        weak = self.client.post('/api/profile/change-password/', {
            'current_password': self.student_pwd,
            'new_password': 'NoNumericLetterHere!',
            'confirm_password': 'NoNumericLetterHere!'
        }, format='json')
        self.assertEqual(weak.status_code, 400)

        # Successful change
        success = self.client.post('/api/profile/change-password/', {
            'current_password': self.student_pwd,
            'new_password': 'NewSecurePass2026!',
            'confirm_password': 'NewSecurePass2026!'
        }, format='json')
        self.assertEqual(success.status_code, 200)
        self.assertIn('token', success.json())

        # Check new password works, old does not
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password('NewSecurePass2026!'))
        self.assertFalse(self.student.check_password(self.student_pwd))

    def test_delete_account_flow(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')

        # Without acknowledgement
        no_ack = self.client.post('/api/profile/delete-account/', {
            'password': self.student_pwd,
            'acknowledge': False
        }, format='json')
        self.assertEqual(no_ack.status_code, 400)

        # Wrong password
        wrong_pwd = self.client.post('/api/profile/delete-account/', {
            'password': 'WrongPassword123!',
            'acknowledge': True
        }, format='json')
        self.assertEqual(wrong_pwd.status_code, 400)

        # Successful deletion
        success = self.client.post('/api/profile/delete-account/', {
            'password': self.student_pwd,
            'acknowledge': True
        }, format='json')
        self.assertEqual(success.status_code, 200)

        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)
        self.assertTrue(self.student.email.startswith('deleted_'))

    def test_manual_registration_blocked(self):
        """
        Requirement 1: Manual registration endpoints must be strictly blocked with HTTP 403.
        Accounts are created exclusively via verified payment or admin workflow.
        """
        payload = {
            'role': 'STUDENT',
            'full_name': 'Manual User',
            'email': 'manual.attempt@example.com',
            'phone': '+91 9988776655',
            'password': 'StrongPass2026!'
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertIn('registration is disabled', res.json().get('error', '').lower())

        res2 = self.client.post('/api/register/', payload, format='json')
        self.assertEqual(res2.status_code, 403)

    def test_temporary_password_generator_spec(self):
        """
        Requirement 5: Generated temporary passwords must be exactly 8 characters
        and contain at least one uppercase, one lowercase, and one digit.
        """
        from api.payment_service import generate_secure_temporary_password
        for _ in range(50):
            pwd = generate_secure_temporary_password(8)
            self.assertEqual(len(pwd), 8)
            self.assertTrue(any(c.isupper() for c in pwd), f"Password {pwd} missing uppercase")
            self.assertTrue(any(c.islower() for c in pwd), f"Password {pwd} missing lowercase")
            self.assertTrue(any(c.isdigit() for c in pwd), f"Password {pwd} missing digit")

    def test_checkout_session_validation_and_creation(self):
        """
        Requirement 2 & 8: Checkout session validates learner metadata, requires
        full name, email, mobile with country code, and creates pending PaymentRecord.
        """
        # Missing fields validation
        res_fail = self.client.post('/api/checkout/session/', {
            'email': 'test@example.com'
        }, format='json')
        self.assertEqual(res_fail.status_code, 400)
        self.assertIn('Full name is required', res_fail.json().get('error', ''))

        course = Course.objects.create(
            title='Landscape Architecture Fundamentals',
            slug='landscape-arch-fundamentals',
            price=999.00,
            discount_price=499.00,
            status='PUBLISHED'
        )

        res_ok = self.client.post('/api/checkout/session/', {
            'full_name': 'Sanjay Kumar',
            'email': 'sanjay.kumar@example.com',
            'phone': '+91 9876543210',
            'account_type': 'STUDENT',
            'course_id': course.id,
            'qualification': 'B.Arch',
            'college_name': 'School of Planning and Architecture',
            'passout_year': 2026
        }, format='json')

        self.assertEqual(res_ok.status_code, 200)
        data = res_ok.json()
        self.assertTrue(data.get('success'))
        self.assertIn('orderId', data)
        self.assertEqual(data.get('amount'), 49900)  # in paise

        # Check pending PaymentRecord created
        record = PaymentRecord.objects.filter(order_id=data['orderId']).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.status, 'PENDING')
        self.assertEqual(record.customer_email, 'sanjay.kumar@example.com')
        self.assertEqual(record.customer_name, 'Sanjay Kumar')
        self.assertEqual(record.account_type, 'STUDENT')
        self.assertEqual(record.checkout_metadata.get('qualification'), 'B.Arch')

    def test_payment_verification_and_automatic_student_account_creation(self):
        """
        Requirements 3, 4, 5, 6, 8:
        Authoritative cryptographic payment verification creates Student account,
        hashes credentials, enrolls in course, and dispatches email.
        """
        course = Course.objects.create(
            title='Executive Landscape Masterclass',
            slug='executive-landscape-masterclass',
            price=799.00,
            discount_price=499.00,
            status='PUBLISHED'
        )

        # 1. Create checkout session
        order_res = self.client.post('/api/checkout/session/', {
            'full_name': 'Divya Sharma',
            'email': 'divya.sharma@example.com',
            'phone': '+91 9123456789',
            'account_type': 'STUDENT',
            'course_id': course.id,
            'qualification': 'B.Des',
            'branch': 'Spatial Design',
            'college_name': 'National Institute of Design',
            'passout_year': 2025
        }, format='json')
        self.assertEqual(order_res.status_code, 200)
        order_id = order_res.json()['orderId']
        payment_id = f"pay_test_{int(time.time())}"

        # 2. Compute valid Razorpay HMAC SHA-256 signature
        sec = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')
        signature = hmac.new(
            sec.encode('utf-8'),
            f"{order_id}|{payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # 3. Verify payment
        verify_res = self.client.post('/api/checkout/verify/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature,
            'email': 'divya.sharma@example.com',
            'full_name': 'Divya Sharma',
            'phone': '+91 9123456789',
            'account_type': 'STUDENT',
            'course_id': course.id
        }, format='json')

        self.assertEqual(verify_res.status_code, 200)
        data = verify_res.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('is_new_user'))
        self.assertEqual(data.get('order_id'), order_id)
        # Verify plaintext password is NEVER exposed in the response
        self.assertNotIn('temporary_password', data)
        self.assertNotIn('password', data)

        # 4. Verify user in database
        usr = Usr.objects.get(email='divya.sharma@example.com')
        self.assertEqual(usr.role, 'STUDENT')
        self.assertTrue(usr.paid)
        self.assertEqual(usr.full_name, 'Divya Sharma')

        # 5. Verify StudentProfile created with metadata
        profile = usr.profile
        self.assertEqual(profile.qualification, 'B.Des')
        self.assertEqual(profile.college_name, 'National Institute of Design')

        # 6. Verify enrollment
        enrollment = Enrollment.objects.filter(user=usr, course=course).first()
        self.assertIsNotNone(enrollment)

        # 7. Verify PaymentRecord updated to SUCCESS
        record = PaymentRecord.objects.get(order_id=order_id)
        self.assertEqual(record.status, 'SUCCESS')
        self.assertEqual(record.payment_id, payment_id)

    def test_payment_verification_employee_and_household(self):
        """
        Verify automatic account creation for EMPLOYEE and HOUSEHOLD account types.
        """
        course = Course.objects.create(
            title='Universal Spatial Strategy',
            slug='universal-spatial-strategy',
            price=999.00,
            status='PUBLISHED'
        )

        sec = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')

        # Employee
        emp_order_res = self.client.post('/api/checkout/session/', {
            'full_name': 'Kiran Rao',
            'email': 'kiran.rao@3capstech.com',
            'phone': '+91 9888877777',
            'account_type': 'EMPLOYEE',
            'course_id': course.id,
            'company_name': '3CAPSTECH',
            'department': 'Cloud Architecture',
            'designation': 'Principal Architect'
        }, format='json')
        emp_order_id = emp_order_res.json()['orderId']
        emp_pay_id = f"pay_emp_{int(time.time())}"
        emp_sig = hmac.new(sec.encode('utf-8'), f"{emp_order_id}|{emp_pay_id}".encode('utf-8'), hashlib.sha256).hexdigest()

        emp_verify = self.client.post('/api/checkout/verify/', {
            'razorpay_order_id': emp_order_id,
            'razorpay_payment_id': emp_pay_id,
            'razorpay_signature': emp_sig,
            'email': 'kiran.rao@3capstech.com'
        }, format='json')
        self.assertEqual(emp_verify.status_code, 200)

        emp_user = Usr.objects.get(email='kiran.rao@3capstech.com')
        self.assertEqual(emp_user.role, 'EMPLOYEE')
        self.assertEqual(emp_user.profile.company_name, '3CAPSTECH')
        self.assertEqual(emp_user.profile.designation, 'Principal Architect')

        # Household
        hh_order_res = self.client.post('/api/checkout/session/', {
            'full_name': 'Ananya Rao',
            'email': 'ananya.household@example.com',
            'phone': '+91 9777766666',
            'account_type': 'HOUSEHOLD',
            'course_id': course.id,
            'household_name': 'Rao Residence',
            'residential_address': 'Road No 10, Banjara Hills',
            'member_count': 3
        }, format='json')
        hh_order_id = hh_order_res.json()['orderId']
        hh_pay_id = f"pay_hh_{int(time.time())}"
        hh_sig = hmac.new(sec.encode('utf-8'), f"{hh_order_id}|{hh_pay_id}".encode('utf-8'), hashlib.sha256).hexdigest()

        hh_verify = self.client.post('/api/checkout/verify/', {
            'razorpay_order_id': hh_order_id,
            'razorpay_payment_id': hh_pay_id,
            'razorpay_signature': hh_sig,
            'email': 'ananya.household@example.com'
        }, format='json')
        self.assertEqual(hh_verify.status_code, 200)

        hh_user = Usr.objects.get(email='ananya.household@example.com')
        self.assertEqual(hh_user.role, 'HOUSEHOLD')
        self.assertEqual(hh_user.profile.household_name, 'Rao Residence')
        self.assertEqual(hh_user.profile.member_count, 3)

    def test_payment_idempotency_no_duplicate_accounts_or_enrollments(self):
        """
        Requirement 3 & 4: Webhooks or repeat calls with identical order/payment IDs
        must be strictly idempotent and not create duplicate users, enrollments, or errors.
        """
        course = Course.objects.create(
            title='Idempotency Masterclass',
            slug='idempotency-masterclass',
            price=499.00,
            status='PUBLISHED'
        )
        sec = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')

        order_res = self.client.post('/api/checkout/session/', {
            'full_name': 'Neha Gupta',
            'email': 'neha.gupta@example.com',
            'phone': '+91 9000011111',
            'account_type': 'STUDENT',
            'course_id': course.id,
            'college_name': 'IIT Kharagpur'
        }, format='json')
        order_id = order_res.json()['orderId']
        pay_id = f"pay_idem_{int(time.time())}"
        sig = hmac.new(sec.encode('utf-8'), f"{order_id}|{pay_id}".encode('utf-8'), hashlib.sha256).hexdigest()

        verify_payload = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': pay_id,
            'razorpay_signature': sig,
            'email': 'neha.gupta@example.com'
        }

        # First Call
        res1 = self.client.post('/api/checkout/verify/', verify_payload, format='json')
        self.assertEqual(res1.status_code, 200)

        # Second Identical Call (e.g. repeated webhook or retry)
        res2 = self.client.post('/api/checkout/verify/', verify_payload, format='json')
        self.assertEqual(res2.status_code, 200)

        # Verify only 1 user exists and only 1 enrollment exists
        users = Usr.objects.filter(email='neha.gupta@example.com')
        self.assertEqual(users.count(), 1)
        enrollments = Enrollment.objects.filter(user=users.first(), course=course)
        self.assertEqual(enrollments.count(), 1)


class CommunityManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.superadmin = Usr.objects.create_user(
            email="superadmin@landscapemastery.com",
            password="AdminPassword123!",
            role="SUPER_ADMIN",
            is_staff=True,
            is_superuser=True
        )
        self.content_manager = Usr.objects.create_user(
            email="contentmgr@landscapemastery.com",
            password="ContentPass123!",
            role="CONTENT_MANAGER",
            is_staff=True
        )
        self.student = Usr.objects.create_user(
            email="student@landscapemastery.com",
            password="StudentPass123!",
            role="STUDENT"
        )
        self.hacker = Usr.objects.create_user(
            email="spammer@example.com",
            password="SpamPass123!",
            role="STUDENT"
        )

        from api.views import get_tokens_for_user
        self.superadmin_token = get_tokens_for_user(self.superadmin)
        self.content_mgr_token = get_tokens_for_user(self.content_manager)
        self.student_token = get_tokens_for_user(self.student)
        self.hacker_token = get_tokens_for_user(self.hacker)

    def test_channels_list_and_auto_seed(self):
        res = self.client.get('/api/community/channels/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('channels', data)
        self.assertGreaterEqual(len(data['channels']), 5)
        slugs = [c['slug'] for c in data['channels']]
        self.assertIn('general-architecture', slugs)

    def test_student_post_message_and_reaction(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        post_res = self.client.post('/api/community/channels/general-architecture/post/', {
            'content': 'Hello from our landscape architecture studio!'
        }, format='json')
        self.assertEqual(post_res.status_code, 201)
        msg_data = post_res.json()['data']
        msg_id = msg_data['id']
        self.assertEqual(msg_data['text'], 'Hello from our landscape architecture studio!')

        # React with emoji
        react_res = self.client.post(f'/api/community/messages/{msg_id}/react/', {
            'emoji': '🔥'
        }, format='json')
        self.assertEqual(react_res.status_code, 200)
        self.assertEqual(react_res.json()['reactions']['🔥'], 1)

    def test_admin_access_control(self):
        # Student attempting admin overview -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/admin/community/overview/')
        self.assertEqual(res.status_code, 403)

        # Content Manager accessing admin overview -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.content_mgr_token}')
        res_cm = self.client.get('/api/admin/community/overview/')
        self.assertEqual(res_cm.status_code, 200)
        self.assertIn('stats', res_cm.json())

        # Super Admin accessing admin overview -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.superadmin_token}')
        res_sa = self.client.get('/api/admin/community/overview/')
        self.assertEqual(res_sa.status_code, 200)

    def test_content_manager_moderation_pin_delete_and_mute(self):
        # 1. Student posts message
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hacker_token}')
        post_res = self.client.post('/api/community/channels/general-architecture/post/', {
            'content': 'Spam advertising unauthorized blueprints'
        }, format='json')
        self.assertEqual(post_res.status_code, 201)
        msg_id = post_res.json()['data']['id']

        # 2. Content Manager pins message
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.content_mgr_token}')
        pin_res = self.client.post(f'/api/admin/community/messages/{msg_id}/moderate/', {
            'action': 'pin'
        }, format='json')
        self.assertEqual(pin_res.status_code, 200)

        # 3. Content Manager deletes message
        del_res = self.client.post(f'/api/admin/community/messages/{msg_id}/moderate/', {
            'action': 'delete'
        }, format='json')
        self.assertEqual(del_res.status_code, 200)

        # Message is now omitted from active channel messages
        get_res = self.client.get('/api/community/channels/general-architecture/messages/')
        active_ids = [m['id'] for m in get_res.json()['messages']]
        self.assertNotIn(msg_id, active_ids)

        # 4. Content Manager mutes the spammer
        mute_res = self.client.post(f'/api/admin/community/members/{self.hacker.id}/moderate/', {
            'action': 'mute',
            'reason': 'Violation of academic standards'
        }, format='json')
        self.assertEqual(mute_res.status_code, 200)

        # 5. Spammer cannot post anymore -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hacker_token}')
        blocked_res = self.client.post('/api/community/channels/general-architecture/post/', {
            'content': 'Another spam attempt'
        }, format='json')
        self.assertEqual(blocked_res.status_code, 403)
        self.assertIn('Cannot post', blocked_res.json()['error'])



