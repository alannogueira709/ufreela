from typing import Any

import requests
from django.conf import settings


class LinkedInService:
    BASE_URL = "https://api.linkedin.com/rest"

    def __init__(self, access_token: str):
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "LinkedIn-Version": settings.LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
        }

    def get_profile(self) -> dict[str, Any]:
        response = requests.get(
            f"{self.BASE_URL}/identityMe",
            headers=self.headers,
            params={
                "projection": "(id,firstName,lastName,profilePicture,headline,vanityName,mostRecentEducation,primaryCurrentPosition)"
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def extract_education(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        education = profile.get("mostRecentEducation")
        if not education:
            return []

        return [
            {
                "linkedin_education_id": str(education.get("id") or profile.get("id")),
                "institution": self._localized(education.get("schoolName")),
                "degree": self._localized(education.get("degreeName")),
                "field_of_study": self._localized(education.get("fieldOfStudy")),
            }
        ]

    def extract_experience(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        position = profile.get("primaryCurrentPosition")
        if not position:
            return []

        return [
            {
                "linkedin_position_id": str(position.get("id") or profile.get("id")),
                "company": self._localized(position.get("companyName")),
                "title": self._localized(position.get("title")),
                "is_current": True,
            }
        ]

    def _localized(self, value: Any) -> str:
        if not isinstance(value, dict):
            return ""

        localized = value.get("localized")
        if not isinstance(localized, dict):
            return ""

        return (
            localized.get("pt_BR")
            or localized.get("pt-BR")
            or localized.get("en_US")
            or localized.get("en-US")
            or next(iter(localized.values()), "")
        )


class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str):
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": settings.GITHUB_API_VERSION,
        }

    def get_user(self) -> dict[str, Any]:
        response = requests.get(f"{self.BASE_URL}/user", headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()

    def get_repositories(self, username: str, per_page: int = 30) -> list[dict[str, Any]]:
        response = requests.get(
            f"{self.BASE_URL}/users/{username}/repos",
            headers=self.headers,
            params={
                "sort": "updated",
                "direction": "desc",
                "per_page": per_page,
                "type": "owner",
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def get_repo_languages(self, owner: str, repo: str) -> list[str]:
        response = requests.get(
            f"{self.BASE_URL}/repos/{owner}/{repo}/languages",
            headers=self.headers,
            timeout=30,
        )
        if response.status_code == 200:
            return list(response.json().keys())
        return []

    def enrich_repos(self, repos: list[dict[str, Any]], username: str) -> list[dict[str, Any]]:
        enriched = []
        for repo in repos:
            if repo.get("fork"):
                continue

            lang = repo.get("language")
            languages = [lang] if lang else []

            enriched.append(
                {
                    "github_repo_id": repo["id"],
                    "title": repo["name"],
                    "description": repo.get("description") or "",
                    "url": repo["html_url"],
                    "technologies": languages,
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                }
            )
        return enriched
