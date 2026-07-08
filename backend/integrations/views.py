from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    GitHubConnection,
    ImportedEducation,
    ImportedExperience,
    LinkedInConnection,
    PortfolioProject,
)
from .serializers import (
    GitHubConnectionSerializer,
    ImportedEducationSerializer,
    ImportedExperienceSerializer,
    LinkedInConnectionSerializer,
    PortfolioProjectSerializer,
)
from .services import GitHubService, LinkedInService


def _missing_oauth_settings(*names: str) -> list[str]:
    return [name for name in names if not getattr(settings, name, None)]


def _validate_redirect_uri(redirect_uri: str) -> bool:
    """S permite redirect_uri que inicie com o FRONTEND_URL configurado."""
    if not redirect_uri:
        return False
    frontend_url = getattr(settings, "FRONTEND_URL", "")
    return bool(frontend_url and redirect_uri.startswith(frontend_url))


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def connect_linkedin(request):
    missing = _missing_oauth_settings("LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET")
    if missing:
        return Response({"error": f"Missing settings: {', '.join(missing)}"}, status=500)

    code = request.data.get("code")
    redirect_uri = request.data.get("redirect_uri")
    if not code or not redirect_uri:
        return Response({"error": "code and redirect_uri are required"}, status=400)

    if not _validate_redirect_uri(redirect_uri):
        return Response({"error": "redirect_uri not allowed"}, status=400)

    try:
        token_res = requests.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
            timeout=30,
        )
        token_res.raise_for_status()
        token_data = token_res.json()
    except requests.RequestException:
        return Response({"error": "LinkedIn token request failed"}, status=400)
    except ValueError:
        return Response({"error": "LinkedIn token response was invalid"}, status=400)

    if "access_token" not in token_data:
        return Response({"error": "Failed to obtain access token"}, status=400)

    service = LinkedInService(token_data["access_token"])
    try:
        profile = service.get_profile()
    except requests.RequestException:
        return Response({"error": "Failed to fetch LinkedIn profile"}, status=400)

    linkedin_id = profile.get("id")
    if not linkedin_id:
        return Response({"error": "LinkedIn profile did not include an id"}, status=400)

    # Impede que um usuario se aproprie da conexao LinkedIn de outro usuario.
    existing = LinkedInConnection.objects.filter(
        linkedin_id=linkedin_id
    ).exclude(user=request.user).first()
    if existing:
        return Response(
            {"error": "Esta conta do LinkedIn ja esta vinculada a outro usuario."},
            status=status.HTTP_409_CONFLICT,
        )

    expires_in = token_data.get("expires_in", 5184000)
    connection, _ = LinkedInConnection.objects.update_or_create(
        user=request.user,
        linkedin_id=linkedin_id,
        defaults={
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": timezone.now() + timedelta(seconds=expires_in),
            "profile_url": f"https://linkedin.com/in/{profile.get('vanityName', '')}",
            "headline": LinkedInService(token_data["access_token"])._localized(profile.get("headline")),
            "is_active": True,
        },
    )

    for education in service.extract_education(profile):
        ImportedEducation.objects.update_or_create(
            user=request.user,
            linkedin_education_id=education["linkedin_education_id"],
            defaults={"source": "linkedin", **education},
        )

    for experience in service.extract_experience(profile):
        ImportedExperience.objects.update_or_create(
            user=request.user,
            linkedin_position_id=experience["linkedin_position_id"],
            defaults={"source": "linkedin", **experience},
        )

    return Response(LinkedInConnectionSerializer(connection).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def connect_github(request):
    missing = _missing_oauth_settings("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
    if missing:
        return Response({"error": f"Missing settings: {', '.join(missing)}"}, status=500)

    code = request.data.get("code")
    if not code:
        return Response({"error": "code is required"}, status=400)

    try:
        token_res = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=30,
        )
        token_res.raise_for_status()
        token_data = token_res.json()
    except requests.RequestException:
        return Response({"error": "GitHub token request failed"}, status=400)
    except ValueError:
        return Response({"error": "GitHub token response was invalid"}, status=400)

    if "access_token" not in token_data:
        return Response({"error": "Failed to obtain access token"}, status=400)

    service = GitHubService(token_data["access_token"])
    try:
        github_user = service.get_user()
    except requests.RequestException:
        return Response({"error": "Failed to fetch GitHub user"}, status=400)

    github_id = str(github_user["id"])

    # Impede que um usuario se aproprie da conexao GitHub de outro usuario.
    existing = GitHubConnection.objects.filter(
        github_id=github_id
    ).exclude(user=request.user).first()
    if existing:
        return Response(
            {"error": "Esta conta do GitHub ja esta vinculada a outro usuario."},
            status=status.HTTP_409_CONFLICT,
        )

    connection, _ = GitHubConnection.objects.update_or_create(
        user=request.user,
        github_id=github_id,
        defaults={
            "username": github_user["login"],
            "access_token": token_data["access_token"],
            "profile_url": github_user["html_url"],
            "avatar_url": github_user.get("avatar_url"),
            "is_active": True,
        },
    )

    try:
        imported_count = _sync_github_projects(request.user, connection, per_page=20)
    except requests.RequestException:
        return Response({"error": "Failed to sync GitHub repositories"}, status=400)

    return Response(
        {
            "connection": GitHubConnectionSerializer(connection).data,
            "imported_repos": imported_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_imported_data(request):
    user = request.user
    linkedin = getattr(user, "linkedin", None)
    github = getattr(user, "github", None)

    return Response(
        {
            "connections": {
                "linkedin": LinkedInConnectionSerializer(linkedin).data
                if linkedin and linkedin.is_active
                else None,
                "github": GitHubConnectionSerializer(github).data
                if github and github.is_active
                else None,
            },
            "education": ImportedEducationSerializer(user.education.all(), many=True).data,
            "experience": ImportedExperienceSerializer(user.experience.all(), many=True).data,
            "portfolio": PortfolioProjectSerializer(user.portfolio_projects.all(), many=True).data,
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def sync_github(request):
    try:
        connection = request.user.github
    except GitHubConnection.DoesNotExist:
        return Response({"error": "GitHub not connected"}, status=400)

    try:
        synced = _sync_github_projects(request.user, connection, per_page=30)
    except requests.RequestException:
        return Response({"error": "Failed to sync GitHub repositories"}, status=400)

    return Response({"synced": synced})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def disconnect_linkedin(request):
    try:
        connection = request.user.linkedin
    except LinkedInConnection.DoesNotExist:
        return Response({"error": "Not connected"}, status=400)

    connection.is_active = False
    connection.save(update_fields=["is_active", "updated_at"])
    return Response({"status": "disconnected"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def disconnect_github(request):
    try:
        connection = request.user.github
    except GitHubConnection.DoesNotExist:
        return Response({"error": "Not connected"}, status=400)

    connection.is_active = False
    connection.save(update_fields=["is_active", "updated_at"])
    return Response({"status": "disconnected"})


def _sync_github_projects(user, connection: GitHubConnection, per_page: int) -> int:
    service = GitHubService(connection.access_token)
    repos = service.get_repositories(connection.username, per_page=per_page)
    enriched = service.enrich_repos(repos, connection.username)

    with transaction.atomic():
        for repo in enriched:
            PortfolioProject.objects.update_or_create(
                user=user,
                github_repo_id=repo["github_repo_id"],
                defaults={"source": "github", **repo},
            )
        connection.repos_fetched = len(enriched)
        connection.save(update_fields=["repos_fetched", "updated_at"])

    return len(enriched)
