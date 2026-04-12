from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .services import OnboardingDTO, RegisterDTO
from .validators import digits_only, is_valid_cnpj, is_valid_cpf


class RegisterSerializer(serializers.Serializer):
    email            = serializers.EmailField()
    password         = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def to_dto(self) -> RegisterDTO:
        return RegisterDTO(**self.validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role.role_name if getattr(user, "role", None) else None
        return token

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError("E-mail ou senha invalidos.")

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class OnboardingSerializer(serializers.Serializer):
    role_id             = serializers.CharField()
    first_name          = serializers.CharField(required=False, allow_blank=True, default="")
    last_name           = serializers.CharField(required=False, allow_blank=True, default="")
    cpf                 = serializers.CharField(required=False, allow_blank=True, default="")
    company_name        = serializers.CharField(required=False, allow_blank=True, default="")
    cnpj                = serializers.CharField(required=False, allow_blank=True, default="")
    primary_area        = serializers.CharField(required=False, allow_blank=True, default="")
    profile_title       = serializers.CharField(required=False, allow_blank=True, default="")
    profile_description = serializers.CharField(required=False, allow_blank=True, default="")
    profile_image       = serializers.ImageField(required=False)

    def validate(self, attrs):
        role_id = attrs.get("role_id", "").strip()
        cpf = digits_only(attrs.get("cpf", ""))
        cnpj = digits_only(attrs.get("cnpj", ""))

        attrs["role_id"] = role_id
        attrs["cpf"] = cpf
        attrs["cnpj"] = cnpj
        attrs["first_name"] = attrs.get("first_name", "").strip()
        attrs["last_name"] = attrs.get("last_name", "").strip()
        attrs["company_name"] = attrs.get("company_name", "").strip()
        attrs["primary_area"] = attrs.get("primary_area", "").strip()
        attrs["profile_title"] = attrs.get("profile_title", "").strip()
        attrs["profile_description"] = attrs.get("profile_description", "").strip()

        if role_id == "freelancer":
            if not cpf:
                raise serializers.ValidationError({"cpf": "CPF é obrigatório para freelancers."})
            if not is_valid_cpf(cpf):
                raise serializers.ValidationError({"cpf": "CPF inválido."})

        if role_id == "publisher":
            if not cnpj:
                raise serializers.ValidationError({"cnpj": "CNPJ é obrigatório para empreendedores."})
            if not is_valid_cnpj(cnpj):
                raise serializers.ValidationError({"cnpj": "CNPJ inválido."})

        return attrs

    def to_dto(self) -> OnboardingDTO:
        return OnboardingDTO(**self.validated_data)
