/**
 * Cloudflare Worker: proxy reverso para api.ufreela.com.br
 *
 * Esse worker encaminha todas as requisicoes de https://api.ufreela.com.br
 * para o backend hospedado no Google Cloud Run, mantendo o header Host como
 * api.ufreela.com.br. Isso faz com que o Django sete cookies para o dominio
 * correto e permita o uso de SameSite=Lax.
 *
 * Como usar:
 * 1. No Cloudflare Dashboard, va em Workers & Pages > Create application > Create Worker
 * 2. Cole o codigo abaixo no editor
 * 3. Vincule o worker a rota: api.ufreela.com.br/*
 * 4. Teste: curl -I https://api.ufreela.com.br/api/health/
 */

const BACKEND_HOST = "ufreela-backend-324745990486.southamerica-east1.run.app";
const BACKEND_URL = `https://${BACKEND_HOST}`;
const PUBLIC_HOST = "api.ufreela.com.br";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // WebSocket: tenta fazer upgrade direto para o backend.
    const upgrade = request.headers.get("Upgrade");
    if (upgrade && upgrade.toLowerCase() === "websocket") {
      return handleWebSocket(request, url);
    }

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

async function handleWebSocket(request, url) {
  try {
    const targetWsUrl = `wss://${BACKEND_HOST}${url.pathname}${url.search}`;
    const [client, server] = Object.values(new WebSocketPair());

    const backendWs = new WebSocket(targetWsUrl, [], {
      headers: {
        Host: PUBLIC_HOST,
        Origin: `https://${PUBLIC_HOST}`,
      },
    });

    backendWs.addEventListener("open", () => {
      server.accept();

      server.addEventListener("message", (event) => {
        if (backendWs.readyState === WebSocket.READY_STATE_OPEN) {
          backendWs.send(event.data);
        }
      });

      backendWs.addEventListener("message", (event) => {
        if (server.readyState === WebSocket.READY_STATE_OPEN) {
          server.send(event.data);
        }
      });

      server.addEventListener("close", () => backendWs.close());
      backendWs.addEventListener("close", () => server.close());
    });

    backendWs.addEventListener("error", (err) => {
      console.error("Backend WS error:", err);
      server.close();
    });

    return new Response(null, { status: 101, webSocket: client });
  } catch (err) {
    console.error("WebSocket proxy error:", err);
    return new Response(`WebSocket proxy error: ${err.message}`, { status: 502 });
  }
}
