from django.urls import path

from . import views


urlpatterns = [
    path("linkedin/connect/", views.connect_linkedin, name="linkedin-connect"),
    path("github/connect/", views.connect_github, name="github-connect"),
    path("data/", views.get_imported_data, name="imported-data"),
    path("github/sync/", views.sync_github, name="github-sync"),
    path("linkedin/disconnect/", views.disconnect_linkedin, name="linkedin-disconnect"),
    path("github/disconnect/", views.disconnect_github, name="github-disconnect"),
]
