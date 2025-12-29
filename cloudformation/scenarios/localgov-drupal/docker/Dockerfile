# AI-Enhanced LocalGov Drupal on AWS
# Multi-stage build for optimized image size
#
# Build context should be the localgov-drupal directory:
#   docker build -f docker/Dockerfile -t localgov-drupal .

# =============================================================================
# Stage 1: Builder - Install Composer dependencies
# =============================================================================
FROM php:8.2-fpm-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    $PHPIZE_DEPS

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        opcache \
        zip \
        bcmath \
        intl \
        mbstring

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/drupal

# Copy composer files first for better layer caching
COPY drupal/composer.json ./

# Install dependencies (no dev dependencies for production)
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts || true

# Copy the rest of the Drupal codebase
COPY drupal/ .

# Run composer scripts that need the full codebase
RUN composer run-script drupal-scaffold || true

# =============================================================================
# Stage 2: Runtime - Minimal production image
# =============================================================================
FROM php:8.2-fpm-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    libpng \
    libjpeg-turbo \
    freetype \
    libzip \
    icu \
    oniguruma \
    mysql-client \
    curl

# Install PHP extensions
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        opcache \
        zip \
        bcmath \
        intl \
        mbstring \
    && apk del \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev

# Copy Drupal from builder
COPY --from=builder /var/www/drupal /var/www/drupal

# Copy Drush from builder (if exists)
RUN if [ -f /var/www/drupal/vendor/bin/drush ]; then \
        ln -s /var/www/drupal/vendor/bin/drush /usr/local/bin/drush; \
    fi

# Copy configuration files
COPY docker/config/nginx.conf /etc/nginx/nginx.conf
COPY docker/config/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/config/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/config/drupal.settings.php /var/www/drupal/web/sites/default/settings.php
COPY docker/config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy entrypoint and scripts
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/scripts/ /scripts/

# Make scripts executable
RUN chmod +x /entrypoint.sh && \
    (chmod +x /scripts/*.sh 2>/dev/null || true)

# Create required directories and ensure www-data user exists
RUN mkdir -p \
    /var/www/drupal/web/sites/default/files \
    /var/www/drupal/private \
    /var/www/drupal/config/sync \
    /var/run/nginx \
    /var/log/nginx \
    /var/log/supervisor \
    && adduser -D -S -H -u 82 -G www-data www-data 2>/dev/null || true

# Set ownership
RUN chown -R www-data:www-data /var/www/drupal \
    && chown -R www-data:www-data /var/run/nginx \
    && chown -R www-data:www-data /var/log/nginx

# Set working directory
WORKDIR /var/www/drupal

# Expose ports
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
