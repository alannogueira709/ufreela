"""
Diagnóstico da conexão de banco do backend.

Uso:
    python manage.py diag_db

Imprime host, database e usuário que o Django está usando de fato
(os valores resolvidos do DATABASE_URL/secrets no ambiente onde roda),
e testa a busca de roles pelo nome — mesmo caminho do onboarding
(RoleRepository.get_by_name). Serve para confirmar se o serviço
enxerga o mesmo banco inspecionado no dashboard do Supabase.
"""

from django.core.management.base import BaseCommand
from django.db import connection

from users.models import Role
from users.repositories import RoleRepository


class Command(BaseCommand):
    help = "Mostra host/db/usuário da conexão ativa e testa o lookup de roles"

    def handle(self, *args, **options):
        cfg = connection.settings_dict
        self.stdout.write(f"HOST: {cfg.get('HOST')}")
        self.stdout.write(f"PORT: {cfg.get('PORT')}")
        self.stdout.write(f"NAME (database): {cfg.get('NAME')}")
        self.stdout.write(f"USER: {cfg.get('USER')}")

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT current_user, current_database(), "
                "current_setting('search_path'), "
                "current_setting('server_version')"
            )
            user, db, search_path, version = cursor.fetchone()
            self.stdout.write(f"current_user: {user}")
            self.stdout.write(f"current_database: {db}")
            self.stdout.write(f"search_path: {search_path}")
            self.stdout.write(f"server_version: {version}")

            cursor.execute(
                "SELECT rolname, rolbypassrls FROM pg_roles "
                "WHERE rolname = current_user"
            )
            row = cursor.fetchone()
            if row:
                self.stdout.write(f"bypass_rls: {row[1]}")

            cursor.execute(
                "SELECT relrowsecurity FROM pg_class "
                "WHERE relname = 'users_role' AND relnamespace = 'public'::regnamespace"
            )
            row = cursor.fetchone()
            if row:
                self.stdout.write(f"users_role RLS habilitado: {row[0]}")

        self.stdout.write("\nRoles visíveis pelo ORM:")
        for role in Role.objects.all():
            self.stdout.write(f"  ({role.role_id}, {role.role_name!r})")

        for name in ("freelancer", "publisher"):
            try:
                role = RoleRepository.get_by_name(name)
                self.stdout.write(self.style.SUCCESS(f"get_by_name({name!r}) -> OK (id={role.role_id})"))
            except ValueError as e:
                self.stdout.write(self.style.ERROR(f"get_by_name({name!r}) -> FALHOU: {e}"))
