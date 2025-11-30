/**
 * NDX:Try Scenario Selector Quiz
 *
 * Progressive enhancement JavaScript for the 3-question quiz flow.
 * Works with GOV.UK Frontend radio button components.
 *
 * Features:
 * - Sequential question display
 * - Back navigation
 * - "Not Sure" escape to gallery
 * - Weighted scoring algorithm
 * - Results with reasoning
 * - Session storage for quiz state
 */

(function() {
  'use strict';

  // Configuration
  const STORAGE_KEY = 'ndx_quiz_state';
  const GALLERY_URL = '/scenarios/';
  const SCENARIOS = window.NDX_SCENARIOS || [];
  const QUIZ_CONFIG = window.NDX_QUIZ_CONFIG || { questions: [], recommendation_algorithm: {}, labels: {} };

  // DOM Elements
  const container = document.getElementById('quiz-container');
  const intro = document.querySelector('.js-quiz-intro');
  const questions = document.querySelectorAll('.js-quiz-question');
  const resultsSection = document.getElementById('quiz-results');
  const reasoningEl = document.getElementById('quiz-reasoning');
  const recommendationsEl = document.getElementById('quiz-recommendations');

  // State
  let currentQuestion = 0;
  let answers = {};

  /**
   * Initialize the quiz
   */
  function init() {
    if (!container || questions.length === 0) {
      console.warn('Quiz: Required elements not found');
      return;
    }

    // Hide intro and show first question when JS is available
    if (intro) {
      intro.style.display = 'none';
    }

    // Restore state from session storage
    restoreState();

    // Set up event listeners
    setupEventListeners();

    // Show the appropriate question
    showQuestion(currentQuestion);
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Next buttons
    document.querySelectorAll('.js-quiz-next').forEach(btn => {
      btn.addEventListener('click', handleNext);
    });

    // Back buttons
    document.querySelectorAll('.js-quiz-back').forEach(btn => {
      btn.addEventListener('click', handleBack);
    });

    // Submit button
    const submitBtn = document.querySelector('.js-quiz-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }

    // Restart button
    const restartBtn = document.querySelector('.js-quiz-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', handleRestart);
    }

    // Radio button changes - check for "Not Sure" escape
    questions.forEach(question => {
      const radios = question.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        radio.addEventListener('change', handleRadioChange);
      });
    });
  }

  /**
   * Handle radio button change - check for escape action
   */
  function handleRadioChange(event) {
    const radio = event.target;
    const action = radio.dataset.action;

    if (action === 'gallery') {
      // Redirect to gallery immediately
      window.location.href = GALLERY_URL;
    }
  }

  /**
   * Handle next button click
   */
  function handleNext() {
    const currentEl = questions[currentQuestion];
    const questionId = currentEl.dataset.question;
    const selected = currentEl.querySelector(`input[name="${questionId}"]:checked`);

    if (!selected) {
      // Show error - no selection made
      showError(currentEl, 'Please select an option to continue');
      return;
    }

    // Store answer
    answers[questionId] = selected.value;
    saveState();

    // Move to next question
    currentQuestion++;
    showQuestion(currentQuestion);
  }

  /**
   * Handle back button click
   */
  function handleBack() {
    if (currentQuestion > 0) {
      currentQuestion--;
      showQuestion(currentQuestion);
    }
  }

  /**
   * Handle submit button click
   */
  function handleSubmit() {
    const currentEl = questions[currentQuestion];
    const questionId = currentEl.dataset.question;
    const selected = currentEl.querySelector(`input[name="${questionId}"]:checked`);

    if (!selected) {
      showError(currentEl, 'Please select an option to see your recommendations');
      return;
    }

    // Store final answer
    answers[questionId] = selected.value;
    saveState();

    // Calculate and show results
    showResults();
  }

  /**
   * Handle restart button click
   */
  function handleRestart() {
    // Clear state
    answers = {};
    currentQuestion = 0;
    clearState();

    // Clear radio selections
    questions.forEach(q => {
      const radios = q.querySelectorAll('input[type="radio"]');
      radios.forEach(r => r.checked = false);
    });

    // Hide results and show first question
    if (resultsSection) {
      resultsSection.hidden = true;
    }
    showQuestion(0);
  }

  /**
   * Show a specific question
   */
  function showQuestion(index) {
    questions.forEach((q, i) => {
      q.hidden = i !== index;
    });

    // Scroll to top of quiz
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Focus on first radio button for accessibility
    if (questions[index]) {
      const firstRadio = questions[index].querySelector('input[type="radio"]');
      if (firstRadio) {
        setTimeout(() => firstRadio.focus(), 100);
      }
    }
  }

  /**
   * Show error message
   */
  function showError(questionEl, message) {
    // Remove existing error
    const existingError = questionEl.querySelector('.govuk-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Add error class to fieldset
    const fieldset = questionEl.querySelector('.govuk-fieldset');
    if (fieldset) {
      fieldset.classList.add('govuk-form-group--error');
    }

    // Add error message
    const errorSpan = document.createElement('p');
    errorSpan.className = 'govuk-error-message';
    errorSpan.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${message}`;

    const radiosDiv = questionEl.querySelector('.govuk-radios');
    if (radiosDiv) {
      radiosDiv.parentNode.insertBefore(errorSpan, radiosDiv);
    }
  }

  /**
   * Calculate scenario scores
   */
  function calculateScores() {
    const scores = {};

    // Initialize scores for all scenarios
    SCENARIOS.forEach(scenario => {
      scores[scenario.id] = 0;
    });

    // Add weights from each answer
    QUIZ_CONFIG.questions.forEach(question => {
      const answerId = answers[question.id];
      if (!answerId) return;

      const selectedOption = question.options.find(opt => opt.id === answerId);
      if (selectedOption && selectedOption.weights) {
        Object.entries(selectedOption.weights).forEach(([scenarioId, weight]) => {
          if (scores.hasOwnProperty(scenarioId)) {
            scores[scenarioId] += weight;
          }
        });
      }
    });

    return scores;
  }

  /**
   * Get top recommendations
   */
  function getRecommendations() {
    const scores = calculateScores();
    const threshold = QUIZ_CONFIG.recommendation_algorithm.threshold || 3;
    const maxResults = QUIZ_CONFIG.recommendation_algorithm.max_results || 3;

    // Sort scenarios by score
    const sorted = Object.entries(scores)
      .filter(([id, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults);

    // Map to full scenario objects
    return sorted.map(([id, score]) => {
      const scenario = SCENARIOS.find(s => s.id === id);
      return { ...scenario, score };
    });
  }

  /**
   * Generate reasoning text
   */
  function generateReasoning() {
    const labels = QUIZ_CONFIG.labels || {};
    const parts = [];

    if (answers.challenge && labels.challenge && labels.challenge[answers.challenge]) {
      parts.push(`your interest in ${labels.challenge[answers.challenge]}`);
    }

    if (answers.time && labels.time && labels.time[answers.time]) {
      parts.push(`${labels.time[answers.time]} available`);
    }

    if (answers.role && labels.role && labels.role[answers.role]) {
      parts.push(`your role as ${labels.role[answers.role]}`);
    }

    if (parts.length === 0) {
      return 'Based on your responses, we recommend the following scenarios:';
    }

    return `Based on ${parts.join(', ')}, we recommend these scenarios:`;
  }

  /**
   * Generate difficulty color class
   */
  function getDifficultyColor(difficulty) {
    const colors = {
      'beginner': 'green',
      'intermediate': 'yellow',
      'advanced': 'red'
    };
    return colors[difficulty?.toLowerCase()] || 'grey';
  }

  /**
   * Render scenario card HTML
   */
  function renderScenarioCard(scenario, rank) {
    const difficultyColor = getDifficultyColor(scenario.difficulty);

    return `
      <div class="ndx-scenario-card ndx-scenario-card--recommended">
        <div class="ndx-scenario-card__content">
          <p class="govuk-body-s govuk-!-margin-bottom-1">
            <span class="govuk-tag govuk-tag--blue">#${rank} Match</span>
          </p>
          <h3 class="govuk-heading-m govuk-!-margin-bottom-2">
            <a href="${scenario.url}" class="govuk-link govuk-link--no-visited-state">
              ${scenario.name}
            </a>
          </h3>
          <p class="govuk-body govuk-!-margin-bottom-3">${scenario.headline}</p>
          <p class="govuk-body-s govuk-!-margin-bottom-3"><strong>Best for:</strong> ${scenario.bestFor || ''}</p>
          <dl class="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-bottom-3">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key govuk-!-width-one-third">Difficulty</dt>
              <dd class="govuk-summary-list__value">
                <strong class="govuk-tag govuk-tag--${difficultyColor}">
                  ${scenario.difficulty ? scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1) : ''}
                </strong>
              </dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key govuk-!-width-one-third">Time</dt>
              <dd class="govuk-summary-list__value">${scenario.timeEstimate || ''}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key govuk-!-width-one-third">Cost</dt>
              <dd class="govuk-summary-list__value">${scenario.estimatedCost || ''}</dd>
            </div>
          </dl>
          <a href="${scenario.url}" class="govuk-button" data-module="govuk-button">
            Learn more
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Show results
   */
  function showResults() {
    const recommendations = getRecommendations();

    // Track quiz completion
    if (window.NDXAnalytics && recommendations.length > 0) {
      NDXAnalytics.trackQuizCompleted(recommendations[0].id, answers);
    }

    // Generate reasoning
    if (reasoningEl) {
      reasoningEl.textContent = generateReasoning();
    }

    // Generate recommendation cards
    if (recommendationsEl) {
      if (recommendations.length === 0) {
        recommendationsEl.innerHTML = `
          <div class="govuk-inset-text">
            <p>We couldn't find a strong match based on your responses.</p>
            <p><a href="${GALLERY_URL}" class="govuk-link">Browse all scenarios</a> to find what works for you.</p>
          </div>
        `;
      } else {
        recommendationsEl.innerHTML = recommendations
          .map((scenario, index) => renderScenarioCard(scenario, index + 1))
          .join('');
      }
    }

    // Hide questions and show results
    questions.forEach(q => q.hidden = true);
    if (resultsSection) {
      resultsSection.hidden = false;
    }

    // Scroll to results
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Save state to session storage
   */
  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentQuestion,
        answers
      }));
    } catch (e) {
      console.warn('Quiz: Could not save state to session storage');
    }
  }

  /**
   * Restore state from session storage
   */
  function restoreState() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        currentQuestion = state.currentQuestion || 0;
        answers = state.answers || {};

        // Restore radio selections
        Object.entries(answers).forEach(([questionId, value]) => {
          const radio = document.querySelector(`input[name="${questionId}"][value="${value}"]`);
          if (radio) {
            radio.checked = true;
          }
        });
      }
    } catch (e) {
      console.warn('Quiz: Could not restore state from session storage');
    }
  }

  /**
   * Clear state from session storage
   */
  function clearState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Quiz: Could not clear state from session storage');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
