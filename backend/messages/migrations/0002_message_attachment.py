from django.db import migrations, models

import core.storages
import messages.models


class Migration(migrations.Migration):

    dependencies = [
        ("messages", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="message",
            name="content",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment",
            field=models.FileField(
                blank=True,
                null=True,
                storage=core.storages.get_private_storage,
                upload_to=messages.models.get_attachment_path,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_size",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_content_type",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]
