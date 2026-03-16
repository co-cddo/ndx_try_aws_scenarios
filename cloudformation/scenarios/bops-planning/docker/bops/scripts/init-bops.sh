#!/bin/bash
set -e

# Initialization orchestrator for BOPS
# Called from entrypoint.sh or seed task

wait_for_database() {
  local retries=60
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

echo "=== BOPS Init ==="
wait_for_database

echo "Running db:prepare..."
bundle exec rails db:prepare

echo "Running db:seed..."
bundle exec rails db:seed

echo "=== BOPS Init Complete ==="
