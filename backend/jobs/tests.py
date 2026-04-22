from django.test import TestCase
from rest_framework.test import APIClient

from jobs.models import Category, Opportunity
from users.models import Publisher, Role, User


class OpportunityApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publisher_role = Role.objects.create(role_name="publisher")
        self.user = User.objects.create_user(
            email="publisher@example.com",
            username="publisher",
            password="secret123",
            role=self.publisher_role,
        )
        self.publisher = Publisher.objects.create(
            user_id=self.user,
            company_name="Studio Teste",
        )
        self.category = Category.objects.create(
            category_name="Escrita e Traducao",
            category_slug="escrita-traducao",
        )
        self.opportunity = Opportunity.objects.create(
            publisher=self.publisher,
            category=self.category,
            title="Redator tecnico",
            description="Criar documentacao para produto SaaS.",
            status=Opportunity.Status.OPEN,
        )

    def test_can_filter_opportunities_by_category_slug(self):
        response = self.client.get("/api/opportunities/?category=escrita-traducao")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(
            response.json()[0]["opportunity_id"],
            self.opportunity.opportunity_id,
        )

    def test_api_root_returns_metadata(self):
        response = self.client.get("/api/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Freela API")
