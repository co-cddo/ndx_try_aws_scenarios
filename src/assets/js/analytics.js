/**
 * NDX:Try Analytics Module
 * Tracks user journey events with graceful degradation
 */
const NDXAnalytics = {
  VALID_PHASES: ['try', 'walkthrough', 'explore'],
  VALID_SCENARIOS: ['council-chatbot', 'planning-application-ai', 'foi-redaction', 'smart-car-park', 'text-to-speech', 'quicksight-dashboard'],

  /**
   * Sanitize scenario ID to prevent injection
   */
  sanitizeScenarioId(id) {
    if (!id || typeof id !== 'string') return 'unknown';
    // Only allow known scenarios or properly formatted custom ones
    if (this.VALID_SCENARIOS.includes(id)) return id;
    // Fallback to alphanumeric, hyphens, underscores only
    const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '');
    return sanitized || 'unknown';
  },

  /**
   * Sanitize phase ID to prevent injection
   */
  sanitizePhase(phase) {
    if (!phase || typeof phase !== 'string') return 'unknown';
    return this.VALID_PHASES.includes(phase) ? phase : 'unknown';
  },

  /**
   * Check if Google Analytics is available
   */
  isAvailable() {
    return typeof gtag === 'function';
  },

  /**
   * Check if analytics consent has been granted
   */
  hasConsent() {
    try {
      var cookie = document.cookie.match(/ndx_cookies_policy=([^;]+)/);
      if (!cookie) return false;
      var prefs = JSON.parse(decodeURIComponent(cookie[1]));
      return prefs.analytics === true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('ndx_session_id');
    if (!sessionId) {
      sessionId = 'ndx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ndx_session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * Core event tracking with enrichment
   */
  track(eventName, params = {}) {
    const enrichedParams = {
      ...params,
      session_id: this.getSessionId(),
      timestamp: new Date().toISOString()
    };

    if (!this.isAvailable()) {
      console.warn('[NDX Analytics] gtag unavailable:', eventName, enrichedParams);
      return false;
    }

    if (!this.hasConsent()) {
      console.debug('[NDX Analytics] No consent, event queued:', eventName);
      return false;
    }

    try {
      gtag('event', eventName, enrichedParams);
      return true;
    } catch (error) {
      console.error('[NDX Analytics] Error:', error);
      return false;
    }
  },

  // Epic 5 Events

  /**
   * AC 5.2.1: Track Next Steps page view
   */
  trackNextStepsViewed(scenarioId) {
    return this.track('next_steps_viewed', {
      scenario_id: scenarioId,
      event_category: 'engagement'
    });
  },

  /**
   * AC 5.2.2: Track pathway display/selection
   */
  trackPathwaySelected(scenarioId, pathwayType) {
    return this.track('pathway_selected', {
      scenario_id: scenarioId,
      pathway_type: pathwayType,
      event_category: 'engagement'
    });
  },

  /**
   * AC 5.2.3: Track G-Cloud link clicks
   */
  trackGCloudClicked(scenarioId, searchTerm) {
    return this.track('gcloud_link_clicked', {
      scenario_id: scenarioId,
      search_term: searchTerm,
      event_category: 'conversion'
    });
  },

  /**
   * AC 5.2.4: Track partner card views
   */
  trackPartnerViewed(scenarioId, partnerId) {
    return this.track('partner_viewed', {
      scenario_id: scenarioId,
      partner_id: partnerId,
      event_category: 'engagement'
    });
  },

  /**
   * AC 5.2.5: Track Evidence Pack downloads
   */
  trackEvidencePackDownloaded(scenarioId, persona) {
    return this.track('evidence_pack_downloaded', {
      scenario_id: scenarioId,
      persona: persona,
      event_category: 'conversion'
    });
  },

  /**
   * Track quiz completion
   */
  trackQuizCompleted(recommendedScenario, answers) {
    return this.track('quiz_completed', {
      recommended_scenario: recommendedScenario,
      total_answers: answers ? Object.keys(answers).length : 0,
      event_category: 'engagement'
    });
  },

  /**
   * Track scenario page view
   */
  trackScenarioViewed(scenarioId) {
    return this.track('scenario_viewed', {
      scenario_id: scenarioId,
      event_category: 'engagement'
    });
  },

  // Epic 6 Exploration Events (Story 6.1)

  /**
   * Track exploration activity started
   */
  trackExplorationActivityStarted(scenarioId, activityId, activityCategory) {
    return this.track('exploration_activity_started', {
      scenario_id: scenarioId,
      activity_id: activityId,
      activity_category: activityCategory,
      event_category: 'exploration'
    });
  },

  /**
   * Track exploration activity completed
   */
  trackExplorationActivityCompleted(scenarioId, activityId) {
    return this.track('exploration_activity_completed', {
      scenario_id: scenarioId,
      activity_id: activityId,
      event_category: 'exploration'
    });
  },

  /**
   * Track full exploration completed
   */
  trackExplorationCompleted(scenarioId, activitiesAttempted, activitiesCompleted, timeSpent, pathTaken) {
    return this.track('exploration_completed', {
      scenario_id: scenarioId,
      activities_attempted: activitiesAttempted,
      activities_completed: activitiesCompleted,
      time_spent_exploring: timeSpent,
      path_taken: pathTaken,
      event_category: 'exploration'
    });
  },

  /**
   * Track persona selection in exploration
   */
  trackExplorationPersonaSelected(scenarioId, persona) {
    return this.track('exploration_persona_selected', {
      scenario_id: scenarioId,
      persona: persona,
      event_category: 'exploration'
    });
  },

  /**
   * Track simplify mode toggle
   */
  trackExplorationModeChanged(mode, enabled) {
    return this.track('exploration_mode_changed', {
      mode: mode,
      enabled: enabled,
      event_category: 'exploration'
    });
  },

  // Epic 12 Journey Phase Events (Story 12.1)

  /**
   * AC 12.1-17: Track phase progression
   */
  trackJourneyPhaseChanged(scenarioId, fromPhase, toPhase) {
    return this.track('journey_phase_changed', {
      scenario_id: this.sanitizeScenarioId(scenarioId),
      from_phase: this.sanitizePhase(fromPhase) || 'none',
      to_phase: this.sanitizePhase(toPhase),
      event_category: 'journey'
    });
  },

  /**
   * AC 12.1-18: Track journey abandonment
   */
  trackJourneyDropOff(scenarioId, phase, completionPercent) {
    return this.track('journey_drop_off', {
      scenario_id: this.sanitizeScenarioId(scenarioId),
      phase: this.sanitizePhase(phase),
      completion_percent: completionPercent,
      event_category: 'journey'
    });
  },

  /**
   * Track journey completion (all phases done)
   */
  trackJourneyCompleted(scenarioId, phasesCompleted) {
    return this.track('journey_completed', {
      scenario_id: scenarioId,
      phases_completed: phasesCompleted,
      event_category: 'journey'
    });
  },

  /**
   * Track phase start
   */
  trackJourneyPhaseStarted(scenarioId, phase) {
    return this.track('journey_phase_started', {
      scenario_id: scenarioId,
      phase: phase,
      event_category: 'journey'
    });
  }
};

// Export globally
if (typeof window !== 'undefined') {
  window.NDXAnalytics = NDXAnalytics;
}
