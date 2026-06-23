#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

PORT="${PORT:-8000}"
echo "Starting Daphne ASGI server on port $PORT..."
exec daphne -b 0.0.0.0 -p "$PORT" core.asgi:application
