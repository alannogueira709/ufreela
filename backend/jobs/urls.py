from django.urls import path

from .views import (
    CategoryListView,
    FreelancerProposalListView,
    OpportunityDetailView,
    OpportunityListCreateView,
    OpportunityProposalCreateView,
    ProposalDetailUpdateView,
    PublisherProposalListView,
    SkillListView,
    SaveOpportunityToggleView,
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
    path(
        "opportunities/<int:opportunity_id>/proposals/",
        OpportunityProposalCreateView.as_view(),
        name="opportunity_proposals",
    ),
    path(
        "freelancers/me/proposals/",
        FreelancerProposalListView.as_view(),
        name="freelancer_proposals",
    ),
    path(
        "publishers/me/proposals/",
        PublisherProposalListView.as_view(),
        name="publisher_proposals",
    ),
    path(
        "proposals/<int:proposal_id>/",
        ProposalDetailUpdateView.as_view(),
        name="proposal_detail_update",
    ),
    path(
        "opportunities/save/<int:opportunity_id>/",
        SaveOpportunityToggleView.as_view(),
        name="save_opportunity_toggle",
    ),
]
