/**
 * Deployment Progress Component - Story 2.2
 *
 * Provides real-time deployment progress tracking with:
 * - Stack status display with colour-coded badges
 * - Resource task list with checkmarks
 * - Progress bar with estimated time remaining
 * - Demo mode for previewing the deployment flow
 * - Accessibility via aria-live regions
 *
 * Note: Actual CloudFormation API polling would require AWS credentials.
 * This implementation provides demo mode and instructions for manual monitoring.
 */

(function () {
  'use strict';

  // Configuration
  const STATUS_CONFIG = {
    'CREATE_IN_PROGRESS': {
      icon: '⏳',
      text: 'Creating',
      class: 'ndx-status-badge--in-progress',
      description: 'Your stack is being created. This typically takes 10-15 minutes.'
    },
    'CREATE_COMPLETE': {
      icon: '✓',
      text: 'Complete',
      class: 'ndx-status-badge--success',
      description: 'Deployment successful! Check the Outputs tab for your credentials.'
    },
    'CREATE_FAILED': {
      icon: '✗',
      text: 'Failed',
      class: 'ndx-status-badge--error',
      description: 'Deployment failed. Check the Events tab for error details.'
    },
    'ROLLBACK_IN_PROGRESS': {
      icon: '↩',
      text: 'Rolling back',
      class: 'ndx-status-badge--warning',
      description: 'Stack creation failed and is rolling back. Resources are being cleaned up.'
    },
    'ROLLBACK_COMPLETE': {
      icon: '↩',
      text: 'Rolled back',
      class: 'ndx-status-badge--error',
      description: 'Rollback complete. The stack failed - check Events for the error.'
    },
    'DELETE_IN_PROGRESS': {
      icon: '🗑',
      text: 'Deleting',
      class: 'ndx-status-badge--warning',
      description: 'Stack is being deleted.'
    },
    'DELETE_COMPLETE': {
      icon: '🗑',
      text: 'Deleted',
      class: 'ndx-status-badge--neutral',
      description: 'Stack has been deleted.'
    }
  };

  // DOM elements
  let statusBadge;
  let statusDescription;
  let progressBar;
  let progressPercentage;
  let timeRemaining;
  let resourcesCompleted;
  let resourceList;
  let errorContainer;
  let successContainer;
  let demoStartBtn;
  let demoResetBtn;

  // State
  let demoInterval = null;
  let currentResourceIndex = 0;
  let totalResources = 0;

  /**
   * Initialize the deployment progress component
   */
  function init() {
    const container = document.getElementById('deployment-progress');
    if (!container) return;

    // Cache DOM elements
    statusBadge = document.getElementById('stack-status-badge');
    statusDescription = document.getElementById('stack-status-description');
    progressBar = document.getElementById('progress-bar-fill');
    progressPercentage = document.getElementById('progress-percentage');
    timeRemaining = document.getElementById('time-remaining');
    resourcesCompleted = document.getElementById('resources-completed');
    resourceList = document.getElementById('resource-list');
    errorContainer = document.getElementById('deployment-error');
    successContainer = document.getElementById('deployment-success');
    demoStartBtn = document.getElementById('demo-start-btn');
    demoResetBtn = document.getElementById('demo-reset-btn');

    // Count total resources
    if (resourceList) {
      totalResources = resourceList.querySelectorAll('.ndx-resource-list__item').length;
    }

    // Bind event listeners
    if (demoStartBtn) {
      demoStartBtn.addEventListener('click', startDemo);
    }
    if (demoResetBtn) {
      demoResetBtn.addEventListener('click', resetDemo);
    }

    // Check URL for stack parameter (for future AWS integration)
    checkUrlForStack();
  }

  /**
   * Update the stack status display
   * @param {string} status - CloudFormation stack status
   */
  function updateStatus(status) {
    if (!statusBadge || !STATUS_CONFIG[status]) return;

    const config = STATUS_CONFIG[status];

    // Update badge
    statusBadge.className = 'ndx-status-badge ' + config.class;
    statusBadge.querySelector('.ndx-status-badge__icon').textContent = config.icon;
    statusBadge.querySelector('.ndx-status-badge__text').textContent = config.text;

    // Update description
    if (statusDescription) {
      statusDescription.textContent = config.description;
    }

    // Show/hide error container
    if (errorContainer) {
      errorContainer.hidden = !['CREATE_FAILED', 'ROLLBACK_COMPLETE'].includes(status);
    }

    // Show/hide success container
    if (successContainer) {
      successContainer.hidden = status !== 'CREATE_COMPLETE';
    }
  }

  /**
   * Update progress bar and percentage
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} estTime - Estimated time remaining string
   */
  function updateProgress(percent, estTime) {
    if (progressBar) {
      progressBar.style.width = percent + '%';
      progressBar.parentElement.setAttribute('aria-valuenow', percent);
    }
    if (progressPercentage) {
      progressPercentage.textContent = percent + '%';
    }
    if (timeRemaining) {
      timeRemaining.textContent = estTime || '--';
    }
  }

  /**
   * Mark a resource as complete
   * @param {number} index - Resource index (0-based)
   */
  function completeResource(index) {
    if (!resourceList) return;

    const items = resourceList.querySelectorAll('.ndx-resource-list__item');
    if (index >= items.length) return;

    const item = items[index];
    const icon = item.querySelector('.ndx-resource-list__icon');
    const status = item.querySelector('.ndx-resource-list__status');

    item.classList.add('ndx-resource-list__item--complete');
    if (icon) icon.textContent = '✓';
    if (status) status.textContent = 'Complete';

    // Update completed count
    if (resourcesCompleted) {
      resourcesCompleted.textContent = index + 1;
    }
  }

  /**
   * Mark a resource as in progress
   * @param {number} index - Resource index (0-based)
   */
  function setResourceInProgress(index) {
    if (!resourceList) return;

    const items = resourceList.querySelectorAll('.ndx-resource-list__item');
    if (index >= items.length) return;

    const item = items[index];
    const icon = item.querySelector('.ndx-resource-list__icon');
    const status = item.querySelector('.ndx-resource-list__status');

    item.classList.add('ndx-resource-list__item--in-progress');
    if (icon) icon.textContent = '◐';
    if (status) status.textContent = 'In progress';
  }

  /**
   * Calculate estimated time remaining
   * @param {number} completedResources - Number of completed resources
   * @param {number} totalResources - Total number of resources
   * @returns {string} Formatted time remaining
   */
  function calculateTimeRemaining(completedResources, totalResources) {
    if (completedResources >= totalResources) return 'Complete';

    // Estimate based on typical deployment times (in seconds)
    const typicalTimes = [30, 180, 60, 120, 300, 60]; // Matches deployment phases
    let remainingSeconds = 0;

    for (let i = completedResources; i < totalResources && i < typicalTimes.length; i++) {
      remainingSeconds += typicalTimes[i];
    }

    if (remainingSeconds < 60) {
      return 'Less than 1 minute';
    } else if (remainingSeconds < 120) {
      return 'About 1 minute';
    } else {
      return 'About ' + Math.ceil(remainingSeconds / 60) + ' minutes';
    }
  }

  /**
   * Start the demo mode to show deployment progress
   */
  function startDemo() {
    if (demoInterval) return;

    // Reset state
    currentResourceIndex = 0;
    updateStatus('CREATE_IN_PROGRESS');
    updateProgress(0, calculateTimeRemaining(0, totalResources));

    // Show reset button
    if (demoStartBtn) demoStartBtn.hidden = true;
    if (demoResetBtn) demoResetBtn.hidden = false;

    // Simulate deployment progress
    setResourceInProgress(0);

    demoInterval = setInterval(function () {
      // Complete current resource
      completeResource(currentResourceIndex);
      currentResourceIndex++;

      // Calculate progress
      const percent = Math.round((currentResourceIndex / totalResources) * 100);
      const estTime = calculateTimeRemaining(currentResourceIndex, totalResources);
      updateProgress(percent, estTime);

      if (currentResourceIndex >= totalResources) {
        // Deployment complete
        clearInterval(demoInterval);
        demoInterval = null;
        updateStatus('CREATE_COMPLETE');

        // Announce to screen readers
        announceToScreenReader('Deployment complete! Your LocalGov Drupal instance is ready.');
      } else {
        // Set next resource in progress
        setResourceInProgress(currentResourceIndex);
      }
    }, 1500); // 1.5 second per resource for demo
  }

  /**
   * Reset the demo to initial state
   */
  function resetDemo() {
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }

    currentResourceIndex = 0;

    // Reset status
    if (statusBadge) {
      statusBadge.className = 'ndx-status-badge ndx-status-badge--pending';
      statusBadge.querySelector('.ndx-status-badge__icon').textContent = '⏳';
      statusBadge.querySelector('.ndx-status-badge__text').textContent = 'Waiting to start';
    }
    if (statusDescription) {
      statusDescription.textContent = 'Click "Deploy to Innovation Sandbox" above to begin deployment.';
    }

    // Reset progress
    updateProgress(0, '--');

    // Reset resources
    if (resourceList) {
      const items = resourceList.querySelectorAll('.ndx-resource-list__item');
      items.forEach(function (item) {
        item.classList.remove('ndx-resource-list__item--complete', 'ndx-resource-list__item--in-progress');
        const icon = item.querySelector('.ndx-resource-list__icon');
        const status = item.querySelector('.ndx-resource-list__status');
        if (icon) icon.textContent = '○';
        if (status) status.textContent = 'Pending';
      });
    }

    if (resourcesCompleted) {
      resourcesCompleted.textContent = '0';
    }

    // Hide error/success containers
    if (errorContainer) errorContainer.hidden = true;
    if (successContainer) successContainer.hidden = true;

    // Show start button
    if (demoStartBtn) demoStartBtn.hidden = false;
    if (demoResetBtn) demoResetBtn.hidden = true;
  }

  /**
   * Check URL for stack parameter (future AWS integration point)
   */
  function checkUrlForStack() {
    const urlParams = new URLSearchParams(window.location.search);
    const stackName = urlParams.get('stack');

    if (stackName) {
      // Future: Could poll CloudFormation API with proper auth
      console.log('Stack monitoring requested for:', stackName);
      updateStatus('CREATE_IN_PROGRESS');
    }
  }

  /**
   * Announce message to screen readers via aria-live region
   * @param {string} message - Message to announce
   */
  function announceToScreenReader(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'govuk-visually-hidden';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(function () {
      document.body.removeChild(announcer);
    }, 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
