---
layout: page
title: Find Your Scenario
description: Answer 3 quick questions to discover the AWS scenario that best matches your council's needs.
---

<div class="ndx-quiz" id="quiz-container">
  <noscript>
    <div class="govuk-warning-text">
      <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
      <strong class="govuk-warning-text__text">
        <span class="govuk-visually-hidden">Warning</span>
        JavaScript is required for the interactive quiz. Browse all scenarios below instead.
      </strong>
    </div>
    <h2 class="govuk-heading-m">Browse All Scenarios</h2>
    <p class="govuk-body">
      <a href="/scenarios/" class="govuk-link">View all 6 AWS scenarios for UK councils &rarr;</a>
    </p>
    <div class="ndx-scenario-grid">
      {% for scenario in scenarios.scenarios %}
        <div class="ndx-scenario-card">
          <div class="ndx-scenario-card__content">
            <h3 class="govuk-heading-s govuk-!-margin-bottom-2">
              <a href="{{ scenario.url }}" class="govuk-link govuk-link--no-visited-state">{{ scenario.name }}</a>
            </h3>
            <p class="govuk-body-s govuk-!-margin-bottom-2">{{ scenario.headline }}</p>
            <p class="govuk-body-s govuk-!-margin-bottom-0">
              <strong class="govuk-tag govuk-tag--{{ scenario.difficulty | difficultyColor }}">{{ scenario.difficulty | capitalize }}</strong>
              <span class="govuk-!-margin-left-2">{{ scenario.timeEstimate }}</span>
            </p>
          </div>
        </div>
      {% endfor %}
    </div>
  </noscript>

  <div class="ndx-quiz__intro js-quiz-intro">
    <p class="govuk-body-l">
      Answer 3 quick questions to find the AWS scenario that best matches your council's needs.
    </p>
    <p class="govuk-body">
      This takes less than 30 seconds. Not sure? You can always <a href="/scenarios/" class="govuk-link">browse all scenarios</a> instead.
    </p>
  </div>

  <!-- Question 1: Challenge -->
  <div class="ndx-quiz__question js-quiz-question" id="question-challenge" data-question="challenge">
    <span class="govuk-caption-l">Step 1 of 3</span>
    <fieldset class="govuk-fieldset">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
        <h2 class="govuk-fieldset__heading">
          {{ quizConfig.questions[0].text }}
        </h2>
      </legend>
      {% if quizConfig.questions[0].hint %}
        <div class="govuk-hint">{{ quizConfig.questions[0].hint }}</div>
      {% endif %}
      <div class="govuk-radios" data-module="govuk-radios">
        {% for option in quizConfig.questions[0].options %}
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="challenge-{{ option.id }}" name="challenge" type="radio" value="{{ option.id }}"{% if option.action %} data-action="{{ option.action }}"{% endif %}>
            <label class="govuk-label govuk-radios__label" for="challenge-{{ option.id }}">
              {{ option.label }}
            </label>
            {% if option.description %}
              <div class="govuk-hint govuk-radios__hint">
                {{ option.description }}
              </div>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    </fieldset>
    <div class="govuk-button-group govuk-!-margin-top-6">
      <button type="button" class="govuk-button js-quiz-next" data-module="govuk-button">
        Continue
      </button>
    </div>
  </div>

  <!-- Question 2: Time -->
  <div class="ndx-quiz__question js-quiz-question" id="question-time" data-question="time" hidden>
    <span class="govuk-caption-l">Step 2 of 3</span>
    <fieldset class="govuk-fieldset">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
        <h2 class="govuk-fieldset__heading">
          {{ quizConfig.questions[1].text }}
        </h2>
      </legend>
      {% if quizConfig.questions[1].hint %}
        <div class="govuk-hint">{{ quizConfig.questions[1].hint }}</div>
      {% endif %}
      <div class="govuk-radios" data-module="govuk-radios">
        {% for option in quizConfig.questions[1].options %}
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="time-{{ option.id }}" name="time" type="radio" value="{{ option.id }}"{% if option.action %} data-action="{{ option.action }}"{% endif %}>
            <label class="govuk-label govuk-radios__label" for="time-{{ option.id }}">
              {{ option.label }}
            </label>
            {% if option.description %}
              <div class="govuk-hint govuk-radios__hint">
                {{ option.description }}
              </div>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    </fieldset>
    <div class="govuk-button-group govuk-!-margin-top-6">
      <button type="button" class="govuk-button govuk-button--secondary js-quiz-back" data-module="govuk-button">
        Back
      </button>
      <button type="button" class="govuk-button js-quiz-next" data-module="govuk-button">
        Continue
      </button>
    </div>
  </div>

  <!-- Question 3: Role -->
  <div class="ndx-quiz__question js-quiz-question" id="question-role" data-question="role" hidden>
    <span class="govuk-caption-l">Step 3 of 3</span>
    <fieldset class="govuk-fieldset">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
        <h2 class="govuk-fieldset__heading">
          {{ quizConfig.questions[2].text }}
        </h2>
      </legend>
      {% if quizConfig.questions[2].hint %}
        <div class="govuk-hint">{{ quizConfig.questions[2].hint }}</div>
      {% endif %}
      <div class="govuk-radios" data-module="govuk-radios">
        {% for option in quizConfig.questions[2].options %}
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="role-{{ option.id }}" name="role" type="radio" value="{{ option.id }}"{% if option.action %} data-action="{{ option.action }}"{% endif %}>
            <label class="govuk-label govuk-radios__label" for="role-{{ option.id }}">
              {{ option.label }}
            </label>
            {% if option.description %}
              <div class="govuk-hint govuk-radios__hint">
                {{ option.description }}
              </div>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    </fieldset>
    <div class="govuk-button-group govuk-!-margin-top-6">
      <button type="button" class="govuk-button govuk-button--secondary js-quiz-back" data-module="govuk-button">
        Back
      </button>
      <button type="button" class="govuk-button js-quiz-submit" data-module="govuk-button">
        Show my recommendations
      </button>
    </div>
  </div>

  <!-- Results Section -->
  <div class="ndx-quiz__results js-quiz-results" id="quiz-results" hidden>
    <h2 class="govuk-heading-l">Your recommended scenarios</h2>
    <p class="govuk-body-l js-quiz-reasoning" id="quiz-reasoning">
      <!-- Reasoning text inserted by JavaScript -->
    </p>

    <div class="ndx-scenario-grid js-quiz-recommendations" id="quiz-recommendations">
      <!-- Scenario cards inserted by JavaScript -->
    </div>

    <div class="govuk-!-margin-top-6">
      <h3 class="govuk-heading-m">Want to see more options?</h3>
      <p class="govuk-body">
        <a href="/scenarios/" class="govuk-link">Browse all 6 scenarios</a> or
        <button type="button" class="govuk-link js-quiz-restart" style="background: none; border: none; cursor: pointer; text-decoration: underline;">
          retake the quiz
        </button>
      </p>
    </div>
  </div>
</div>

<script>
  // Store scenario data for JavaScript
  window.NDX_SCENARIOS = {{ scenarios.scenarios | dump | safe }};
  window.NDX_QUIZ_CONFIG = {{ quizConfig | dump | safe }};
</script>
<script src="/assets/js/quiz.js" defer></script>
