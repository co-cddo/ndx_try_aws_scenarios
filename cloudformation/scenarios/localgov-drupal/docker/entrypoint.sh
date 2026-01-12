#!/bin/sh
# Entrypoint script for LocalGov Drupal container
# Handles initialization, PHP-FPM, and Nginx startup

set -e

echo "=== LocalGov Drupal Container Starting ==="
echo "Deployment Mode: ${DEPLOYMENT_MODE:-production}"
echo "AWS Region: ${AWS_REGION:-us-east-1}"

# Ensure log directories exist
mkdir -p /var/log/nginx /var/log/supervisor
touch /var/log/nginx/access.log /var/log/nginx/error.log

# Ensure nginx temp directories exist with correct permissions
# Required for buffering file uploads larger than client_body_buffer_size
mkdir -p /var/lib/nginx/tmp/client_body
chown -R www-data:www-data /var/lib/nginx
chmod -R 755 /var/lib/nginx

# Set correct permissions on Drupal files
chown -R www-data:www-data /var/www/drupal/web/sites/default/files || true
chmod 755 /var/www/drupal/web/sites/default/files || true

# Create private files directory if on EFS mount
if [ -d "/var/www/drupal/private" ]; then
    chown -R www-data:www-data /var/www/drupal/private
    chmod 755 /var/www/drupal/private
fi

# Health check endpoint - returns OK even during installation
cat > /var/www/drupal/web/health << 'EOF'
OK
EOF

# Start PHP-FPM and Nginx first for health checks
echo "=== Starting Services for Health Checks ==="
php-fpm -D
nginx

# Wait for services to be ready
sleep 2
echo "Web services started, health checks will now pass"

# Check if this is first boot (database initialization needed)
if [ "${SKIP_INIT:-false}" != "true" ]; then
    echo "Checking initialization status..."

    # Run initialization script if it exists
    if [ -f /scripts/init-drupal.sh ]; then
        echo "Running Drupal initialization..."
        # Capture logs to file for web-based status viewer while preserving stdout for Docker logs
        INIT_LOG_FILE="/var/www/drupal/web/init-log.txt"
        touch "$INIT_LOG_FILE"
        chmod 644 "$INIT_LOG_FILE"
        /scripts/init-drupal.sh 2>&1 | tee "$INIT_LOG_FILE"
    fi
fi

echo "=== Switching to Supervisord ==="

# Stop the initial nginx/php-fpm (supervisord will restart them)
nginx -s quit 2>/dev/null || true
pkill php-fpm 2>/dev/null || true
sleep 1

# Execute the main command (supervisord)
exec "$@"
