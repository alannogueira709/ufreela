# Proxy Cloudflare para api.ufreela.com.br

Como o Google Cloud Run na regiao `southamerica-east1` nao permite mapear
dominios customizados sem Load Balancer (pago) ou mudanca de regiao, usamos
um **Cloudflare Worker** como proxy reverso gratuito.

## O que esse Worker faz

- Recebe requisicoes em `https://api.ufreela.com.br/*`
- Encaminha para `https://ufreela-backend-324745990486.southamerica-east1.run.app/*`
- Forca o header `Host: api.ufreela.com.br` para que o Django valide o hostname
e defina cookies para o dominio correto.
- Funciona para HTTP/HTTPS. WebSockets devem conectar diretamente ao backend
via `wss://ufreela-backend-324745990486.southamerica-east1.run.app/ws/...`.

## Requisitos

- Node.js 18+
- Conta Cloudflare com acesso ao dominio `ufreela.com.br`

## Instalacao

### 1. Instalar o Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Autenticar no Cloudflare

```bash
wrangler login
```

### 3. Configurar o DNS

No Cloudflare Dashboard, va em **DNS > Records**:

| Type | Name | Target | Proxy |
|---|---|---|---|
| AAAA | api | `100::` | Proxied (nuvem laranja) |

O endereco `100::` e um dummy. O Worker interceptara a requisicao antes dele.

### 4. Fazer deploy

A partir desta pasta (`cloudflare/`):

```bash
cd cloudflare
wrangler deploy
```

O `wrangler.toml` ja esta configurado para criar o dominio customizado
`api.ufreela.com.br` automaticamente.

### 5. Testar

```bash
curl -I https://api.ufreela.com.br/api/health/
curl -I -H "Origin: https://www.ufreela.com.br" \
  https://api.ufreela.com.br/api/opportunities/
```

## Observacoes importantes

- O plano gratuito do Cloudflare Workers permite **100.000 requisicoes/dia**.
  Se o trafego for maior, sera necessario um plano pago.
- WebSockets nao sao suportados por este proxy. Use a URL direta do Cloud Run
  para conexoes WebSocket.
- O backend ja deve ter `api.ufreela.com.br` em `ALLOWED_HOSTS` (configurado no
  `deploy_backend.yml`).

## Arquivos

- `index.js` — codigo do Worker
- `wrangler.toml` — configuracao de deploy
