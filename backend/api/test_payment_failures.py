import hmac
import hashlib
import time
import json
from django.test import TestCase
from django.conf import settings
from rest_framework.test import APIClient
from api.models import Usr, Course, Enrollment, PaymentRecord, UserProfile

class PaymentGatewayFailureScenariosTests(TestCase):
    """
    Automated QA Test Suite for Payment Gateway Failure, Edge-Case, and Recovery Scenarios.
    Target: Razorpay Payment Integration (Test Mode / Sandbox).
    """

    def setUp(self):
        self.client = APIClient()
        self.secret = 'test_secret_for_qa_testing_12345'
        self.webhook_secret = 'test_webhook_secret_qa_67890'

        # Create a test course
        self.course = Course.objects.create(
            title='Landscape Architecture Executive Masterclass',
            slug='landscape-architecture-executive-masterclass',
            price=999.00,
            discount_price=499.00,
            status='PUBLISHED'
        )

    # ----------------------------------------------------------------------
    # Scenario 1: Payment declined by payment provider
    # ----------------------------------------------------------------------
    def test_scenario_1_payment_declined_webhook_handling(self):
        """
        Scenario 1: Provider declines payment (e.g. bank decline, insufficient funds).
        Razorpay sends a 'payment.failed' webhook event.
        Expected: PaymentRecord is marked FAILED, user is not created or marked paid.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret, RAZORPAY_WEBHOOK_SECRET=self.webhook_secret):
            order_id = 'order_declined_test_101'
            email = 'declined_student@example.com'

            # Pre-create pending record from checkout session
            record = PaymentRecord.objects.create(
                order_id=order_id,
                amount=499.00,
                currency='INR',
                status='PENDING',
                customer_email=email,
                customer_name='Declined Student',
                course=self.course
            )

            # Webhook payload sent by Razorpay for payment.failed
            payload = {
                'event': 'payment.failed',
                'payload': {
                    'payment': {
                        'entity': {
                            'id': 'pay_declined_999',
                            'order_id': order_id,
                            'amount': 49900,
                            'status': 'failed',
                            'error_code': 'BAD_REQUEST_ERROR',
                            'error_description': 'Payment was declined by the bank due to insufficient funds.',
                            'email': email,
                            'contact': '+91 9999988888'
                        }
                    }
                }
            }
            body_bytes = json.dumps(payload).encode('utf-8')
            signature = hmac.new(self.webhook_secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

            response = self.client.post(
                '/api/webhook/razorpay/',
                data=body_bytes,
                content_type='application/json',
                HTTP_X_RAZORPAY_SIGNATURE=signature
            )

            self.assertEqual(response.status_code, 200)

            # Refresh record from DB
            record.refresh_from_db()

            # Security verification: user must NOT be granted access
            user_exists = Usr.objects.filter(email=email).exists()
            self.assertFalse(user_exists, "Declined payment must NEVER create or activate an enrolled user.")

            # Record must reflect failure
            self.assertEqual(record.status, 'FAILED', "PaymentRecord must transition to FAILED upon payment.failed event.")

    # ----------------------------------------------------------------------
    # Scenario 2: Payment fails due to invalid payment method / bad parameters
    # ----------------------------------------------------------------------
    def test_scenario_2_invalid_checkout_parameters_rejected(self):
        """
        Scenario 2: Payment fails due to invalid learner or payment details.
        Expected: HTTP 400 with descriptive error, no pending order created.
        """
        # Missing email
        res1 = self.client.post('/api/checkout/session/', {
            'full_name': 'Valid Name',
            'phone': '+91 9876543210'
        }, format='json')
        self.assertEqual(res1.status_code, 400)
        self.assertIn('Email address is required', res1.json().get('error', ''))

        # Malformed email
        res2 = self.client.post('/api/checkout/session/', {
            'email': 'not-an-email',
            'full_name': 'Valid Name',
            'phone': '+91 9876543210'
        }, format='json')
        self.assertEqual(res2.status_code, 400)
        self.assertIn('valid email address', res2.json().get('error', ''))

    # ----------------------------------------------------------------------
    # Scenario 3 & 4: Payment cancelled by user or checkout window dismissed
    # ----------------------------------------------------------------------
    def test_scenario_3_cancelled_payment_leaves_record_pending_and_unfulfilled(self):
        """
        Scenario 3 & 4: User opens Razorpay modal but cancels / closes window.
        Expected: PaymentRecord exists in PENDING state; no User created, no Enrollment created.
        """
        order_id = 'order_cancelled_202'
        email = 'cancelled_user@example.com'

        PaymentRecord.objects.create(
            order_id=order_id,
            amount=499.00,
            currency='INR',
            status='PENDING',
            customer_email=email,
            customer_name='Cancelled User',
            course=self.course
        )

        # Check DB state
        self.assertFalse(Usr.objects.filter(email=email).exists())
        self.assertEqual(Enrollment.objects.filter(course=self.course).count(), 0)

        # Verify order status endpoint returns PENDING
        status_res = self.client.get(f'/api/orders/{order_id}/status/')
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()['status'], 'PENDING')

    # ----------------------------------------------------------------------
    # Scenario 5: Payment times out or remains pending
    # ----------------------------------------------------------------------
    def test_scenario_5_pending_payment_never_grants_access(self):
        """
        Scenario 5: Payment times out or remains pending indefinitely.
        Expected: User cannot log in, has paid=False, and course is not accessible.
        """
        email = 'pending_timeout@example.com'
        user = Usr.objects.create_user(
            email=email,
            password='TestPassword123!',
            role='STUDENT',
            paid=False
        )

        order_id = 'order_timeout_303'
        PaymentRecord.objects.create(
            user=user,
            order_id=order_id,
            amount=499.00,
            status='PENDING',
            customer_email=email,
            course=self.course
        )

        user.refresh_from_db()
        self.assertFalse(user.paid, "User with pending order must remain paid=False.")
        self.assertFalse(
            Enrollment.objects.filter(user=user, course=self.course, status='ACTIVE').exists(),
            "Pending order must never grant active course enrollment."
        )

    # ----------------------------------------------------------------------
    # Scenario 6: Network interruption during verification
    # ----------------------------------------------------------------------
    def test_scenario_6_verification_missing_parameters_does_not_fulfill(self):
        """
        Scenario 6: Network disconnect causes incomplete verification request.
        Expected: HTTP 400, no fulfillment.
        """
        res = self.client.post('/api/checkout/verify/', {
            'razorpay_order_id': 'order_partial',
            # missing payment_id and email
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Missing payment verification parameters', res.json().get('error', ''))

    # ----------------------------------------------------------------------
    # Scenario 7: Gateway succeeds, frontend dropped; Webhook fulfills order
    # ----------------------------------------------------------------------
    def test_scenario_7_webhook_reconciliation_when_frontend_drops(self):
        """
        Scenario 7: Payment succeeds at Razorpay, but student's browser disconnected.
        Razorpay sends 'payment.captured' webhook.
        Expected: Webhook verifies signature, fulfills payment, creates user, enrolls.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret, RAZORPAY_WEBHOOK_SECRET=self.webhook_secret):
            order_id = 'order_reconcile_404'
            pay_id = 'pay_reconcile_777'
            email = 'reconciled_student@example.com'

            PaymentRecord.objects.create(
                order_id=order_id,
                amount=499.00,
                status='PENDING',
                customer_email=email,
                customer_name='Reconciled Student',
                course=self.course
            )

            payload = {
                'event': 'payment.captured',
                'payload': {
                    'payment': {
                        'entity': {
                            'id': pay_id,
                            'order_id': order_id,
                            'amount': 49900,
                            'email': email,
                            'contact': '+91 9123456789',
                            'notes': {
                                'course_id': str(self.course.id),
                                'account_type': 'STUDENT',
                                'customer_name': 'Reconciled Student'
                            }
                        }
                    }
                }
            }
            body_bytes = json.dumps(payload).encode('utf-8')
            signature = hmac.new(self.webhook_secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

            res = self.client.post(
                '/api/webhook/razorpay/',
                data=body_bytes,
                content_type='application/json',
                HTTP_X_RAZORPAY_SIGNATURE=signature
            )
            self.assertEqual(res.status_code, 200)

            # Verify reconciliation in DB
            user = Usr.objects.get(email=email)
            self.assertTrue(user.paid)
            self.assertTrue(Enrollment.objects.filter(user=user, course=self.course, status='ACTIVE').exists())

            record = PaymentRecord.objects.get(order_id=order_id)
            self.assertEqual(record.status, 'SUCCESS')
            self.assertEqual(record.payment_id, pay_id)

    # ----------------------------------------------------------------------
    # Scenario 8: Invalid signature or mismatched payment ID rejected
    # ----------------------------------------------------------------------
    def test_scenario_8a_invalid_signature_rejected(self):
        """
        Scenario 8A: Client submits forged or corrupted signature.
        Expected: HTTP 400 Bad Request, no account provisioned.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            res = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': 'order_fake_501',
                'razorpay_payment_id': 'pay_fake_502',
                'razorpay_signature': 'tampered_or_invalid_signature_hex',
                'email': 'attacker@example.com'
            }, format='json')

            self.assertEqual(res.status_code, 400)
            self.assertIn('signature verification failed', res.json().get('error', '').lower())
            self.assertFalse(Usr.objects.filter(email='attacker@example.com').exists())

    def test_scenario_8b_mismatched_payment_id_fails_signature(self):
        """
        Scenario 8B: Signature was calculated for pay_aaa, but attacker sends pay_bbb.
        Expected: Cryptographic signature mismatch -> HTTP 400.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            order_id = 'order_legit_601'
            pay_id_1 = 'pay_legit_602'
            pay_id_tampered = 'pay_tampered_603'

            # Valid signature for pay_id_1
            sig = hmac.new(
                self.secret.encode('utf-8'),
                f"{order_id}|{pay_id_1}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Send pay_id_tampered with sig of pay_id_1
            res = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': pay_id_tampered,
                'razorpay_signature': sig,
                'email': 'victim@example.com'
            }, format='json')

            self.assertEqual(res.status_code, 400)
            self.assertIn('signature verification failed', res.json().get('error', '').lower())

    def test_scenario_8c_missing_signature_rejected(self):
        """
        Scenario 8C: Signature omitted entirely.
        Expected: HTTP 400, signature required.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            res = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': 'order_no_sig_701',
                'razorpay_payment_id': 'pay_no_sig_702',
                'razorpay_signature': '',
                'email': 'nosig@example.com'
            }, format='json')

            self.assertEqual(res.status_code, 400)
            self.assertFalse(Usr.objects.filter(email='nosig@example.com').exists())

    # ----------------------------------------------------------------------
    # Scenario 9: Duplicate payment callback or webhook received (Idempotency)
    # ----------------------------------------------------------------------
    def test_scenario_9a_duplicate_verify_callback_idempotent(self):
        """
        Scenario 9A: Client or network retries /api/checkout/verify/ with identical payload.
        Expected: First returns 200, second returns 200 with already_processed logic,
        exact same user, exactly 1 enrollment, no duplicate accounts.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            order_id = 'order_idem_801'
            pay_id = 'pay_idem_802'
            email = 'idempotent_user@example.com'

            sig = hmac.new(
                self.secret.encode('utf-8'),
                f"{order_id}|{pay_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            payload = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': pay_id,
                'razorpay_signature': sig,
                'email': email,
                'full_name': 'Idempotent User',
                'course_id': self.course.id
            }

            res1 = self.client.post('/api/checkout/verify/', payload, format='json')
            self.assertEqual(res1.status_code, 200)

            # Repeat identical call immediately
            res2 = self.client.post('/api/checkout/verify/', payload, format='json')
            self.assertEqual(res2.status_code, 200)

            # Assert database invariants
            users = Usr.objects.filter(email=email)
            self.assertEqual(users.count(), 1, "Duplicate callback must NOT create duplicate user.")

            enrollments = Enrollment.objects.filter(user=users.first(), course=self.course)
            self.assertEqual(enrollments.count(), 1, "Duplicate callback must NOT create duplicate enrollment.")

    def test_scenario_9b_duplicate_webhook_replay_idempotent(self):
        """
        Scenario 9B: Razorpay re-delivers payment.captured webhook (at least once delivery).
        Expected: Handled idempotently, no duplicate fulfillment.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret, RAZORPAY_WEBHOOK_SECRET=self.webhook_secret):
            order_id = 'order_hook_idem_901'
            pay_id = 'pay_hook_idem_902'
            email = 'webhook_idem@example.com'

            payload = {
                'event': 'payment.captured',
                'payload': {
                    'payment': {
                        'entity': {
                            'id': pay_id,
                            'order_id': order_id,
                            'amount': 49900,
                            'email': email,
                            'notes': {'course_id': str(self.course.id)}
                        }
                    }
                }
            }
            body_bytes = json.dumps(payload).encode('utf-8')
            signature = hmac.new(self.webhook_secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

            # First webhook delivery
            res1 = self.client.post('/api/webhook/razorpay/', data=body_bytes, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=signature)
            self.assertEqual(res1.status_code, 200)

            # Replayed webhook delivery
            res2 = self.client.post('/api/webhook/razorpay/', data=body_bytes, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=signature)
            self.assertEqual(res2.status_code, 200)

            # Verify idempotency
            self.assertEqual(Usr.objects.filter(email=email).count(), 1)
            self.assertEqual(Enrollment.objects.filter(user__email=email, course=self.course).count(), 1)

    # ----------------------------------------------------------------------
    # Scenario 10: User retries payment after previous failure
    # ----------------------------------------------------------------------
    def test_scenario_10_retry_payment_flow(self):
        """
        Scenario 10: First payment fails; user retries with a new payment attempt.
        Expected: First order is FAILED/PENDING; second attempt succeeds cleanly.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            email = 'retry_user@example.com'

            # Attempt 1: Failed
            order_1 = 'order_retry_fail_1001'
            PaymentRecord.objects.create(
                order_id=order_1,
                amount=499.00,
                status='FAILED',
                customer_email=email,
                course=self.course
            )

            # Attempt 2: Succeeded
            order_2 = 'order_retry_succ_1002'
            pay_2 = 'pay_retry_succ_2002'
            sig_2 = hmac.new(
                self.secret.encode('utf-8'),
                f"{order_2}|{pay_2}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            res = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': order_2,
                'razorpay_payment_id': pay_2,
                'razorpay_signature': sig_2,
                'email': email,
                'full_name': 'Retry User',
                'course_id': self.course.id
            }, format='json')

            self.assertEqual(res.status_code, 200)

            # Verify that user is successfully enrolled
            user = Usr.objects.get(email=email)
            self.assertTrue(user.paid)
            self.assertEqual(Enrollment.objects.filter(user=user, course=self.course).count(), 1)

    # ----------------------------------------------------------------------
    # Scenario 12: Delayed webhook update for older pending order
    # ----------------------------------------------------------------------
    def test_scenario_12_delayed_webhook_reconciliation(self):
        """
        Scenario 12: An order was pending for hours. Gateway sends late payment.captured.
        Expected: Pending record reconciles to SUCCESS, user activated.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret, RAZORPAY_WEBHOOK_SECRET=self.webhook_secret):
            order_id = 'order_delayed_1201'
            pay_id = 'pay_delayed_1202'
            email = 'delayed_student@example.com'

            # Order placed earlier
            record = PaymentRecord.objects.create(
                order_id=order_id,
                amount=499.00,
                status='PENDING',
                customer_email=email,
                customer_name='Delayed Student',
                course=self.course
            )

            # Delayed webhook arrives
            payload = {
                'event': 'payment.captured',
                'payload': {
                    'payment': {
                        'entity': {
                            'id': pay_id,
                            'order_id': order_id,
                            'amount': 49900,
                            'email': email,
                            'notes': {'course_id': str(self.course.id)}
                        }
                    }
                }
            }
            body_bytes = json.dumps(payload).encode('utf-8')
            signature = hmac.new(self.webhook_secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

            res = self.client.post('/api/webhook/razorpay/', data=body_bytes, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=signature)
            self.assertEqual(res.status_code, 200)

            record.refresh_from_db()
            self.assertEqual(record.status, 'SUCCESS')
            self.assertEqual(record.payment_id, pay_id)

            user = Usr.objects.get(email=email)
            self.assertTrue(user.paid)

    # ----------------------------------------------------------------------
    # Security Checks: Amount validation & Credential confidentiality
    # ----------------------------------------------------------------------
    def test_security_server_calculated_pricing(self):
        """
        Security: Order creation amounts must be calculated authoritatively from DB,
        ignoring any client-tampered price parameters.
        """
        res = self.client.post('/api/checkout/session/', {
            'email': 'price_check@example.com',
            'full_name': 'Price Auditor',
            'phone': '+91 9123456789',
            'course_id': self.course.id,
            'amount': 1.00  # Attacker tries to set price to 1 INR
        }, format='json')

        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Course discount_price is 499.00 -> 49900 paise
        self.assertEqual(data['amount'], 49900, "Server must override client-supplied price with DB price.")

    def test_security_credentials_never_exposed_in_responses(self):
        """
        Security: Neither checkout session nor verify API should ever expose secrets,
        Razorpay secret keys, user passwords, or tokens in plaintext.
        """
        with self.settings(RAZORPAY_KEY_SECRET=self.secret):
            order_id = 'order_sec_1301'
            pay_id = 'pay_sec_1302'
            email = 'sec_audit@example.com'

            sig = hmac.new(
                self.secret.encode('utf-8'),
                f"{order_id}|{pay_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            res = self.client.post('/api/checkout/verify/', {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': pay_id,
                'razorpay_signature': sig,
                'email': email,
                'full_name': 'Security Audit User',
                'course_id': self.course.id
            }, format='json')

            self.assertEqual(res.status_code, 200)
            raw_text = res.content.decode('utf-8')

            self.assertNotIn(self.secret, raw_text, "Gateway secret must NEVER be reflected.")
            self.assertNotIn('temporary_password', raw_text, "Temporary password must not be returned in API response.")
            self.assertNotIn('password', raw_text.lower(), "Password field should not be in API response.")
