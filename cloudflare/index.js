/**
 * Cloudflare Worker: proxy reverso para api.ufreela.com.br
 *
 * Encaminha requisicoes HTTP/HTTPS de https://api.ufreela.com.br para o
 * backend no Google Cloud Run, mantendo Host: api.ufreela.com.br para que
 * o Django valide o hostname e defina cookies no dominio correto.
 */

const BACKEND_HOST = "ufreela-backend-324745990486.southamerica-east1.run.app";
const BACKEND_URL = `https://${BACKEND_HOST}`;
const PUBLIC_HOST = "api.ufreela.com.br";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set("Host", PUBLIC_HOST);
    headers.set("X-Forwarded-Host", url.host);
    headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

    const init = {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "manual",
    };

    try {
      const response = await fetch(targetUrl, init);
      const responseHeaders = new Headers(response.headers);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      console.error("Proxy error:", err);
      return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }
  },
};
