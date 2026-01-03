/**
 * Explore Page JavaScript (Story 6.2)
 *
 * Handles:
 * - Reading deployment URL from localStorage
 * - Displaying deployment banner
 * - Constructing deep links for AI feature cards
 * - Fallback UI when no deployment detected
 */

(function() {
  'use strict';

  const SCENARIO_ID = 'localgov-drupal';
  const STORAGE_KEY = `ndx-deployment-${SCENARIO_ID}`;

  /**
   * Get deployment data from localStorage
   * @returns {Object|null} Deployment data or null if not found
   */
  function getDeploymentData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Validate required fields
      if (!parsed.drupalUrl) return null;

      // Check if deployment is not too old (90 minutes = 5400000ms)
      const maxAge = 90 * 60 * 1000;
      if (parsed.timestamp && (Date.now() - parsed.timestamp) > maxAge) {
        console.log('Deployment data expired');
        return null;
      }

      return parsed;
    } catch (e) {
      console.error('Error reading deployment data:', e);
      return null;
    }
  }

  /**
   * Sanitize URL to prevent XSS
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';

    // Only allow http/https protocols
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.href;
    } catch {
      return '';
    }
  }

  /**
   * Update deployment banner with URL
   * @param {string} drupalUrl - The Drupal deployment URL
   */
  function showDeploymentBanner(drupalUrl) {
    const banner = document.getElementById('deployment-banner');
    const urlElement = document.getElementById('deployment-url');
    const noDeploymentBanner = document.getElementById('no-deployment-banner');

    if (banner && urlElement) {
      const sanitizedUrl = sanitizeUrl(drupalUrl);
      if (sanitizedUrl) {
        urlElement.href = sanitizedUrl;
        urlElement.textContent = sanitizedUrl;
        banner.hidden = false;

        if (noDeploymentBanner) {
          noDeploymentBanner.hidden = true;
        }
      }
    }
  }

  /**
   * Update all feature card deep links with deployment URL
   * @param {string} drupalUrl - The Drupal deployment URL
   */
  function updateFeatureLinks(drupalUrl) {
    const buttons = document.querySelectorAll('.ndx-ai-feature-card__button[data-drupal-path]');

    buttons.forEach(button => {
      const drupalPath = button.getAttribute('data-drupal-path');
      if (drupalPath && drupalUrl) {
        // Construct full URL
        const baseUrl = drupalUrl.endsWith('/') ? drupalUrl.slice(0, -1) : drupalUrl;
        const fullUrl = sanitizeUrl(baseUrl + drupalPath);

        if (fullUrl) {
          button.href = fullUrl;
        }
      }
    });

    // Remove disabled state from cards
    const cards = document.querySelectorAll('.ndx-ai-feature-card');
    cards.forEach(card => {
      card.classList.remove('ndx-ai-feature-card--no-deployment');
    });
  }

  /**
   * Show fallback UI when no deployment is detected
   */
  function showNoDeploymentState() {
    const noDeploymentBanner = document.getElementById('no-deployment-banner');
    if (noDeploymentBanner) {
      noDeploymentBanner.hidden = false;
    }

    // Add disabled state to cards
    const cards = document.querySelectorAll('.ndx-ai-feature-card');
    cards.forEach(card => {
      card.classList.add('ndx-ai-feature-card--no-deployment');
    });

    // Update buttons to show login message
    const buttons = document.querySelectorAll('.ndx-ai-feature-card__button[data-drupal-path]');
    buttons.forEach(button => {
      button.href = '/scenarios/localgov-drupal/';
      button.setAttribute('target', '_self');
      button.textContent = 'Deploy first';
      button.setAttribute('aria-label', 'Deploy LocalGov Drupal to try this feature');
    });
  }

  /**
   * Initialize the explore page
   */
  function init() {
    const deploymentData = getDeploymentData();

    if (deploymentData && deploymentData.drupalUrl) {
      const sanitizedUrl = sanitizeUrl(deploymentData.drupalUrl);
      if (sanitizedUrl) {
        showDeploymentBanner(sanitizedUrl);
        updateFeatureLinks(sanitizedUrl);
        return;
      }
    }

    // No valid deployment found
    showNoDeploymentState();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Listen for storage events (in case deployment happens in another tab)
  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY) {
      init();
    }
  });
})();
