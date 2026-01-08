/**
 * Experiment Tracker (Story 6.3)
 *
 * Manages experiment completion via localStorage:
 * - Tracks completed experiments per scenario
 * - Updates progress bar and count
 * - Handles difficulty filtering
 * - Copy to clipboard functionality
 * - Deep link URL construction
 *
 * Schema: ndx-experiments-{scenarioId}
 * {
 *   completed: ['experiment-id-1', 'experiment-id-2'],
 *   timestamp: number
 * }
 */

(function() {
  'use strict';

  const SCENARIO_ID = 'localgov-drupal';
  const STORAGE_KEY = `ndx-experiments-${SCENARIO_ID}`;
  const DEPLOYMENT_KEY = `ndx-deployment-${SCENARIO_ID}`;

  /**
   * Check if localStorage is available
   */
  function isLocalStorageAvailable() {
    try {
      const test = '__ndx_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get experiment completion data
   */
  function getExperimentData() {
    if (!isLocalStorageAvailable()) return { completed: [], timestamp: 0 };

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { completed: [], timestamp: 0 };
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read experiment data:', e);
      return { completed: [], timestamp: 0 };
    }
  }

  /**
   * Save experiment completion data
   */
  function saveExperimentData(data) {
    if (!isLocalStorageAvailable()) return false;

    try {
      data.timestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save experiment data:', e);
      return false;
    }
  }

  /**
   * Toggle experiment completion
   */
  function toggleExperiment(experimentId, completed) {
    const data = getExperimentData();
    const index = data.completed.indexOf(experimentId);

    if (completed && index === -1) {
      data.completed.push(experimentId);
    } else if (!completed && index > -1) {
      data.completed.splice(index, 1);
    }

    saveExperimentData(data);
    updateProgressUI();

    // Track analytics event
    if (window.NDXAnalytics && typeof window.NDXAnalytics.track === 'function') {
      window.NDXAnalytics.track('experiment_complete', {
        scenario: SCENARIO_ID,
        experiment: experimentId,
        completed: completed
      });
    }
  }

  /**
   * Reset all experiment progress
   */
  function resetProgress() {
    if (!isLocalStorageAvailable()) return;

    localStorage.removeItem(STORAGE_KEY);

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('.ndx-experiment-checkbox');
    checkboxes.forEach(function(checkbox) {
      checkbox.checked = false;
      updateCardState(checkbox.dataset.experimentId, false);
    });

    updateProgressUI();
  }

  /**
   * Update the progress UI (count and bar)
   */
  function updateProgressUI() {
    const data = getExperimentData();
    const totalCards = document.querySelectorAll('.ndx-experiment-card').length;
    const completedCount = data.completed.length;

    // Update count
    const countElement = document.getElementById('progress-count');
    if (countElement) {
      countElement.textContent = `${completedCount} of ${totalCards}`;
    }

    // Update progress bar
    const fillElement = document.getElementById('progress-fill');
    if (fillElement) {
      const percentage = totalCards > 0 ? (completedCount / totalCards) * 100 : 0;
      fillElement.style.width = `${percentage}%`;
    }
  }

  /**
   * Update card visual state
   */
  function updateCardState(experimentId, completed) {
    const card = document.querySelector(`[data-experiment-id="${experimentId}"]`);
    if (card) {
      if (completed) {
        card.classList.add('ndx-experiment-card--completed');
      } else {
        card.classList.remove('ndx-experiment-card--completed');
      }
    }
  }

  /**
   * Initialize checkbox states from localStorage
   */
  function initCheckboxStates() {
    const data = getExperimentData();
    const checkboxes = document.querySelectorAll('.ndx-experiment-checkbox');

    checkboxes.forEach(function(checkbox) {
      const experimentId = checkbox.dataset.experimentId;
      const isCompleted = data.completed.includes(experimentId);
      checkbox.checked = isCompleted;
      updateCardState(experimentId, isCompleted);
    });

    updateProgressUI();
  }

  /**
   * Get deployment URL from localStorage
   */
  function getDeploymentUrl() {
    if (!isLocalStorageAvailable()) return null;

    try {
      const data = localStorage.getItem(DEPLOYMENT_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      // Check for 90-minute expiry
      const maxAge = 90 * 60 * 1000;
      if (parsed.timestamp && (Date.now() - parsed.timestamp) > maxAge) {
        return null;
      }
      return parsed.drupalUrl || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Sanitize URL to prevent XSS
   */
  function sanitizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '#';
      }
      return parsed.href;
    } catch (e) {
      return '#';
    }
  }

  /**
   * Update deep link buttons with deployment URL
   */
  function updateDeepLinks() {
    const drupalUrl = getDeploymentUrl();
    const buttons = document.querySelectorAll('.ndx-experiment-card__try-button[data-drupal-path]');
    const deploymentNotice = document.getElementById('deployment-notice');

    if (drupalUrl) {
      buttons.forEach(function(button) {
        const drupalPath = button.getAttribute('data-drupal-path');
        button.href = sanitizeUrl(drupalUrl + drupalPath);
        button.style.display = '';
      });
      if (deploymentNotice) {
        deploymentNotice.hidden = true;
      }
    } else {
      buttons.forEach(function(button) {
        button.href = '/scenarios/localgov-drupal/';
        button.textContent = 'Deploy first';
      });
      if (deploymentNotice) {
        deploymentNotice.hidden = false;
      }
    }
  }

  /**
   * Handle difficulty filter changes
   */
  function handleFilterChange() {
    const filters = document.querySelectorAll('input[name="difficulty"]');
    const activeFilters = [];

    filters.forEach(function(filter) {
      if (filter.checked) {
        activeFilters.push(filter.value);
      }
    });

    // Show/hide sections based on filters
    const sections = document.querySelectorAll('.ndx-experiment-section[data-difficulty]');
    sections.forEach(function(section) {
      const difficulty = section.dataset.difficulty;
      if (activeFilters.includes(difficulty)) {
        section.hidden = false;
      } else {
        section.hidden = true;
      }
    });
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);

      // Visual feedback
      const originalText = button.innerHTML;
      button.classList.add('ndx-copy-button--copied');
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
      `;

      setTimeout(function() {
        button.classList.remove('ndx-copy-button--copied');
        button.innerHTML = originalText;
      }, 2000);

      return true;
    } catch (e) {
      console.warn('Failed to copy:', e);

      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (e2) {
        console.warn('Fallback copy failed:', e2);
        return false;
      }
    }
  }

  /**
   * Initialize all event listeners
   */
  function initEventListeners() {
    // Checkbox change events
    document.addEventListener('change', function(e) {
      if (e.target.classList.contains('ndx-experiment-checkbox')) {
        const experimentId = e.target.dataset.experimentId;
        toggleExperiment(experimentId, e.target.checked);
        updateCardState(experimentId, e.target.checked);
      }

      // Difficulty filter changes
      if (e.target.name === 'difficulty') {
        handleFilterChange();
      }
    });

    // Reset progress button
    const resetButton = document.getElementById('reset-progress');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all experiment progress?')) {
          resetProgress();
        }
      });
    }

    // Copy buttons
    document.addEventListener('click', function(e) {
      const copyButton = e.target.closest('.ndx-copy-button');
      if (copyButton) {
        const targetId = copyButton.dataset.copyTarget;
        const textarea = document.getElementById(targetId);
        if (textarea) {
          copyToClipboard(textarea.value, copyButton);
        }
      }
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    initCheckboxStates();
    updateDeepLinks();
    initEventListeners();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external use
  window.NDXExperiments = {
    getExperimentData: getExperimentData,
    toggleExperiment: toggleExperiment,
    resetProgress: resetProgress
  };
})();
