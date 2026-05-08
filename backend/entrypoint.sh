#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until python -c "
import psycopg, os, sys
try:
    psycopg.connect(
        host=os.environ.get('DB_HOST','db'),
        port=os.environ.get('DB_PORT','5432'),
        dbname=os.environ.get('DB_NAME','postgres'),
        user=os.environ.get('DB_USER','postgres'),
        password=os.environ.get('DB_PASSWORD','postgres'),
        connect_timeout=1,
    ).close()
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p 8000 core.asgi:application