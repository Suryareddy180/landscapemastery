from django.test import TestCase
from rest_framework.test import APIClient
from company.models import Contact, Newsletter

class CompanyAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_brand_config_endpoint(self):
        response = self.client.get('/api/config/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('name', data)
        self.assertIn('email', data)
        self.assertIn('primary_color', data)

    def test_stats_endpoint(self):
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('projects', data)
        self.assertIn('learners', data)

    def test_contact_submission(self):
        payload = {
            'name': 'Alexander Wright',
            'email': 'alex@firm.design',
            'company': 'Wright Architecture Studio',
            'phone': '+1 555 0199',
            'interest': 'Architecture & Design',
            'message': 'We are interested in licensing the Landscape Mastery curriculum for our junior architects.'
        }
        response = self.client.post('/api/contact/', payload, format='json')
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(Contact.objects.filter(email='alex@firm.design').exists())

    def test_newsletter_subscription(self):
        payload = {'email': 'subscriber@designmag.com'}
        response = self.client.post('/api/newsletter/', payload, format='json')
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(Newsletter.objects.filter(email='subscriber@designmag.com').exists())
