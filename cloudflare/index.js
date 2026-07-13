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

      // Copia todos os headers EXCETO Set-Cookie, que precisa de tratamento
      // especial. O construtor new Headers() combina multiplos Set-Cookie
      // em um unico header separado por virgula, que o browser interpreta como
      // apenas um cookie invalido -- isso descarta os cookies JWT e de sessao
      // que o Django envia no /api/auth/social/session/, quebrando o fluxo
      // OAuth.
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") {
          responseHeaders.set(key, value);
        }
      });

      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

      // getSetCookie() e a API da Fetch para ler todos os Set-Cookie como
      // array, preservando cada cookie individualmente. Append no headers da
      // Response (mutavel em Cloudflare Workers) garante que o browser veja
      // todos os cookies separados e os armazene corretamente.
      const setCookies = response.headers.getSetCookie?.() ?? [];
      for (const cookie of setCookies) {
        newResponse.headers.append("Set-Cookie", cookie);
      }

      return newResponse;
    } catch (err) {
      console.error("Proxy error:", err);
      return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }
  },
};
