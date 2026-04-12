from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CompleteRegistrationView,
    CustomTokenObtainPairView,
    HealthCheckView,
    LogoutView,
    RegisterView,
    UserMeView,
)

urlpatterns = [
    path("health/",                  HealthCheckView.as_view()),
    path("auth/me/",                 UserMeView.as_view(),             name="me"),
    path("auth/register/",           RegisterView.as_view(),           name="register"),
    path("auth/login/",              CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/logout/",             LogoutView.as_view(),             name="logout"),
    path("auth/token/refresh/",      TokenRefreshView.as_view(),       name="token_refresh"),
    path("auth/register/complete/",  CompleteRegistrationView.as_view(), name="register_complete"),
]
