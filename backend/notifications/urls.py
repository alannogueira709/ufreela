from django.urls import path

from .views import (
    NotificationDeleteView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("read-all/", NotificationMarkAllReadView.as_view(), name="notification-read-all"),
    path("<uuid:notification_id>/read/", NotificationMarkReadView.as_view(), name="notification-read"),
    path("<uuid:notification_id>/", NotificationDeleteView.as_view(), name="notification-delete"),
]
