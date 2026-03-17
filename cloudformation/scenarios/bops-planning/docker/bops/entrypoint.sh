#!/bin/bash
set -e

STATUS_DIR="/rails/public"
STATUS_FILE="${STATUS_DIR}/init-status.html"
SEED_MARKER="/tmp/.bops-seeded"

update_status() {
  local step="$1"
  local message="$2"
  local progress="$3"
  mkdir -p "$STATUS_DIR"
  cat > "$STATUS_FILE" <<STATUSEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="10">
  <title>BOPS - Initialising</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
    .card { background: white; border-radius: 8px; padding: 2rem; max-width: 500px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #1d4ed8; font-size: 1.5rem; }
    .progress { background: #e5e7eb; border-radius: 9999px; height: 8px; margin: 1rem 0; overflow: hidden; }
    .bar { background: #3b82f6; height: 100%; border-radius: 9999px; transition: width 0.5s; width: ${progress}%; }
    .step { color: #6b7280; font-size: 0.875rem; }
    .message { color: #374151; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>BOPS is starting up</h1>
    <div class="progress"><div class="bar"></div></div>
    <p class="step">Step ${step}</p>
    <p class="message">${message}</p>
    <p class="step">This page will refresh automatically.</p>
  </div>
</body>
</html>
STATUSEOF
}

wait_for_database() {
  local retries=120
  local count=0
  while ! pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" 2>/dev/null; do
    count=$((count + 1))
    if [ "$count" -ge "$retries" ]; then
      echo "ERROR: Database not available after ${retries} attempts"
      exit 1
    fi
    echo "Waiting for database (attempt ${count}/${retries})..."
    sleep 5
  done
  echo "Database is ready."
}

echo "=== BOPS Entrypoint ==="

update_status "1/6" "Waiting for database..." "10"
wait_for_database

# Verify authentication works
echo "Testing database authentication..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1 || {
  echo "ERROR: Cannot authenticate to database"
  exit 1
}

# Ensure bops_production database exists
echo "Checking database exists..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
  -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-bops_production}'" | grep -q 1 || {
  echo "Creating ${DB_NAME:-bops_production} database..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
    -c "CREATE DATABASE ${DB_NAME:-bops_production};"
}

update_status "2/6" "Enabling PostGIS extensions..." "20"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "${DB_NAME:-bops_production}" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_topology; CREATE EXTENSION IF NOT EXISTS btree_gin;" 2>&1 || true

update_status "3/6" "Running database migrations..." "35"
bundle exec rails db:prepare 2>&1

# Seed on first run only
if [ ! -f "$SEED_MARKER" ]; then
  update_status "4/6" "Loading seed data..." "50"
  bundle exec rails db:seed 2>&1 || echo "db:seed skipped or already done"

  update_status "5/6" "Generating sample planning applications..." "70"
  bundle exec rails runner scripts/seed_sample_data.rb 2>&1 || echo "Sample data generation skipped"

  # Create BOPS-Applicants database
  echo "Creating bops_applicants_production database..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
    -c "CREATE DATABASE bops_applicants_production;" 2>/dev/null || true

  echo "Running BOPS-Applicants migrations..."
  DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:${DB_PORT:-5432}/bops_applicants_production" \
    bundle exec rails db:migrate 2>&1 || echo "Applicants migration skipped"

  touch "$SEED_MARKER"
  echo "Seed complete."
else
  echo "Already seeded, skipping."
fi

update_status "6/6" "Starting BOPS..." "95"
rm -f "$STATUS_FILE"

echo "Starting Puma server..."
exec bundle exec rails server -b 0.0.0.0 -p "${PORT:-3000}"
