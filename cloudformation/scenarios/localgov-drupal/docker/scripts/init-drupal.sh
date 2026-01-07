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

# Helper function to run drush commands with retry logic for deadlocks
# Handles Aurora MySQL deadlocks (SQLSTATE 40001) that occur during cache writes
run_drush_with_retry() {
    local max_attempts=5
    local attempt=1
    local delay=2
    local output

    while [ $attempt -le $max_attempts ]; do
        if output=$("$@" 2>&1); then
            echo "$output"
            return 0
        else
            # Check if it's a deadlock or transient error
            if echo "$output" | grep -qiE "(deadlock|serialization failure|40001|try restarting transaction)"; then
                log "  Deadlock detected, retrying in ${delay}s (attempt $attempt/$max_attempts)..."
                sleep $delay
                delay=$((delay * 2))
                attempt=$((attempt + 1))
            else
                # Not a deadlock, return the error
                echo "$output"
                return 1
            fi
        fi
    done
    log "  Max retries exceeded for drush command"
    echo "$output"
    return 1
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

# Run drush command with proper output capture (avoids SIGPIPE issues with piping)
# Usage: run_drush "description" command args...
# Returns: 0 on success, command's exit code on failure
run_drush() {
    local desc="$1"
    shift
    local output
    local exit_code

    log "$desc"
    # Capture output to variable instead of piping to avoid SIGPIPE
    output=$("$@" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    # Log output if any
    if [ -n "$output" ]; then
        echo "$output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    return $exit_code
}

# Run drush command silently (output only on error)
run_drush_quiet() {
    local output
    local exit_code

    output=$("$@" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    if [ $exit_code -ne 0 ] && [ -n "$output" ]; then
        log "  Warning: $output"
    fi

    return $exit_code
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

    # Run Drush site-install with output capture (avoids SIGPIPE from piping)
    log "Running drush site:install..."
    local install_output
    local install_result=0
    install_output=$(./vendor/bin/drush site:install localgov \
        --yes \
        --db-url="mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
        --account-name="$ADMIN_USER" \
        --account-pass="$ADMIN_PASSWORD" \
        --site-name="LocalGov Drupal Demo" \
        --site-mail="noreply@example.com" \
        --locale="en" \
        2>&1) || install_result=$?

    # Log the output
    if [ -n "$install_output" ]; then
        echo "$install_output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    if [ $install_result -ne 0 ]; then
        log "ERROR: Drupal installation failed with exit code $install_result"
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
        local config_output
        config_output=$(./vendor/bin/drush config:import --yes 2>&1) || true
        if [ -n "$config_output" ]; then
            echo "$config_output" | while IFS= read -r line; do
                log "  $line"
            done
        fi
    else
        log "No configuration found to import, skipping"
    fi

    return 0
}

install_themes() {
    log "Installing LocalGov themes..."
    update_status "Themes" "Installing LocalGov Drupal themes..." 65

    cd "$DRUPAL_ROOT"

    # Delete any conflicting theme config that may exist without the theme being installed
    ./vendor/bin/drush cdel localgov_base.settings -y 2>/dev/null || true
    ./vendor/bin/drush cdel localgov_scarfolk.settings -y 2>/dev/null || true

    # Install themes in dependency order
    log "Installing localgov_base theme..."
    local base_output
    base_output=$(./vendor/bin/drush theme:install localgov_base -y 2>&1) || true
    if [ -n "$base_output" ]; then
        log "  $base_output"
    fi

    log "Installing localgov_scarfolk theme..."
    local scarfolk_output
    scarfolk_output=$(./vendor/bin/drush theme:install localgov_scarfolk -y 2>&1) || true
    if [ -n "$scarfolk_output" ]; then
        log "  $scarfolk_output"
    fi

    # Set localgov_scarfolk as the default theme
    log "Setting localgov_scarfolk as default theme..."
    ./vendor/bin/drush config:set system.theme default localgov_scarfolk -y 2>&1 || true

    # Set admin theme to Claro (Drupal core theme - Gin is not installed)
    log "Setting admin theme to Claro..."
    ./vendor/bin/drush config:set system.theme admin claro -y 2>&1 || true

    # Rebuild caches to ensure theme is active
    ./vendor/bin/drush cr 2>&1 || true

    log "Theme installation complete"
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

    # Retry cache rebuild up to 3 times with increasing delays
    local max_attempts=3
    local attempt=1
    local cache_output
    local cache_result

    while [ $attempt -le $max_attempts ]; do
        log "Cache rebuild attempt $attempt of $max_attempts..."
        cache_result=0
        cache_output=$(./vendor/bin/drush cache:rebuild 2>&1) || cache_result=$?

        if [ -n "$cache_output" ]; then
            echo "$cache_output" | while IFS= read -r line; do
                log "  $line"
            done
        fi

        if [ $cache_result -eq 0 ]; then
            log "Cache rebuild succeeded on attempt $attempt"
            break
        else
            log "Cache rebuild attempt $attempt failed (exit code: $cache_result)"
            if [ $attempt -lt $max_attempts ]; then
                log "Waiting 5 seconds before retry..."
                sleep 5
            fi
        fi
        attempt=$((attempt + 1))
    done

    # Explicitly rebuild the router to ensure routes are registered
    log "Rebuilding router cache..."
    local router_output
    router_output=$(./vendor/bin/drush router:rebuild 2>&1) || true
    if [ -n "$router_output" ]; then
        echo "$router_output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    return 0
}

enable_localgov_modules() {
    log "Enabling LocalGov modules..."
    update_status "Modules" "Enabling LocalGov modules..." 72

    cd "$DRUPAL_ROOT"

    # List of LocalGov modules to enable (excluding localgov_demo which we replace with our own content)
    # These are commonly available in the LocalGov Drupal distribution
    LOCALGOV_MODULES="
        localgov_alert_banner
        localgov_alert_banner_full_page
        localgov_campaigns
        localgov_char_count
        localgov_content_lock
        localgov_directories
        localgov_directories_db
        localgov_directories_location
        localgov_directories_or
        localgov_directories_org
        localgov_directories_page
        localgov_directories_venue
        localgov_directories_venue_or
        localgov_directories_promo_page
        localgov_editoria11y
        localgov_events
        localgov_events_remove_expired
        localgov_geo
        localgov_geo_area
        localgov_guides
        localgov_media
        localgov_menu_link_group
        localgov_news
        localgov_openreferral
        localgov_page_components
        localgov_paragraphs
        localgov_paragraphs_layout
        localgov_paragraphs_views
        localgov_publications
        localgov_review_date
        localgov_roles
        localgov_search
        localgov_search_db
        localgov_services
        localgov_services_navigation
        localgov_services_page
        localgov_services_sublanding
        localgov_services_status
        localgov_step_by_step
        localgov_subsites
        localgov_subsites_paragraphs
        localgov_workflows
        localgov_workflows_notifications
    "

    # Enable each module if available (ignore errors for missing optional modules)
    for module in $LOCALGOV_MODULES; do
        log "Checking module: $module"
        if ./vendor/bin/drush pm:list --status=disabled --type=module --field=name 2>/dev/null | grep -q "^${module}$"; then
            log "  Enabling $module..."
            local module_output
            module_output=$(./vendor/bin/drush pm:enable "$module" --yes 2>&1) || true
            if [ -n "$module_output" ]; then
                echo "$module_output" | while IFS= read -r line; do
                    log "    $line"
                done
            fi
        else
            log "  $module already enabled or not available, skipping"
        fi
    done

    return 0
}

enable_custom_modules() {
    log "Enabling custom NDX modules..."
    update_status "Modules" "Enabling custom NDX modules..." 75

    cd "$DRUPAL_ROOT"

    # Helper function to enable a module without problematic piping
    # The | while read pattern causes SIGPIPE issues with drush
    enable_module() {
        local module_name="$1"
        local module_dir="$DRUPAL_ROOT/web/modules/custom/$module_name"

        if [ -d "$module_dir" ]; then
            log "Enabling $module_name module..."
            # Use direct execution with output capture and retry for deadlocks
            local output
            if output=$(run_drush_with_retry ./vendor/bin/drush pm:enable "$module_name" --yes); then
                log "  $module_name enabled successfully"
                [ -n "$output" ] && log "  Output: $output"
                return 0
            else
                log "  Warning: $module_name enable returned non-zero, but may have succeeded"
                [ -n "$output" ] && log "  Output: $output"
                # Check if actually enabled despite the error using pm:list (filter warning lines)
                sleep 2  # Wait for any pending cache writes to complete
                local enabled_list
                enabled_list=$(./vendor/bin/drush pm:list --status=enabled --type=module --field=name 2>/dev/null | grep -v '\[warning\]' | grep -v 'Drush command' | tr '\n' ' ')
                if echo "$enabled_list" | grep -qw "$module_name"; then
                    log "  Verified: $module_name is enabled"
                    return 0
                fi
                log "  Module $module_name not in enabled list - continuing anyway"
                # Return 0 to avoid script exit - module may still work
                return 0
            fi
        else
            log "$module_name module not found at $module_dir, skipping"
            return 0
        fi
    }

    # Enable modules in dependency order
    enable_module "ndx_demo_banner"      # Story 1.10
    enable_module "ndx_welcome"          # Story 1.11
    enable_module "ndx_walkthrough"      # Epic 2
    enable_module "ndx_aws_ai"           # Epic 3-4 dependency
    enable_module "ndx_council_generator" # Epic 5 - requires ndx_aws_ai

    # Clear caches before verification to ensure module system is up to date
    log "Rebuilding cache before module verification..."
    run_drush_with_retry ./vendor/bin/drush cache:rebuild 2>&1 || true
    sleep 3

    # Verify critical modules are enabled using pm:info which directly queries module status
    log "Verifying module status..."

    local critical_modules="ndx_aws_ai ndx_council_generator"
    for module in $critical_modules; do
        # Use pm:info to get the status directly - more reliable than pm:list
        local module_status
        module_status=$(./vendor/bin/drush pm:info "$module" --field=status 2>/dev/null | tr -d '[:space:]' || echo "unknown")
        log "  Module $module status: $module_status"

        if [ "$module_status" = "Enabled" ] || [ "$module_status" = "enabled" ]; then
            log "  ✓ $module is enabled"
        else
            log "  ✗ $module is NOT enabled (status: $module_status) - attempting force enable..."
            run_drush_with_retry ./vendor/bin/drush pm:enable "$module" --yes 2>&1 || true
            sleep 3
            run_drush_with_retry ./vendor/bin/drush cache:rebuild 2>&1 || true
            sleep 2
            # Re-check using pm:info
            module_status=$(./vendor/bin/drush pm:info "$module" --field=status 2>/dev/null | tr -d '[:space:]' || echo "unknown")
            if [ "$module_status" = "Enabled" ] || [ "$module_status" = "enabled" ]; then
                log "  ✓ $module is now enabled after retry"
            else
                log "  ✗ $module still NOT enabled (status: $module_status) - check module dependencies"
            fi
        fi
    done

    return 0
}

configure_tts_block() {
    log "Configuring Text-to-Speech block..."
    update_status "TTS Block" "Configuring Listen to Page block..." 75

    cd "$DRUPAL_ROOT"

    # Check if the block already exists
    local block_exists
    block_exists=$(./vendor/bin/drush config:get block.block.ndx_listen_to_page_scarfolk id 2>/dev/null || echo "")

    if [ -z "$block_exists" ]; then
        log "  TTS block not found, creating..."

        # Import the optional config from the module
        # This uses drush to create the block with proper settings
        ./vendor/bin/drush php:eval "
            \$block_config = [
                'id' => 'ndx_listen_to_page_scarfolk',
                'theme' => 'localgov_scarfolk',
                'region' => 'content_top',
                'weight' => 0,
                'plugin' => 'ndx_listen_to_page',
                'settings' => [
                    'id' => 'ndx_listen_to_page',
                    'label' => 'Listen to this Page',
                    'provider' => 'ndx_aws_ai',
                    'label_display' => 'visible',
                    'default_language' => 'en-GB',
                    'show_speed_control' => TRUE,
                    'sticky_position' => TRUE,
                ],
                'visibility' => [
                    'entity_bundle:node' => [
                        'id' => 'entity_bundle:node',
                        'bundles' => [
                            'localgov_guides_overview' => 'localgov_guides_overview',
                            'localgov_guides_page' => 'localgov_guides_page',
                            'localgov_news_article' => 'localgov_news_article',
                            'localgov_services_landing' => 'localgov_services_landing',
                            'localgov_services_page' => 'localgov_services_page',
                        ],
                        'negate' => FALSE,
                        'context_mapping' => ['node' => '@node.node_route_context:node'],
                    ],
                ],
            ];
            \$block = \Drupal\block\Entity\Block::create(\$block_config);
            \$block->save();
            echo 'TTS block created successfully';
        " 2>&1 || log "  Warning: Could not create TTS block programmatically"

        log "  TTS block configuration complete"
    else
        log "  TTS block already exists, skipping"
    fi

    return 0
}

generate_council_content() {
    log "Generating AI council content..."
    update_status "AI Content" "Generating council content with AI..." 80

    cd "$DRUPAL_ROOT"

    # Try to check module status but don't block on it - drush pm:info can be unreliable
    local module_status
    module_status=$(./vendor/bin/drush pm:info ndx_council_generator --field=status 2>/dev/null | tr -d '[:space:]' || echo "unknown")
    log "ndx_council_generator module status check returned: '$module_status'"

    # Check if localgov:generate-council command exists (more reliable than module status)
    if ! ./vendor/bin/drush help localgov:generate-council >/dev/null 2>&1; then
        log "localgov:generate-council command not available - attempting to enable ndx_council_generator module"
        ./vendor/bin/drush pm:enable ndx_council_generator -y 2>&1 || true
        ./vendor/bin/drush cache:rebuild 2>&1 || true
        sleep 2
        # Check again
        if ! ./vendor/bin/drush help localgov:generate-council >/dev/null 2>&1; then
            log "localgov:generate-council command still not available, skipping AI content generation"
            return 0
        fi
    fi

    log "localgov:generate-council command available, proceeding with generation"

    # Clean up any previous content before generation
    log "Cleaning up previous content..."
    local cleanup_output
    cleanup_output=$(run_drush_with_retry ./vendor/bin/drush entity:delete node --all 2>&1) || true
    if [ -n "$cleanup_output" ]; then
        log "  $cleanup_output"
    fi
    run_drush_with_retry ./vendor/bin/drush state:delete ndx_council_generator.generation_state 2>/dev/null || true
    run_drush_with_retry ./vendor/bin/drush state:delete ndx_council_generator.image_queue 2>/dev/null || true
    run_drush_with_retry ./vendor/bin/drush config:delete ndx_council_generator.council_identity 2>/dev/null || true

    # Clear caches before generation
    log "Clearing caches before generation..."
    local cache_output
    cache_output=$(run_drush_with_retry ./vendor/bin/drush cache:rebuild 2>&1) || true
    if [ -n "$cache_output" ]; then
        log "  $cache_output"
    fi

    # Generate council content with AI
    log "Running council generation (this may take several minutes)..."
    update_status "AI Content" "Generating identity and content..." 82

    # Run the generation command with output capture to avoid SIGPIPE
    # Use timeout to prevent hanging, capture output properly
    local gen_result=0
    local gen_output
    gen_output=$(timeout 600 ./vendor/bin/drush localgov:generate-council --force --verbose 2>&1) || gen_result=$?

    # Log the output and update status based on content
    if [ -n "$gen_output" ]; then
        echo "$gen_output" | while IFS= read -r line; do
            log "  $line"
            # Update status periodically (note: this runs in subshell so status may not persist)
            case "$line" in
                *"Generating identity"*|*"Phase 1"*) : ;; # Status updates handled by log
                *"Generating content"*|*"Phase 2"*) : ;;
                *"Generating images"*|*"Phase 3"*) : ;;
            esac
        done
    fi

    if [ $gen_result -eq 0 ]; then
        log "Council content generation completed successfully"
        update_status "AI Content" "AI content generation complete!" 95
    elif [ $gen_result -eq 124 ]; then
        log "Warning: Council generation timed out (10 min limit), but continuing..."
        update_status "AI Content" "Generation timed out, continuing..." 95
    else
        log "Warning: Council generation returned error $gen_result, but continuing..."
        update_status "AI Content" "Generation completed with warnings" 95
    fi

    return 0
}

configure_site_navigation() {
    log "Configuring site navigation..."
    update_status "Navigation" "Configuring site navigation and front page..." 93

    cd "$DRUPAL_ROOT"

    # NOTE: Front page is configured by the PHP NavigationMenuConfigurator
    # during content generation. We don't duplicate that here to avoid
    # overwriting the correct setting with stale data.

    # Run pathauto to generate URL aliases for all content
    log "Generating URL aliases with pathauto..."
    local pathauto_output
    pathauto_output=$(./vendor/bin/drush pathauto:update node 2>&1) || true
    if [ -n "$pathauto_output" ]; then
        echo "$pathauto_output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    # Rebuild router to ensure all routes are registered
    log "Rebuilding router..."
    local router_output
    router_output=$(./vendor/bin/drush router:rebuild 2>&1) || true
    if [ -n "$router_output" ]; then
        echo "$router_output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    return 0
}

build_search_index() {
    log "Building search index..."
    update_status "Search" "Building search index..." 95

    cd "$DRUPAL_ROOT"

    # First, ensure search modules are enabled.
    log "Ensuring search modules are enabled..."
    ./vendor/bin/drush pm:enable search_api localgov_search localgov_search_db -y 2>&1 || true
    sleep 1

    # Rebuild caches to ensure all content is visible to search.
    log "Rebuilding caches before indexing..."
    run_drush_with_retry ./vendor/bin/drush cache:rebuild 2>&1 || true
    sleep 2

    # Run cron to trigger any pending tasks including search indexing.
    log "Running cron for search indexing..."
    local cron_output
    cron_output=$(./vendor/bin/drush cron 2>&1) || true
    if [ -n "$cron_output" ]; then
        echo "$cron_output" | while IFS= read -r line; do
            log "  $line"
        done
    fi

    # Check if search_api module is enabled.
    if ./vendor/bin/drush pm:info search_api --field=status 2>/dev/null | grep -qi enabled; then
        # Enable the specific index if disabled.
        log "Enabling localgov_sitewide_search index..."
        ./vendor/bin/drush search-api:enable localgov_sitewide_search 2>&1 || true

        # Clear and rebuild search index for the sitewide search index.
        log "Clearing existing search index..."
        ./vendor/bin/drush search-api:clear localgov_sitewide_search 2>&1 || true

        # Index all content using search_api for the specific index.
        log "Indexing content with Search API (this may take a moment)..."
        local index_output
        # Index with batch size for reliability, targeting the specific index.
        index_output=$(./vendor/bin/drush search-api:index localgov_sitewide_search --batch-size=50 2>&1) || true
        if [ -n "$index_output" ]; then
            echo "$index_output" | while IFS= read -r line; do
                log "  $line"
            done
        fi

        # Show index status.
        log "Search index status:"
        local status_output
        status_output=$(./vendor/bin/drush search-api:status 2>&1) || true
        if [ -n "$status_output" ]; then
            echo "$status_output" | while IFS= read -r line; do
                log "  $line"
            done
        fi
    else
        log "Search API module not enabled, skipping search indexing"
    fi

    log "Search index build complete"
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
        log "Drupal already initialized"
        # Always wait for database and run essential updates
        if ! wait_for_database; then
            update_status "Error" "Database connection failed" 10 "error"
            signal_cfn_failure "Database connection timeout"
            exit 1
        fi
        # Always enable modules and rebuild caches on restart
        enable_localgov_modules
        enable_custom_modules
        clear_caches
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

        # Install LocalGov themes (must be done before modules that depend on them)
        install_themes
    else
        log "Existing installation detected, skipping install"
        update_status "Reconnecting" "Connecting to existing database..." 50
        # Ensure themes are installed on reconnect too
        install_themes
    fi

    # Enable LocalGov modules (excluding localgov_demo)
    enable_localgov_modules

    # Enable custom NDX modules (Story 1.10) - always run to ensure new modules are enabled
    enable_custom_modules

    # Configure TTS block (must be after ndx_aws_ai module is enabled)
    configure_tts_block

    # Generate AI council content (Epic 5) - only on fresh install or when requested
    if [ ! -f "$INIT_MARKER" ]; then
        generate_council_content
        # Configure site navigation after content generation
        configure_site_navigation
        # Build search index after all content is created
        build_search_index
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
