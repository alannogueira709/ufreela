from django.test import TestCase
from rest_framework.test import APIClient

from jobs.models import Category, Opportunity, Proposal
from users.models import Freelancer, Publisher, Role, User


class OpportunityApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publisher_role = Role.objects.create(role_name="publisher")
        self.freelancer_role = Role.objects.create(role_name="freelancer")
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
        self.category = Category.objects.get(
            category_slug="escrita-traducao",
        )
        self.opportunity = Opportunity.objects.create(
            publisher=self.publisher,
            category=self.category,
            title="Redator tecnico",
            description="Criar documentacao para produto SaaS.",
            status=Opportunity.Status.OPEN,
        )
        self.freelancer_user = User.objects.create_user(
            email="freela@example.com",
            username="freela",
            password="secret123",
            role=self.freelancer_role,
            name="Ana",
            last_name="Silva",
        )
        self.freelancer = Freelancer.objects.create(
            user_id=self.freelancer_user,
            professional_level="mid",
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

    def test_freelancer_can_create_proposal(self):
        self.client.force_authenticate(self.freelancer_user)

        response = self.client.post(
            f"/api/opportunities/{self.opportunity.opportunity_id}/proposals/",
            {
                "proposed_value": "1500.00",
                "cover_letter": "Tenho experiencia para entregar este projeto.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Proposal.objects.count(), 1)
        self.assertEqual(response.json()["status"], Proposal.Status.PENDING)

    def test_freelancer_cannot_create_duplicate_proposal(self):
        Proposal.objects.create(
            opportunity=self.opportunity,
            freelancer=self.freelancer,
            proposed_value="1500.00",
            cover_letter="Primeira proposta.",
        )
        self.client.force_authenticate(self.freelancer_user)

        response = self.client.post(
            f"/api/opportunities/{self.opportunity.opportunity_id}/proposals/",
            {
                "proposed_value": "1800.00",
                "cover_letter": "Segunda proposta.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Proposal.objects.count(), 1)

    def test_freelancer_can_list_own_proposals(self):
        Proposal.objects.create(
            opportunity=self.opportunity,
            freelancer=self.freelancer,
            proposed_value="1500.00",
            cover_letter="Proposta enviada.",
        )
        self.client.force_authenticate(self.freelancer_user)

        response = self.client.get("/api/freelancers/me/proposals/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["freelancer"]["name"], "Ana")

    def test_publisher_can_list_received_proposals(self):
        Proposal.objects.create(
            opportunity=self.opportunity,
            freelancer=self.freelancer,
            proposed_value="1500.00",
            cover_letter="Proposta enviada.",
        )
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/publishers/me/proposals/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(
            response.json()[0]["opportunity"]["opportunity_id"],
            self.opportunity.opportunity_id,
        )
