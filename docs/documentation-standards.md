# NDX:Try Documentation Standards

This document defines the standards, conventions, and requirements for all walkthrough documentation in the NDX:Try AWS Scenarios portal. Following these standards ensures consistent quality, accessibility, and maintainability across all guides.

## Table of Contents

1. [Document Structure](#document-structure)
2. [Screenshot Standards](#screenshot-standards)
3. [Terminology Glossary](#terminology-glossary)
4. [Accessibility Requirements](#accessibility-requirements)
5. [Content Guidelines](#content-guidelines)
6. [Drupal Overlay Content](#drupal-overlay-content)

---

## Document Structure

### Walkthrough Step Pages

All walkthrough step pages use the Nunjucks template system with 11ty and follow a consistent structure.

#### Required Front Matter

```yaml
---
layout: layouts/walkthrough.njk
title: "Step N: Action Title - Scenario Name Walkthrough"
description: Brief description of what this step accomplishes
currentStep: 1  # Step number (1-5 typically)
totalSteps: 5   # Total steps in this walkthrough
timeEstimate: "3 minutes"
scenarioId: scenario-id  # e.g., localgov-drupal, council-chatbot
---
```

#### Required Sections

Every walkthrough step must include:

1. **Step Variables Block**
   ```nunjucks
   {% set stepNumber = 1 %}
   {% set stepTitle = "Action Title" %}
   {% set stepDescription = "What this step accomplishes." %}
   {% set timeEstimate = "3 minutes" %}
   {% set expectedOutcomes = [
     "First expected outcome",
     "Second expected outcome",
     "Third expected outcome"
   ] %}

   {% include "components/walkthrough-step.njk" %}
   ```

2. **Main Content** - Numbered instruction steps using GOV.UK patterns
3. **What You Should See** - Verification of successful completion
4. **Troubleshooting** - Common issues in `<details>` accordions
5. **Screenshot Placeholders** - References to required screenshots

#### File Naming Convention

- Landing page: `src/walkthroughs/{scenario-id}/index.njk`
- Step pages: `src/walkthroughs/{scenario-id}/step-{N}.njk`
- Completion page: `src/walkthroughs/{scenario-id}/complete.njk`
- Explore pages: `src/walkthroughs/{scenario-id}/explore/{topic}.njk`

---

## Screenshot Standards

### File Naming Convention

Screenshots follow a strict naming pattern for consistency and automation:

```
{scenario-id}-{step-N}-{description}-{viewport}.png
```

**Components:**
- `scenario-id`: The scenario identifier (e.g., `localgov-drupal`, `council-chatbot`)
- `step-N`: The step number (e.g., `step-1`, `step-2`)
- `description`: Brief lowercase description with hyphens (e.g., `login-form`, `admin-dashboard`)
- `viewport`: Either `desktop` or `mobile`

**Examples:**
```
localgov-drupal-step-1-login-form-desktop.png
localgov-drupal-step-1-login-form-mobile.png
council-chatbot-step-2-sample-question-desktop.png
planning-ai-step-3-extracted-data-desktop.png
```

### Viewport Dimensions

| Viewport | Width | Height | Use Case |
|----------|-------|--------|----------|
| Desktop  | 1280  | 800    | Primary screenshots for guides |
| Mobile   | 375   | 667    | Mobile-responsive verification |

### File Requirements

| Property | Requirement |
|----------|-------------|
| Format | PNG |
| Maximum file size | 500KB |
| Colour depth | 8-bit (256 colours) for simple UI, 24-bit for complex images |
| Compression | Optimised with tools like pngquant or ImageOptim |

### Directory Structure

```
src/assets/images/screenshots/
├── localgov-drupal/
│   ├── localgov-drupal-step-1-login-form-desktop.png
│   ├── localgov-drupal-step-1-login-form-mobile.png
│   └── ...
├── council-chatbot/
│   └── ...
├── planning-ai/
│   └── ...
├── foi-redaction/
│   └── ...
├── smart-car-park/
│   └── ...
├── text-to-speech/
│   └── ...
└── quicksight-dashboard/
    └── ...
```

### Screenshot Manifest

Each scenario has a YAML manifest in `src/_data/screenshots/`:

```yaml
scenario: localgov-drupal
generated: 2025-12-30T00:00:00.000Z
description: Screenshots of deployed LocalGov Drupal CMS instance

public_pages:
  - path: "/"
    name: "homepage"
    description: "LocalGov Drupal homepage with sample content"

admin_pages:
  - path: "/admin/content"
    name: "admin-content"
    description: "Admin content management dashboard"

screenshots:
  - path: "localgov-drupal-step-1-login-form-desktop.png"
    description: "Drupal login form"
    captured: "2025-12-30T10:00:00.000Z"
    viewport: "desktop"
```

### Automation

Screenshots are captured automatically using Playwright:

```bash
# For LocalGov Drupal screenshots
DRUPAL_URL=https://your-alb-url.amazonaws.com \
DRUPAL_USER=admin \
DRUPAL_PASS=your-password \
npm run test:drupal-screenshots

# Validate all screenshots exist
npm run check-screenshots
```

### Annotation Guidelines

When screenshots require annotations (arrows, highlights, callouts):

1. **Arrows**: Red (#D4351C), 3px stroke, pointing to the relevant element
2. **Highlights**: Yellow (#FFDD00) with 30% opacity, rectangular bounds
3. **Callout boxes**: White background, 1px #0B0C0C border, GOV.UK Transport font
4. **Number badges**: 24px circles, #1D70B8 background, white text

Tool recommendation: Use Excalidraw or Figma for consistent annotation styling.

---

## Terminology Glossary

Use these consistent terms across all documentation.

### Drupal UI Elements

| Term | Definition | Usage |
|------|------------|-------|
| Admin toolbar | The dark horizontal bar at the top when logged in | "Click **Manage** in the admin toolbar" |
| Content types | Templates for different kinds of content | "Service pages use the **Service** content type" |
| Node | A single piece of content | "Edit the node at /node/1/edit" |
| Taxonomy | Classification system for content | "Add tags using the **Topics** taxonomy" |
| View | A dynamically generated list of content | "The homepage uses a **View** to display services" |
| Block | A reusable piece of content | "The DEMO banner is a **Block**" |
| Module | An extension that adds functionality | "Enable the **NDX AWS AI** module" |

### GOV.UK Design System Components

| Term | Definition | Usage |
|------|------------|-------|
| Summary card | Card displaying key information | "Your credentials appear in a **summary card**" |
| Details component | Expandable section | "Click the **details** to see troubleshooting" |
| Inset text | Highlighted text with left border | "Note the **inset text** with tips" |
| Tag | Status indicator | "Look for the **green tag** showing 'Complete'" |
| Warning text | Important warning with icon | "Read the **warning text** before proceeding" |
| Button | Primary action element | "Click the **Continue** button" |
| Link | Navigation element | "Click the **Log in** link" |

### AWS Resources

| Term | Definition | Usage |
|------|------------|-------|
| Stack | CloudFormation deployment unit | "Wait for the **stack** to complete" |
| Outputs | Values exported by a stack | "Find the URL in **Outputs**" |
| ALB | Application Load Balancer | "The **ALB** provides the public URL" |
| Fargate | Serverless container service | "Drupal runs on **Fargate**" |
| Aurora Serverless | Managed database service | "Data is stored in **Aurora Serverless**" |
| EFS | Elastic File System | "Drupal files are stored on **EFS**" |
| Bedrock | Foundation model service | "AI features use **Amazon Bedrock**" |
| Polly | Text-to-speech service | "Audio is generated by **Amazon Polly**" |

### Portal-Specific Terms

| Term | Definition | Usage |
|------|------------|-------|
| Scenario | A deployable AI demonstration | "Select a **scenario** to deploy" |
| Walkthrough | Step-by-step guided experience | "Follow the **walkthrough** to explore" |
| Evidence pack | Downloadable summary for stakeholders | "Generate an **evidence pack** for your committee" |
| DEMO banner | Indicator that site is for demonstration | "The **DEMO banner** appears on all pages" |
| Credentials card | Component showing login details | "Copy credentials from the **credentials card**" |

---

## Accessibility Requirements

All documentation must meet WCAG 2.2 Level AA standards.

### Content Requirements

1. **Heading hierarchy**: Use proper heading levels (h2, h3, h4) in sequence
2. **Link text**: Use descriptive link text, not "click here"
3. **Lists**: Use proper list markup for sequential steps
4. **Abbreviations**: Expand on first use (e.g., "Freedom of Information (FOI)")
5. **Language**: Use plain English (reading level 9 or below)

### Image Requirements

1. **Alt text**: All images must have meaningful alt text
2. **Decorative images**: Mark as decorative with empty alt=""
3. **Complex images**: Provide extended description in surrounding text
4. **Screenshots**: Alt text should describe what the user should see

**Alt text examples:**
```html
<!-- Good: Describes what's relevant -->
<img alt="CloudFormation Outputs tab showing DrupalUrl, AdminUsername, and AdminPassword values" src="...">

<!-- Good: For decorative/redundant images -->
<img alt="" role="presentation" src="...">

<!-- Bad: Too vague -->
<img alt="Screenshot" src="...">

<!-- Bad: Too detailed -->
<img alt="Screenshot showing CloudFormation console with stack name ndx-try-localgov-drupal-123456789 in the us-east-1 region with status CREATE_COMPLETE shown in green..." src="...">
```

### Interactive Elements

1. **Focus states**: All interactive elements must have visible focus
2. **Keyboard navigation**: All functionality accessible via keyboard
3. **Touch targets**: Minimum 44x44px touch target size
4. **Skip links**: Provided in layout for keyboard users

### Colour and Contrast

1. **Text contrast**: Minimum 4.5:1 ratio (3:1 for large text)
2. **UI components**: Minimum 3:1 ratio for borders and icons
3. **Don't rely on colour alone**: Use icons, patterns, or text as well

### GOV.UK Components

Use GOV.UK Design System components which have built-in accessibility:

```nunjucks
{# Use govuk-list for numbered steps #}
<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>First step instruction</li>
  <li>Second step instruction</li>
</ol>

{# Use govuk-details for troubleshooting #}
<details class="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: Issue title
    </span>
  </summary>
  <div class="govuk-details__text">
    Solution content here
  </div>
</details>

{# Use govuk-inset-text for tips #}
<div class="govuk-inset-text">
  <p class="govuk-body">Tip: Helpful information here</p>
</div>
```

---

## Content Guidelines

### Writing Style

1. **Second person**: Address the user as "you"
2. **Active voice**: "Click the button" not "The button should be clicked"
3. **Present tense**: "The page displays" not "The page will display"
4. **Concise**: Remove unnecessary words
5. **Consistent terminology**: Use glossary terms

### Instruction Format

Use numbered lists for sequential actions:

```html
<ol class="govuk-list govuk-list--number govuk-list--spaced">
  <li>
    <strong>Action in bold</strong>
    <p class="govuk-body">
      Supporting detail explaining the action
    </p>
  </li>
</ol>
```

### Code and Technical Terms

```html
{# Inline code #}
<code>/user/login</code>

{# URLs and paths #}
Add <code>/admin/content</code> to the URL

{# Stack names and identifiers #}
Look for <code>ndx-try-localgov-drupal-[timestamp]</code>
```

### Expected Outcomes

Always tell users what they should see after completing steps:

```html
<h3 class="govuk-heading-m">What you should see</h3>
<ul class="govuk-list govuk-list--bullet">
  <li>The admin toolbar at the top of the page</li>
  <li>A welcome message with the council name</li>
  <li>The DEMO banner indicating demonstration mode</li>
</ul>
```

### Troubleshooting Sections

Anticipate common issues and provide solutions:

```html
<details class="govuk-details govuk-!-margin-top-6">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      Troubleshooting: Specific issue title
    </span>
  </summary>
  <div class="govuk-details__text">
    <p class="govuk-body">If this happens:</p>
    <ul class="govuk-list govuk-list--bullet">
      <li>First possible cause and solution</li>
      <li>Second possible cause and solution</li>
    </ul>
  </div>
</details>
```

---

## Drupal Overlay Content

In-CMS guided tours use different standards than portal walkthrough pages.

### Step Length Limits

| Property | Limit | Reason |
|----------|-------|--------|
| Step title | 60 characters | Fits in overlay header |
| Step body | 200 characters | Readable in overlay panel |
| Steps per tour | 5-8 steps | Maintains engagement |

### Content Differences

| Portal Walkthrough | Drupal Overlay |
|--------------------|----------------|
| Full HTML with GOV.UK components | Plain text with minimal formatting |
| Screenshots with alt text | Points to live UI elements |
| Troubleshooting sections | Quick tips only |
| External links | In-context actions |

### Overlay Content Format

```yaml
# Tour step definition for Drupal overlay
- target: "#toolbar-item-administration"
  title: "Admin toolbar"
  body: "Click Manage to access content, structure, and configuration options."
  placement: "bottom"

- target: ".node-edit-form"
  title: "Edit content"
  body: "Make changes to page content here. Don't forget to save when done."
  placement: "left"
```

### Terminology Adjustments

Use simpler terminology in overlay content:
- "Admin toolbar" → "This menu"
- "Content types" → "Page templates"
- "Node" → "This page"

---

## Quick Reference Checklist

Before publishing any walkthrough content:

- [ ] Front matter includes all required fields
- [ ] Step variables block is complete
- [ ] Numbered lists use `govuk-list govuk-list--number govuk-list--spaced`
- [ ] All `<strong>` tags are used for action keywords
- [ ] "What you should see" section is present
- [ ] At least one troubleshooting section exists
- [ ] Screenshot naming follows convention
- [ ] All images have meaningful alt text
- [ ] Headings follow proper hierarchy (h2, h3, h4)
- [ ] Links have descriptive text
- [ ] Code uses `<code>` tags
- [ ] Terminology matches glossary
- [ ] Reading level is 9 or below
- [ ] All interactive elements are keyboard accessible

---

## References

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK Content Design Manual](https://www.gov.uk/guidance/content-design)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [LocalGov Drupal Documentation](https://localgovdrupal.org/docs)
- [11ty Documentation](https://www.11ty.dev/docs/)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Story Reference:** Story 2.8 - Documentation Template & Standards
