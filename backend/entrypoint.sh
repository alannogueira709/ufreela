#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until python -c "
import os, sys, psycopg

def get_conninfo():
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        return database_url
    return (
        f'host={os.environ.get(\"DB_HOST\",\"db\")} '
        f'port={os.environ.get(\"DB_PORT\",\"5432\")} '
        f'dbname={os.environ.get(\"DB_NAME\",\"\")} '
        f'user={os.environ.get(\"DB_USER\",\"\")} '
        f'password={os.environ.get(\"DB_PASSWORD\",\"\")} '
        'connect_timeout=1'
    )

try:
    psycopg.connect(get_conninfo(), connect_timeout=1).close()
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Applying database migrations..."
python manage.py migrate --noinput

PORT="${PORT:-8000}"
echo "Starting Daphne ASGI server on port $PORT..."
exec daphne -b 0.0.0.0 -p "$PORT" core.asgi:application