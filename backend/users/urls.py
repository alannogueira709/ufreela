# users/urls.py
from django.urls import path
from .views import HealthCheckView, RegisterView

urlpatterns = [
    path("health/", HealthCheckView.as_view()),
    path("auth/register/", RegisterView.as_view(), name="auth_register")
]
