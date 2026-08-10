from unittest.mock import patch

import requests
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from integrations.models import GitHubConnection, PortfolioProject
from users.models import Role, User


class IntegrationsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role, _ = Role.objects.get_or_create(role_name="freelancer")
        self.user = User.objects.create_user(
            email="integrations@example.com",
            username="integrations",
            password="secret123",
            role=self.role,
        )
        self.client.force_authenticate(self.user)

    @override_settings(GITHUB_CLIENT_ID="client", GITHUB_CLIENT_SECRET="secret")
    @patch("integrations.views.GitHubService")
    @patch("integrations.views.requests.post")
    def test_connect_github_imports_repositories(self, post_mock, service_cls):
        post_mock.return_value.json.return_value = {"access_token": "github-token"}
        service = service_cls.return_value
        service.get_user.return_value = {
            "id": 123,
            "login": "octo",
            "html_url": "https://github.com/octo",
            "avatar_url": "https://example.com/avatar.png",
        }
        service.get_repositories.return_value = []
        service.enrich_repos.return_value = [
            {
                "github_repo_id": 10,
                "title": "portfolio",
                "description": "Repo",
                "url": "https://github.com/octo/portfolio",
                "technologies": ["Python"],
                "stars": 3,
                "forks": 1,
            }
        ]

        response = self.client.post(
            "/api/integrations/github/connect/",
            {"code": "oauth-code"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["imported_repos"], 1)
        self.assertTrue(GitHubConnection.objects.filter(user=self.user).exists())
        self.assertTrue(PortfolioProject.objects.filter(user=self.user, github_repo_id=10).exists())

    def test_get_imported_data_returns_empty_defaults(self):
        response = self.client.get("/api/integrations/data/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["connections"]["github"])
        self.assertEqual(response.json()["portfolio"], [])

    @override_settings(GITHUB_CLIENT_ID="client", GITHUB_CLIENT_SECRET="secret")
    @patch("integrations.views.requests.post")
    def test_connect_github_handles_token_failure(self, post_mock):
        post_mock.side_effect = requests.RequestException("network down")

        response = self.client.post(
            "/api/integrations/github/connect/",
            {"code": "oauth-code"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    @patch("integrations.views.GitHubService")
    def test_sync_github_updates_projects(self, service_cls):
        GitHubConnection.objects.create(
            user=self.user,
            github_id="123",
            username="octo",
            access_token="github-token",
            profile_url="https://github.com/octo",
        )
        service = service_cls.return_value
        service.get_repositories.return_value = []
        service.enrich_repos.return_value = [
            {
                "github_repo_id": 11,
                "title": "synced",
                "description": "",
                "url": "https://github.com/octo/synced",
                "technologies": [],
                "stars": 0,
                "forks": 0,
            }
        ]

        response = self.client.post("/api/integrations/github/sync/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["synced"], 1)
        self.assertTrue(PortfolioProject.objects.filter(github_repo_id=11).exists())
