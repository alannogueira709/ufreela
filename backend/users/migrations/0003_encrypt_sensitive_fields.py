from django.db import migrations
import encrypted_model_fields.fields


def reencrypt_sensitive_fields(apps, schema_editor):
    User = apps.get_model("users", "User")
    Publisher = apps.get_model("users", "Publisher")

    for user in User.objects.exclude(oauth_id="").iterator():
        current_value = user.oauth_id
        user.oauth_id = current_value
        user.save(update_fields=["oauth_id"])

    for publisher in Publisher.objects.exclude(cnpj="").iterator():
        current_value = publisher.cnpj
        publisher.cnpj = current_value
        publisher.save(update_fields=["cnpj"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_seed_roles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="oauth_id",
            field=encrypted_model_fields.fields.EncryptedCharField(blank=True, max_length=200),
        ),
        migrations.AlterField(
            model_name="publisher",
            name="cnpj",
            field=encrypted_model_fields.fields.EncryptedCharField(blank=True, max_length=18),
        ),
        migrations.RunPython(reencrypt_sensitive_fields, migrations.RunPython.noop),
    ]
