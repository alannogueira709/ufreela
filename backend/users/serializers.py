import re

from rest_framework import serializers
from django.contrib.auth import get_user_model

User =  get_user_model()

PASSWORD_REQUIREMENTS_MESSAGE = (
    "Password must have at least 8 characters, 1 uppercase letter, "
    "1 lowercase letter, and 1 special character"
)

class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password']

        extra_kwargs = {
            'password': {'write_only': True},   
            'email': {'required': True},
            'confirm_password': {'required': True},
        }
    def validate(self, data):
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        email = data.get('email')

        if (
            password
            and (
                len(password) < 8
                or not re.search(r"[A-Z]", password)
                or not re.search(r"[a-z]", password)
                or not re.search(r"[^A-Za-z0-9]", password)
            )
        ):
            raise serializers.ValidationError({
                'password': PASSWORD_REQUIREMENTS_MESSAGE
            })

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match"
            })

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': "A user with this email already exists"
            })

        data.pop('confirm_password')
        return data

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')

        user = User.objects.create_user(
            username=email,
            email=email, 
            password=password
        )
        return user
