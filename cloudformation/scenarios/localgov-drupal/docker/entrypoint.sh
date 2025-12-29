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

# Set correct permissions on Drupal files
chown -R www-data:www-data /var/www/drupal/web/sites/default/files || true
chmod 755 /var/www/drupal/web/sites/default/files || true

# Create private files directory if on EFS mount
if [ -d "/var/www/drupal/private" ]; then
    chown -R www-data:www-data /var/www/drupal/private
    chmod 755 /var/www/drupal/private
fi

# Health check endpoint
cat > /var/www/drupal/web/health << 'EOF'
OK
EOF

# Check if this is first boot (database initialization needed)
# This will be expanded in Story 1.8
if [ "${SKIP_INIT:-false}" != "true" ]; then
    echo "Checking initialization status..."

    # Run initialization script if it exists
    if [ -f /scripts/init-drupal.sh ]; then
        echo "Running Drupal initialization..."
        /scripts/init-drupal.sh
    fi
fi

echo "=== Starting Services ==="

# Execute the main command (supervisord)
exec "$@"
