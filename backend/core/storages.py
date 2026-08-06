"""
Backends de storage para o Supabase (S3-compatible).

Dois buckets com propositos distintos:

- ``SupabasePublicStorage`` (STORAGES["default"]): bucket publico
  (SUPABASE_PUBLIC_BUCKET) — imagens publicas como avatar e portfolio.
  URLs publicas estaveis, sem assinatura. Requer o bucket marcado como
  "Public" no dashboard do Supabase.

- ``SupabasePrivateStorage`` (STORAGES["private"]): bucket privado
  (SUPABASE_PRIVATE_BUCKET) — anexos de conversas e documentos sensiveis
  (LGPD). ``url()`` gera URLs assinadas temporarias; o bucket NAO pode ser
  publico. A autorizacao (ex: usuario participa da conversa) deve ser
  checada na view ANTES de gerar a URL assinada — o storage em si nao
  faz controle de acesso.

Uso em models (campo explicito, serializacao limpa em migrations):

    from core.storages import get_private_storage

    class Message(models.Model):
        ...
        attachment = models.FileField(
            upload_to=get_attachment_path,
            storage=get_private_storage,
        )

Uso em views (download autorizado de anexo):

    url = storages["private"].url(message.attachment.name)  # URL assinada
"""

from django.conf import settings
from django.core.files.storage import storages
from storages.backends.s3boto3 import S3Boto3Storage


class SupabasePublicStorage(S3Boto3Storage):
    """Bucket publico: URLs estaveis no formato publico do Supabase."""

    bucket_name = settings.SUPABASE_PUBLIC_BUCKET
    querystring_auth = False
    file_overwrite = False
    # https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<key>
    custom_domain = (
        f"{settings.SUPABASE_S3_HOST}"
        f"/storage/v1/object/public/{settings.SUPABASE_PUBLIC_BUCKET}"
    )


class SupabasePrivateStorage(S3Boto3Storage):
    """Bucket privado: URLs assinadas que expiram (padrao LGPD)."""

    bucket_name = settings.SUPABASE_PRIVATE_BUCKET
    querystring_auth = True
    querystring_expire = 600  # URL assinada valida por 10 minutos
    file_overwrite = False


def get_public_storage():
    """Retorna o storage publico (alias "default").

    Passado como callable para campos de model (``storage=get_public_storage``),
    mantendo a serializacao em migrations como referencia estavel.
    """
    return storages["default"]


def get_private_storage():
    """Retorna o storage privado (alias "private").

    Resolve via STORAGES, entao em dev local cai no FileSystemStorage
    configurado no settings (sem necessidade das chaves S3).
    """
    return storages["private"]
