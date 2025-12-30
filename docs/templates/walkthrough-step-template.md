# Walkthrough Step Template

Use this template when creating new walkthrough step pages.

---

## File Location

```
src/walkthroughs/{scenario-id}/step-{N}.njk
```

Replace `{scenario-id}` with the scenario identifier (e.g., `localgov-drupal`, `council-chatbot`).
Replace `{N}` with the step number.

---

## Template

```nunjucks
---
layout: layouts/walkthrough.njk
title: "Step {N}: {Action Title} - {Scenario Name} Walkthrough"
description: {Brief description of what this step accomplishes}
currentStep: {N}
totalSteps: {TOTAL}
timeEstimate: "{X} minutes"
scenarioId: {scenario-id}
---

{#
  Step {N}: {Action Title} (Story reference)
  - First key action
  - Second key action
  - Third key action
#}

{% set stepNumber = {N} %}
{% set stepTitle = "{Action Title}" %}
{% set stepDescription = "{What this step accomplishes in one sentence.}" %}
{% set timeEstimate = "{X} minutes" %}
{% set expectedOutcomes = [
  "{First expected outcome}",
  "{Second expected outcome}",
  "{Third expected outcome}"
] %}

{% include "components/walkthrough-step.njk" %}

<h3 class="govuk-heading-m">{First Section Title}</h3>

<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>
    <strong>{First action in bold}</strong>
    <p class="govuk-body">
      {Supporting detail explaining the action}
    </p>
  </li>

  <li>
    <strong>{Second action in bold}</strong>
    <p class="govuk-body">
      {Supporting detail explaining the action}
    </p>
  </li>

  <li>
    <strong>{Third action in bold}</strong>
    <p class="govuk-body">
      {Supporting detail explaining the action}
    </p>
    <p class="govuk-body">
      {Additional detail if needed}
    </p>
  </li>
</ol>

{# Optional: Tip or note #}
<div class="govuk-inset-text">
  <p class="govuk-body">
    <strong>Tip:</strong> {Helpful information for the user}
  </p>
</div>

<h3 class="govuk-heading-m">{Second Section Title}</h3>

<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>
    <strong>{Action in bold}</strong>
    <p class="govuk-body">
      {Supporting detail}
    </p>
  </li>

  <li>
    <strong>{Action in bold}</strong>
    <p class="govuk-body">
      {Supporting detail}
    </p>
  </li>
</ol>

<h3 class="govuk-heading-m">What you should see</h3>

<p class="govuk-body">
  After completing this step, you should see:
</p>

<ul class="govuk-list govuk-list--bullet">
  <li>{First observable outcome}</li>
  <li>{Second observable outcome}</li>
  <li>{Third observable outcome}</li>
</ul>

{# Troubleshooting section(s) #}
<details class="govuk-details govuk-!-margin-top-6">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: {Specific issue title}
    </span>
  </summary>
  <div class="govuk-details__text">
    <p class="govuk-body">
      If {describe the problem}:
    </p>
    <ul class="govuk-list govuk-list--bullet">
      <li>{First possible solution}</li>
      <li>{Second possible solution}</li>
      <li>{Third possible solution}</li>
    </ul>
  </div>
</details>

<details class="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: {Another issue title}
    </span>
  </summary>
  <div class="govuk-details__text">
    <p class="govuk-body">
      If {describe the problem}:
    </p>
    <ul class="govuk-list govuk-list--bullet">
      <li>{First possible solution}</li>
      <li>{Second possible solution}</li>
    </ul>
  </div>
</details>

{# Screenshot placeholder - remove once real screenshots added #}
<div class="govuk-warning-text govuk-!-margin-top-6">
  <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
  <strong class="govuk-warning-text__text">
    <span class="govuk-visually-hidden">Note</span>
    Screenshot placeholder: This page should include annotated screenshots showing {what}.
  </strong>
</div>

<style>
  code {
    background-color: #f3f2f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 16px;
  }

  {# Add any step-specific styles here #}
</style>
```

---

## Placeholders Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{N}` | Step number | `1`, `2`, `3` |
| `{TOTAL}` | Total steps in walkthrough | `5` |
| `{Action Title}` | Brief action description | `Log in to Drupal` |
| `{Scenario Name}` | Full scenario name | `LocalGov Drupal` |
| `{scenario-id}` | Scenario identifier | `localgov-drupal` |
| `{X}` | Time estimate in minutes | `3` |

---

## Required Sections Checklist

- [ ] Front matter with all required fields
- [ ] Step comment documenting story reference and key actions
- [ ] Step variables block with `expectedOutcomes`
- [ ] Include statement for `walkthrough-step.njk`
- [ ] At least one content section with numbered list
- [ ] "What you should see" section
- [ ] At least one troubleshooting section
- [ ] Screenshot placeholder (until real screenshots added)

---

## Front Matter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `layout` | Yes | Always `layouts/walkthrough.njk` |
| `title` | Yes | Format: "Step N: Action - Scenario Walkthrough" |
| `description` | Yes | Meta description for SEO |
| `currentStep` | Yes | Current step number (1-based) |
| `totalSteps` | Yes | Total steps in this walkthrough |
| `timeEstimate` | No | Estimated time to complete step |
| `scenarioId` | Yes | Scenario identifier for navigation |

---

## Screenshot Integration

When screenshots are available, replace the placeholder with:

```nunjucks
{# Screenshot with lightbox support #}
<figure class="ndx-screenshot">
  <a href="/assets/images/screenshots/{scenario-id}/{scenario-id}-step-{N}-{description}-desktop.png"
     class="ndx-lightbox-trigger"
     data-caption="{Screenshot caption}">
    <img src="/assets/images/screenshots/{scenario-id}/{scenario-id}-step-{N}-{description}-desktop.png"
         alt="{Meaningful alt text describing what the user should see}"
         class="ndx-screenshot__image" />
  </a>
  <figcaption class="ndx-screenshot__caption">
    {Screenshot caption}
  </figcaption>
</figure>
```

---

## Related Templates

- **Index page**: `docs/templates/walkthrough-index-template.md`
- **Complete page**: `docs/templates/walkthrough-complete-template.md`
- **Explore pages**: `docs/templates/walkthrough-explore-template.md`

---

## References

- [Documentation Standards](../documentation-standards.md)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [Walkthrough Layout](../../src/_includes/layouts/walkthrough.njk)
