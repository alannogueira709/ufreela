import logging
import re
from urllib.parse import urlparse

from django.conf import settings
from django.http import HttpResponseForbidden

logger = logging.getLogger("django")

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Endpoints que devem continuar funcionando sem o header X-Requested-With
# (fluxos que dependem de submit de formulario HTML ou webhooks de terceiros).
XHR_EXEMPT_PATHS = {
    "/api/billing/webhook/",
    "/api/_allauth/browser/v1/auth/provider/redirect",
}

# Endpoints onde a validacao de Origin nao pode ser aplicada porque o
# cliente legitimo nao envia Origin previsivel (webhooks) ou tem protecao
# propria (Django admin).
ORIGIN_EXEMPT_PATHS = {
    "/api/billing/webhook/",
}


class ApiSecurityMiddleware:
    """
    Reforca a protecao contra CSRF para APIs SPA.

    Em requisicoes mutating (POST, PUT, PATCH, DELETE):
    - Exige o header X-Requested-With: XMLHttpRequest, a menos que o path
      esteja em XHR_EXEMPT_PATHS. Isso bloqueia requisicoes simples de
      formulario HTML, vetor classico de CSRF.
    - Valida o header Origin ou Referer contra CORS_ALLOWED_ORIGINS,
      a menos que o path esteja em ORIGIN_EXEMPT_PATHS.

    O middleware nao substitui o CsrfViewMiddleware; atua como camada
    adicional de defesa, especialmente util quando cookies sao enviados
    cross-site (SameSite=None).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in MUTATING_METHODS:
            path = request.path

            # Soh exige X-Requested-With quando a requisicao eh identificavel
            # como cross-site (Origin/Referer de dominio diferente do host).
            # Requisicoes sem Origin (testes, server-to-server, same-site com
            # SameSite=Lax) nao precisam desse header.
            if (
                self._is_cross_site_request(request)
                and not self._is_xhr_exempt(path)
                and not self._is_xml_http_request(request)
            ):
                logger.warning(
                    "API Security: requisicao cross-site mutating sem X-Requested-With. Path=%s",
                    path,
                )
                return HttpResponseForbidden("Requisicao deve ser XMLHttpRequest.")

            if not self._is_origin_exempt(path) and not self._is_trusted_origin(request):
                logger.warning(
                    "API Security: origem nao confiavel. Path=%s Origin=%s Referer=%s",
                    path,
                    request.headers.get("Origin"),
                    request.headers.get("Referer"),
                )
                return HttpResponseForbidden("Origem nao permitida.")

        return self.get_response(request)

    def _is_xml_http_request(self, request):
        return request.headers.get("X-Requested-With") == "XMLHttpRequest"

    def _is_cross_site_request(self, request):
        """Retorna True se Origin/Referer indicar requisicao cross-site."""
        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if not origin:
            return False
        parsed = urlparse(origin)
        return parsed.netloc != request.get_host()

    def _is_xhr_exempt(self, path: str) -> bool:
        return any(path.startswith(exempt) for exempt in XHR_EXEMPT_PATHS)

    def _is_origin_exempt(self, path: str) -> bool:
        return any(path.startswith(exempt) for exempt in ORIGIN_EXEMPT_PATHS)

    def _is_trusted_origin(self, request):
        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if not origin:
            # Requisicoes sem Origin/Referer nao podem ser validadas aqui.
            # Em requisicoes cross-site reais o browser sempre envia Origin.
            # Deixamos a protecao para o CsrfViewMiddleware + SameSite.
            return True

        parsed = urlparse(origin)
        # A string normalizada "scheme://netloc" (sem path) eh usada para
        # comparacao exata contra as origens confiaveis.
        normalized_origin = f"{parsed.scheme}://{parsed.netloc}"

        # 1) CORS_ALLOWED_ORIGINS: comparacao exata de origem completa
        #    (scheme + host), e fallback de netloc para retrocompatibilidade
        #    com configuracoes legadas (apenas hostname na lista).
        for allowed_origin in getattr(settings, "CORS_ALLOWED_ORIGINS", []) or []:
            allowed_parsed = urlparse(allowed_origin)
            if not allowed_parsed.netloc:
                continue
            if (
                allowed_parsed.scheme == parsed.scheme
                and allowed_parsed.netloc == parsed.netloc
            ):
                return True
            # Fallback legado: comparar apenas o netloc.
            if allowed_parsed.netloc == parsed.netloc:
                return True

        # 2) CORS_ALLOWED_ORIGIN_REGEXES: casamento por expressao regular
        #    contra a origem normalizada, alinhado ao comportamento do
        #    django-cors-headers.
        for pattern in getattr(settings, "CORS_ALLOWED_ORIGIN_REGEXES", []) or []:
            try:
                if re.search(pattern, normalized_origin):
                    return True
            except re.error:
                logger.warning(
                    "API Security: regex invalido em CORS_ALLOWED_ORIGIN_REGEXES: %s",
                    pattern,
                )

        # 3) CSRF_TRUSTED_ORIGINS: lista canonica do Django para validar
        #    Origin em requisicoes unsafe cross-origin. Eh exatamente o
        #    conjunto que o CsrfViewMiddleware usaria logo a seguir, entao
        #    confiar nele aqui mantem o middleware consistente com o Django
        #    e evita bloqueios por divergencia de configuracao.
        for trusted in getattr(settings, "CSRF_TRUSTED_ORIGINS", []) or []:
            trusted_parsed = urlparse(trusted)
            trusted_netloc = trusted_parsed.netloc or trusted
            if trusted_parsed.scheme == parsed.scheme and (
                trusted_netloc == parsed.netloc
                # Permite entradas wildcard como https://*.ufreela.com.br
                or self._wildcard_match(trusted_netloc, parsed.netloc)
            ):
                return True

        return False

    @staticmethod
    def _wildcard_match(pattern: str, value: str) -> bool:
        """Casa um host com wildcard do tipo '*.example.com' contra um host."""
        if not pattern.startswith("*."):
            return False
        suffix = pattern[1:]  # '.example.com'
        return value.endswith(suffix) and len(value) > len(suffix)
