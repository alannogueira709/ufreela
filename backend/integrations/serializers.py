from rest_framework import serializers

from .models import (
    GitHubConnection,
    ImportedEducation,
    ImportedExperience,
    LinkedInConnection,
    PortfolioProject,
)


class LinkedInConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedInConnection
        fields = ["id", "linkedin_id", "profile_url", "headline", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class GitHubConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GitHubConnection
        fields = [
            "id",
            "github_id",
            "username",
            "profile_url",
            "avatar_url",
            "repos_fetched",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ImportedEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportedEducation
        fields = [
            "id",
            "source",
            "institution",
            "degree",
            "field_of_study",
            "start_year",
            "end_year",
            "is_current",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ImportedExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportedExperience
        fields = [
            "id",
            "source",
            "company",
            "title",
            "location",
            "start_year",
            "end_year",
            "is_current",
            "description",
            "company_logo_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PortfolioProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioProject
        fields = [
            "id",
            "source",
            "title",
            "description",
            "url",
            "image_url",
            "technologies",
            "stars",
            "forks",
            "is_featured",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
