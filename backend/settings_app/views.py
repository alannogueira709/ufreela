from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import UserSettings
from .serializers import UserSettingsSerializer


class UserSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj

    def get(self, request):
        return Response(UserSettingsSerializer(self.get_object()).data)

    def patch(self, request):
        serializer = UserSettingsSerializer(
            self.get_object(),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

