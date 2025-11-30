/**
 * Cross-Scenario Recommendations (Story 15.5)
 *
 * Generates personalized walkthrough recommendations on completion pages:
 * - Priority 1: Quiz results (stored scores from scenario quiz)
 * - Priority 2: Same category as completed scenario
 * - Priority 3: Different category for variety
 *
 * Filters:
 * - Excludes already-completed walkthroughs
 * - Prefers not-yet-started over in-progress
 * - Limits to 2-3 recommendations
 *
 * Shows "all complete" celebration when all 6 walkthroughs done.
 */

(function() {
  'use strict';

  // All available walkthroughs with metadata
  const WALKTHROUGHS = {
    'council-chatbot': {
      id: 'council-chatbot',
      name: 'Council Chatbot',
      headline: 'AI-powered resident Q&A assistant',
      url: '/walkthroughs/council-chatbot/',
      category: 'ai',
      difficulty: 'beginner',
      duration: '10 minutes',
      totalSteps: 4
    },
    'planning-ai': {
      id: 'planning-ai',
      name: 'Planning Application AI',
      headline: 'Intelligent document analysis for planning',
      url: '/walkthroughs/planning-ai/',
      category: 'ai',
      difficulty: 'intermediate',
      duration: '8 minutes',
      totalSteps: 4
    },
    'foi-redaction': {
      id: 'foi-redaction',
      name: 'FOI Redaction',
      headline: 'Automated sensitive data redaction',
      url: '/walkthroughs/foi-redaction/',
      category: 'ai',
      difficulty: 'intermediate',
      duration: '10 minutes',
      totalSteps: 5
    },
    'smart-car-park': {
      id: 'smart-car-park',
      name: 'Smart Car Park',
      headline: 'Real-time parking with IoT sensors',
      url: '/walkthroughs/smart-car-park/',
      category: 'iot',
      difficulty: 'advanced',
      duration: '12 minutes',
      totalSteps: 4
    },
    'text-to-speech': {
      id: 'text-to-speech',
      name: 'Text to Speech',
      headline: 'Accessibility audio for council content',
      url: '/walkthroughs/text-to-speech/',
      category: 'accessibility',
      difficulty: 'beginner',
      duration: '8 minutes',
      totalSteps: 4
    },
    'quicksight-dashboard': {
      id: 'quicksight-dashboard',
      name: 'QuickSight Dashboard',
      headline: 'Service performance analytics',
      url: '/walkthroughs/quicksight-dashboard/',
      category: 'analytics',
      difficulty: 'intermediate',
      duration: '10 minutes',
      totalSteps: 4
    }
  };

  const ALL_SCENARIO_IDS = Object.keys(WALKTHROUGHS);
  const QUIZ_RESULTS_KEY = 'ndx_quiz_results';
  const MAX_RECOMMENDATIONS = 3;

  /**
   * Get quiz results from localStorage
   * @returns {Object|null} Quiz results with scenario scores
   */
  function getQuizResults() {
    try {
      const data = localStorage.getItem(QUIZ_RESULTS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to read quiz results:', e);
      return null;
    }
  }

  /**
   * Get completed scenario IDs using NDXProgress API
   * @returns {string[]} Array of completed scenario IDs
   */
  function getCompletedScenarios() {
    if (window.NDXProgress && typeof window.NDXProgress.getCompletedScenarios === 'function') {
      return window.NDXProgress.getCompletedScenarios();
    }
    return [];
  }

  /**
   * Get in-progress (started but not completed) scenario IDs
   * @returns {string[]} Array of in-progress scenario IDs
   */
  function getInProgressScenarios() {
    if (window.NDXProgress && typeof window.NDXProgress.getProgress === 'function') {
      const progress = window.NDXProgress.getProgress();
      return Object.keys(progress).filter(function(id) {
        return progress[id] && !progress[id].completed && progress[id].currentStep > 0;
      });
    }
    return [];
  }

  /**
   * Get the current scenario ID from the page
   * @returns {string|null} Current scenario ID
   */
  function getCurrentScenarioId() {
    const container = document.querySelector('[data-scenario]');
    return container ? container.dataset.scenario : null;
  }

  /**
   * Calculate recommendation scores for each walkthrough
   * @param {string} currentScenarioId - The just-completed scenario
   * @param {string[]} completedIds - Already completed scenario IDs
   * @param {string[]} inProgressIds - In-progress scenario IDs
   * @returns {Array} Sorted array of {id, score, reason} objects
   */
  function calculateRecommendations(currentScenarioId, completedIds, inProgressIds) {
    const quizResults = getQuizResults();
    const currentCategory = WALKTHROUGHS[currentScenarioId]?.category || 'ai';

    // Get all available (not completed) walkthroughs
    const availableIds = ALL_SCENARIO_IDS.filter(function(id) {
      return !completedIds.includes(id) && id !== currentScenarioId;
    });

    if (availableIds.length === 0) {
      return [];
    }

    // Score each available walkthrough
    const scored = availableIds.map(function(id) {
      const walkthrough = WALKTHROUGHS[id];
      let score = 0;
      let reason = '';

      // Priority 1: Quiz results (highest weight)
      if (quizResults && quizResults.scores && quizResults.scores[id]) {
        score += quizResults.scores[id] * 2; // Double quiz scores for priority
        reason = 'Based on your quiz answers';
      }

      // Priority 2: Same category as completed scenario
      if (walkthrough.category === currentCategory) {
        score += 3;
        if (!reason) {
          reason = 'Similar to what you just completed';
        }
      }

      // Priority 3: Different category for variety (small bonus)
      if (walkthrough.category !== currentCategory) {
        score += 1;
        if (!reason) {
          reason = 'Try something different';
        }
      }

      // Prefer not-yet-started over in-progress
      if (inProgressIds.includes(id)) {
        score -= 0.5;
        reason = 'Continue where you left off';
      }

      // Beginner scenarios get slight boost for accessibility
      if (walkthrough.difficulty === 'beginner') {
        score += 0.5;
      }

      return {
        id: id,
        score: score,
        reason: reason,
        walkthrough: walkthrough
      };
    });

    // Sort by score (highest first), then by name for stability
    scored.sort(function(a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.walkthrough.name.localeCompare(b.walkthrough.name);
    });

    return scored.slice(0, MAX_RECOMMENDATIONS);
  }

  /**
   * Create recommendation card HTML
   * @param {Object} recommendation - Recommendation object
   * @returns {string} HTML string for the card
   */
  function createRecommendationCard(recommendation) {
    const w = recommendation.walkthrough;
    const difficultyColors = {
      beginner: 'green',
      intermediate: 'blue',
      advanced: 'purple'
    };
    const categoryLabels = {
      ai: 'AI',
      iot: 'IoT',
      accessibility: 'Accessibility',
      analytics: 'Analytics'
    };

    return '<div class="govuk-grid-column-one-third">' +
      '<div class="ndx-recommendation-card">' +
        '<h4 class="govuk-heading-s govuk-!-margin-bottom-1">' +
          '<a href="' + w.url + '" class="govuk-link govuk-link--no-visited-state">' +
            escapeHtml(w.name) +
          '</a>' +
        '</h4>' +
        '<p class="govuk-body-s govuk-!-margin-bottom-2">' +
          escapeHtml(w.headline) +
        '</p>' +
        '<p class="govuk-body-s govuk-!-margin-bottom-2">' +
          '<span class="govuk-tag govuk-tag--' + difficultyColors[w.difficulty] + ' govuk-!-margin-right-1">' +
            capitalize(w.difficulty) +
          '</span>' +
          '<span class="govuk-tag govuk-tag--grey">' +
            (categoryLabels[w.category] || w.category) +
          '</span>' +
        '</p>' +
        '<p class="govuk-body-s govuk-!-margin-bottom-2">' +
          '<strong>' + w.totalSteps + ' steps</strong> &middot; ' + w.duration +
        '</p>' +
        '<p class="govuk-body-s ndx-recommendation-reason">' +
          escapeHtml(recommendation.reason) +
        '</p>' +
        '<a href="' + w.url + '" class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" data-module="govuk-button">' +
          'Start walkthrough' +
        '</a>' +
      '</div>' +
    '</div>';
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Initialize recommendations on the page
   */
  function init() {
    // Find recommendation containers
    const recommendationsContainer = document.querySelector('[data-recommendations]');
    const cardsContainer = document.querySelector('[data-recommendation-cards]');
    const allCompleteContainer = document.querySelector('[data-all-complete]');

    // Exit if containers not found (not on a completion page)
    if (!recommendationsContainer || !cardsContainer) {
      return;
    }

    const currentScenarioId = getCurrentScenarioId();
    const completedIds = getCompletedScenarios();
    const inProgressIds = getInProgressScenarios();

    // Include current scenario in completed count for display logic
    const allCompleted = [...new Set([...completedIds, currentScenarioId])];

    // Check if all walkthroughs are complete
    if (allCompleted.length >= ALL_SCENARIO_IDS.length) {
      // Show "all complete" celebration
      if (allCompleteContainer) {
        allCompleteContainer.hidden = false;
      }
      recommendationsContainer.hidden = true;

      // Track analytics event
      if (window.NDXAnalytics && typeof window.NDXAnalytics.track === 'function') {
        window.NDXAnalytics.track('all_walkthroughs_complete', {
          totalScenarios: ALL_SCENARIO_IDS.length
        });
      }
      return;
    }

    // Calculate recommendations
    const recommendations = calculateRecommendations(
      currentScenarioId,
      allCompleted,
      inProgressIds
    );

    if (recommendations.length === 0) {
      // No recommendations available
      recommendationsContainer.hidden = true;
      return;
    }

    // Render recommendation cards
    var cardsHtml = recommendations.map(createRecommendationCard).join('');
    cardsContainer.innerHTML = cardsHtml;
    recommendationsContainer.hidden = false;

    // Track analytics event
    if (window.NDXAnalytics && typeof window.NDXAnalytics.track === 'function') {
      window.NDXAnalytics.track('recommendations_shown', {
        scenario: currentScenarioId,
        recommended: recommendations.map(function(r) { return r.id; }),
        completedCount: allCompleted.length
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for testing
  window.NDXRecommendations = {
    calculateRecommendations: calculateRecommendations,
    getQuizResults: getQuizResults,
    WALKTHROUGHS: WALKTHROUGHS
  };
})();
