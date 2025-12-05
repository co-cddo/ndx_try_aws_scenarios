---
layout: page
title: NDX:Try AWS for UK Councils
description: Try AWS Before You Buy - Zero-cost evaluation platform for UK local government. Deploy real AWS scenarios in 15 minutes with no cloud expertise required.
---

<div class="ndx-hero">
  <div class="govuk-width-container">
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <h1 class="govuk-heading-xl ndx-hero__title">Try AWS Before You Buy for UK Councils</h1>
        <p class="govuk-body-l ndx-hero__description">
          Evaluate AWS AI and cloud services with real local government scenarios. No cloud expertise required. Deploy in 15 minutes. <strong>Completely FREE as part of NDX:Try.</strong>
        </p>
        <div class="ndx-hero__cta">
          <a href="/quiz/" role="button" draggable="false" class="govuk-button govuk-button--start" data-module="govuk-button">
            Find Your Scenario
            <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="ndx-safety-banner ndx-safety-banner--info">
  <div class="govuk-width-container">
    <p class="ndx-safety-banner__text">
      <span class="ndx-safety-banner__icon">&#128274;</span>
      <strong>Innovation Sandbox:</strong> Your evaluation is completely isolated from production systems. Automatic cleanup when you're done.
    </p>
  </div>
</div>

## Why councils trust NDX:Try

<div class="ndx-trust-indicators">
  <ul class="ndx-trust-indicators__list">
    <li class="ndx-trust-indicators__item">
      <span class="ndx-trust-indicators__value">50+</span>
      <span class="ndx-trust-indicators__label">councils evaluating AWS</span>
    </li>
    <li class="ndx-trust-indicators__item">
      <span class="ndx-trust-indicators__value">15 min</span>
      <span class="ndx-trust-indicators__label">to first insight</span>
    </li>
    <li class="ndx-trust-indicators__item">
      <span class="ndx-trust-indicators__value">FREE</span>
      <span class="ndx-trust-indicators__label">provided by AWS</span>
    </li>
  </ul>
</div>

<div class="ndx-explainer" id="what-is-ndx-try">
  <h2 class="govuk-heading-m ndx-explainer__title">What is NDX:Try?</h2>
  <p class="govuk-body">
    NDX:Try is a free evaluation platform that lets UK councils experience AWS cloud services before committing to procurement. Each scenario is designed specifically for local government use cases, with realistic sample data and guided walkthroughs.
  </p>
  <p class="govuk-body">
    You're not the first council to explore cloud AI, and you won't be the last. Our scenarios help you understand what's possible in 15 minutes, not 15 hours.
  </p>
  <p class="govuk-body govuk-!-margin-bottom-0">
    <a href="/get-started/" class="govuk-link">Learn how it works &rarr;</a>
  </p>
</div>

## Explore real-world scenarios

Choose from 6 AWS scenarios designed for UK local government:

<div class="ndx-scenario-grid">
  {% for scenario in scenarios.scenarios %}
    <div class="ndx-scenario-card{% if scenario.featured %} ndx-scenario-card--featured{% endif %}">
      <div class="ndx-scenario-card__content">
        {% if scenario.featured %}
          <p class="govuk-body-s govuk-!-margin-bottom-1">
            <span class="govuk-tag govuk-tag--purple">Featured</span>
          </p>
        {% endif %}
        <h3 class="govuk-heading-m govuk-!-margin-bottom-2">
          <a href="{{ scenario.url }}" class="govuk-link govuk-link--no-visited-state">
            {{ scenario.name }}
          </a>
        </h3>
        <p class="govuk-body govuk-!-margin-bottom-3">{{ scenario.headline }}</p>
        <p class="govuk-body-s govuk-!-margin-bottom-3"><strong>Best for:</strong> {{ scenario.bestFor }}</p>
        <dl class="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-bottom-3">
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key govuk-!-width-one-third">Difficulty</dt>
            <dd class="govuk-summary-list__value">
              <strong class="govuk-tag govuk-tag--{{ scenario.difficulty | difficultyColor }}">
                {{ scenario.difficulty | capitalize }}
              </strong>
            </dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key govuk-!-width-one-third">Time</dt>
            <dd class="govuk-summary-list__value">{{ scenario.timeEstimate }}</dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key govuk-!-width-one-third">Cost</dt>
            <dd class="govuk-summary-list__value">
              <strong class="govuk-tag govuk-tag--green">FREE</strong>
            </dd>
          </div>
        </dl>
        {% if scenario.tags and scenario.tags.length > 0 %}
          <p class="govuk-body-s govuk-!-margin-bottom-0">
            {% for tag in scenario.tags %}
              <span class="govuk-tag govuk-tag--grey govuk-!-margin-right-1 govuk-!-margin-bottom-1">{{ tag }}</span>
            {% endfor %}
          </p>
        {% endif %}
      </div>
      <div class="ndx-scenario-card__action govuk-!-margin-top-3">
        <a href="{{ scenario.url }}" class="govuk-link govuk-body-s">
          Learn more<span class="govuk-visually-hidden"> about {{ scenario.name }}</span>
        </a>
      </div>
    </div>
  {% endfor %}
</div>

<p class="govuk-body govuk-!-margin-top-6">
  <a href="/scenarios/" class="govuk-link">Browse all scenarios with filtering &rarr;</a>
</p>

<div class="ndx-cta-section">
  <h2 class="govuk-heading-m ndx-cta-section__title">Not sure where to start?</h2>
  <p class="govuk-body">
    Take our 2-minute quiz to find the best scenario for your council's needs.
  </p>
  <a href="/quiz/" role="button" draggable="false" class="govuk-button" data-module="govuk-button">
    Find Your Scenario
  </a>
  <p class="govuk-body-s govuk-!-margin-top-3 govuk-!-margin-bottom-0">
    or <a href="/scenarios/" class="govuk-link">browse all scenarios</a>
  </p>
</div>

---

<div class="govuk-grid-row">
  <div class="govuk-grid-column-two-thirds">
    <h2 class="govuk-heading-m">Built for UK councils</h2>
    <p class="govuk-body">
      This platform is developed by the NDX Partnership with support from the
      <a href="https://www.local.gov.uk/our-support/efficiency-and-productivity/artificial-intelligence" class="govuk-link">Local Government Association AI Hub</a>.
    </p>
    <p class="govuk-body">
      <span class="govuk-tag govuk-tag--green">Open Source (MIT)</span>
      <a href="https://github.com/co-cddo/ndx-try-aws-scenarios" class="govuk-link govuk-!-margin-left-2">View on GitHub</a>
    </p>
  </div>
</div>
