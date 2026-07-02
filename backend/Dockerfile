# ========== STAGE 1: Builder (coleta estáticos) ==========
FROM python:3.12.10-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Coleta estáticos com valores dummy VÁLIDOS (ficam APENAS no builder).
# A imagem final NÃO contém essas variáveis.
# SECRET_KEY precisa ter >=50 chars. FIELD_ENCRYPTION_KEY precisa ser Fernet válida.
RUN DJANGO_SECRET_KEY=build-only-build-only-build-only-build-only-build-only-build-only \
    FIELD_ENCRYPTION_KEY=6aSBE7FD9poZOqxvEjzKVWYAOxxsjoWRyo9CqPd5y78= \
    python manage.py collectstatic --noinput

# ========== STAGE 2: Runtime (imagem final limpa) ==========
FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Copia APENAS os arquivos estáticos do builder (não as variáveis dummy!)
COPY --from=builder /app/staticfiles ./staticfiles

EXPOSE 8080

CMD exec gunicorn core.wsgi:application --bind :$PORT --workers 2 --threads 4 --timeout 0
