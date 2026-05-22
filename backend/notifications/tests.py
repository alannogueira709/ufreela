from django.test import TestCase
from rest_framework.test import APIClient

from notifications.models import Notification
from users.models import Freelancer, Publisher, Role, User


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(role_name="freelancer")
        self.user = User.objects.create_user(
            email="notifications@example.com",
            username="notifications",
            password="secret123",
            role=self.role,
        )
        self.other_user = User.objects.create_user(
            email="other-notifications@example.com",
            username="other-notifications",
            password="secret123",
            role=self.role,
        )

    def test_list_returns_only_authenticated_user_notifications(self):
        own_notification = Notification.objects.create(
            user=self.user,
            type=Notification.Type.NEW_MESSAGE,
            title="Nova mensagem",
            message="Voce recebeu uma nova mensagem.",
        )
        Notification.objects.create(
            user=self.other_user,
            type=Notification.Type.PAYMENT_RECEIVED,
            title="Pagamento recebido",
            message="Esse item nao deve aparecer para outro usuario.",
        )
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["unread_count"], 1)
        self.assertEqual(len(payload["results"]), 1)
        self.assertEqual(payload["results"][0]["id"], str(own_notification.id))

    def test_mark_notification_as_read(self):
        notification = Notification.objects.create(
            user=self.user,
            type=Notification.Type.JOB_INVITATION,
            title="Convite para vaga",
        )
        self.client.force_authenticate(self.user)

        response = self.client.patch(f"/api/notifications/{notification.id}/read/")

        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.read)
        self.assertTrue(response.json()["read"])

    def test_mark_all_notifications_as_read(self):
        Notification.objects.create(
            user=self.user,
            type=Notification.Type.PROPOSAL_ACCEPTED,
            title="Proposta aceita",
        )
        Notification.objects.create(
            user=self.user,
            type=Notification.Type.DEADLINE_REMINDER,
            title="Prazo chegando",
            read=True,
        )
        self.client.force_authenticate(self.user)

        response = self.client.post("/api/notifications/read-all/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["marked"], 1)
        self.assertFalse(Notification.objects.filter(user=self.user, read=False).exists())

    def test_delete_notification(self):
        notification = Notification.objects.create(
            user=self.user,
            type=Notification.Type.PROFILE_VIEW,
            title="Perfil visualizado",
        )
        self.client.force_authenticate(self.user)

        response = self.client.delete(f"/api/notifications/{notification.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Notification.objects.filter(id=notification.id).exists())


class NotificationSignalTests(TestCase):
    def setUp(self):
        self.freelancer_role = Role.objects.create(role_name="freelancer")
        self.publisher_role = Role.objects.create(role_name="publisher")
        
        self.pub_user = User.objects.create_user(
            email="publisher@example.com",
            username="publisher",
            password="password123",
            role=self.publisher_role
        )
        self.publisher = Publisher.objects.create(user_id=self.pub_user, company_name="Acme Corp")
        
        self.free_user = User.objects.create_user(
            email="freelancer@example.com",
            username="freelancer",
            password="password123",
            role=self.freelancer_role
        )
        self.freelancer = Freelancer.objects.create(user_id=self.free_user)

    def test_opportunity_creation_notifies_freelancer(self):
        from jobs.models import Opportunity
        
        opp = Opportunity.objects.create(
            publisher=self.publisher,
            title="Desenvolvedor Django",
            description="Vaga para desenvolvedor experiente em Django/Python.",
            budget_min=1000,
            budget_max=3000
        )
        
        notifications = Notification.objects.filter(user=self.free_user, type=Notification.Type.JOB_INVITATION)
        self.assertTrue(notifications.exists())
        self.assertEqual(notifications.first().metadata["opportunity_id"], str(opp.opportunity_id))

    def test_proposal_creation_notifies_publisher(self):
        from jobs.models import Opportunity, Proposal
        opp = Opportunity.objects.create(
            publisher=self.publisher,
            title="Desenvolvedor Django",
            description="Vaga para desenvolvedor experiente em Django/Python."
        )
        
        proposal = Proposal.objects.create(
            opportunity=opp,
            freelancer=self.freelancer,
            proposed_value=1500,
            cover_letter="Estou interessado!"
        )
        
        notifications = Notification.objects.filter(user=self.pub_user, type=Notification.Type.NEW_PROPOSAL)
        self.assertTrue(notifications.exists())
        self.assertEqual(notifications.first().metadata["proposal_id"], str(proposal.proposal_id))

    def test_proposal_status_change_notifies_freelancer(self):
        from jobs.models import Opportunity, Proposal
        opp = Opportunity.objects.create(
            publisher=self.publisher,
            title="Desenvolvedor Django",
            description="Vaga para desenvolvedor experiente em Django/Python."
        )
        proposal = Proposal.objects.create(
            opportunity=opp,
            freelancer=self.freelancer,
            proposed_value=1500,
            cover_letter="Estou interessado!"
        )
        
        Notification.objects.all().delete()
        
        proposal.status = Proposal.Status.ACCEPTED
        proposal.save()
        
        notifications = Notification.objects.filter(user=self.free_user, type=Notification.Type.PROPOSAL_ACCEPTED)
        self.assertTrue(notifications.exists())

    def test_transaction_completion_notifies_both(self):
        from finances.models import Transaction
        
        tx = Transaction.objects.create(
            publisher=self.pub_user,
            freelancer=self.free_user,
            amount=1000,
            platform_fee=100,
            freelancer_amount=900,
            type=Transaction.Type.PAYMENT,
            status=Transaction.Status.COMPLETED,
            description="Pagamento do projeto X"
        )
        
        pub_notifications = Notification.objects.filter(user=self.pub_user, type=Notification.Type.PAYMENT_RECEIVED)
        self.assertTrue(pub_notifications.exists())
        
        free_notifications = Notification.objects.filter(user=self.free_user, type=Notification.Type.PAYMENT_RECEIVED)
        self.assertTrue(free_notifications.exists())
