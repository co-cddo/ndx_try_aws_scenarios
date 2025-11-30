/**
 * NDX:Try Phase State Manager (Story 12.1)
 * Manages URL parameter and sessionStorage state for phase navigation
 * Follows ExplorationState pattern for consistency
 */
const PhaseState = {
  STORAGE_KEY: 'ndx_phase_state',
  SESSION_EXPIRY_MS: 5400000, // 90 minutes
  VALID_PHASES: ['try', 'walkthrough', 'explore'],
  VALID_SCENARIOS: ['council-chatbot', 'planning-application-ai', 'foi-redaction', 'smart-car-park', 'text-to-speech', 'quicksight-dashboard'],
  _initialized: false,

  /**
   * Initialize PhaseState (Promise-based guard against race conditions)
   */
  initialize() {
    if (this._initialized) {
      return Promise.resolve();
    }
    this._initialized = true;
    return Promise.resolve();
  },

  /**
   * Validate phase ID
   */
  isValidPhase(phase) {
    return phase && typeof phase === 'string' && this.VALID_PHASES.includes(phase);
  },

  /**
   * Validate scenario ID (alphanumeric, hyphens, underscores only)
   */
  isValidScenario(scenario) {
    if (!scenario || typeof scenario !== 'string') return false;
    // Allow known scenarios or properly formatted custom ones
    if (this.VALID_SCENARIOS.includes(scenario)) return true;
    return /^[a-zA-Z0-9_-]+$/.test(scenario);
  },

  /**
   * Validate timestamp
   */
  isValidTimestamp(timestamp) {
    if (!timestamp) return false;
    const parsed = parseInt(timestamp, 10);
    if (isNaN(parsed)) return false;
    // Reasonable timestamp range (after year 2020, before year 2100)
    return parsed > 1577836800000 && parsed < 4102444800000;
  },

  /**
   * Handle errors consistently
   */
  handleError(context, error) {
    console.error(`[PhaseState] ${context}:`, error);
    return this.getDefaultState();
  },

  /**
   * Check if sessionStorage is available
   */
  isAvailable() {
    try {
      const test = '__ndx_storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get default state object
   */
  getDefaultState() {
    return {
      currentPhase: null,
      completedPhases: [],
      scenario: null,
      startedAt: null
    };
  },

  /**
   * Parse URL parameters with validation
   */
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    // Validate phase
    const phase = params.get('phase');
    const validPhase = this.isValidPhase(phase) ? phase : null;

    // Validate completed phases (comma-separated list)
    const completedParam = params.get('completed');
    let validCompleted = [];
    if (completedParam) {
      const completedArray = completedParam.split(',');
      validCompleted = completedArray.filter(p => this.isValidPhase(p));
    }

    // Validate scenario
    const scenario = params.get('scenario');
    const validScenario = this.isValidScenario(scenario) ? scenario : null;

    // Validate timestamp
    const started = params.get('started');
    const validStarted = this.isValidTimestamp(started) ? parseInt(started, 10) : null;

    return {
      phase: validPhase,
      completed: validCompleted,
      scenario: validScenario,
      started: validStarted
    };
  },

  /**
   * Set URL parameters without page reload
   */
  setUrlParams(state) {
    if (!state.scenario) return;

    const params = new URLSearchParams();
    if (state.currentPhase) {
      params.set('phase', state.currentPhase);
    }
    if (state.completedPhases && state.completedPhases.length > 0) {
      params.set('completed', state.completedPhases.join(','));
    }
    params.set('scenario', state.scenario);
    if (state.startedAt) {
      params.set('started', state.startedAt.toString());
    }

    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
  },

  /**
   * Load state from sessionStorage
   */
  loadFromStorage() {
    if (!this.isAvailable()) {
      return this.getDefaultState();
    }

    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultState();
      }
      const parsed = JSON.parse(stored);
      // Validate structure
      if (typeof parsed !== 'object') {
        return this.getDefaultState();
      }
      return {
        currentPhase: parsed.currentPhase || null,
        completedPhases: Array.isArray(parsed.completedPhases) ? parsed.completedPhases : [],
        scenario: parsed.scenario || null,
        startedAt: parsed.startedAt || null
      };
    } catch (e) {
      return this.handleError('Error loading from storage', e);
    }
  },

  /**
   * Save state to sessionStorage
   */
  saveToStorage(state) {
    if (!this.isAvailable()) {
      console.warn('[PhaseState] sessionStorage unavailable, state not persisted');
      return false;
    }

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      this.handleError('Error saving to storage', e);
      return false;
    }
  },

  /**
   * Get current phase state (URL params take precedence over sessionStorage)
   * @returns {Object} Current phase state
   */
  getPhaseState() {
    const urlParams = this.getUrlParams();
    const storageState = this.loadFromStorage();

    // URL params take precedence
    return {
      currentPhase: urlParams.phase || storageState.currentPhase,
      completedPhases: urlParams.completed.length > 0 ? urlParams.completed : storageState.completedPhases,
      scenario: urlParams.scenario || storageState.scenario,
      startedAt: urlParams.started || storageState.startedAt
    };
  },

  /**
   * Set phase state (writes to both URL and sessionStorage)
   * @param {Object} state - Partial state to update
   */
  setPhaseState(state) {
    const currentState = this.getPhaseState();
    const newState = { ...currentState, ...state };

    // Save to both URL and storage
    this.setUrlParams(newState);
    this.saveToStorage(newState);

    // Fire analytics event if phase changed
    if (state.currentPhase && state.currentPhase !== currentState.currentPhase && window.NDXAnalytics) {
      window.NDXAnalytics.trackJourneyPhaseChanged(
        newState.scenario,
        currentState.currentPhase,
        state.currentPhase
      );
    }

    return newState;
  },

  /**
   * Mark current phase as completed and advance to next
   */
  completePhase() {
    const state = this.getPhaseState();
    if (!state.currentPhase) {
      console.warn('[PhaseState] Cannot complete phase: no current phase set');
      return false;
    }

    // Add current phase to completed if not already there
    if (!state.completedPhases.includes(state.currentPhase)) {
      state.completedPhases.push(state.currentPhase);
    }

    // Determine next phase
    const phaseOrder = ['try', 'walkthrough', 'explore'];
    const currentIndex = phaseOrder.indexOf(state.currentPhase);
    const nextPhase = currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : null;

    // Update state
    this.setPhaseState({
      completedPhases: state.completedPhases,
      currentPhase: nextPhase
    });

    // Fire journey completed event if all phases done
    if (!nextPhase && window.NDXAnalytics) {
      window.NDXAnalytics.trackJourneyCompleted(state.scenario, state.completedPhases.length);
    }

    return true;
  },

  /**
   * Check if CloudFormation stack has expired (90+ minutes)
   * @returns {boolean} True if session is stale
   */
  isStackExpired() {
    const state = this.getPhaseState();
    if (!state.startedAt) {
      return false;
    }
    const elapsed = Date.now() - state.startedAt;
    return elapsed > this.SESSION_EXPIRY_MS;
  },

  /**
   * Get shareable URL with current state
   * @returns {string} Full URL with state parameters
   */
  getShareableUrl() {
    const state = this.getPhaseState();
    if (!state.scenario) {
      return window.location.href;
    }

    const params = new URLSearchParams();
    if (state.currentPhase) {
      params.set('phase', state.currentPhase);
    }
    if (state.completedPhases && state.completedPhases.length > 0) {
      params.set('completed', state.completedPhases.join(','));
    }
    params.set('scenario', state.scenario);
    if (state.startedAt) {
      params.set('started', state.startedAt.toString());
    }

    return window.location.origin + window.location.pathname + '?' + params.toString();
  },

  /**
   * Start a new journey for a scenario
   * @param {string} scenarioId - Scenario identifier
   */
  startJourney(scenarioId) {
    this.setPhaseState({
      currentPhase: 'try',
      completedPhases: [],
      scenario: scenarioId,
      startedAt: Date.now()
    });
  },

  /**
   * Reset all state
   */
  reset() {
    if (this.isAvailable()) {
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        console.error('[PhaseState] Error resetting state:', e);
      }
    }
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
  },

  /**
   * Check if a specific phase is completed
   * @param {string} phase - Phase to check
   * @returns {boolean}
   */
  isPhaseCompleted(phase) {
    const state = this.getPhaseState();
    return state.completedPhases.includes(phase);
  },

  /**
   * Get phase progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgressPercent() {
    const state = this.getPhaseState();
    const totalPhases = 3; // try, walkthrough, explore
    return Math.round((state.completedPhases.length / totalPhases) * 100);
  }
};

// Initialize on page load with race condition guard
document.addEventListener('DOMContentLoaded', function() {
  PhaseState.initialize().then(function() {
    // Check for scenario ID in page data
    const scenarioId = document.body.dataset.scenarioId;
    if (scenarioId) {
      // Ensure scenario is set in state
      const state = PhaseState.getPhaseState();
      if (!state.scenario) {
        PhaseState.setPhaseState({ scenario: scenarioId });
      }

      // Update UI elements
      updatePhaseIndicators();

      // Check for stack expiry
      if (PhaseState.isStackExpired()) {
        showStackExpiredMessage();
      }

      // Check for parallel entry (AC-9)
      checkParallelEntry();
    }

    // Handle page unload - track drop-off
    window.addEventListener('beforeunload', function() {
      const state = PhaseState.getPhaseState();
      if (state.currentPhase && state.scenario && window.NDXAnalytics) {
        const completionPercent = PhaseState.getProgressPercent();
        window.NDXAnalytics.trackJourneyDropOff(
          state.scenario,
          state.currentPhase,
          completionPercent
        );
      }
    });
  });
});

/**
 * Update phase indicators in the UI
 */
function updatePhaseIndicators() {
  const state = PhaseState.getPhaseState();

  // Update navigator if present
  document.querySelectorAll('[data-phase-id]').forEach(function(element) {
    const phaseId = element.dataset.phaseId;
    const link = element.querySelector('[data-phase-link]');

    // Remove all state classes
    element.classList.remove('ndx-phase-navigator__phase--current');
    element.classList.remove('ndx-phase-navigator__phase--completed');

    // Add appropriate class and update aria-label
    if (phaseId === state.currentPhase) {
      element.classList.add('ndx-phase-navigator__phase--current');
      element.setAttribute('aria-current', 'step');
      // Restore base label for current phase
      if (link && link.dataset.baseLabel) {
        link.setAttribute('aria-label', link.dataset.baseLabel);
      }
    } else if (state.completedPhases.includes(phaseId)) {
      element.classList.add('ndx-phase-navigator__phase--completed');
      element.removeAttribute('aria-current');
      // Add "(completed)" to aria-label (AC-3)
      if (link && link.dataset.baseLabel) {
        link.setAttribute('aria-label', link.dataset.baseLabel + ' (completed)');
      }
    } else {
      element.removeAttribute('aria-current');
      // Restore base label for future phases
      if (link && link.dataset.baseLabel) {
        link.setAttribute('aria-label', link.dataset.baseLabel);
      }
    }
  });
}

/**
 * Show stack expired message (AC-10)
 */
function showStackExpiredMessage() {
  const banner = document.querySelector('[data-stack-expired]');
  if (banner) {
    banner.hidden = false;
  }
}

/**
 * Check for parallel entry (AC-9)
 */
function checkParallelEntry() {
  const state = PhaseState.getPhaseState();
  const currentPath = window.location.pathname;

  // Check if on walkthrough page without TRY phase completed
  if (currentPath.includes('/walkthroughs/') && !currentPath.includes('/walkthroughs/complete/')) {
    if (!state.completedPhases.includes('try')) {
      const prompt = document.querySelector('[data-parallel-entry-prompt]');
      if (prompt) {
        prompt.hidden = false;
      }
    }
  }

  // Check if on explore page without WALKTHROUGH phase completed
  if (currentPath.includes('/explore/')) {
    if (!state.completedPhases.includes('walkthrough')) {
      const prompt = document.querySelector('[data-parallel-entry-prompt]');
      if (prompt) {
        prompt.hidden = false;
      }
    }
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.PhaseState = PhaseState;
  window.updatePhaseIndicators = updatePhaseIndicators;
}
