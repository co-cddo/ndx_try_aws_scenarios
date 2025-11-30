/**
 * NDX:Try Exploration State Manager (Story 6.1)
 * Manages LocalStorage state for exploration activities with graceful degradation
 */
const ExplorationState = {
  STORAGE_KEY: 'ndx_exploration_state',

  /**
   * Check if LocalStorage is available
   */
  isAvailable() {
    try {
      const test = '__ndx_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get the default state object
   */
  getDefaultState() {
    return {
      simplifyMode: false,
      advancedMode: false,
      completedActivities: {},
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Load state from LocalStorage
   */
  load() {
    if (!this.isAvailable()) {
      console.warn('[ExplorationState] LocalStorage unavailable, using in-memory state');
      return this.getDefaultState();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultState();
      }
      const parsed = JSON.parse(stored);
      // Validate structure
      if (typeof parsed !== 'object' || !parsed.completedActivities) {
        return this.getDefaultState();
      }
      return parsed;
    } catch (e) {
      console.error('[ExplorationState] Error loading state:', e);
      return this.getDefaultState();
    }
  },

  /**
   * Save state to LocalStorage
   */
  save(state) {
    if (!this.isAvailable()) {
      console.warn('[ExplorationState] LocalStorage unavailable, state not persisted');
      return false;
    }

    try {
      state.timestamp = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('[ExplorationState] Error saving state:', e);
      return false;
    }
  },

  /**
   * Get simplify mode preference
   */
  getSimplifyMode() {
    return this.load().simplifyMode;
  },

  /**
   * Set simplify mode preference
   */
  setSimplifyMode(enabled) {
    const state = this.load();
    state.simplifyMode = enabled;
    return this.save(state);
  },

  /**
   * Get advanced mode preference
   */
  getAdvancedMode() {
    return this.load().advancedMode;
  },

  /**
   * Set advanced mode preference
   */
  setAdvancedMode(enabled) {
    const state = this.load();
    state.advancedMode = enabled;
    return this.save(state);
  },

  /**
   * Mark an activity as completed for a scenario
   */
  markActivityCompleted(scenarioId, activityId) {
    const state = this.load();
    if (!state.completedActivities[scenarioId]) {
      state.completedActivities[scenarioId] = [];
    }
    if (!state.completedActivities[scenarioId].includes(activityId)) {
      state.completedActivities[scenarioId].push(activityId);
    }
    return this.save(state);
  },

  /**
   * Check if an activity is completed
   */
  isActivityCompleted(scenarioId, activityId) {
    const state = this.load();
    const activities = state.completedActivities[scenarioId] || [];
    return activities.includes(activityId);
  },

  /**
   * Get all completed activities for a scenario
   */
  getCompletedActivities(scenarioId) {
    const state = this.load();
    return state.completedActivities[scenarioId] || [];
  },

  /**
   * Get count of completed activities for a scenario
   */
  getCompletedCount(scenarioId) {
    return this.getCompletedActivities(scenarioId).length;
  },

  /**
   * Check if essential exploration is complete (3+ activities)
   */
  isEssentialComplete(scenarioId, threshold = 3) {
    return this.getCompletedCount(scenarioId) >= threshold;
  },

  /**
   * Reset all state
   */
  reset() {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('[ExplorationState] Error resetting state:', e);
      return false;
    }
  },

  /**
   * Reset activities for a specific scenario
   */
  resetScenario(scenarioId) {
    const state = this.load();
    if (state.completedActivities[scenarioId]) {
      delete state.completedActivities[scenarioId];
    }
    return this.save(state);
  }
};

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize simplify toggle if present
  const simplifyToggle = document.querySelector('[data-exploration-simplify-toggle]');
  if (simplifyToggle) {
    const checkbox = simplifyToggle.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = ExplorationState.getSimplifyMode();
      checkbox.addEventListener('change', function() {
        ExplorationState.setSimplifyMode(this.checked);
        document.body.classList.toggle('ndx-simplified', this.checked);
        // Fire analytics event
        if (window.NDXAnalytics) {
          window.NDXAnalytics.trackExplorationModeChanged('simplify', this.checked);
        }
      });
      // Apply initial state
      if (checkbox.checked) {
        document.body.classList.add('ndx-simplified');
      }
    }
  }

  // Initialize completion indicators
  const scenarioId = document.body.dataset.scenarioId;
  if (scenarioId) {
    updateCompletionIndicators(scenarioId);
  }

  // Initialize activity cards
  document.querySelectorAll('[data-activity-id]').forEach(function(card) {
    const activityId = card.dataset.activityId;
    if (scenarioId && ExplorationState.isActivityCompleted(scenarioId, activityId)) {
      card.classList.add('ndx-activity-card--completed');
    }
  });
});

/**
 * Update completion indicators on the page
 */
function updateCompletionIndicators(scenarioId) {
  const completedCount = ExplorationState.getCompletedCount(scenarioId);
  const isEssentialComplete = ExplorationState.isEssentialComplete(scenarioId);

  // Update count display
  document.querySelectorAll('[data-completion-count]').forEach(function(el) {
    el.textContent = completedCount;
  });

  // Show/hide essential complete banner
  const essentialBanner = document.querySelector('[data-essential-complete]');
  if (essentialBanner) {
    essentialBanner.hidden = !isEssentialComplete;
  }
}

/**
 * Mark activity as complete (called from activity pages)
 */
function completeActivity(scenarioId, activityId) {
  ExplorationState.markActivityCompleted(scenarioId, activityId);
  updateCompletionIndicators(scenarioId);

  // Update card styling
  const card = document.querySelector(`[data-activity-id="${activityId}"]`);
  if (card) {
    card.classList.add('ndx-activity-card--completed');
  }

  // Fire analytics event
  if (window.NDXAnalytics) {
    window.NDXAnalytics.trackExplorationActivityCompleted(scenarioId, activityId);
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.ExplorationState = ExplorationState;
  window.completeActivity = completeActivity;
}
