FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ARG DJANGO_SECRET_KEY=dummy-secret-for-build
ARG FIELD_ENCRYPTION_KEY
RUN if [ -z "$FIELD_ENCRYPTION_KEY" ]; then FIELD_ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"); fi && \
    DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY FIELD_ENCRYPTION_KEY=$FIELD_ENCRYPTION_KEY \
    python manage.py collectstatic --noinput

EXPOSE 8000

ENTRYPOINT ["sh", "-c", "sed -i 's/\r$//' /app/entrypoint.sh && exec sh /app/entrypoint.sh"]
