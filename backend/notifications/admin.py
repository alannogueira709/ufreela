from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "user", "read", "created_at")
    list_filter = ("type", "read", "created_at")
    search_fields = ("title", "message", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
