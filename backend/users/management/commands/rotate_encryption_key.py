"""
Rotação segura da FIELD_ENCRYPTION_KEY.

Uso:
    python manage.py rotate_encryption_key --dry-run
    python manage.py rotate_encryption_key

Como funciona:
    1. Configura a variável FIELD_ENCRYPTION_KEY com DUAS chaves separadas por vírgula:
       NOVA_CHAVE,CHAVE_ANTIGA
    2. Este script lê todos os registros com campos criptografados
    3. Re-salva cada registro (forçando criptografia com a NOVA chave)
    4. Depois de executado, remova a chave antiga do secret

AVISO: Faça backup do banco antes de executar!
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from users.models import User, Publisher
from integrations.models import LinkedInConnection, GitHubConnection


class Command(BaseCommand):
    help = "Re-criptografa todos os campos criptografados com a nova FIELD_ENCRYPTION_KEY"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula a operação sem salvar alterações",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Número de registros processados por batch (padrão: 100)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        batch_size = options["batch_size"]

        self.stdout.write(self.style.WARNING("=" * 60))
        self.stdout.write(self.style.WARNING("ROTAÇÃO DE FIELD_ENCRYPTION_KEY"))
        self.stdout.write(self.style.WARNING("=" * 60))

        if dry_run:
            self.stdout.write(self.style.NOTICE("\n🧪 MODO SIMULAÇÃO (dry-run)\n"))
        else:
            self.stdout.write(self.style.WARNING("\n⚠️  MODO REAL - ALTERAÇÕES SERÃO SALVAS\n"))
            self.stdout.write("Certifique-se de que FIELD_ENCRYPTION_KEY contém "
                             "'NOVA_CHAVE,CHAVE_ANTIGA'\n\n")

        total_updated = 0

        # 1. User.oauth_id
        total_updated += self._rotate_model(
            model=User,
            encrypted_fields=["oauth_id"],
            dry_run=dry_run,
            batch_size=batch_size,
        )

        # 2. Publisher.cnpj
        total_updated += self._rotate_model(
            model=Publisher,
            encrypted_fields=["cnpj"],
            dry_run=dry_run,
            batch_size=batch_size,
        )

        # 3. LinkedInConnection (access_token, refresh_token)
        total_updated += self._rotate_model(
            model=LinkedInConnection,
            encrypted_fields=["access_token", "refresh_token"],
            dry_run=dry_run,
            batch_size=batch_size,
        )

        # 4. GitHubConnection (access_token)
        total_updated += self._rotate_model(
            model=GitHubConnection,
            encrypted_fields=["access_token"],
            dry_run=dry_run,
            batch_size=batch_size,
        )

        self.stdout.write("\n" + "=" * 60)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"✅ Simulação concluída. {total_updated} registros seriam atualizados."
            ))
            self.stdout.write("\nPara executar de verdade, rode:")
            self.stdout.write("  python manage.py rotate_encryption_key")
        else:
            self.stdout.write(self.style.SUCCESS(
                f"✅ Rotação concluída! {total_updated} registros re-criptografados."
            ))
            self.stdout.write("\nPróximos passos:")
            self.stdout.write("1. Verifique se os dados estão acessíveis normalmente")
            self.stdout.write("2. Atualize o secret FIELD_ENCRYPTION_KEY para conter apenas a NOVA chave")
            self.stdout.write("3. Faça um novo deploy do backend")
        self.stdout.write("=" * 60)

    def _rotate_model(self, model, encrypted_fields, dry_run, batch_size):
        """Re-criptografa todos os registros de um modelo."""
        model_name = model.__name__
        queryset = model.objects.all()
        total = queryset.count()

        if total == 0:
            self.stdout.write(f"  ⏭️  {model_name}: nenhum registro encontrado")
            return 0

        self.stdout.write(f"\n🔐 {model_name} ({total} registros)")
        self.stdout.write(f"   Campos: {', '.join(encrypted_fields)}")

        updated = 0
        errors = 0

        if dry_run:
            # Apenas conta registros que possuem dados criptografados
            for obj in queryset.iterator():
                has_data = any(getattr(obj, f, None) for f in encrypted_fields)
                if has_data:
                    updated += 1
            self.stdout.write(f"   📊 {updated} registros com dados criptografados")
            return updated

        # Modo real: re-salva em batches
        with transaction.atomic():
            for obj in queryset.iterator():
                try:
                    # Força o Django a re-criptografar os campos
                    # Salvando com force_update=False (INSERT/UPDATE normal)
                    obj.save(update_fields=encrypted_fields)
                    updated += 1

                    if updated % batch_size == 0:
                        self.stdout.write(f"   🔄 {updated}/{total} processados...")

                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(
                        f"   ❌ Erro no registro {obj.pk}: {e}"
                    ))

        self.stdout.write(f"   ✅ {updated} re-criptografados")
        if errors:
            self.stdout.write(self.style.ERROR(f"   ❌ {errors} erros"))

        return updated
