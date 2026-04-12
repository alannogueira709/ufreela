from django.db import migrations


def seed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")

    for role_name in ("freelancer", "publisher"):
        Role.objects.get_or_create(role_name=role_name)


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    Role.objects.filter(role_name__in=("freelancer", "publisher")).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]
