from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from finances.models import Contract, StripeAccount, Transaction
from jobs.models import Opportunity, Proposal
from users.models import Freelancer, Publisher, Role, User


class FakeStripe:
    class Account:
        @staticmethod
        def create(**_kwargs):
            return SimpleNamespace(id="acct_123", country="BR")

        @staticmethod
        def retrieve(_account_id):
            return SimpleNamespace(
                charges_enabled=True,
                payouts_enabled=True,
                requirements=SimpleNamespace(currently_due=[]),
            )

    class AccountLink:
        @staticmethod
        def create(**_kwargs):
            return SimpleNamespace(url="https://stripe.test/onboarding")

    class PaymentIntent:
        @staticmethod
        def create(**_kwargs):
            return SimpleNamespace(id="pi_123", client_secret="secret_123")

    class Transfer:
        @staticmethod
        def create(**_kwargs):
            return SimpleNamespace(id="tr_123")

    class Webhook:
        event_type = "payment_intent.succeeded"
        intent_id = "pi_123"

        @classmethod
        def construct_event(cls, _payload, _signature, _secret):
            return {
                "type": cls.event_type,
                "data": {"object": {"id": cls.intent_id}},
            }


@override_settings(STRIPE_SECRET_KEY="sk_test", STRIPE_WEBHOOK_SECRET="whsec_test")
class BillingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publisher_role = Role.objects.create(role_name="publisher")
        self.freelancer_role = Role.objects.create(role_name="freelancer")
        self.publisher = User.objects.create_user(
            email="publisher-billing@example.com",
            username="publisher-billing",
            password="secret123",
            role=self.publisher_role,
        )
        self.freelancer = User.objects.create_user(
            email="freelancer-billing@example.com",
            username="freelancer-billing",
            password="secret123",
            role=self.freelancer_role,
        )
        self.publisher_profile = Publisher.objects.create(
            user_id=self.publisher,
            company_name="Acme",
        )
        self.freelancer_profile = Freelancer.objects.create(user_id=self.freelancer)
        self.opportunity = Opportunity.objects.create(
            publisher=self.publisher_profile,
            title="Projeto escrow",
            description="Construir fluxo de escrow.",
            deadline=timezone.localdate() + timedelta(days=30),
        )
        self.proposal = Proposal.objects.create(
            opportunity=self.opportunity,
            freelancer=self.freelancer_profile,
            proposed_value="100.00",
            cover_letter="Posso entregar.",
        )

    @patch("finances.views._stripe", return_value=FakeStripe)
    def test_create_connect_account(self, _stripe_mock):
        self.client.force_authenticate(self.freelancer)

        response = self.client.post("/api/billing/account/create/", {"country": "BR"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["onboarding_url"], "https://stripe.test/onboarding")
        self.assertTrue(StripeAccount.objects.filter(user=self.freelancer).exists())

    @patch("finances.views._stripe", return_value=FakeStripe)
    def test_create_payment_intent_records_transaction(self, _stripe_mock):
        self.client.force_authenticate(self.publisher)
        StripeAccount.objects.create(
            user=self.freelancer,
            stripe_account_id="acct_123",
            charges_enabled=True,
            payouts_enabled=True,
        )

        response = self.client.post(
            "/api/billing/payment-intent/",
            {"proposal_id": self.proposal.proposal_id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["payment_intent_id"], "pi_123")
        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(Transaction.objects.first().amount, 100)
        self.assertEqual(Transaction.objects.first().platform_fee, 15)
        self.assertEqual(Transaction.objects.first().freelancer_amount, 85)
        self.assertEqual(Transaction.objects.first().metadata["proposal_id"], str(self.proposal.proposal_id))
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, Proposal.Status.PENDING)

    def test_create_payment_intent_rejects_invalid_payload(self):
        self.client.force_authenticate(self.publisher)

        missing_proposal_response = self.client.post(
            "/api/billing/payment-intent/",
            {},
            format="json",
        )
        invalid_proposal_response = self.client.post(
            "/api/billing/payment-intent/",
            {"proposal_id": "invalid"},
            format="json",
        )

        self.assertEqual(missing_proposal_response.status_code, 400)
        self.assertEqual(invalid_proposal_response.status_code, 400)

    @patch("finances.views._stripe", return_value=FakeStripe)
    def test_webhook_updates_transaction(self, _stripe_mock):
        Transaction.objects.create(
            stripe_payment_intent_id="pi_123",
            publisher=self.publisher,
            freelancer=self.freelancer,
            job_id=str(self.opportunity.opportunity_id),
            amount="100.00",
            platform_fee="15.00",
            freelancer_amount="85.00",
            type=Transaction.Type.PAYMENT,
            status=Transaction.Status.PENDING,
            description="Escrow da proposta",
            metadata={"proposal_id": str(self.proposal.proposal_id), "escrow": True},
        )

        response = self.client.post(
            "/api/billing/webhook/",
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Transaction.objects.get().status, Transaction.Status.COMPLETED)
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, Proposal.Status.ACCEPTED)
        contract = Contract.objects.get(proposal=self.proposal)
        self.assertEqual(contract.status, Contract.Status.ACTIVE)
        self.assertEqual(contract.end_date, self.opportunity.deadline)

    def test_webhook_rejects_invalid_signature(self):
        class InvalidStripe(FakeStripe):
            class Webhook:
                @staticmethod
                def construct_event(_payload, _signature, _secret):
                    raise ValueError("invalid")

        with patch("finances.views._stripe", return_value=InvalidStripe):
            response = self.client.post(
                "/api/billing/webhook/",
                data=b"{}",
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="sig",
            )

        self.assertEqual(response.status_code, 400)


class ContractDashboardApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publisher_role = Role.objects.create(role_name="publisher")
        self.freelancer_role = Role.objects.create(role_name="freelancer")
        self.publisher_user = User.objects.create_user(
            email="publisher-contract@example.com",
            username="publisher-contract",
            password="secret123",
            role=self.publisher_role,
        )
        self.freelancer_user = User.objects.create_user(
            email="freelancer-contract@example.com",
            username="freelancer-contract",
            password="secret123",
            role=self.freelancer_role,
        )
        self.publisher = Publisher.objects.create(
            user_id=self.publisher_user,
            company_name="Acme",
        )
        self.freelancer = Freelancer.objects.create(user_id=self.freelancer_user)
        self.opportunity = Opportunity.objects.create(
            publisher=self.publisher,
            title="Dashboard agile",
            description="Construir dashboard de projetos.",
            status=Opportunity.Status.CLOSED,
        )
        self.proposal = Proposal.objects.create(
            opportunity=self.opportunity,
            freelancer=self.freelancer,
            proposed_value="1000.00",
            cover_letter="Vamos entregar.",
            status=Proposal.Status.ACCEPTED,
        )
        self.contract = Contract.objects.create(
            proposal=self.proposal,
            start_date="2026-05-03",
            end_date="2026-06-03",
            total_value="1000.00",
            status=Contract.Status.ACTIVE,
        )
        StripeAccount.objects.create(
            user=self.freelancer_user,
            stripe_account_id="acct_contract",
            payouts_enabled=True,
        )
        Transaction.objects.create(
            stripe_payment_intent_id="pi_contract",
            publisher=self.publisher_user,
            freelancer=self.freelancer_user,
            job_id=str(self.opportunity.opportunity_id),
            amount="1000.00",
            platform_fee="150.00",
            freelancer_amount="850.00",
            type=Transaction.Type.PAYMENT,
            status=Transaction.Status.COMPLETED,
            description="Escrow da proposta",
            metadata={"proposal_id": str(self.proposal.proposal_id), "escrow": True},
        )

    def test_user_can_list_own_contracts(self):
        self.client.force_authenticate(self.freelancer_user)

        response = self.client.get("/api/billing/contracts/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["contract_id"], str(self.contract.contract_id))

    @override_settings(STRIPE_SECRET_KEY="sk_test")
    @patch("finances.views._stripe", return_value=FakeStripe)
    def test_contract_completes_only_after_both_parties_approve(self, _stripe_mock):
        self.client.force_authenticate(self.freelancer_user)
        first_response = self.client.post(f"/api/billing/contracts/{self.contract.contract_id}/complete/")

        self.assertEqual(first_response.status_code, 200)
        self.assertTrue(first_response.json()["freelancer_completion_approved"])
        self.assertFalse(first_response.json()["publisher_completion_approved"])
        self.assertEqual(first_response.json()["status"], Contract.Status.ACTIVE)

        self.client.force_authenticate(self.publisher_user)
        second_response = self.client.post(f"/api/billing/contracts/{self.contract.contract_id}/complete/")

        self.assertEqual(second_response.status_code, 200)
        self.assertTrue(second_response.json()["freelancer_completion_approved"])
        self.assertTrue(second_response.json()["publisher_completion_approved"])
        self.assertEqual(second_response.json()["status"], Contract.Status.COMPLETED)
        self.assertIsNotNone(second_response.json()["completed_at"])
        self.assertIsNotNone(second_response.json()["escrow_released_at"])
        self.assertEqual(Transaction.objects.get(stripe_payment_intent_id="pi_contract").stripe_transfer_id, "tr_123")
