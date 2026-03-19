#!/bin/bash
set -e

echo "=== BOPS Seed Task ==="

# Wait for database
until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" 2>/dev/null; do
  echo "Waiting for database..." && sleep 5
done
echo "Database is ready."

# Verify we can actually authenticate (pg_isready only checks socket, not auth)
echo "Testing database authentication..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "SELECT 1;" || {
  echo "ERROR: Cannot authenticate to database. Check DB_USER/DB_PASSWORD."
  echo "DB_HOST=$DB_HOST DB_USER=$DB_USER DB_NAME=$DB_NAME"
  exit 1
}

# Ensure bops_production database exists (should be created by Aurora defaultDatabaseName)
echo "Checking bops_production database..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
  -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
  echo "Creating $DB_NAME database..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
    -c "CREATE DATABASE $DB_NAME;"
}

# Enable PostGIS extensions on bops_production
echo "Enabling PostGIS extensions..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_topology; CREATE EXTENSION IF NOT EXISTS btree_gin;"

# Run Rails setup (runs migrations on existing database)
echo "Running db:prepare..."
bundle exec rails db:prepare

# Run default seeds (creates application types, statuses, etc.)
echo "Running db:seed..."
bundle exec rails db:seed

# Run our custom sample data generator
echo "Running sample data seed..."
bundle exec rails runner scripts/seed_sample_data.rb

# Create BOPS-Applicants database and run its migrations
echo "Creating bops_applicants_production database..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" \
  -c "CREATE DATABASE bops_applicants_production;" 2>/dev/null || true

# BOPS-Applicants uses standard pg adapter (NOT postgis) — postgres:// scheme is correct
echo "Running BOPS-Applicants migrations..."
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:${DB_PORT:-5432}/bops_applicants_production" \
  bundle exec rails db:migrate

echo "=== Seed Complete ==="
