<?php

/**
 * @file
 * Drupal settings for AI-Enhanced LocalGov Drupal on AWS.
 *
 * This settings file reads configuration from environment variables
 * for AWS Fargate deployment with Aurora Serverless v2.
 */

/**
 * Database settings.
 *
 * Configured via environment variables:
 * - DB_HOST: Aurora cluster endpoint
 * - DB_NAME: Database name (default: drupal)
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password
 */
$databases['default']['default'] = [
  'driver' => 'mysql',
  'host' => getenv('DB_HOST') ?: 'localhost',
  'database' => getenv('DB_NAME') ?: 'drupal',
  'username' => getenv('DB_USER') ?: 'drupal',
  'password' => getenv('DB_PASSWORD') ?: '',
  'port' => 3306,
  'prefix' => '',
  'charset' => 'utf8mb4',
  'collation' => 'utf8mb4_general_ci',
];

/**
 * Salt for one-time login links, cancel links, form tokens, etc.
 *
 * This should be set via environment variable or generated during installation.
 */
$settings['hash_salt'] = getenv('DRUPAL_HASH_SALT') ?: 'change-this-to-a-random-string';

/**
 * Deployment mode configuration.
 *
 * - development: Enables verbose errors, ECS Exec
 * - production: Optimized for demo reliability
 */
$deployment_mode = getenv('DEPLOYMENT_MODE') ?: 'production';

/**
 * Trusted host patterns.
 *
 * Configured via DRUPAL_TRUSTED_HOSTS environment variable.
 * Should be a regex pattern, e.g., '^.+\.execute-api\.us-east-1\.amazonaws\.com$'
 */
$trusted_hosts = getenv('DRUPAL_TRUSTED_HOSTS');
if ($trusted_hosts) {
  $settings['trusted_host_patterns'] = [
    $trusted_hosts,
  ];
}
else {
  // Allow all hosts in development mode
  $settings['trusted_host_patterns'] = [
    '^.+$',
  ];
}

/**
 * File paths.
 *
 * Public files are served via Nginx.
 * Private files are stored on EFS outside web root.
 */
$settings['file_public_path'] = 'sites/default/files';
$settings['file_private_path'] = '/var/www/drupal/private';
$settings['file_temp_path'] = '/tmp';

/**
 * Config sync directory.
 *
 * Exported Drupal configuration for site:install --existing-config.
 */
$settings['config_sync_directory'] = '/var/www/drupal/config/sync';

/**
 * Performance settings.
 */
if ($deployment_mode === 'production') {
  // Aggregate CSS and JS
  $config['system.performance']['css']['preprocess'] = TRUE;
  $config['system.performance']['js']['preprocess'] = TRUE;

  // Enable page caching
  $config['system.performance']['cache']['page']['max_age'] = 300;
}
else {
  // Development: Disable caching for easier debugging
  $config['system.performance']['css']['preprocess'] = FALSE;
  $config['system.performance']['js']['preprocess'] = FALSE;
  $config['system.performance']['cache']['page']['max_age'] = 0;
}

/**
 * Error display settings.
 */
if ($deployment_mode === 'development') {
  $config['system.logging']['error_level'] = 'verbose';
  ini_set('display_errors', 1);
}
else {
  $config['system.logging']['error_level'] = 'hide';
  ini_set('display_errors', 0);
}

/**
 * Reverse proxy settings for ALB.
 *
 * Required for proper HTTPS detection behind AWS ALB.
 */
$settings['reverse_proxy'] = TRUE;
$settings['reverse_proxy_addresses'] = [];
$settings['reverse_proxy_trusted_headers'] = \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_FOR |
  \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_HOST |
  \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_PORT |
  \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_PROTO;

/**
 * AWS configuration for AI services.
 */
$config['ndx_aws_ai.settings']['aws_region'] = getenv('AWS_REGION') ?: 'us-east-1';

/**
 * Council theme configuration.
 *
 * Used by ndx_council_generator module.
 */
$config['ndx_council_generator.settings']['council_theme'] = getenv('COUNCIL_THEME') ?: 'random';

/**
 * Session configuration.
 */
$settings['session_write_interval'] = 180;

/**
 * Update settings.
 *
 * Disable automatic updates in demo environment.
 */
$settings['update_free_access'] = FALSE;

/**
 * Container-aware configuration.
 */
$settings['container_yamls'][] = $app_root . '/' . $site_path . '/services.yml';

/**
 * Skip file system modifications during runtime.
 *
 * The container image should contain all required files.
 */
$settings['skip_permissions_hardening'] = TRUE;
