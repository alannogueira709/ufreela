# ========== STAGE 1: Builder (coleta estáticos) ==========
FROM python:3.12.10-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Coleta estáticos com valores dummy (ficam APENAS no builder).
# A imagem final NÃO contém essas variáveis.
RUN DJANGO_SECRET_KEY=build-only FIELD_ENCRYPTION_KEY=build-only \
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
