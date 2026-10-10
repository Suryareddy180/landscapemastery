#!/bin/sh
set -e

echo "===> Initializing Landscape Mastery Production Backend..."

# Wait for PostgreSQL database if DB_HOST is configured
if [ -n "$DB_HOST" ]; then
    echo "Checking database connection to $DB_HOST:${DB_PORT:-5432}..."
    python - <<END
import time, sys, os
import psycopg2

host = os.environ.get('DB_HOST')
port = os.environ.get('DB_PORT', '5432')
dbname = os.environ.get('DB_NAME', 'landscapemastery')
user = os.environ.get('DB_USER', 'postgres')
password = os.environ.get('DB_PASSWORD', 'postgres')

max_retries = 30
for attempt in range(1, max_retries + 1):
    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port,
            connect_timeout=3
        )
        conn.close()
        print(f"Database reachable at {host}:{port} (attempt {attempt}).")
        sys.exit(0)
    except Exception as err:
        print(f"Waiting for database ({attempt}/{max_retries}): {err}")
        time.sleep(1)

print("ERROR: Timed out waiting for database connection.")
sys.exit(1)
END
fi

# Run database migrations
echo "===> Applying database migrations..."
python manage.py migrate --noinput

# Ensure production admin accounts exist
echo "===> Ensuring production administrator accounts..."
python manage.py create_production_admin || true

# Run static files collection
echo "===> Ensuring static files are collected..."
python manage.py collectstatic --noinput

echo "===> Backend initialization complete. Launching server process..."
exec "$@"
