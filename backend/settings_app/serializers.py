from rest_framework import serializers

from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            "id",
            "theme",
            "compact_mode",
            "email_notifications",
            "push_notifications",
            "marketing_emails",
            "profile_visible",
            "show_activity_status",
            "language",
            "timezone",
            "two_factor_enabled",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

