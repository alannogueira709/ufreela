from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_email_verification_auth_codes"),
    ]

    operations = [
        migrations.AddField(
            model_name="freelancer",
            name="profile_title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="freelancer",
            name="primary_area",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
