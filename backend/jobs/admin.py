from django.contrib import admin
from .models import Category, Skill, FreelancerSkill, Opportunity, Proposal

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("category_name", "category_slug")
	search_fields = ("category_name",)

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
	list_display = ("skill_name", "category")
	list_filter = ("category",)
	search_fields = ("skill_name",)

@admin.register(FreelancerSkill)
class FreelancerSkillAdmin(admin.ModelAdmin):
	list_display = ("freelancer", "skill", "skill_level")
	list_filter = ("skill_level", "skill__category")
	search_fields = ("freelancer__user_id__email", "skill__skill_name")

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("title", "publisher", "status", "created_at")
    list_filter = ("status", "xp_level", "work_modality")
    search_fields = ("title", "publisher__company_name")

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ("proposal_id", "opportunity", "freelancer", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("opportunity__title", "freelancer__user_id__email")
