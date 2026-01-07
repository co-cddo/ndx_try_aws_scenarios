# Forms Specification

**Author:** cns
**Date:** 2025-11-27
**Platform:** GOV.UK Forms Service
**Configuration:** `src/_data/forms.yaml` (single source of truth)

---

## Overview

NDX:Try uses GOV.UK Forms service for all user-facing forms. This ensures:
- Accessibility compliance (WCAG 2.2 AA built-in)
- UK government design standards
- Secure data handling
- Automatic form management
- No custom form code required

All form references are configured in a single YAML file (`forms.yaml`), enabling:
- Easy switching between dev and production URLs
- Version control for form specifications
- Single source of truth for integration
- Placeholder URLs during development

---

## Form 1: Scenario Selector Quiz

### Purpose

Guide councils to the most relevant scenario in under 1 minute. Uses a 3-question flow to match council context with scenario fit.

### User Journey

1. Council lands on homepage or "Get Started" page
2. Clicks "Find Your Scenario" or "Start the Quiz"
3. Answers 3 questions about their context
4. Receives 1-3 ranked scenario recommendations with explanation
5. Clicks through to recommended scenario

### Questions

#### Question 1: "What's your main challenge?"
- **Type:** Radio buttons (select one)
- **Purpose:** Identify service area/problem domain
- **Options:**
  - Service management (citizen-facing services)
  - Finance and procurement
  - IT operations and infrastructure
  - Citizen communication and support
  - Other

**Logic:** Certain answers correlate with specific scenarios:
- "Citizen communication" → Council Chatbot, Text-to-Speech
- "Planning" → Planning Application AI
- "Finance" → QuickSight Dashboard
- "IT operations" → Car Park IoT, Smart Street Lighting

#### Question 2: "How much time do you have?"
- **Type:** Radio buttons (select one)
- **Purpose:** Assess complexity tolerance and evaluation depth
- **Options:**
  - Quick tour (under 15 minutes)
  - Hands-on evaluation (15-45 minutes)
  - Deep dive (1+ hour)
  - Unsure - show me options

**Logic:**
- "Quick tour" → Recommend simpler scenarios (Text-to-Speech, QuickSight)
- "Hands-on" → Mixed complexity (Council Chatbot, Car Park IoT)
- "Deep dive" → Complex scenarios (Planning AI, Smart Street Lighting)

#### Question 3: "Who's evaluating?"
- **Type:** Radio buttons (select one)
- **Purpose:** Tailor recommendation language and depth to persona
- **Options:**
  - Technical lead (CTO/developer)
  - Service manager (department lead)
  - Finance/procurement
  - Team evaluation (mixed group)
  - Other

**Logic:**
- "Technical lead" → Include architecture details, code samples
- "Service manager" → Focus on business benefits, user impact
- "Finance/procurement" → Emphasize cost, ROI, procurement next steps
- "Team" → Balanced recommendation for mixed audience

### Output

**Result Page:** 1-3 recommended scenarios displayed in order of relevance

**For each recommendation:**
- Scenario name
- Icon/visual
- 1-sentence reason why (e.g., "Highly relevant to citizen communication")
- Difficulty level (Beginner/Intermediate/Advanced)
- Time estimate (15 min / 30 min / 1 hour)
- "Explore This Scenario" button → links to scenario detail page

### Configuration

```yaml
# src/_data/forms.yaml
forms:
  scenario_selector_quiz:
    name: "Scenario Selector Quiz"
    dev_url: "https://placeholder.example.com/forms/scenario-selector"
    live_url: "https://forms.service.gov.uk/ndx-try/scenario-selector"
```

### Where Used

- Homepage: "Find Your Scenario" call-to-action button
- Get Started page: Primary entry point in 15-minute journey
- Scenario Gallery: "Not sure where to start?" section
- Navigation: Top nav link to quiz

### Implementation Notes

- GOV.UK Forms handles form submission and data storage
- Results page displayed within GOV.UK Forms (not on NDX portal)
- Portal links to form, doesn't embed or manage it
- Response data stays in GOV.UK Forms (we access via API if needed)

---

## Form 2: Evidence Pack Generator

### Purpose

Capture council evaluation insights during or after scenario testing, generate committee-ready PDF evidence pack to support procurement decision.

### User Journey

1. Council completes scenario evaluation (deployment + walkthrough)
2. Clicks "Generate Evidence Pack" or "Create Committee Presentation"
3. Answers 6-8 questions about their experience
4. Submits email address
5. Receives PDF via email with:
   - Scenario summary
   - Their evaluation insights
   - ROI projection
   - Risk assessment
   - Peer council comparisons
   - Procurement next steps

### Form Fields

#### Field 1: "Scenario evaluated" (Text)
- **Required:** Yes
- **Purpose:** Identify which scenario this evidence pack covers
- **Input Type:** Text field (or dropdown with 6 scenario options)
- **Helper Text:** "Which scenario did you just evaluate? (e.g., 'Council Chatbot', 'Planning Application AI')"
- **Validation:** Not empty

#### Field 2: "What surprised you?" (Text Area)
- **Required:** Yes
- **Purpose:** Capture "wow moments" and unexpected value
- **Input Type:** Text area (500 character limit)
- **Helper Text:** "What was unexpected or impressive about this service?"
- **Validation:** Not empty, min 10 characters
- **Used in Evidence Pack:** Quote in summary section

#### Field 3: "Would this help your council?" (Radio)
- **Required:** Yes
- **Purpose:** Assess likelihood of procurement
- **Options:**
  - Yes - we'd definitely use this
  - Maybe - with some modifications
  - No - not a priority for us
  - Unsure - need more information
- **Used in Evidence Pack:** Primary decision indicator

#### Field 4: "What would you want in production?" (Text Area)
- **Required:** No (but recommended)
- **Purpose:** Identify customization/integration requirements
- **Input Type:** Text area (500 character limit)
- **Helper Text:** "If implementing this, what would you change? (features, integration, performance, data handling, etc.)"
- **Used in Evidence Pack:** Implementation considerations section

#### Field 5: "Any concerns?" (Text Area)
- **Required:** No (but recommended)
- **Purpose:** Identify barriers or risks to procurement
- **Input Type:** Text area (500 character limit)
- **Helper Text:** "What barriers or risks would you need to address? (cost, complexity, data security, skills, etc.)"
- **Used in Evidence Pack:** Risk assessment section

#### Field 6: "How likely are you to proceed?" (Rating Scale)
- **Required:** Yes
- **Purpose:** Quantify procurement likelihood
- **Input Type:** 5-point rating scale (or 1-10)
- **Scale Labels:**
  - 1 = Very unlikely
  - 3 = Maybe
  - 5 = Very likely
- **Used in Evidence Pack:** Key metric in summary

#### Field 7: "Email address" (Email)
- **Required:** Yes
- **Purpose:** Delivery address for Evidence Pack PDF
- **Input Type:** Email field with validation
- **Helper Text:** "We'll send your Evidence Pack PDF here"
- **Validation:** Valid email format

#### Field 8: "May we follow up?" (Radio - Optional)
- **Required:** No
- **Purpose:** Track interest in implementation support
- **Options:**
  - Yes, contact me with updates
  - No, thanks
- **Used in Evidence Pack:** Not visible, stored for follow-up outreach

### Output: Evidence Pack PDF

**Generated:** At form submission time (via build-time Puppeteer or Lambda)

**Contents:**

**Cover Page:**
- NDX:Try logo
- "Evidence Pack: [Scenario Name]"
- Council name (if provided)
- Date

**Executive Summary (1 page):**
- Scenario description (2-3 sentences)
- Evaluation date
- Evaluator role
- Overall assessment (likelihood to proceed)

**Evaluation Insights (1 page):**
- "What surprised you" (quote from form)
- Key capabilities experienced
- Business value for this council

**Risk & Implementation (1 page):**
- Risk assessment (from "concerns" field)
- Implementation considerations (from "what you'd want" field)
- Skill/training requirements
- Integration considerations

**Procurement Pathway (1 page):**
- G-Cloud procurement route
- Typical procurement timeline
- Implementation partner recommendations
- Next steps checklist

**Appendix:**
- Scenario technical details (AWS services, architecture)
- Peer council case studies (similar scenarios)
- Contact information for questions

### Configuration

```yaml
# src/_data/forms.yaml
forms:
  evidence_pack_generator:
    name: "Evidence Pack Generator"
    dev_url: "https://placeholder.example.com/forms/evidence-pack"
    live_url: "https://forms.service.gov.uk/ndx-try/evidence-pack"
```

### Where Used

- Bottom of each scenario detail page (prominent button)
- Post-deployment walkthrough ("Now create your Evidence Pack")
- Case studies page (success story examples)
- "What's Next" section (supporting procurement decision)

### Implementation Notes

- Form submission triggers Evidence Pack PDF generation
- Puppeteer (build-time) or Lambda (runtime) generates PDF from template
- PDF sent to provided email automatically
- Form response data stored in GOV.UK Forms (confidential, for follow-up)
- Portal doesn't store evaluation data (GDPR/privacy compliance)

---

## Development Workflow

### Phase 1: Development (Current)

**Form URLs:** Point to placeholder.example.com
```yaml
dev_url: "https://placeholder.example.com/forms/scenario-selector"
live_url: "https://forms.service.gov.uk/ndx-try/scenario-selector"  # Not yet created
```

**Portal:** Links to dev URLs, shows "Coming Soon" or demo forms

**Testing:** Placeholder forms or manual HTML forms for testing

### Phase 2: GOV.UK Forms Creation

1. Create Scenario Selector Quiz in GOV.UK Forms service
2. Configure questions, options, routing logic
3. Obtain public form URL from GOV.UK Forms
4. Create Evidence Pack form in GOV.UK Forms
5. Configure form fields, validation, confirmation message
6. Obtain public form URL from GOV.UK Forms

### Phase 3: Production Deployment

1. Update `forms.yaml` with live URLs
2. No code changes needed - Eleventy uses live URLs automatically
3. Deploy to GitHub Pages
4. All portal pages now reference live forms
5. GOV.UK Forms handles submissions, data storage, accessibility

---

## Eleventy Integration

### In Templates (Nunjucks)

```html
<!-- Homepage -->
<a href="{{ forms.scenario_selector_quiz.live_url }}" class="govuk-button">
  {{ forms.scenario_selector_quiz.short_description }}
</a>

<!-- Scenario detail page -->
<a href="{{ forms.evidence_pack_generator.live_url }}" class="govuk-button govuk-button--start">
  {{ forms.evidence_pack_generator.short_description }}
</a>
```

### In Markdown

```markdown
[Start the Quiz]({{ forms.scenario_selector_quiz.live_url }})

[Generate Evidence Pack]({{ forms.evidence_pack_generator.live_url }})
```

### Data Access

Eleventy's data cascade automatically loads `forms.yaml`:
- Available as `forms` global in all templates
- Accessible via Liquid/Nunjucks syntax: `{{ forms.scenario_selector_quiz.live_url }}`
- Can be filtered/mapped in JavaScript data files

---

## Configuration File: forms.yaml

**Location:** `src/_data/forms.yaml`

**Format:** YAML (Eleventy data file)

**Key Sections:**

- `forms`: Map of all forms with metadata
- `usage_guide`: Examples for developers
- `development_workflow`: Steps from dev to production

**Updating for Production:**

```diff
  scenario_selector_quiz:
-   live_url: "https://forms.service.gov.uk/ndx-try/scenario-selector"
+   live_url: "https://forms.service.gov.uk/ndx-try/scenario-selector-abc123"
```

(No code changes needed - just YAML update)

---

## Accessibility

Both forms are built in GOV.UK Forms service, which ensures:

✓ WCAG 2.2 AA compliance
✓ Keyboard navigation
✓ Screen reader support
✓ Color contrast requirements
✓ Clear error messages
✓ Accessible form labels
✓ Mobile-friendly

No additional accessibility work required.

---

## Data Privacy & GDPR

**GOV.UK Forms service:**
- Handles data storage securely
- Meets UK government data protection standards
- Enables export of form responses
- Complies with GDPR

**NDX Portal:**
- Does not store evaluation data
- Links to forms hosted on gov.uk domain
- Respects UK government privacy practices

**Form Response Data:**
- Stored in GOV.UK Forms (not NDX)
- Can be used for follow-up communication (with consent)
- Provides insights into adoption patterns
- Council's own AWS account tracks deployment activity

---

## Future Enhancements

**Phase 2+:**

- Integrate Evidence Pack PDF generation (build-time Puppeteer)
- Add scenario branching logic in Scenario Selector Quiz
- Create Evidence Pack PDF variants per persona
- Implement form response analytics dashboard
- Track deployment outcomes (post-evaluation)

---

_Forms specification for NDX:Try AWS Scenarios - Using GOV.UK Forms service for all user interactions._
