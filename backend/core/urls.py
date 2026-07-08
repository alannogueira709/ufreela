from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def api_root(_request):
    return JsonResponse(
        {
            "message": "Freela API",
            "endpoints": {
                "health": "/api/health/",
                "auth": "/api/auth/",
                "jobs": "/api/opportunities/",
                "notifications": "/api/notifications/",
            },
        }
    )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/chat/", include("messages.urls")),
    path("api/", api_root, name="api_root"),
    path("api/settings/", include("settings_app.urls")),
    path("api/integrations/", include("integrations.urls")),
    path("api/billing/", include("finances.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/", include("jobs.urls")),
    path("api/", include("users.urls")),
    path("api/_allauth/", include("allauth.headless.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += staticfiles_urlpatterns()
