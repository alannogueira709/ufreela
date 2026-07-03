from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("finances", "0004_stripeaccount_paymentmethod_transaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="contract",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="contract",
            name="escrow_released_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="contract",
            name="freelancer_completion_approved",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="contract",
            name="publisher_completion_approved",
            field=models.BooleanField(default=False),
        ),
    ]
