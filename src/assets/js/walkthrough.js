/**
 * Walkthrough Progress Tracking (Story 3.2 - AC-3.2.4, AC-3.2.9)
 *
 * Features:
 * - Copy-to-clipboard functionality with visual confirmation
 * - Progress tracking with localStorage persistence
 * - Resume from last completed step on page load
 * - Keyboard accessible interactions
 * - Progressive enhancement (works without JS)
 *
 * ADR-4 (Vanilla JavaScript): No frameworks, plain JS only
 */

(function() {
  'use strict';

  // Configuration
  const STORAGE_KEY_PREFIX = 'ndx-walkthrough-';
  const COPY_CONFIRMATION_DURATION = 3000; // 3 seconds

  /**
   * Initialize copy-to-clipboard functionality
   * AC-3.2.4: Copy-to-clipboard function works with visual confirmation
   */
  function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.ndx-walkthrough-step__copy-btn');

    copyButtons.forEach(function(button) {
      button.addEventListener('click', handleCopyClick);
    });
  }

  /**
   * Handle copy button click
   */
  function handleCopyClick(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute('data-copy-target');
    const stepNumber = button.getAttribute('data-step');

    if (!targetId) {
      console.error('Copy button missing data-copy-target attribute');
      return;
    }

    const textElement = document.getElementById(targetId);
    if (!textElement) {
      console.error('Copy target element not found:', targetId);
      return;
    }

    const textToCopy = textElement.textContent.trim();

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(function() {
          showCopyConfirmation(stepNumber, button);
          trackCopyEvent(stepNumber);
        })
        .catch(function(error) {
          console.error('Clipboard API failed:', error);
          fallbackCopy(textToCopy, stepNumber, button);
        });
    } else {
      // Fallback for older browsers
      fallbackCopy(textToCopy, stepNumber, button);
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  function fallbackCopy(text, stepNumber, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.setAttribute('aria-hidden', 'true');

    document.body.appendChild(textArea);
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopyConfirmation(stepNumber, button);
        trackCopyEvent(stepNumber);
      } else {
        showCopyError(stepNumber);
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      showCopyError(stepNumber);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Show copy confirmation message
   */
  function showCopyConfirmation(stepNumber, button) {
    const confirmationId = 'copy-confirmation-' + stepNumber;
    const confirmation = document.getElementById(confirmationId);

    if (!confirmation) return;

    // Update button text temporarily
    const originalLabel = button.querySelector('.ndx-walkthrough-step__copy-label');
    const originalText = originalLabel.textContent;
    originalLabel.textContent = 'Copied!';
    button.classList.add('ndx-walkthrough-step__copy-btn--success');

    // Show confirmation message
    confirmation.hidden = false;

    // Reset after timeout
    setTimeout(function() {
      confirmation.hidden = true;
      originalLabel.textContent = originalText;
      button.classList.remove('ndx-walkthrough-step__copy-btn--success');
    }, COPY_CONFIRMATION_DURATION);
  }

  /**
   * Show copy error message
   */
  function showCopyError(stepNumber) {
    alert('Failed to copy to clipboard. Please try selecting and copying the text manually.');
  }

  /**
   * Track copy event for analytics
   */
  function trackCopyEvent(stepNumber) {
    // Store in localStorage that this step was attempted
    const scenarioId = getScenarioId();
    const progressKey = STORAGE_KEY_PREFIX + scenarioId;
    const progress = getProgress(scenarioId);

    if (!progress.stepsAttempted) {
      progress.stepsAttempted = [];
    }

    if (!progress.stepsAttempted.includes(stepNumber)) {
      progress.stepsAttempted.push(stepNumber);
      saveProgress(scenarioId, progress);
    }
  }

  /**
   * Get scenario ID from current page
   */
  function getScenarioId() {
    // Extract from URL path: /walkthroughs/council-chatbot/...
    const pathParts = window.location.pathname.split('/');
    const walkthroughIndex = pathParts.indexOf('walkthroughs');

    if (walkthroughIndex !== -1 && pathParts[walkthroughIndex + 1]) {
      return pathParts[walkthroughIndex + 1];
    }

    return 'council-chatbot'; // default
  }

  /**
   * Get current step number from page
   */
  function getCurrentStep() {
    // Extract from URL: step-1, step-2, etc.
    const path = window.location.pathname;

    if (path.includes('/complete')) {
      return 5; // completion page
    }

    const stepMatch = path.match(/step-(\d+)/);
    if (stepMatch) {
      return parseInt(stepMatch[1], 10);
    }

    return 0; // landing page
  }

  /**
   * Get progress from localStorage
   * AC-3.2.9: Progress persists across browser refresh
   */
  function getProgress(scenarioId) {
    const key = STORAGE_KEY_PREFIX + scenarioId;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading progress from localStorage:', error);
    }

    // Default progress object
    return {
      currentStep: 0,
      stepsCompleted: [],
      stepsAttempted: [],
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save progress to localStorage
   */
  function saveProgress(scenarioId, progress) {
    const key = STORAGE_KEY_PREFIX + scenarioId;
    progress.lastUpdated = new Date().toISOString();

    try {
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }

  /**
   * Update progress when page loads
   */
  function updateProgress() {
    const scenarioId = getScenarioId();
    const currentStep = getCurrentStep();
    const progress = getProgress(scenarioId);

    // Update current step if it's further than before
    if (currentStep > progress.currentStep) {
      progress.currentStep = currentStep;

      // Mark previous step as completed
      if (currentStep > 1 && !progress.stepsCompleted.includes(currentStep - 1)) {
        progress.stepsCompleted.push(currentStep - 1);
      }

      saveProgress(scenarioId, progress);
    }
  }

  /**
   * Show resume notification if user has previous progress
   */
  function showResumeNotification() {
    const scenarioId = getScenarioId();
    const currentStep = getCurrentStep();
    const progress = getProgress(scenarioId);

    // Only show on landing page if user has made progress
    if (currentStep === 0 && progress.currentStep > 0) {
      const resumeNotification = createResumeNotification(progress, scenarioId);
      const mainContent = document.querySelector('.govuk-grid-column-two-thirds');

      if (mainContent) {
        mainContent.insertBefore(resumeNotification, mainContent.firstChild);
      }
    }
  }

  /**
   * Create resume notification element
   */
  function createResumeNotification(progress, scenarioId) {
    const notification = document.createElement('div');
    notification.className = 'govuk-notification-banner';
    notification.setAttribute('role', 'region');
    notification.setAttribute('aria-labelledby', 'resume-banner-title');
    notification.setAttribute('data-module', 'govuk-notification-banner');

    const lastStep = progress.currentStep;
    const lastStepUrl = '/walkthroughs/' + scenarioId + '/step-' + lastStep + '/';

    // Build header
    const header = document.createElement('div');
    header.className = 'govuk-notification-banner__header';
    
    const title = document.createElement('h2');
    title.className = 'govuk-notification-banner__title';
    title.id = 'resume-banner-title';
    title.textContent = 'Continue walkthrough';
    header.appendChild(title);

    // Build content
    const content = document.createElement('div');
    content.className = 'govuk-notification-banner__content';
    
    const heading = document.createElement('p');
    heading.className = 'govuk-notification-banner__heading';
    heading.textContent = 'You were last on step ' + lastStep + '. Would you like to continue?';
    
    const actions = document.createElement('p');
    actions.className = 'govuk-body';
    
    const link = document.createElement('a');
    link.className = 'govuk-notification-banner__link';
    link.href = lastStepUrl;
    link.textContent = 'Resume from step ' + lastStep;
    
    const textNode = document.createTextNode(' or ');
    
    const restartButton = document.createElement('button');
    restartButton.type = 'button';
    restartButton.className = 'govuk-link ndx-restart-walkthrough';
    restartButton.style.background = 'none';
    restartButton.style.border = 'none';
    restartButton.style.padding = '0';
    restartButton.style.cursor = 'pointer';
    restartButton.style.textDecoration = 'underline';
    restartButton.textContent = 'start from the beginning';
    
    actions.appendChild(link);
    actions.appendChild(textNode);
    actions.appendChild(restartButton);
    
    content.appendChild(heading);
    content.appendChild(actions);
    
    notification.appendChild(header);
    notification.appendChild(content);

    // Add event listener for restart button
    restartButton.addEventListener('click', function() {
      if (confirm('This will reset your progress. Are you sure?')) {
        localStorage.removeItem(STORAGE_KEY_PREFIX + scenarioId);
        notification.remove();
      }
    });

    return notification;
  }

  /**
   * Add completion tracking
   */
  function trackCompletion() {
    const currentStep = getCurrentStep();

    if (currentStep === 5) { // Completion page
      const scenarioId = getScenarioId();
      const progress = getProgress(scenarioId);

      progress.completedAt = new Date().toISOString();
      progress.currentStep = 5;

      // Calculate total time
      if (progress.startedAt) {
        const startTime = new Date(progress.startedAt);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
        progress.durationMinutes = durationMinutes;
      }

      saveProgress(scenarioId, progress);
    }
  }

  /**
   * Initialize all walkthrough functionality
   */
  function initialize() {
    // Initialize copy buttons
    initializeCopyButtons();

    // Update progress
    updateProgress();

    // Show resume notification if applicable
    showResumeNotification();

    // Track completion
    trackCompletion();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
