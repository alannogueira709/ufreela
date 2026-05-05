from django.test import TestCase
from rest_framework.test import APIClient

from settings_app.models import UserSettings
from users.models import Role, User


class UserSettingsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(role_name="freelancer")
        self.user = User.objects.create_user(
            email="settings@example.com",
            username="settings",
            password="secret123",
            role=self.role,
        )
        self.client.force_authenticate(self.user)

    def test_get_creates_default_settings(self):
        response = self.client.get("/api/settings/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["theme"], "system")
        self.assertTrue(UserSettings.objects.filter(user=self.user).exists())

    def test_patch_updates_settings(self):
        response = self.client.patch(
            "/api/settings/",
            {"theme": "dark", "compact_mode": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["theme"], "dark")
        self.assertTrue(response.json()["compact_mode"])
