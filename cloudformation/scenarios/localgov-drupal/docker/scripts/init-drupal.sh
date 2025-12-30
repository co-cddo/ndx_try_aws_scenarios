#!/bin/sh
# Drupal initialization script for LocalGov Drupal on AWS
# Handles first-boot initialization including database setup and CloudFormation signaling
#
# Story 1.8: Drupal Init & WaitCondition

set -e

# Configuration
INIT_MARKER="/var/www/drupal/sites/default/.installed"
STATUS_FILE="/var/www/drupal/web/init-status.html"
DRUPAL_ROOT="/var/www/drupal"
MAX_DB_RETRIES=60
DB_RETRY_INTERVAL=5

# Default values
DB_NAME="${DB_NAME:-drupal}"
DB_PORT="${DB_PORT:-3306}"
ADMIN_USER="${ADMIN_USER:-admin}"

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

update_status() {
    local phase="$1"
    local message="$2"
    local progress="${3:-0}"
    local status="${4:-in_progress}"

    log "Status: $phase - $message"

    # Create HTML status page
    cat > "$STATUS_FILE" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="5">
    <title>LocalGov Drupal - Initialization</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
               max-width: 600px; margin: 50px auto; padding: 20px; background: #f3f2f1; }
        .card { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #0b0c0c; margin-bottom: 10px; }
        .phase { font-size: 1.2em; color: #1d70b8; margin-bottom: 20px; }
        .message { color: #505a5f; margin-bottom: 20px; }
        .progress-bar { background: #dee0e2; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { background: #00703c; height: 100%; transition: width 0.5s ease; }
        .status { text-align: center; margin-top: 20px; font-size: 0.9em; color: #505a5f; }
        .spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid #dee0e2;
                   border-top-color: #1d70b8; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error { color: #d4351c; }
        .success { color: #00703c; }
    </style>
</head>
<body>
    <div class="card">
        <h1>LocalGov Drupal</h1>
        <div class="phase">$phase</div>
        <div class="message">$message</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="status">
            $(if [ "$status" = "error" ]; then
                echo '<span class="error">❌ Error occurred</span>'
            elif [ "$status" = "complete" ]; then
                echo '<span class="success">✓ Complete - Redirecting...</span><script>setTimeout(function(){window.location.href="/"},3000);</script>'
            else
                echo '<span class="spinner"></span> Please wait...'
            fi)
        </div>
    </div>
</body>
</html>
EOF

    # Also write JSON for API consumers
    cat > "${STATUS_FILE%.html}.json" << EOF
{
    "phase": "$phase",
    "message": "$message",
    "progress": $progress,
    "status": "$status",
    "timestamp": "$(date -Iseconds)"
}
EOF
}

signal_cfn_success() {
    if [ -n "$WAIT_CONDITION_URL" ]; then
        log "Signaling CloudFormation success..."
        curl -s -X PUT -H 'Content-Type:' --data-binary \
            "{\"Status\":\"SUCCESS\",\"UniqueId\":\"$(hostname)\",\"Data\":\"Drupal initialized successfully\",\"Reason\":\"Site installation complete\"}" \
            "$WAIT_CONDITION_URL" || log "Warning: Failed to signal CloudFormation"
    else
        log "No WAIT_CONDITION_URL set, skipping CloudFormation signal"
    fi
}

signal_cfn_failure() {
    local reason="$1"
    if [ -n "$WAIT_CONDITION_URL" ]; then
        log "Signaling CloudFormation failure: $reason"
        curl -s -X PUT -H 'Content-Type:' --data-binary \
            "{\"Status\":\"FAILURE\",\"UniqueId\":\"$(hostname)\",\"Data\":\"Initialization failed\",\"Reason\":\"$reason\"}" \
            "$WAIT_CONDITION_URL" || log "Warning: Failed to signal CloudFormation failure"
    fi
}

# ============================================================================
# Database Functions
# ============================================================================

wait_for_database() {
    log "Waiting for database at $DB_HOST:$DB_PORT..."
    update_status "Database" "Waiting for Aurora database to be available..." 10

    local retry=0
    while [ $retry -lt $MAX_DB_RETRIES ]; do
        if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
            log "Database is available"
            return 0
        fi

        retry=$((retry + 1))
        log "Database not ready, retrying ($retry/$MAX_DB_RETRIES)..."
        sleep $DB_RETRY_INTERVAL
    done

    log "ERROR: Database not available after $MAX_DB_RETRIES retries"
    return 1
}

check_database_empty() {
    # Check if Drupal tables exist
    local tables=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -N -e \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='users'" 2>/dev/null || echo "0")

    if [ "$tables" = "0" ] || [ -z "$tables" ]; then
        return 0  # Database is empty
    else
        return 1  # Database has tables
    fi
}

# ============================================================================
# Drupal Installation Functions
# ============================================================================

install_drupal() {
    log "Installing Drupal..."
    update_status "Installing" "Installing LocalGov Drupal CMS..." 30

    cd "$DRUPAL_ROOT"

    # Generate admin password if not set
    if [ -z "$ADMIN_PASSWORD" ]; then
        ADMIN_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 16)
        log "Generated admin password"
    fi

    # Run Drush site-install
    log "Running drush site:install..."
    ./vendor/bin/drush site:install localgov \
        --yes \
        --db-url="mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
        --account-name="$ADMIN_USER" \
        --account-pass="$ADMIN_PASSWORD" \
        --site-name="LocalGov Drupal Demo" \
        --site-mail="noreply@example.com" \
        --locale="en" \
        2>&1 | while read line; do log "  $line"; done

    if [ $? -ne 0 ]; then
        log "ERROR: Drupal installation failed"
        return 1
    fi

    log "Drupal installation completed"
    return 0
}

import_config() {
    log "Importing configuration..."
    update_status "Configuring" "Importing Drupal configuration..." 60

    cd "$DRUPAL_ROOT"

    # Check if config exists
    if [ -d "config/sync" ] && [ -n "$(ls -A config/sync 2>/dev/null)" ]; then
        log "Found configuration to import"
        ./vendor/bin/drush config:import --yes 2>&1 | while read line; do log "  $line"; done || true
    else
        log "No configuration found to import, skipping"
    fi

    return 0
}

set_permissions() {
    log "Setting file permissions..."
    update_status "Permissions" "Setting file permissions..." 80

    # Ensure files directory is writable
    chown -R www-data:www-data "$DRUPAL_ROOT/web/sites/default/files" 2>/dev/null || true
    chmod -R 775 "$DRUPAL_ROOT/web/sites/default/files" 2>/dev/null || true

    # Ensure settings.php is read-only
    chmod 444 "$DRUPAL_ROOT/web/sites/default/settings.php" 2>/dev/null || true

    return 0
}

clear_caches() {
    log "Clearing Drupal caches..."
    update_status "Caching" "Rebuilding Drupal caches..." 90

    cd "$DRUPAL_ROOT"
    ./vendor/bin/drush cache:rebuild 2>&1 | while read line; do log "  $line"; done || true

    return 0
}

import_sample_content() {
    log "Importing sample content..."
    update_status "Content" "Importing sample content..." 70

    cd "$DRUPAL_ROOT"

    # Check if sample content directory and import script exist
    if [ -f "$DRUPAL_ROOT/sample-content/import.php" ]; then
        log "Running sample content import script..."
        ./vendor/bin/drush scr "$DRUPAL_ROOT/sample-content/import.php" 2>&1 | while read line; do log "  $line"; done || true
    else
        log "Sample content import script not found, skipping"
    fi

    return 0
}

enable_custom_modules() {
    log "Enabling custom modules..."
    update_status "Modules" "Enabling custom modules..." 75

    cd "$DRUPAL_ROOT"

    # Enable the NDX Demo Banner module (Story 1.10)
    if [ -d "$DRUPAL_ROOT/web/modules/custom/ndx_demo_banner" ]; then
        log "Enabling ndx_demo_banner module..."
        ./vendor/bin/drush pm:enable ndx_demo_banner --yes 2>&1 | while read line; do log "  $line"; done || true
    else
        log "ndx_demo_banner module not found, skipping"
    fi

    return 0
}

# ============================================================================
# Main Initialization Flow
# ============================================================================

main() {
    log "=== LocalGov Drupal Initialization ==="
    log "Deployment Mode: ${DEPLOYMENT_MODE:-production}"

    # Validate required environment variables
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
        log "ERROR: Missing required database environment variables"
        update_status "Error" "Missing database configuration" 0 "error"
        signal_cfn_failure "Missing database environment variables"
        exit 1
    fi

    # Check if already initialized
    if [ -f "$INIT_MARKER" ]; then
        log "Drupal already initialized, skipping"
        update_status "Ready" "LocalGov Drupal is ready" 100 "complete"
        return 0
    fi

    # Create initial status page
    mkdir -p "$(dirname "$STATUS_FILE")"
    update_status "Starting" "Initializing LocalGov Drupal..." 5

    # Wait for database
    if ! wait_for_database; then
        update_status "Error" "Database connection failed" 10 "error"
        signal_cfn_failure "Database connection timeout"
        exit 1
    fi

    # Check if this is a fresh install or reconnection
    if check_database_empty; then
        log "Fresh installation detected"

        # Install Drupal
        if ! install_drupal; then
            update_status "Error" "Drupal installation failed" 30 "error"
            signal_cfn_failure "Drupal site:install failed"
            exit 1
        fi

        # Import configuration
        if ! import_config; then
            update_status "Error" "Configuration import failed" 60 "error"
            signal_cfn_failure "Drupal config:import failed"
            exit 1
        fi

        # Import sample content (Story 1.9)
        import_sample_content

        # Enable custom modules (Story 1.10)
        enable_custom_modules
    else
        log "Existing installation detected, skipping install"
        update_status "Reconnecting" "Connecting to existing database..." 50
    fi

    # Set permissions
    set_permissions

    # Clear caches
    clear_caches

    # Create installation marker
    touch "$INIT_MARKER"
    log "Created installation marker: $INIT_MARKER"

    # Final status
    update_status "Complete" "LocalGov Drupal is ready!" 100 "complete"

    # Signal CloudFormation success
    signal_cfn_success

    log "=== Initialization Complete ==="
    return 0
}

# Run main function
main "$@"
