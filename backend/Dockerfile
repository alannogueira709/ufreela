FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Coleta arquivos estáticos usando valores dummy temporários.
# As chaves reais são injetadas pelo Secret Manager em runtime.
# Usa variáveis inline (não persistem na imagem) para evitar
# que valores sensíveis fiquem nas camadas do Docker.
# Usa chaves dummy com formato válido apenas para o collectstatic.
# As chaves reais são injetadas pelo Secret Manager em runtime.
RUN DJANGO_SECRET_KEY=build-only-secret-key-12345 FIELD_ENCRYPTION_KEY=6aSBE7FD9poZOqxvEjzKVWYAOxxsjoWRyo9CqPd5y78= \
    python manage.py collectstatic --noinput

# Cloud Run exige porta 8080
ENV PORT=8080
EXPOSE 8080

# Usa gunicorn com workers baseados em CPU (Cloud Run limita CPU)
CMD exec gunicorn core.wsgi:application --bind :$PORT --workers 2 --threads 4 --timeout 0
