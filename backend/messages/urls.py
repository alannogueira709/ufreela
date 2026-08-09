from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversations'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='messages'),
    path('conversations/<int:conversation_id>/read/', views.MarkAsReadView.as_view(), name='mark-read'),
    path('conversations/<int:conversation_id>/attachments/', views.AttachmentUploadView.as_view(), name='attachment-upload'),
    path('messages/<int:message_id>/attachment/', views.AttachmentDownloadView.as_view(), name='attachment-download'),
]
