# Walkthrough Step Example

This is a complete example of a properly formatted walkthrough step page, demonstrating all required elements and best practices.

---

## Example: LocalGov Drupal Step 1

The following is the complete content for `src/walkthroughs/localgov-drupal/step-1.njk`:

```nunjucks
---
layout: layouts/walkthrough.njk
title: "Step 1: Log in to Drupal - LocalGov Drupal Walkthrough"
description: Get your credentials and access the Drupal admin dashboard
currentStep: 1
totalSteps: 5
timeEstimate: "3 minutes"
scenarioId: localgov-drupal
---

{#
  Step 1: Log in to Drupal (Story 2.4)
  - Finding credentials in CloudFormation Outputs
  - Accessing the Drupal login page
  - First login experience
#}

{% set stepNumber = 1 %}
{% set stepTitle = "Log in to Drupal" %}
{% set stepDescription = "Get your admin credentials from CloudFormation and access the Drupal admin dashboard." %}
{% set timeEstimate = "3 minutes" %}
{% set expectedOutcomes = [
  "CloudFormation stack shows CREATE_COMPLETE status",
  "You have copied the DrupalUrl, AdminUsername, and AdminPassword",
  "You are logged into the Drupal admin dashboard"
] %}

{% include "components/walkthrough-step.njk" %}

<h3 class="govuk-heading-m">Finding your credentials</h3>

<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>
    <strong>Open the CloudFormation console</strong>
    <p class="govuk-body">
      Go to <a href="https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks" target="_blank" rel="noopener noreferrer" class="govuk-link">CloudFormation console in us-east-1 (N. Virginia)<span class="govuk-visually-hidden"> (opens in new tab)</span></a>
    </p>
  </li>

  <li>
    <strong>Find your stack</strong>
    <p class="govuk-body">
      Look for a stack named <code>ndx-try-localgov-drupal-[timestamp]</code>
    </p>
    <p class="govuk-body">
      The status should be <span class="govuk-tag govuk-tag--green">CREATE_COMPLETE</span>
    </p>
  </li>

  <li>
    <strong>Go to the "Outputs" tab</strong>
    <p class="govuk-body">
      Click on your stack name, then select the "Outputs" tab
    </p>
  </li>

  <li>
    <strong>Copy these three values</strong>
    <div class="ndx-credentials-list">
      <p class="govuk-body">
        <strong>DrupalUrl:</strong> The URL to access your Drupal site<br>
        <code>https://[your-alb-dns].elb.amazonaws.com</code>
      </p>
      <p class="govuk-body">
        <strong>AdminUsername:</strong> Usually <code>admin</code>
      </p>
      <p class="govuk-body">
        <strong>AdminPassword:</strong> Auto-generated secure password
      </p>
    </div>
  </li>
</ol>

<div class="govuk-inset-text">
  <p class="govuk-body">
    <strong>Tip:</strong> If you're viewing this after deploying from the scenario page,
    your credentials are also shown in the Credentials Card on that page.
  </p>
</div>

<h3 class="govuk-heading-m">Logging in to Drupal</h3>

<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>
    <strong>Open your Drupal site</strong>
    <p class="govuk-body">
      Click the <strong>DrupalUrl</strong> link or paste it into a new browser tab
    </p>
  </li>

  <li>
    <strong>Go to the login page</strong>
    <p class="govuk-body">
      Add <code>/user/login</code> to the URL, or click "Log in" in the header
    </p>
  </li>

  <li>
    <strong>Enter your credentials</strong>
    <p class="govuk-body">
      Enter the <strong>AdminUsername</strong> and <strong>AdminPassword</strong> from the Outputs tab
    </p>
  </li>

  <li>
    <strong>Click "Log in"</strong>
    <p class="govuk-body">
      You'll be redirected to the Drupal admin dashboard
    </p>
  </li>
</ol>

<h3 class="govuk-heading-m">What you should see</h3>

<p class="govuk-body">
  After logging in, you should see:
</p>

<ul class="govuk-list govuk-list--bullet">
  <li>The Drupal admin toolbar at the top of the page</li>
  <li>A "Welcome to [Council Name]" message</li>
  <li>Quick links to Content, Structure, and other admin sections</li>
  <li>The DEMO banner indicating this is a demonstration site</li>
</ul>

{# Troubleshooting section #}
<details class="govuk-details govuk-!-margin-top-6">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: Site not loading
    </span>
  </summary>
  <div class="govuk-details__text">
    <p class="govuk-body">
      If the Drupal site doesn't load:
    </p>
    <ul class="govuk-list govuk-list--bullet">
      <li>Wait 2-3 minutes after stack completion - Drupal needs time to initialize</li>
      <li>Check the CloudFormation "Events" tab for any errors</li>
      <li>Try refreshing the page - the first load may be slow</li>
      <li>Check you're using the correct URL from the Outputs tab</li>
    </ul>
  </div>
</details>

<details class="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: Login not working
    </span>
  </summary>
  <div class="govuk-details__text">
    <p class="govuk-body">
      If you can't log in:
    </p>
    <ul class="govuk-list govuk-list--bullet">
      <li>Double-check you copied the entire password (no trailing spaces)</li>
      <li>Passwords are case-sensitive</li>
      <li>Make sure you're on the <code>/user/login</code> page, not the homepage</li>
      <li>Try using the password copy button in CloudFormation Outputs</li>
    </ul>
  </div>
</details>

{# Screenshot with lightbox - example of integrated screenshot #}
<figure class="ndx-screenshot govuk-!-margin-top-6">
  <a href="/assets/images/screenshots/localgov-drupal/localgov-drupal-step-1-login-form-desktop.png"
     class="ndx-lightbox-trigger"
     data-caption="Drupal login form at /user/login">
    <img src="/assets/images/screenshots/localgov-drupal/localgov-drupal-step-1-login-form-desktop.png"
         alt="Drupal login form showing username and password fields with a Log in button"
         class="ndx-screenshot__image" />
  </a>
  <figcaption class="ndx-screenshot__caption">
    The Drupal login form at /user/login
  </figcaption>
</figure>

<style>
  code {
    background-color: #f3f2f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 16px;
  }

  .ndx-credentials-list {
    margin: 15px 0;
    padding: 15px;
    background-color: #f3f2f1;
    border-left: 4px solid #1d70b8;
  }

  .ndx-credentials-list p {
    margin-bottom: 10px;
  }

  .ndx-credentials-list p:last-child {
    margin-bottom: 0;
  }

  .ndx-screenshot {
    margin: 0;
    padding: 0;
  }

  .ndx-screenshot__image {
    max-width: 100%;
    height: auto;
    border: 1px solid #b1b4b6;
    border-radius: 4px;
  }

  .ndx-screenshot__caption {
    margin-top: 10px;
    font-size: 16px;
    color: #505a5f;
  }
</style>
```

---

## Key Elements Demonstrated

### 1. Front Matter

All required fields present:
- `layout`: Uses the walkthrough layout
- `title`: Follows "Step N: Action - Scenario Walkthrough" format
- `description`: Brief, descriptive meta text
- `currentStep`: Current step number
- `totalSteps`: Total steps in walkthrough
- `timeEstimate`: Time to complete step
- `scenarioId`: Matches scenario identifier

### 2. Comment Block

Documents the story reference and key actions for maintainability:
```nunjucks
{#
  Step 1: Log in to Drupal (Story 2.4)
  - Finding credentials in CloudFormation Outputs
  - Accessing the Drupal login page
  - First login experience
#}
```

### 3. Step Variables

All required variables set before including the component:
- `stepNumber`: Current step
- `stepTitle`: Brief action title
- `stepDescription`: One sentence description
- `timeEstimate`: Time estimate string
- `expectedOutcomes`: Array of outcomes

### 4. Content Structure

- **Multiple sections** with `govuk-heading-m`
- **Numbered lists** using `govuk-list govuk-list--number govuk-list--spaced`
- **Bold action keywords** in `<strong>` tags
- **Code formatting** for URLs and technical terms
- **Inset text** for tips
- **Credentials list** with custom styling

### 5. What You Should See

Clear verification section:
```html
<h3 class="govuk-heading-m">What you should see</h3>
<ul class="govuk-list govuk-list--bullet">
  <li>Observable outcome 1</li>
  <li>Observable outcome 2</li>
</ul>
```

### 6. Troubleshooting

Multiple `govuk-details` components:
- First one has `govuk-!-margin-top-6` for spacing
- Subsequent ones have no extra margin
- Each has specific, actionable solutions

### 7. Accessibility

- External links have `target="_blank" rel="noopener noreferrer"`
- Visually hidden text for screen readers: `<span class="govuk-visually-hidden">`
- Proper heading hierarchy (h3 within layout's h1/h2)
- Meaningful alt text for screenshots
- Focus states inherited from GOV.UK components

### 8. Screenshot Integration

When screenshots are available:
```html
<figure class="ndx-screenshot">
  <a href="..." class="ndx-lightbox-trigger" data-caption="...">
    <img src="..." alt="Meaningful description" class="ndx-screenshot__image" />
  </a>
  <figcaption class="ndx-screenshot__caption">Caption text</figcaption>
</figure>
```

### 9. Custom Styles

Minimal, scoped styles for step-specific elements:
- `code` styling for inline code
- `.ndx-credentials-list` for structured credential display
- `.ndx-screenshot` for figure styling

---

## Screenshot Naming Examples

For this step, screenshots would be named:

| Screenshot | Filename |
|------------|----------|
| Login form (desktop) | `localgov-drupal-step-1-login-form-desktop.png` |
| Login form (mobile) | `localgov-drupal-step-1-login-form-mobile.png` |
| CloudFormation outputs | `localgov-drupal-step-1-cloudformation-outputs-desktop.png` |
| Admin dashboard | `localgov-drupal-step-1-admin-dashboard-desktop.png` |

---

## Terminology Usage

This example demonstrates correct terminology from the glossary:

| Term Used | Glossary Entry |
|-----------|----------------|
| Admin toolbar | The dark horizontal bar at the top when logged in |
| DEMO banner | Indicator that site is for demonstration |
| Stack | CloudFormation deployment unit |
| Outputs | Values exported by a stack |

---

## Validation Checklist

This example passes all validation criteria:

- [x] Front matter includes all required fields
- [x] Step variables block is complete with `expectedOutcomes`
- [x] Numbered lists use `govuk-list govuk-list--number govuk-list--spaced`
- [x] All `<strong>` tags used for action keywords
- [x] "What you should see" section present
- [x] Multiple troubleshooting sections included
- [x] Screenshot follows naming convention
- [x] Image has meaningful alt text
- [x] Headings follow proper hierarchy
- [x] Links have descriptive text
- [x] Code uses `<code>` tags
- [x] Terminology matches glossary
- [x] External links accessible in new tab with screen reader text

---

## Related Files

- [Documentation Standards](../documentation-standards.md)
- [Walkthrough Step Template](./walkthrough-step-template.md)
- [Live Example](../../src/walkthroughs/localgov-drupal/step-1.njk)
