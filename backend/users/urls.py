from django.urls import include, path

from .views import (CompleteRegistrationView, CookieTokenRefreshView,
                    CsrfTokenView, CustomTokenObtainPairView,
                    FeaturedFreelancersView, FeaturedOpportunitiesView,
                    FreelancerProfileView, FreelancerSkillsView,
                    HealthCheckView, LogoutView, PublisherProfileView,
                    RegisterView, SkillListView, SocialLoginSuccessView,
                    UserMeView)

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
    path("auth/social/", include("allauth.urls")),
    path(
        "auth/social/success/",
        SocialLoginSuccessView.as_view(),
        name="social_login_success",
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
    path("profile/freelancer/<str:user_id>/", FreelancerProfileView.as_view(), name="freelancer_profile")
]
