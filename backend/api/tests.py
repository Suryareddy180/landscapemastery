import hmac
import hashlib
import time
import jwt
from django.test import TestCase
from django.conf import settings
from rest_framework.test import APIClient
from api.models import Usr, Course, Enrollment, PaymentRecord, SiteSetting
from api.signed_url_service import generate_signed_stream_token, verify_signed_stream_token

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
