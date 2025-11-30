/**
 * Walkthrough Progress Tracker (Story 15.2)
 *
 * Manages walkthrough progress via localStorage:
 * - Tracks current step and completed steps per scenario
 * - Persists across sessions
 * - Graceful degradation when localStorage unavailable
 *
 * Schema: ndx_walkthrough_progress
 * {
 *   "scenario-id": {
 *     "currentStep": number,
 *     "totalSteps": number,
 *     "completedSteps": number[],
 *     "startedAt": ISO string,
 *     "lastVisited": ISO string,
 *     "completed": boolean,
 *     "completedAt": ISO string | null
 *   }
 * }
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'ndx_walkthrough_progress';

  // Expose API globally
  window.NDXProgress = {
    getProgress: getProgress,
    setProgress: setProgress,
    getScenarioProgress: getScenarioProgress,
    updateStep: updateStep,
    markCompleted: markCompleted,
    clearProgress: clearProgress,
    clearScenarioProgress: clearScenarioProgress,
    getCompletedScenarios: getCompletedScenarios,
    isLocalStorageAvailable: isLocalStorageAvailable
  };

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
   * Get all progress data
   */
  function getProgress() {
    if (!isLocalStorageAvailable()) return {};

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to read progress data:', e);
      return {};
    }
  }

  /**
   * Set all progress data
   */
  function setProgress(data) {
    if (!isLocalStorageAvailable()) return false;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save progress data:', e);
      return false;
    }
  }

  /**
   * Get progress for a specific scenario
   */
  function getScenarioProgress(scenarioId) {
    const progress = getProgress();
    return progress[scenarioId] || null;
  }

  /**
   * Update step progress for a scenario
   * @param {string} scenarioId - The scenario ID
   * @param {number} currentStep - Current step number (1-based)
   * @param {number} totalSteps - Total number of steps
   */
  function updateStep(scenarioId, currentStep, totalSteps) {
    if (!isLocalStorageAvailable()) return false;

    const progress = getProgress();
    const now = new Date().toISOString();

    if (!progress[scenarioId]) {
      // First visit to this scenario's walkthrough
      progress[scenarioId] = {
        currentStep: currentStep,
        totalSteps: totalSteps,
        completedSteps: [],
        startedAt: now,
        lastVisited: now,
        completed: false,
        completedAt: null
      };
    } else {
      // Update existing progress
      progress[scenarioId].currentStep = currentStep;
      progress[scenarioId].totalSteps = totalSteps;
      progress[scenarioId].lastVisited = now;
    }

    // Mark previous steps as completed
    if (currentStep > 1) {
      const completedSet = new Set(progress[scenarioId].completedSteps);
      for (let i = 1; i < currentStep; i++) {
        completedSet.add(i);
      }
      progress[scenarioId].completedSteps = Array.from(completedSet).sort((a, b) => a - b);
    }

    // Track analytics event
    if (window.NDXAnalytics && typeof window.NDXAnalytics.track === 'function') {
      window.NDXAnalytics.track('walkthrough_step', {
        scenario: scenarioId,
        step: currentStep,
        totalSteps: totalSteps
      });
    }

    return setProgress(progress);
  }

  /**
   * Mark a scenario walkthrough as completed
   */
  function markCompleted(scenarioId, totalSteps) {
    if (!isLocalStorageAvailable()) return false;

    const progress = getProgress();
    const now = new Date().toISOString();

    if (!progress[scenarioId]) {
      progress[scenarioId] = {
        currentStep: totalSteps + 1, // Beyond last step = complete
        totalSteps: totalSteps,
        completedSteps: [],
        startedAt: now,
        lastVisited: now,
        completed: true,
        completedAt: now
      };
    } else {
      progress[scenarioId].completed = true;
      progress[scenarioId].completedAt = now;
      progress[scenarioId].lastVisited = now;
      progress[scenarioId].currentStep = totalSteps + 1;
    }

    // Mark all steps as completed
    progress[scenarioId].completedSteps = Array.from(
      { length: totalSteps },
      (_, i) => i + 1
    );

    // Track analytics event
    if (window.NDXAnalytics && typeof window.NDXAnalytics.track === 'function') {
      window.NDXAnalytics.track('walkthrough_complete', {
        scenario: scenarioId,
        totalSteps: totalSteps
      });
    }

    return setProgress(progress);
  }

  /**
   * Clear all progress data
   */
  function clearProgress() {
    if (!isLocalStorageAvailable()) return false;

    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.warn('Failed to clear progress data:', e);
      return false;
    }
  }

  /**
   * Clear progress for a specific scenario
   */
  function clearScenarioProgress(scenarioId) {
    if (!isLocalStorageAvailable()) return false;

    const progress = getProgress();
    if (progress[scenarioId]) {
      delete progress[scenarioId];
      return setProgress(progress);
    }
    return true;
  }

  /**
   * Get list of completed scenario IDs
   */
  function getCompletedScenarios() {
    const progress = getProgress();
    return Object.keys(progress).filter(function(id) {
      return progress[id].completed === true;
    });
  }

  /**
   * Auto-initialize on page load
   * Detects walkthrough pages and updates progress
   */
  function init() {
    // Check if we're on a walkthrough page
    const path = window.location.pathname;
    const walkthroughMatch = path.match(/^\/walkthroughs\/([^\/]+)\/(?:step-(\d+)|complete)?\/?$/);

    if (!walkthroughMatch) return;

    const scenarioId = walkthroughMatch[1];
    const stepMatch = path.match(/step-(\d+)/);
    const isCompletePage = path.includes('/complete');

    // Get total steps from page data attribute or default to 4
    const pageElement = document.querySelector('[data-total-steps]');
    const totalSteps = pageElement ? parseInt(pageElement.dataset.totalSteps, 10) : 4;

    if (stepMatch) {
      // On a step page
      const currentStep = parseInt(stepMatch[1], 10);
      updateStep(scenarioId, currentStep, totalSteps);
    } else if (isCompletePage) {
      // On completion page
      markCompleted(scenarioId, totalSteps);
    } else {
      // On landing page (step 0)
      updateStep(scenarioId, 0, totalSteps);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
