#!/bin/bash
set -e

STATUS_DIR="/rails/public"
STATUS_FILE="${STATUS_DIR}/init-status.html"

update_status() {
  local step="$1"
  local message="$2"
  local progress="$3"
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

echo "=== BOPS Entrypoint ==="
mkdir -p "$STATUS_DIR"

update_status "1/3" "Waiting for database..." "20"
wait_for_database

update_status "2/3" "Running database migrations..." "50"
bundle exec rails db:migrate 2>&1 || echo "Migration skipped or already up to date"

update_status "3/3" "Starting BOPS..." "90"

# Remove status file — the Rails app will serve its own pages now
rm -f "$STATUS_FILE"

echo "Starting Puma server..."
exec bundle exec rails server -b 0.0.0.0 -p "${PORT:-3000}"
