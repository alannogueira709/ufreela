# Guia Passo a Passo — Deploy do uFreela para Produção

> Ultima atualizacao: 23/06/2026
> Status: Apos as correcoes de normalizacao e hardening, falta apenas configurar secrets e deploy.

---

## 0. PREPARACAO LOCAL (Faca isso agora)

### 0.1 Commitar as mudancas de hardening
```bash
cd /home/team_alan/alan/ufreela
git add .
git status
```

Verifique que aparecem:
- `backend/core/settings.py` (django_extensions removido, email verification via env)
- `backend/requirements.txt` (django-extensions removido)
- `backend/finances/models.py` + migrations (FK opportunity)
- `backend/integrations/models.py` + migrations (unique_together)
- `backend/messages/models.py` (clean/save ordenado)
- `backend/finances/views.py` (opportunity preenchida)
- `backend/.dockerignore` (*.log adicionado)
- `frontend/freela/next.config.ts` (headers de seguranca)
- `frontend/freela/Dockerfile` (npm ci)
- `docker-compose.yml` (redis sem porta exposta)
- `backend/finances/migrations/0007_populate_transaction_opportunity.py`

```bash
git commit -m "security: hardening completo para producao

- Remove django_extensions de prod
- Adiciona headers de seguranca no frontend (CSP, HSTS, X-Frame)
- Usa npm ci em vez de npm install
- Redis nao expoe porta externa no docker-compose
- Adiciona FK opportunity em Transaction + normalizacao
- Corrige unicidade de imported education/experience por usuario
- Garante ordenacao user1/user2 em Conversation
- .dockerignore exclui logs"
```

### 0.2 Push para o GitHub
```bash
git push origin main
```

---

## 1. ROTACIONAR SECRETS (Dashboards externos)

Faca isso ANTES de configurar os GitHub Secrets, pois os valores novos precisam ser copiados para la.

### 1.1 Google OAuth (Google Cloud Console)
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no seu OAuth 2.0 Client ID
3. Aba "Credentials" -> clique no nome do client
4. Clique em **"RESET SECRET"** (ou crie um novo client e delete o antigo)
5. Copie o **novo Client Secret**

### 1.2 GitHub OAuth (GitHub Settings)
1. Acesse: https://github.com/settings/developers
2. Clique em "OAuth Apps" -> seu app uFreela
3. Clique em **"Generate a new client secret"**
4. Copie o **novo Client Secret**
5. Delete o secret antigo

### 1.3 Stripe (Stripe Dashboard)
1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Va para: Developers > API Keys
3. Clique em **"Reveal test key token"** -> **"Roll key"** (ou crie Restricted Key nova)
4. Para webhook: Developers > Webhooks -> seu endpoint -> **"Reveal"** -> **"Roll signing secret"**
5. Copie os novos `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`

### 1.4 Resend (Resend Dashboard)
1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. De um nome: "uFreela Production"
4. Selecione permissao "Sending Access"
5. Copie a **nova API Key**
6. Delete a chave antiga

### 1.5 Verificar dominio no Resend
1. Acesse: https://resend.com/domains
2. Adicione seu dominio real (ex: `ufreela.com.br`)
3. Siga as instrucoes de DNS (adicione os registros TXT na Vercel/Cloudflare)
4. Aguarde a verificacao (pode levar minutos a horas)
5. No `settings.py`, altere `RESEND_FROM_EMAIL` para um email do seu dominio:
   - Ex: `uFreela <noreply@ufreela.com.br>`

---

## 2. SUPABASE (Banco de Dados)

### 2.1 Gerar senha forte
```bash
openssl rand -base64 32
# Exemplo: ZO3Q986BKZHPSYsP3Zlgqt5iG3ojVW4SJ7GeiONtXr8=
```

### 2.2 Alterar senha no Supabase
1. Acesse: https://app.supabase.com/project/_/settings/database
2. Va em "Database Password"
3. Clique em **"Reset Password"**
4. Cole a senha gerada acima

### 2.3 Pegar a DATABASE_URL
Na mesma pagina (Settings > Database), copie a "Connection string" em formato URI:
```
postgresql://postgres:[SUA_SENHA]@db.xxxxxx.supabase.co:5432/postgres?sslmode=require
```

**Importante:** Substitua `[SUA_SENHA]` pela senha real.

Exemplo final:
```
postgresql://postgres:ZO3Q986BKZHPSYsP3Zlgqt5iG3ojVW4SJ7GeiONtXr8=@db.abc123.supabase.co:5432/postgres?sslmode=require
```

### 2.4 FIELD_ENCRYPTION_KEY (Nova)
Se quiser rotacionar (recomendado):
```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Exemplo: RwNrQg2SlsT5pcwScYETMkfXB5PxAElYWy-rVDJNCaM=
```

**AVISO:** Se mudar a FIELD_ENCRYPTION_KEY, TODOS os dados criptografados (oauth_id, cnpj, tokens OAuth) ficarao ilegiveis. So faca isso se o banco estiver vazio ou se voce tiver um script de re-criptografia.

---

## 3. UPSTASH (Redis)

### 3.1 Criar/Obter URL do Redis
1. Acesse: https://console.upstash.com
2. Crie um novo Database (ou use um existente)
3. Va em "Details" -> "Redis Connect"
4. Copie a URL no formato:
```
rediss://default:[SENHA]@seu-host.upstash.io:6379
```

**Importante:** Deve comecar com `rediss://` (dois S = TLS/SSL).

---

## 4. GITHUB SECRETS (Repositorio -> Settings -> Secrets)

Acesse: `https://github.com/seu-usuario/ufreela/settings/secrets/actions`

Clique em **"New repository secret"** para cada um:

| Secret Name | Valor | Origem |
|-------------|-------|--------|
| `DJANGO_SECRET_KEY` | `openssl rand -base64 48` | Gere localmente |
| `FIELD_ENCRYPTION_KEY` | Sua chave atual ou nova | Gere via Fernet |
| `DATABASE_URL` | `postgresql://...` | Supabase (passo 2.3) |
| `REDIS_URL` | `rediss://...` | Upstash (passo 3.1) |
| `DEBUG` | `0` | Literal |
| `ALLOWED_HOSTS` | `api.ufreela.com.br,backend` | Seu dominio da API |
| `CORS_ALLOWED_ORIGINS` | `https://ufreela.com.br` | Seu dominio do frontend |
| `CSRF_TRUSTED_ORIGINS` | `https://ufreela.com.br` | Mesmo do frontend |
| `FRONTEND_URL` | `https://ufreela.com.br` | Seu dominio do frontend |
| `ACCOUNT_EMAIL_VERIFICATION` | `mandatory` | Literal |
| `GOOGLE_CLIENT_ID` | `64131920814-...` | Google Console (nao mudou) |
| `GOOGLE_CLIENT_SECRET` | NOVO SECRET | Google Console (passo 1.1) |
| `GITHUB_CLIENT_ID` | `Ov23li...` | GitHub (nao mudou) |
| `GITHUB_CLIENT_SECRET` | NOVO SECRET | GitHub (passo 1.2) |
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` | Stripe (passo 1.3) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe (passo 1.3) |
| `STRIPE_PUBLIC_KEY` | `pk_test_...` ou `pk_live_...` | Stripe (nao e secret, mas facilite) |
| `RESEND_API_KEY` | NOVA API KEY | Resend (passo 1.4) |
| `RESEND_FROM_EMAIL` | `uFreela <noreply@ufreela.com.br>` | Seu dominio verificado |
| `AUTH_COOKIE_SECURE` | `1` | Literal |
| `SECURE_SSL_REDIRECT` | `0` | Literal (Render gerencia HTTPS) |
| `SUPABASE_S3_ENDPOINT` | `https://...` | Se usar Supabase Storage |
| `SUPABASE_ACCESS_KEY` | `...` | Se usar Supabase Storage |
| `SUPABASE_SECRET_KEY` | `...` | Se usar Supabase Storage |
| `SUPABASE_BUCKET_NAME` | `ufreela-media` | Se usar Supabase Storage |
| `RENDER_SERVICE_ID` | `srv-...` | Render Dashboard |
| `RENDER_API_KEY` | `rnd_...` | Render Dashboard (Account Settings) |
| `VERCEL_TOKEN` | `...` | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | `...` | Vercel Project Settings |
| `VERCEL_PROJECT_ID` | `...` | Vercel Project Settings |

---

## 5. RENDER (Backend)

### 5.1 Criar Web Service
1. Acesse: https://dashboard.render.com
2. New > Web Service
3. Conecte seu repo GitHub
4. Configure:
   - **Name:** `ufreela-api`
   - **Environment:** `Docker`
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile`
5. Em "Environment", adicione TODAS as variaveis do passo 4 (copie do GitHub Secrets)

### 5.2 Configurar Health Check
Render faz health check automatico em `/api/health/`.

### 5.3 Configurar Webhook do Stripe
1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://api.ufreela.com.br/api/billing/webhook/`
3. Selecione eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copie o Signing Secret e adicione ao GitHub Secret `STRIPE_WEBHOOK_SECRET`

---

## 6. VERCEL (Frontend)

### 6.1 Configurar Projeto
1. Acesse: https://vercel.com/dashboard
2. Import Project -> seu repo GitHub
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend/freela`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Em "Environment Variables", adicione:
   - `NEXT_PUBLIC_API_URL=https://api.ufreela.com.br/api`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...`

### 6.2 Configurar DNS
Na Vercel, va em Project > Settings > Domains:
1. Adicione seu dominio customizado (ex: `ufreela.com.br`)
2. Siga as instrucoes de DNS (adicione CNAME na Cloudflare/registrar)

---

## 7. TESTES POS-DEPLOY

### 7.1 Backend (Render)
```bash
curl https://api.ufreela.com.br/api/health/
# Deve retornar: {"status":"ok","database":"ok","cache":"ok"}
```

### 7.2 Frontend (Vercel)
Abra `https://ufreela.com.br` no navegador. Verifique:
- [ ] Console nao mostra erros de CORS
- [ ] Login funciona
- [ ] OAuth Google/GitHub redireciona corretamente

### 7.3 Stripe Webhook
No Stripe Dashboard, envie um evento de teste para o webhook. Verifique logs no Render.

### 7.4 Email
Faca um "Esqueci minha senha" e verifique se o email chega.

---

## 8. COMANDOS UTEIS (Docker local apos as mudancas)

### Rebuildar a imagem do backend
```bash
cd /home/team_alan/alan/ufreela
docker compose build backend
```

### Rebuildar a imagem do frontend
```bash
docker compose build frontend
```

### Rodar tudo
```bash
docker compose up -d
```

### Ver logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

## CHECKLIST FINAL (Marque conforme faz)

- [ ] Commit e push das correcoes para o GitHub
- [ ] Rotacionar Google Client Secret
- [ ] Rotacionar GitHub Client Secret
- [ ] Rotacionar Stripe Secret Key e Webhook Secret
- [ ] Criar nova API Key no Resend
- [ ] Verificar dominio no Resend
- [ ] Gerar senha forte do PostgreSQL e alterar no Supabase
- [ ] Copiar DATABASE_URL do Supabase
- [ ] Copiar REDIS_URL do Upstash
- [ ] Gerar DJANGO_SECRET_KEY
- [ ] Configurar TODOS os GitHub Secrets
- [ ] Criar Web Service no Render
- [ ] Configurar Webhook do Stripe com URL de producao
- [ ] Deploy frontend na Vercel
- [ ] Configurar DNS customizado na Vercel
- [ ] Testar health check da API
- [ ] Testar login/registro/OAuth
- [ ] Testar fluxo de pagamento (Stripe test mode)
- [ ] Testar envio de email
