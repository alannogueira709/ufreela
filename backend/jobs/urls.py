from django.urls import path

from .views import (
    CategoryListView,
    OpportunityDetailView,
    OpportunityListCreateView,
    SkillListView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="categories_list"),
    path("skills/", SkillListView.as_view(), name="skills_list"),
    path("opportunities/", OpportunityListCreateView.as_view(), name="opportunities"),
    path(
        "opportunities/<int:opportunity_id>/",
        OpportunityDetailView.as_view(),
        name="opportunity_detail",
    ),
]
