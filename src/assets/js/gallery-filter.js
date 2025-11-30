/**
 * Gallery Filter - Scenario Gallery Filtering
 *
 * Progressive enhancement for scenario gallery filtering.
 * Filter by persona/audience, difficulty, and time estimate.
 * Reflects filter state in URL parameters for shareability.
 *
 * @file gallery-filter.js
 */

(function() {
  'use strict';

  // Feature detection
  if (!document.querySelector || !document.querySelectorAll || !window.URLSearchParams) {
    return;
  }

  // DOM elements
  const filtersContainer = document.querySelector('.js-gallery-filters');
  const scenarioGrid = document.querySelector('.js-scenario-grid');
  const noResultsMessage = document.querySelector('.ndx-gallery-no-results');
  const filterCountDisplay = document.querySelector('.js-filter-count');
  const clearFilterButtons = document.querySelectorAll('.js-clear-filters');

  // Filter controls
  const personaSelect = document.getElementById('filter-persona');
  const difficultySelect = document.getElementById('filter-difficulty');
  const timeSelect = document.getElementById('filter-time');

  // Exit if essential elements missing
  if (!filtersContainer || !scenarioGrid || !personaSelect || !difficultySelect || !timeSelect) {
    return;
  }

  /**
   * Initialize the gallery filter
   */
  function init() {
    // Show filter controls (hidden by default for no-JS)
    filtersContainer.removeAttribute('hidden');

    // Read initial filters from URL
    loadFiltersFromURL();

    // Attach event listeners
    personaSelect.addEventListener('change', handleFilterChange);
    difficultySelect.addEventListener('change', handleFilterChange);
    timeSelect.addEventListener('change', handleFilterChange);

    // Clear filter buttons
    clearFilterButtons.forEach(function(button) {
      button.addEventListener('click', clearAllFilters);
    });

    // Apply initial filters
    applyFilters();
  }

  /**
   * Load filter values from URL parameters
   */
  function loadFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);

    var persona = params.get('persona');
    var difficulty = params.get('difficulty');
    var time = params.get('time');

    if (persona && hasOption(personaSelect, persona)) {
      personaSelect.value = persona;
    }

    if (difficulty && hasOption(difficultySelect, difficulty)) {
      difficultySelect.value = difficulty;
    }

    if (time && hasOption(timeSelect, time)) {
      timeSelect.value = time;
    }
  }

  /**
   * Check if select has an option with given value
   * @param {HTMLSelectElement} select
   * @param {string} value
   * @returns {boolean}
   */
  function hasOption(select, value) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle filter control change
   */
  function handleFilterChange() {
    applyFilters();
    updateURL();
    updateClearButtonVisibility();
  }

  /**
   * Apply current filter values to scenario cards
   */
  function applyFilters() {
    var selectedPersona = personaSelect.value;
    var selectedDifficulty = difficultySelect.value;
    var selectedTime = timeSelect.value;

    var cards = scenarioGrid.querySelectorAll('.ndx-scenario-card');
    var visibleCount = 0;

    cards.forEach(function(card) {
      var matchesPersona = matchPersona(card, selectedPersona);
      var matchesDifficulty = matchDifficulty(card, selectedDifficulty);
      var matchesTime = matchTime(card, selectedTime);

      var isVisible = matchesPersona && matchesDifficulty && matchesTime;

      if (isVisible) {
        card.style.display = '';
        card.removeAttribute('hidden');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.setAttribute('hidden', '');
      }
    });

    updateFilterCount(visibleCount, cards.length);
    updateNoResultsMessage(visibleCount === 0);
  }

  /**
   * Check if card matches persona filter
   * @param {HTMLElement} card
   * @param {string} selectedPersona
   * @returns {boolean}
   */
  function matchPersona(card, selectedPersona) {
    if (!selectedPersona) return true;

    var personas = card.getAttribute('data-personas');
    if (!personas) return false;

    var personaList = personas.split(',');
    return personaList.indexOf(selectedPersona) !== -1;
  }

  /**
   * Check if card matches difficulty filter
   * @param {HTMLElement} card
   * @param {string} selectedDifficulty
   * @returns {boolean}
   */
  function matchDifficulty(card, selectedDifficulty) {
    if (!selectedDifficulty) return true;

    var difficulty = card.getAttribute('data-difficulty');
    return difficulty === selectedDifficulty;
  }

  /**
   * Check if card matches time filter
   * @param {HTMLElement} card
   * @param {string} selectedTime
   * @returns {boolean}
   */
  function matchTime(card, selectedTime) {
    if (!selectedTime) return true;

    var timeEstimate = card.getAttribute('data-time');
    if (!timeEstimate) return false;

    // Parse time estimate to minutes
    var minutes = parseTimeToMinutes(timeEstimate);

    switch (selectedTime) {
      case 'quick':
        return minutes < 15;
      case 'medium':
        return minutes >= 15 && minutes <= 30;
      case 'longer':
        return minutes > 30;
      default:
        return true;
    }
  }

  /**
   * Parse time estimate string to minutes
   * @param {string} timeStr - e.g. "15 minutes", "1-2 hours", "30 mins"
   * @returns {number}
   */
  function parseTimeToMinutes(timeStr) {
    var str = timeStr.toLowerCase();

    // Handle hour formats
    if (str.indexOf('hour') !== -1) {
      var hourMatch = str.match(/(\d+)/);
      if (hourMatch) {
        return parseInt(hourMatch[1], 10) * 60;
      }
    }

    // Handle minute formats
    var minMatch = str.match(/(\d+)/);
    if (minMatch) {
      return parseInt(minMatch[1], 10);
    }

    return 30; // Default fallback
  }

  /**
   * Update filter count display
   * @param {number} visible
   * @param {number} total
   */
  function updateFilterCount(visible, total) {
    if (!filterCountDisplay) return;

    var text = 'Showing ' + visible + ' of ' + total + ' scenarios';
    if (visible === total) {
      text = 'Showing all ' + total + ' scenarios';
    }

    filterCountDisplay.textContent = text;
  }

  /**
   * Update no results message visibility
   * @param {boolean} show
   */
  function updateNoResultsMessage(show) {
    if (!noResultsMessage) return;

    if (show) {
      noResultsMessage.removeAttribute('hidden');
      scenarioGrid.setAttribute('hidden', '');
    } else {
      noResultsMessage.setAttribute('hidden', '');
      scenarioGrid.removeAttribute('hidden');
    }
  }

  /**
   * Update URL with current filter values
   */
  function updateURL() {
    var params = new URLSearchParams();

    if (personaSelect.value) {
      params.set('persona', personaSelect.value);
    }

    if (difficultySelect.value) {
      params.set('difficulty', difficultySelect.value);
    }

    if (timeSelect.value) {
      params.set('time', timeSelect.value);
    }

    var newURL = window.location.pathname;
    var queryString = params.toString();
    if (queryString) {
      newURL += '?' + queryString;
    }

    // Use replaceState to avoid polluting history
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', newURL);
    }
  }

  /**
   * Update clear button visibility based on active filters
   */
  function updateClearButtonVisibility() {
    var hasFilters = personaSelect.value || difficultySelect.value || timeSelect.value;

    clearFilterButtons.forEach(function(button) {
      if (hasFilters) {
        button.removeAttribute('hidden');
      } else {
        button.setAttribute('hidden', '');
      }
    });
  }

  /**
   * Clear all filters and reset to default
   */
  function clearAllFilters() {
    personaSelect.value = '';
    difficultySelect.value = '';
    timeSelect.value = '';

    applyFilters();
    updateURL();
    updateClearButtonVisibility();

    // Focus on first filter for accessibility
    personaSelect.focus();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
