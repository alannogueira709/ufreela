# Proxy Cloudflare para api.ufreela.com.br

Como o Google Cloud Run na regiao `southamerica-east1` nao permite mapear
 dominios customizados sem Load Balancer (pago) ou mudanca de regiao, usamos
 um **Cloudflare Worker** como proxy reverto gratuito.

## O que esse Worker faz

- Recebe requisicoes em `https://api.ufreela.com.br/*`
- Encaminha para `https://ufreela-backend-324745990486.southamerica-east1.run.app/*`
- Forca o header `Host: api.ufreela.com.br` para que o Django valide o hostname
e defina cookies para o dominio correto.
- Suporta HTTP/HTTPS e WebSocket.

## Configuracao no Cloudflare

### 1. Criar o registro DNS

No Cloudflare Dashboard, va em **DNS > Records**:

| Type | Name | Target | Proxy |
|---|---|---|---|
| AAAA | api | `100::` | Proxied (nuvem laranja) |

O endereco `100::` e um dummy. O Worker interceptara a requisicao antes dele.

### 2. Criar o Worker

1. Va em **Workers & Pages > Create application > Create Worker**
2. De um nome, por exemplo: `ufreela-api-proxy`
3. Cole o conteudo de `api-proxy-worker.js`
4. Clique em **Deploy**

### 3. Vincular o Worker a rota

1. Na pagina do Worker, va em **Triggers > Custom Domains > Add Custom Domain**
2. Digite: `api.ufreela.com.br`
3. Salve

Ou, alternativamente, via **Routes**:

1. Va em **Triggers > Routes > Add route**
2. Route: `api.ufreela.com.br/*`
3. Zone: seu dominio `ufreela.com.br`
4. Service: `ufreela-api-proxy`
5. Salve

### 4. Testar

```bash
curl -I https://api.ufreela.com.br/api/health/
curl -I -H "Origin: https://www.ufreela.com.br" \
  https://api.ufreela.com.br/api/opportunities/
```

## Observacoes importantes

- O plano gratuito do Cloudflare Workers permite **100.000 requisicoes/dia**.
  Se o trafego for maior, sera necessario um plano pago.
- WebSockets funcionam, mas consomem mais recursos do Worker.
- O backend ja deve ter `api.ufreela.com.br` em `ALLOWED_HOSTS` (configurado no
  `deploy_backend.yml`).
