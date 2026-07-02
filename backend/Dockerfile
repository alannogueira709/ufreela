FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Argumentos para build (não ficam na imagem final)
ARG FIELD_ENCRYPTION_KEY=""
ENV FIELD_ENCRYPTION_KEY=${FIELD_ENCRYPTION_KEY}
ARG DJANGO_SECRET_KEY=""
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}

# Coleta arquivos estáticos para o WhiteNoise servir
RUN python manage.py collectstatic --noinput

# Cloud Run exige porta 8080
ENV PORT=8080
EXPOSE 8080

# Usa gunicorn com workers baseados em CPU (Cloud Run limita CPU)
CMD exec gunicorn core.wsgi:application --bind :$PORT --workers 2 --threads 4 --timeout 0
