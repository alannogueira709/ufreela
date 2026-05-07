from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(_request):
    return JsonResponse(
        {
            "message": "Freela API",
            "endpoints": {
                "health": "/api/health/",
                "auth": "/api/auth/",
                "jobs": "/api/opportunities/",
            },
        }
    )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/chat/", include("messages.urls")),
    path("api/", api_root, name="api_root"),
    path("api/settings/", include("settings_app.urls")),
    path("api/integrations/", include("integrations.urls")),
    path("api/billing/", include("finances.urls")),
    path("api/", include("jobs.urls")),
    path("api/", include("users.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
