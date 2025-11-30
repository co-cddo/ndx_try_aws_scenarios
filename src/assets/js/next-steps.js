/**
 * Next Steps Session State Management (Story 5-1 - AC 5.1.5)
 *
 * Reads would_implement value from localStorage (ndx_reflection_form)
 * and displays appropriate pathway section:
 * - 'yes' -> proceed pathway
 * - 'maybe' -> maybe pathway (default)
 * - 'no' -> not_now pathway
 *
 * Also shows incomplete evaluation banner when no session data exists.
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNextSteps);
  } else {
    initNextSteps();
  }

  function initNextSteps() {
    // Read session data from localStorage
    const savedData = localStorage.getItem('ndx_reflection_form');
    let pathway = 'maybe'; // Default pathway when no data
    let hasSessionData = false;

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        hasSessionData = true;

        // Determine pathway based on would_implement value
        if (data.would_implement === 'yes') {
          pathway = 'proceed';
        } else if (data.would_implement === 'no') {
          pathway = 'not_now';
        } else {
          // 'maybe' or any other value defaults to 'maybe'
          pathway = 'maybe';
        }
      } catch (e) {
        console.error('Error parsing reflection form data:', e);
        // On error, default to 'maybe' pathway
        pathway = 'maybe';
      }
    }

    // Show/hide pathway sections based on determined pathway
    const pathwaySections = document.querySelectorAll('[data-pathway]');
    pathwaySections.forEach(function(section) {
      const sectionPathway = section.getAttribute('data-pathway');
      if (sectionPathway === pathway) {
        section.hidden = false;
      } else {
        section.hidden = true;
      }
    });

    // Track analytics events
    if (window.NDXAnalytics) {
      const scenarioId = document.body.dataset.scenarioId || window.location.pathname.split('/')[2];
      NDXAnalytics.trackNextStepsViewed(scenarioId);
      NDXAnalytics.trackPathwaySelected(scenarioId, pathway);
    }

    // Show incomplete evaluation banner if no session data
    const incompleteBanner = document.querySelector('[data-incomplete-banner]');
    if (incompleteBanner) {
      if (!hasSessionData) {
        incompleteBanner.hidden = false;
      } else {
        incompleteBanner.hidden = true;
      }
    }

    // Log pathway for debugging (can be removed in production)
    if (window.console && window.console.log) {
      console.log('Next Steps pathway:', pathway, '(has session data:', hasSessionData, ')');
    }
  }
})();
