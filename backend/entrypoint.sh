#!/bin/sh
set -e

echo "Waiting for PostgreSQL to start..."
while ! python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('db', 5432))" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL started"

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p 8000 backend.asgi:application