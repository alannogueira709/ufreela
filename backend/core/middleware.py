import logging
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
        allowed = getattr(settings, "CORS_ALLOWED_ORIGINS", []) or []
        return any(
            urlparse(allowed_origin).netloc == parsed.netloc
            for allowed_origin in allowed
        )
