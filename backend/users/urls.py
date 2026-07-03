from django.urls import include, path

from allauth.urls import build_provider_urlpatterns

from .views import (CompleteRegistrationView, CookieTokenRefreshView,
                    CsrfTokenView, CustomTokenObtainPairView,
                    FeaturedFreelancersView, FeaturedOpportunitiesView,
                    FreelancerProfileView, FreelancerSkillsView,
                    HealthCheckView, LogoutView, PublisherProfileView,
                    RegisterView, SkillListView, SocialLoginSuccessView,
                    SocialSessionView, UserDataExportView, UserDeleteAccountView,
                    UserMeView, SaveProfileToggleView, PasswordResetRequestView,
                    PasswordResetConfirmView)

urlpatterns = [
    path("health/", HealthCheckView.as_view()),
    path("auth/csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("auth/me/", UserMeView.as_view(), name="me"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path(
        "auth/register/complete/",
        CompleteRegistrationView.as_view(),
        name="register_complete",
    ),
    path("auth/social/", include(build_provider_urlpatterns())),
    path(
        "auth/social/success/",
        SocialLoginSuccessView.as_view(),
        name="social_login_success",
    ),
    path(
        "auth/social/session/",
        SocialSessionView.as_view(),
        name="social_session",
    ),
    path("skills/", SkillListView.as_view(), name="skills_list"),
    path(
        "freelancers/me/skills/",
        FreelancerSkillsView.as_view(),
        name="freelancer_skills",
    ),
    path(
        "freelancers/featured/",
        FeaturedFreelancersView.as_view(),
        name="featured_freelancers",
    ),
    path(
        "opportunities/featured/",
        FeaturedOpportunitiesView.as_view(),
        name="featured_opportunities",
    ),
    path("profile/publisher/<str:user_id>/", PublisherProfileView.as_view(), name="publisher_profile"),
    path("profile/freelancer/<str:user_id>/", FreelancerProfileView.as_view(), name="freelancer_profile"),
    path("profile/save/<str:user_id>/", SaveProfileToggleView.as_view(), name="save_profile_toggle"),
    path("auth/password/reset/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("auth/password/reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("users/me/export/", UserDataExportView.as_view(), name="user_data_export"),
    path("users/me/delete/", UserDeleteAccountView.as_view(), name="user_delete_account"),
]
