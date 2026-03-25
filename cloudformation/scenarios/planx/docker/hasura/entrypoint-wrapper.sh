#!/bin/bash
set -e

echo "=== NDX:Try Hasura Boot Script ==="

# Extract DB connection details from HASURA_GRAPHQL_DATABASE_URL
# Format: postgres://user:password@host:port/database
DB_URL="${HASURA_GRAPHQL_DATABASE_URL}"
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "DB Host: $DB_HOST"
echo "DB Name: $DB_NAME"

# 1. Wait for DNS resolution (Aurora DNS can take a minute to propagate)
echo "[1/3] Waiting for DNS resolution of $DB_HOST..."
for i in $(seq 1 60); do
  if nslookup "$DB_HOST" > /dev/null 2>&1; then
    echo "DNS resolved."
    break
  fi
  if [ $i -eq 60 ]; then
    echo "WARNING: DNS resolution timed out after 5 minutes. Continuing anyway..."
  fi
  sleep 5
done

# 2. Wait for PostgreSQL to accept connections
echo "[2/3] Waiting for PostgreSQL to be ready..."
for i in $(seq 1 60); do
  if PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "PostgreSQL ready."
    break
  fi
  if [ $i -eq 60 ]; then
    echo "WARNING: PostgreSQL not ready after 5 minutes. Continuing anyway..."
  fi
  sleep 5
done

# 3. Pre-create PostgreSQL extensions that PlanX migrations expect
echo "[3/3] Creating PostgreSQL extensions..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'
CREATE EXTENSION IF NOT EXISTS plpgsql;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

# pg_cron needs special handling — it can only be created in the database specified
# by cron.database_name parameter
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
  "CREATE EXTENSION IF NOT EXISTS pg_cron;" 2>&1 || echo "pg_cron creation failed (may need RDS parameter group - non-fatal)"

echo "Extensions created. Starting Hasura with migrations..."

# 4. Run Hasura cli-migrations entrypoint in background
/usr/bin/docker-entrypoint.sh graphql-engine serve &
HASURA_PID=$!

# 5. Wait for Hasura to be healthy (migrations complete)
echo "[4/5] Waiting for Hasura to be ready..."
for i in $(seq 1 120); do
  if curl -sf http://localhost:8080/healthz > /dev/null 2>&1; then
    echo "Hasura healthy."
    break
  fi
  if [ $i -eq 120 ]; then
    echo "WARNING: Hasura not healthy after 10 minutes."
  fi
  sleep 5
done

# 6. Apply seed data (idempotent — ON CONFLICT DO NOTHING)
if [ -d /seed ]; then
  echo "[5/5] Applying seed data..."
  for f in /seed/*.sql; do
    echo "  Running $f..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f" 2>&1 || echo "  Warning: $f had errors (non-fatal)"
  done
  echo "Seed data applied."
else
  echo "[5/5] No seed data found."
fi

# Wait for Hasura process
wait $HASURA_PID
