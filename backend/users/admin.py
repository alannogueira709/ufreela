from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Freelancer, Publisher, Role, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
	model = User
	list_display = ("email", "username", "is_staff", "is_active", "role")
	list_filter = ("is_staff", "is_active", "role")
	ordering = ("email",)

	fieldsets = (
		(None, {"fields": ("email", "username", "password")}),
		(
			"Informacoes pessoais",
			{"fields": ("name", "last_name", "role", "oauth_id", "profile_img")},
		),
		("Permissoes", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
		("Datas importantes", {"fields": ("last_login", "date_joined")}),
	)

	add_fieldsets = (
		(
			None,
			{
				"classes": ("wide",),
				"fields": ("email", "username", "password1", "password2", "is_staff", "is_active"),
			},
		),
	)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
	list_display = ("role_id", "role_name")
	search_fields = ("role_name",)


@admin.register(Freelancer)
class FreelancerAdmin(admin.ModelAdmin):
	list_display = ("user_id", "professional_level", "finished_jobs", "mean_eval")
	list_filter = ("professional_level",)
	search_fields = ("user_id__email", "user_id__username")


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
	list_display = ("user_id", "company_name", "cnpj", "mean_eval")
	search_fields = ("user_id__email", "user_id__username", "company_name", "cnpj")
