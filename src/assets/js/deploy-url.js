/**
 * NDX:Try CloudFormation Deployment URL Handler
 *
 * Progressive enhancement JavaScript for the deploy button functionality.
 * Works with the server-side URL generation as a fallback (works without JS).
 *
 * Features:
 * - Unique stack name generation with timestamp (AC-2.1.3)
 * - Confirmation modal before redirect (AC-2.1.4)
 * - Pre-requisite checkbox validation
 * - Return URL allowlist validation (AC-2.1.8)
 * - Deployment analytics tracking (placeholder for Epic 5)
 */

(function() {
  'use strict';

  // Configuration
  const STORAGE_KEY = 'ndx_deploy_session';
  const ALLOWED_RETURN_DOMAINS = [
    'localhost',
    '127.0.0.1',
    'ndx-try.service.gov.uk',
    'github.io'
  ];

  // DOM Elements
  const deployButton = document.getElementById('deploy-button');
  const deployModal = document.getElementById('deploy-modal');
  const modalContinue = document.getElementById('modal-continue');
  const modalCancel = document.getElementById('modal-cancel');
  const prereqChecks = document.querySelectorAll('.js-prereq-check');

  // State
  let deployUrl = '';

  /**
   * Initialize the deploy handler
   */
  function init() {
    if (!deployButton) {
      return;
    }

    // Get base deploy URL from data attribute
    const baseUrl = deployButton.dataset.deployUrl;
    if (!baseUrl || baseUrl === '#') {
      return;
    }

    // Store base URL for later modification
    deployUrl = baseUrl;

    // Set up event listeners
    setupEventListeners();

    // Enable progressive enhancement
    enableProgressiveEnhancement();
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Deploy button click - show modal instead of direct navigation
    deployButton.addEventListener('click', handleDeployClick);

    // Modal continue button
    if (modalContinue) {
      modalContinue.addEventListener('click', handleModalContinue);
    }

    // Modal cancel button
    if (modalCancel) {
      modalCancel.addEventListener('click', handleModalCancel);
    }

    // Close modal on escape key
    document.addEventListener('keydown', handleKeyDown);

    // Close modal on backdrop click
    if (deployModal) {
      deployModal.addEventListener('click', handleBackdropClick);
    }

    // Pre-requisite checkbox changes
    prereqChecks.forEach(checkbox => {
      checkbox.addEventListener('change', updateDeployButtonState);
    });
  }

  /**
   * Enable progressive enhancement features
   * Note: Deploy button click handler is set in setupEventListeners()
   */
  function enableProgressiveEnhancement() {
    // Initial button state check
    updateDeployButtonState();
  }

  /**
   * Handle deploy button click
   */
  function handleDeployClick(event) {
    event.preventDefault();

    // Generate unique stack name with timestamp
    const finalUrl = generateFinalDeployUrl();

    // Track deployment started event (placeholder for Epic 5 analytics)
    trackDeploymentStarted();

    // Show confirmation modal
    showModal(finalUrl);
  }

  /**
   * Generate final deploy URL with unique timestamp
   */
  function generateFinalDeployUrl() {
    // Generate timestamp for unique stack name (AC-2.1.3)
    const timestamp = Date.now().toString(36).substring(0, 8);

    // Replace {timestamp} placeholder in URL with actual timestamp
    let finalUrl = deployUrl.replace(encodeURIComponent('{timestamp}'), timestamp);
    finalUrl = finalUrl.replace('{timestamp}', timestamp);

    return finalUrl;
  }

  /**
   * Validate return URL against allowlist (AC-2.1.8)
   * Fixed: Uses proper subdomain matching to prevent bypass
   */
  function isAllowedReturnUrl(url) {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      // Check exact match OR proper subdomain (with leading dot)
      return ALLOWED_RETURN_DOMAINS.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate deploy URL is to AWS Console (security control)
   */
  function isValidAWSConsoleUrl(url) {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'console.aws.amazon.com' ||
             urlObj.hostname.endsWith('.console.aws.amazon.com');
    } catch {
      return false;
    }
  }

  /**
   * Show confirmation modal
   * Security: Validates URL is to AWS Console before showing
   */
  function showModal(finalUrl) {
    // SECURITY: Validate the URL is to AWS Console before proceeding
    if (!isValidAWSConsoleUrl(finalUrl)) {
      console.error('Deploy: Invalid destination URL - not AWS Console');
      return;
    }

    if (!deployModal) {
      // Fallback: direct navigation if modal not available
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Update continue button href
    if (modalContinue) {
      modalContinue.href = finalUrl;
      modalContinue.setAttribute('target', '_blank');
      modalContinue.setAttribute('rel', 'noopener noreferrer');
    }

    // Show modal using native dialog API with error handling
    try {
      if (typeof deployModal.showModal === 'function') {
        deployModal.showModal();
      } else {
        // Fallback for browsers without dialog support
        deployModal.setAttribute('open', '');
        deployModal.style.display = 'block';
      }
    } catch (e) {
      console.error('Deploy: Could not show modal', e);
      // Fallback: direct navigation
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Focus on cancel button for accessibility
    if (modalCancel) {
      modalCancel.focus();
    }

    // Save deployment session
    saveDeploymentSession();
  }

  /**
   * Handle modal continue button click
   */
  function handleModalContinue(event) {
    // Track that user proceeded to AWS Console
    trackDeploymentProceeded();

    // Close modal after brief delay to allow link to work
    setTimeout(() => {
      closeModal();
    }, 100);
  }

  /**
   * Handle modal cancel button click
   */
  function handleModalCancel() {
    closeModal();
  }

  /**
   * Close modal
   */
  function closeModal() {
    if (!deployModal) return;

    if (typeof deployModal.close === 'function') {
      deployModal.close();
    } else {
      deployModal.removeAttribute('open');
      deployModal.style.display = 'none';
    }

    // Return focus to deploy button
    if (deployButton) {
      deployButton.focus();
    }
  }

  /**
   * Handle escape key to close modal
   */
  function handleKeyDown(event) {
    if (event.key === 'Escape' && deployModal && deployModal.open) {
      closeModal();
    }
  }

  /**
   * Handle backdrop click to close modal
   */
  function handleBackdropClick(event) {
    if (event.target === deployModal) {
      closeModal();
    }
  }

  /**
   * Update deploy button state based on prerequisites (AC-2.3.4)
   * Button is visually disabled until all acknowledgments are checked.
   * Note: Button remains a functional link for progressive enhancement (no-JS fallback).
   */
  function updateDeployButtonState() {
    if (prereqChecks.length === 0) return;

    const allChecked = Array.from(prereqChecks).every(cb => cb.checked);
    const checkedCount = Array.from(prereqChecks).filter(cb => cb.checked).length;
    const totalCount = prereqChecks.length;

    // Update visual state and aria attributes
    if (allChecked) {
      deployButton.classList.remove('ndx-deploy-button--disabled');
      deployButton.removeAttribute('aria-disabled');
      deployButton.setAttribute('data-ready', 'true');
    } else {
      deployButton.classList.add('ndx-deploy-button--disabled');
      deployButton.setAttribute('aria-disabled', 'true');
      deployButton.setAttribute('data-ready', 'false');
    }

    // Update button help text with progress
    const helpText = document.querySelector('.ndx-deploy-action .govuk-body-s');
    if (helpText && !allChecked) {
      helpText.textContent = `Complete all ${totalCount} acknowledgments above to enable deployment (${checkedCount}/${totalCount} done)`;
    } else if (helpText && allChecked) {
      helpText.textContent = 'Opens AWS CloudFormation Console in a new tab';
    }
  }

  /**
   * Save deployment session to session storage
   */
  function saveDeploymentSession() {
    const scenarioId = deployButton.dataset.scenarioId;

    try {
      const session = {
        scenarioId: scenarioId,
        deploymentStartedAt: new Date().toISOString(),
        awsSessionChecked: false,
        interstitialShown: true,
        interstitialAccepted: false
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Deploy: Could not save session state');
    }
  }

  /**
   * Track deployment started event (placeholder for Epic 5)
   */
  function trackDeploymentStarted() {
    const scenarioId = deployButton.dataset.scenarioId;

    // Analytics placeholder - will be implemented in Epic 5
    if (typeof window.ndxAnalytics !== 'undefined') {
      window.ndxAnalytics.track('deployment_started', {
        scenario_id: scenarioId,
        timestamp: new Date().toISOString()
      });
    }

    // Console log for debugging
    console.log('NDX:Try - Deployment started:', scenarioId);
  }

  /**
   * Track that user proceeded to AWS Console
   */
  function trackDeploymentProceeded() {
    const scenarioId = deployButton.dataset.scenarioId;

    // Update session storage
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        session.interstitialAccepted = true;
        session.proceededAt = new Date().toISOString();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch (e) {
      console.warn('Deploy: Could not update session state');
    }

    // Analytics placeholder
    if (typeof window.ndxAnalytics !== 'undefined') {
      window.ndxAnalytics.track('deployment_proceeded', {
        scenario_id: scenarioId,
        timestamp: new Date().toISOString()
      });
    }

    console.log('NDX:Try - User proceeded to AWS Console:', scenarioId);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
