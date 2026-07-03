# Manual migration: popula Transaction.opportunity a partir de job_id legado.
from django.db import migrations


def forwards(apps, schema_editor):
    Transaction = apps.get_model("finances", "Transaction")
    Opportunity = apps.get_model("jobs", "Opportunity")

    for tx in Transaction.objects.filter(opportunity__isnull=True).exclude(job_id="").exclude(job_id__isnull=True):
        try:
            opp = Opportunity.objects.get(pk=int(tx.job_id))
            tx.opportunity = opp
            tx.save(update_fields=["opportunity"])
        except (ValueError, Opportunity.DoesNotExist):
            # job_id inválido ou oportunidade removida — deixa nulo
            pass


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("finances", "0006_transaction_opportunity_alter_transaction_job_id"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
