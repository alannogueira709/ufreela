from django.db import migrations


def seed_roles(apps, schema_editor):
    """Garante que as roles padrao existam em qualquer banco.

    O backend consulta a role SEMPRE pelo nome (RoleRepository.get_by_name),
    entao as linhas precisam existir com role_name exato. Sem este seed,
    bancos novos/resetados ficam vazios e o onboarding falha com
    "Role 'freelancer' nao encontrada."
    """
    Role = apps.get_model("users", "Role")
    Role.objects.get_or_create(role_name="freelancer")
    Role.objects.get_or_create(role_name="publisher")


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_alter_user_profile_img_savedprofile"),
    ]

    operations = [
        # Reverse intencionalmente vazio: remover roles quebraria usuarios
        # que ja referenciam a FK.
        migrations.RunPython(seed_roles, migrations.RunPython.noop),
    ]
