#!/bin/bash
set -e

# Wait for PostgreSQL to be ready if POSTGRES_HOST is specified
if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL to be ready..."
  while ! nc -z "$POSTGRES_HOST" 5432; do
    sleep 1
  done
  echo "PostgreSQL is ready!"
else
  echo "POSTGRES_HOST is not set, skipping PostgreSQL health check (using SQLite)..."
fi

# Wait for Redis to be ready if REDIS_HOST is specified
if [ -n "$REDIS_HOST" ]; then
  echo "Waiting for Redis to be ready..."
  while ! nc -z "$REDIS_HOST" 6379; do
    sleep 1
  done
  echo "Redis is ready!"
else
  echo "REDIS_HOST is not set, skipping Redis health check (using in-memory channel layer)..."
fi

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if it doesn't exist
echo "Creating superuser if needed..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Seed demo data
echo "Seeding demo data..."
python manage.py seed_demo --force

# Start the server using Django's management command for Daphne
echo "Starting Daphne server via Django management command..."
exec python manage.py run_daphne