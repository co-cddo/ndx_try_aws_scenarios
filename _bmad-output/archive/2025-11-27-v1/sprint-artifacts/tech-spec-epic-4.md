# Epic Technical Specification: Evidence Generation & Committee-Ready Artifacts

Date: 2025-11-28
Author: cns
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 delivers the **evidence generation and committee-ready artifacts** capability that transforms council demo experiences into structured business cases for procurement decisions. This is the critical bridge between "I just tried this scenario" and "I can present this to my committee."

The epic addresses a key barrier in UK local government cloud adoption: councils complete evaluations but lack the materials needed to justify procurement decisions to leadership and oversight committees. By auto-generating persona-specific Evidence Pack PDFs from evaluation data, NDX:Try enables councils to move from experiential proof to actionable procurement documentation within minutes of completing their scenario evaluation.

This epic delivers 4 stories covering Evidence Pack template design, reflection form capture, PDF generation, and service-specific ROI guidance - all essential for achieving the platform's primary success metric of 65-80% informed decision rate.

## Objectives and Scope

### Objectives

1. **Enable committee-ready output**: Generate professional PDF evidence packs that councils can present directly to procurement committees
2. **Capture evaluation insights**: Provide structured "What You Experienced" reflection forms that capture key evaluation learnings
3. **Support all personas**: Deliver persona-specific content (CTO, Service Manager, Finance, Developer) from a single template system
4. **Quantify ROI**: Include service-specific success metrics and ROI calculations that justify procurement decisions

### In Scope

- Evidence Pack HTML template with persona conditional logic (Nunjucks templating)
- "What You Experienced" reflection guide form (7 fields capturing evaluation insights)
- Build-time PDF generation via Puppeteer in GitHub Actions
- Persona-specific PDF variants (4 personas × 6 scenarios = 24 PDF templates)
- Service-specific success metrics and ROI guidance per scenario
- Session data capture for Evidence Pack auto-population
- Form validation and error handling (GOV.UK Frontend patterns)
- WCAG 2.2 AA accessibility for all form and PDF content

### Out of Scope

- Dynamic/on-demand PDF generation (using build-time approach per Architecture Decision 2)
- Integration with external CRM or partner matching systems (deferred to Phase 2)
- Real-time cost data from AWS Cost Explorer (manual/estimated data used)
- Custom Evidence Pack branding per council (standard NDX:Try branding only)
- Evidence Pack versioning or history tracking
- Multi-language Evidence Pack translation

## System Architecture Alignment

### Architecture Constraints (from Architecture Document)

This epic operates within the **static-first architecture** established in the Architecture decisions:

1. **Decision 2 - Build-Time PDF Generation**: Evidence Pack PDFs are generated during GitHub Actions build using Puppeteer, not on-demand. This means:
   - PDFs are pre-generated for all scenario/persona combinations
   - Session data (form responses) populate template variables at build time
   - No Lambda or serverless infrastructure required

2. **Decision 3 - GOV.UK Forms Service**: Form handling uses GOV.UK Forms for accessibility compliance and GDPR-compliant data storage. However, the reflection guide form may need to be handled differently since it feeds into Evidence Pack generation.

3. **Decision 4 - Vanilla JavaScript**: Client-side interaction uses progressive enhancement with vanilla JS, no framework. Form validation follows GOV.UK Frontend patterns.

### Components Referenced

| Component | Role in Epic 4 |
|-----------|---------------|
| `src/_includes/components/evidence-cta.njk` | Evidence Pack call-to-action component |
| `src/_data/scenarios.yaml` | Scenario metadata including ROI metrics |
| `src/assets/js/analytics.js` | Session event capture for form completion |
| GitHub Actions `build-deploy.yml` | Puppeteer PDF generation step |
| GOV.UK Frontend form components | Reflection guide form styling |

### Data Flow

```
User completes scenario walkthrough
        ↓
User fills "What You Experienced" form (Story 4.2)
        ↓
Form data captured in session/local storage
        ↓
User clicks "Generate Evidence Pack"
        ↓
Template populated with: session data + scenario metadata + persona selection
        ↓
Puppeteer generates PDF (build-time pre-generation or client-side)
        ↓
PDF delivered to user (download or email)
```

## Detailed Design

### Services and Modules

#### Module 1: Evidence Pack Template System (Story 4.1)

**Purpose**: Single Nunjucks template with persona conditionals that generates 4 persona-specific PDF variants per scenario.

**File Structure:**
```
src/
├── _includes/
│   ├── evidence-pack/
│   │   ├── base.njk              # Base Evidence Pack template
│   │   ├── sections/
│   │   │   ├── cover.njk         # Cover page with scenario/council info
│   │   │   ├── executive-summary.njk
│   │   │   ├── architecture.njk  # CTO-specific section
│   │   │   ├── resident-impact.njk # Service Manager-specific
│   │   │   ├── cost-analysis.njk # Finance-specific
│   │   │   ├── technical-impl.njk # Developer-specific
│   │   │   ├── evaluation-summary.njk # Shared section
│   │   │   ├── roi-projection.njk
│   │   │   └── next-steps.njk
│   │   └── partials/
│   │       ├── persona-header.njk
│   │       └── print-styles.njk
│   └── components/
│       └── evidence-cta.njk      # "Generate Evidence Pack" CTA
└── assets/
    └── pdfs/
        └── evidence-pack-{scenario-id}-{persona}.pdf
```

**Template Logic:**
```njk
{# base.njk - Single template with persona conditionals #}
<!DOCTYPE html>
<html lang="en">
<head>
  <title>{{ scenario.name }} - Evidence Pack ({{ persona | capitalize }})</title>
  {% include "evidence-pack/partials/print-styles.njk" %}
</head>
<body class="evidence-pack evidence-pack--{{ persona }}">
  {% include "evidence-pack/sections/cover.njk" %}
  {% include "evidence-pack/sections/executive-summary.njk" %}

  {# Persona-specific sections #}
  {% if persona == 'cto' %}
    {% include "evidence-pack/sections/architecture.njk" %}
  {% endif %}

  {% if persona == 'service-manager' %}
    {% include "evidence-pack/sections/resident-impact.njk" %}
  {% endif %}

  {% if persona == 'finance' %}
    {% include "evidence-pack/sections/cost-analysis.njk" %}
  {% endif %}

  {% if persona == 'developer' %}
    {% include "evidence-pack/sections/technical-impl.njk" %}
  {% endif %}

  {# Shared sections (all personas) #}
  {% include "evidence-pack/sections/evaluation-summary.njk" %}
  {% include "evidence-pack/sections/roi-projection.njk" %}
  {% include "evidence-pack/sections/next-steps.njk" %}
</body>
</html>
```

#### Module 2: Reflection Guide Form (Story 4.2)

**Purpose**: Capture evaluation insights via structured form that auto-populates Evidence Pack.

**Implementation:**
- GOV.UK Frontend form components (text input, textarea, radio, rating scale)
- Client-side validation using vanilla JavaScript
- Form data stored in `localStorage` for session persistence
- Form submission triggers Evidence Pack generation

**Form Fields:**
| Field | Type | Required | Maps to Evidence Pack |
|-------|------|----------|----------------------|
| what_surprised | textarea | Yes | Executive Summary |
| would_implement | radio (Yes/Maybe/No) | Yes | Decision Summary |
| production_wants | textarea | No | Implementation Roadmap |
| concerns | textarea | No | Risk Assessment |
| likelihood_proceed | rating (1-5) | Yes | Analytics + Decision |
| council_name | text | No | Cover Page + Follow-up |
| email | email | No | PDF Delivery |

#### Module 3: PDF Generation Pipeline (Story 4.3)

**Purpose**: Generate Evidence Pack PDFs using Puppeteer during GitHub Actions build.

**Approach**: Build-time generation (not on-demand)

**GitHub Actions Workflow:**
```yaml
# .github/workflows/generate-evidence-packs.yml
name: Generate Evidence Packs
on:
  push:
    paths:
      - 'src/_includes/evidence-pack/**'
      - 'src/_data/scenarios.yaml'
jobs:
  generate-pdfs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:evidence-packs
      - uses: actions/upload-artifact@v4
        with:
          name: evidence-packs
          path: src/assets/pdfs/
```

**Generation Script:**
```javascript
// scripts/generate-evidence-packs.js
const puppeteer = require('puppeteer');
const scenarios = require('../src/_data/scenarios.yaml');
const personas = ['cto', 'service-manager', 'finance', 'developer'];

async function generatePDFs() {
  const browser = await puppeteer.launch();

  for (const scenario of scenarios) {
    for (const persona of personas) {
      const page = await browser.newPage();
      const html = await renderTemplate(scenario, persona);
      await page.setContent(html);
      await page.pdf({
        path: `src/assets/pdfs/evidence-pack-${scenario.id}-${persona}.pdf`,
        format: 'A4',
        printBackground: true
      });
      await page.close();
    }
  }

  await browser.close();
}
```

#### Module 4: Service-Specific Success Metrics (Story 4.4)

**Purpose**: Provide ROI calculations tailored to each service area (Planning, Parking, Contact Center, etc.)

**Data Structure (scenarios.yaml enhancement):**
```yaml
scenarios:
  - id: council-chatbot
    success_metrics:
      service_area: "Contact Center"
      primary_metric: "Call volume reduction"
      baseline:
        description: "5,000 calls/month, 30% routine inquiries"
        value: 1500
        unit: "routine calls/month"
      projection:
        description: "AI handles 80% of routine inquiries"
        value: 1200
        reduction_percent: 80
      roi:
        annual_savings: 72000
        calculation: "1,200 calls × £5/call × 12 months"
        payback_months: 1
      committee_language: "AI chatbot reduces inquiry handling cost by £72K annually while improving 24/7 citizen access"
```

### Data Models and Contracts

#### Evidence Pack Data Model

```typescript
interface EvidencePackData {
  // Scenario metadata
  scenario: {
    id: string;
    name: string;
    description: string;
    aws_services: string[];
    architecture_diagram: string; // Mermaid SVG path
    estimated_cost: string;
    maximum_cost: string;
    time_estimate: string;
  };

  // Persona selection
  persona: 'cto' | 'service-manager' | 'finance' | 'developer';

  // Session data (from form)
  session: {
    what_surprised: string;
    would_implement: 'yes' | 'maybe' | 'no';
    production_wants: string | null;
    concerns: string | null;
    likelihood_proceed: 1 | 2 | 3 | 4 | 5;
    council_name: string | null;
    email: string | null;
    evaluation_date: string; // ISO date
    actual_cost: number | null; // If available from deployment
  };

  // Service-specific metrics
  success_metrics: {
    service_area: string;
    primary_metric: string;
    baseline: { description: string; value: number; unit: string };
    projection: { description: string; value: number; reduction_percent: number };
    roi: {
      annual_savings: number;
      calculation: string;
      payback_months: number;
    };
    committee_language: string;
  };

  // Generated content
  generated: {
    timestamp: string;
    version: string;
    pdf_filename: string;
  };
}
```

#### Form Submission Schema

```typescript
interface ReflectionFormSubmission {
  scenario_id: string;
  timestamp: string;
  fields: {
    what_surprised: string;
    would_implement: 'yes' | 'maybe' | 'no';
    production_wants?: string;
    concerns?: string;
    likelihood_proceed: number; // 1-5
    council_name?: string;
    email?: string;
  };
  metadata: {
    referrer: string; // Which scenario page
    session_duration: number; // Seconds on site
    deployment_completed: boolean;
  };
}
```

### APIs and Interfaces

#### Form Handling Interface

Since this is a static site without backend API, form handling uses one of two approaches:

**Option A: GOV.UK Forms Service (External)**
```
Form submission → GOV.UK Forms Service (managed)
                 ↓
           GDPR-compliant storage
                 ↓
           Manual export for analytics
```

**Option B: Client-Side Generation (Preferred for MVP)**
```
Form submission → localStorage storage
                 ↓
           Client-side template population
                 ↓
           html2pdf.js generates PDF in browser
                 ↓
           Download to user's device
```

**Client-Side PDF Generation (Option B):**
```javascript
// src/assets/js/evidence-pack.js
import html2pdf from 'html2pdf.js';

async function generateEvidencePack(formData, scenario, persona) {
  // Populate template with form data
  const template = await fetch(`/templates/evidence-pack-${persona}.html`);
  const html = populateTemplate(await template.text(), formData, scenario);

  // Generate PDF client-side
  const options = {
    margin: 10,
    filename: `evidence-pack-${scenario.id}-${persona}-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(options).from(html).save();

  // Track analytics event
  trackEvent('evidence_pack_generated', { scenario: scenario.id, persona });
}
```

### Workflows and Sequencing

#### User Flow: Reflection Form → Evidence Pack

```
┌─────────────────────────────────────────────────────────────────┐
│                    EPIC 4 USER WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

[Epic 3 Complete] → User finished scenario walkthrough
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 1: Navigate to Reflection Section  │
│ "Share Your Feedback" appears at bottom │
│ of scenario detail page                 │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 2: Complete Reflection Form        │
│ - 7 fields (4 required, 3 optional)     │
│ - Client-side validation                │
│ - ~2 minutes to complete                │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 3: Select Persona                  │
│ "Generate Evidence Pack for:"           │
│ ○ CTO/Technical Lead                    │
│ ○ Service Manager                       │
│ ○ Finance/Procurement                   │
│ ○ Developer                             │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 4: Generate Evidence Pack          │
│ [Generate Evidence Pack] button click   │
│ → Client-side PDF generation            │
│ → ~5 seconds to complete                │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 5: Download/Deliver                │
│ - Browser download prompt               │
│ - Optional: Email delivery (if provided)│
│ - Success notification shown            │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 6: Analytics Event                 │
│ Event: evidence_pack_generated          │
│ Data: scenario_id, persona, timestamp   │
└─────────────────────────────────────────┘
        │
        ▼
[Epic 5 Entry] → "What's Next" guidance
```

#### Story Sequencing

```
Story 4.1: Evidence Pack Template
    ↓ (template must exist first)
Story 4.2: Reflection Guide Form  ←──┐
    ↓ (form captures data)          │
Story 4.3: PDF Generation          ──┘ (can parallel with 4.2)
    ↓ (depends on 4.1 + 4.2)
Story 4.4: Service-Specific Metrics
    (can parallel, enhances scenarios.yaml)
```

**Recommended Implementation Order:**
1. **Story 4.1** first - establishes template structure
2. **Story 4.2** + **Story 4.4** in parallel - form + metrics data
3. **Story 4.3** last - integrates all components

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Form validation response | <100ms | Time from blur to error display |
| PDF generation (client-side) | <5 seconds | Time from button click to download prompt |
| PDF generation (build-time) | <30 seconds per PDF | GitHub Actions build log |
| Form page load | <2 seconds | Lighthouse performance score |
| PDF file size | <2MB | File size post-generation |
| Total build time (24 PDFs) | <10 minutes | GitHub Actions workflow duration |

**Optimization Strategies:**
- Pre-generate PDF templates during build (not on-demand)
- Use html2pdf.js for client-side generation (avoids server round-trip)
- Lazy-load Evidence Pack JavaScript only on scenario detail pages
- Compress images in PDF to maintain file size target

### Security

| Requirement | Implementation |
|-------------|----------------|
| No PII in localStorage | Council name and email stored only if user consents; cleared on session end |
| GDPR compliance | Privacy notice displayed before form; email only used for PDF delivery |
| No external data transmission | Client-side generation keeps data local; no third-party analytics for form data |
| Input sanitization | All form inputs sanitized before template population (XSS prevention) |
| PDF content security | PDFs contain no executable code; text-only content |
| Session expiry | localStorage cleared after 24 hours of inactivity |

**Data Handling:**
- Form responses do NOT leave the browser (client-side generation)
- Email field is optional and used only for Evidence Pack delivery (if email service added)
- Council name is optional and used only for PDF cover page personalization
- No form data is sent to analytics (only aggregate events like "evidence_pack_generated")

### Reliability/Availability

| Requirement | Target | Fallback |
|-------------|--------|----------|
| Form availability | 99.9% (GitHub Pages SLA) | Static form always loads |
| PDF generation success rate | 95%+ | Retry button + error guidance |
| Browser compatibility | Chrome, Firefox, Safari, Edge (latest 2 versions) | Graceful degradation |
| Mobile support | iOS Safari, Chrome Mobile | Responsive form, mobile-friendly PDF |

**Error Handling:**
- If PDF generation fails: Show user-friendly error message with retry option
- If localStorage unavailable: Form still works but data not persisted between sessions
- If JavaScript disabled: Form submits gracefully, PDF generation unavailable (acceptable degradation)

**Fallback Strategy:**
```
Primary: Client-side PDF generation (html2pdf.js)
    ↓ (if fails)
Fallback 1: Retry with reduced quality settings
    ↓ (if still fails)
Fallback 2: Offer pre-generated template PDF with blanks for manual completion
```

### Observability

| Event | Data Captured | Purpose |
|-------|---------------|---------|
| `reflection_form_started` | scenario_id, timestamp | Funnel tracking |
| `reflection_form_completed` | scenario_id, time_to_complete | Completion rate |
| `evidence_pack_generated` | scenario_id, persona, generation_time | Success tracking |
| `evidence_pack_failed` | scenario_id, error_type | Error monitoring |
| `persona_selected` | persona, scenario_id | Persona distribution |

**Metrics Dashboard Integration:**
- Form completion rate tracked as part of Epic 5 analytics (Story 5.2)
- Evidence Pack generation rate feeds into "informed decision rate" calculation
- Target: 60%+ form completion rate among users who completed deployment

**Monitoring:**
- No server-side logging (static site)
- Client-side events sent to Google Analytics via gtag.js
- Build-time PDF generation logs captured in GitHub Actions
- Error tracking via browser console logging (development) and analytics events (production)

## Dependencies and Integrations

### Epic Dependencies

| Dependency | Type | Impact | Status |
|------------|------|--------|--------|
| **Epic 1 - Portal Foundation** | Required | Base layout, navigation, GOV.UK Frontend | Must be complete |
| **Epic 2 - Deployment** | Optional | Deployment data for cost actuals | Can work without |
| **Epic 3 - Guided Experiences** | Required | Walkthrough completion triggers form | Must be complete |
| **Epic 5 - Analytics** | Bidirectional | Form events feed analytics; analytics provides metrics | Parallel development |

### Story Dependencies Within Epic 4

```
Story 4.1 (Template)
    │
    ├───→ Story 4.3 (PDF Generation) - requires template structure
    │
    └───→ Story 4.2 (Form) - form fields map to template sections

Story 4.4 (Metrics) - independent, enhances scenarios.yaml
    │
    └───→ Story 4.1 (Template) - metrics displayed in ROI section
```

### External Dependencies

| Dependency | Version | Purpose | Fallback |
|------------|---------|---------|----------|
| **html2pdf.js** | ^0.10.1 | Client-side PDF generation | Puppeteer build-time generation |
| **Puppeteer** | ^21.x | Build-time PDF generation | html2pdf.js client-side |
| **GOV.UK Frontend** | 5.13.0 | Form components and styling | Already in place from Epic 1 |
| **Eleventy** | ^2.x | Template processing (Nunjucks) | Already in place from Epic 1 |
| **jsPDF** | ^2.x | PDF library (used by html2pdf.js) | Included with html2pdf.js |

### NPM Package Additions for Epic 4

```json
{
  "devDependencies": {
    "puppeteer": "^21.0.0"
  },
  "dependencies": {
    "html2pdf.js": "^0.10.1"
  }
}
```

### Integration Points

#### Integration 1: Scenario Data → Evidence Pack

**Source:** `src/_data/scenarios.yaml`
**Consumer:** Evidence Pack template

```yaml
# scenarios.yaml fields used by Evidence Pack
scenarios:
  - id: council-chatbot
    name: "Council Chatbot"
    description: "..."
    aws_services: [Bedrock, Lambda, DynamoDB]
    architecture_diagram: "/diagrams/council-chatbot.svg"
    estimated_cost: "£0.50-2.00"
    maximum_cost: "£5.00"
    time_estimate: "15 minutes"
    # NEW fields for Epic 4
    success_metrics:
      service_area: "Contact Center"
      primary_metric: "Call volume reduction"
      baseline: { description: "...", value: 1500, unit: "calls/month" }
      projection: { description: "...", value: 1200, reduction_percent: 80 }
      roi: { annual_savings: 72000, calculation: "...", payback_months: 1 }
      committee_language: "..."
```

#### Integration 2: Form Data → PDF Template

**Source:** Reflection guide form (localStorage)
**Consumer:** Evidence Pack template

```javascript
// Form data structure stored in localStorage
const formData = {
  scenario_id: "council-chatbot",
  what_surprised: "User input...",
  would_implement: "yes",
  production_wants: "User input...",
  concerns: "User input...",
  likelihood_proceed: 4,
  council_name: "Example Council",
  email: "user@council.gov.uk"
};

// Retrieved and passed to template
localStorage.setItem('ndx_reflection_form', JSON.stringify(formData));
```

#### Integration 3: Analytics Events

**Source:** Evidence Pack generation
**Consumer:** Epic 5 analytics dashboard

```javascript
// Event fired on PDF generation
gtag('event', 'evidence_pack_generated', {
  'scenario_id': 'council-chatbot',
  'persona': 'cto',
  'form_completion_time': 120, // seconds
  'likelihood_proceed': 4
});
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EPIC 4 DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ scenarios.   │────▶│ Evidence Pack │────▶│ PDF Output   │
│ yaml         │     │ Template      │     │ (A4, ~1MB)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    ▲                     │
       │                    │                     │
       ▼                    │                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ success_     │     │ Form Data    │     │ Analytics    │
│ metrics      │     │ (localStorage)│     │ Event        │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    ▲                     │
       │                    │                     │
       │              ┌──────────────┐           │
       └─────────────▶│ Reflection   │◀──────────┘
                      │ Guide Form   │
                      └──────────────┘
                            ▲
                            │
                      ┌──────────────┐
                      │ User Input   │
                      │ (Browser)    │
                      └──────────────┘
```

## Acceptance Criteria (Authoritative)

### Story 4.1: Evidence Pack Template - Single Template with Persona Conditionals

**Given** the Evidence Pack template system is implemented
**When** a user generates an Evidence Pack
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 4.1.1 | Single HTML template with Nunjucks conditionals for 4 personas | Template file exists at `src/_includes/evidence-pack/base.njk` |
| 4.1.2 | CTO version includes Architecture & Security Assessment section | PDF contains heading "Architecture & Security Assessment" |
| 4.1.3 | Service Manager version includes Resident Impact section | PDF contains heading "Resident Impact & Service Improvement" |
| 4.1.4 | Finance version includes Cost Analysis & Budget Impact section | PDF contains heading "Cost Analysis & Budget Impact" |
| 4.1.5 | Developer version includes Technical Implementation section | PDF contains heading "Technical Implementation Details" |
| 4.1.6 | All versions include shared sections: Evaluation Summary, ROI Projection, Next Steps | All PDFs contain these 3 sections |
| 4.1.7 | Template uses CSS `@media print` for print-friendly styling | PDF renders correctly on A4 paper (tested) |
| 4.1.8 | PDF passes accessibility check (text-selectable, not image-based) | Axe PDF checker passes |
| 4.1.9 | Template renders in <2 seconds during build | GitHub Actions log shows render time |
| 4.1.10 | CTO Evidence Pack includes "Security & Compliance" section (shared responsibility, data residency, certifications) | Section visible in CTO PDF |
| 4.1.11 | Service Manager Evidence Pack includes "Citizen Journey Impact" section (before/after service experience) | Section visible in SM PDF |
| 4.1.12 | Finance Evidence Pack includes "3-Year TCO Projection" section (all costs: AWS, integration, training, support) | Section visible in Finance PDF |
| 4.1.13 | Developer Evidence Pack includes "Technical Runbook Summary" section (deployment, monitoring, troubleshooting) | Section visible in Dev PDF |

### Story 4.2: "What You Experienced" Reflection Guide Form

**Given** the reflection guide form is implemented
**When** a user completes scenario evaluation
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 4.2.1 | Form displays 7 fields: what_surprised (req), would_implement (req), production_wants, concerns, likelihood_proceed (req), council_name, email | Form contains all fields with correct types |
| 4.2.2 | Required fields show asterisk (*) and validation errors if empty | Submit with empty required field shows error |
| 4.2.3 | Email field validates email format | Invalid email shows "Enter a valid email address" |
| 4.2.4 | Form uses GOV.UK Frontend components (text input, textarea, radio, rating) | Visual inspection against GOV.UK Design System |
| 4.2.5 | Form passes WCAG 2.2 AA accessibility (labels, focus, keyboard nav) | Axe DevTools scan passes |
| 4.2.6 | Form data persists in localStorage for session | Close/reopen browser, data preserved |
| 4.2.7 | Form completion tracked as analytics event | GA event `reflection_form_completed` fires |
| 4.2.8 | Form completion rate target: 60%+ of deployers | Monitored post-launch in Epic 5 dashboard |
| 4.2.9 | Help text with placeholder examples displayed for open-ended fields (e.g., "The response speed, the accuracy...") | Placeholder text visible in textarea fields |
| 4.2.10 | Privacy notice displayed above submit button | Privacy notice text visible |
| 4.2.11 | "Quick Form" option available (3 required fields only) for users short on time | Toggle between quick/full form visible |
| 4.2.12 | Progress indicator shows form completion status ("Step X of Y") | Progress indicator visible during form |
| 4.2.13 | "Get Your Evidence Pack" CTA banner with value prop ("Takes 2 min • Committee-ready PDF") bridges walkthrough to form | Banner visible after walkthrough section |
| 4.2.14 | Form completion required to unlock Evidence Pack generation (form IS the unlock, not optional) | Generate button disabled until form valid |
| 4.2.15 | "Email my form progress" optional feature allows cross-device continuation (enter email → receive magic link) | Email link restores form state on any device |

### Story 4.3: Evidence Pack PDF Generation & Auto-Population

**Given** the PDF generation pipeline is implemented
**When** a user clicks "Generate Evidence Pack"
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 4.3.1 | PDF generates within 5 seconds (client-side) | Stopwatch measurement from click to download |
| 4.3.2 | PDF includes form responses quoted in Evaluation Summary section | Form data visible in PDF |
| 4.3.3 | PDF includes scenario metadata (name, AWS services, cost, time) | Scenario data visible in PDF |
| 4.3.4 | PDF includes persona-specific content based on selection | CTO PDF differs from Service Manager PDF |
| 4.3.5 | PDF filename follows pattern: `evidence-pack-{scenario}-{persona}-{date}.pdf` | Downloaded file has correct name |
| 4.3.6 | PDF file size <2MB | File size check |
| 4.3.7 | PDF renders correctly in Chrome, Firefox, Safari, Edge | Cross-browser testing |
| 4.3.8 | PDF prints correctly on A4 paper without overflow | Print test |
| 4.3.9 | Success confirmation with "Open PDF" button and clear next actions | Green banner with action buttons visible |
| 4.3.10 | Analytics event `evidence_pack_generated` fires with persona | GA event capture verified |
| 4.3.11 | Fallback HTML print view available if PDF generation fails | "View printable version" link appears on error |
| 4.3.12 | Preview modal shows PDF sections before generation | Modal displays persona-specific preview |
| 4.3.13 | "Download All Personas" option generates ZIP with 4 PDFs | ZIP download completes successfully |
| 4.3.14 | Shareable link option for locked-down council environments | URL copy button functional |
| 4.3.15 | Persona description tooltips explain each option ("Best for: technical committees...") | Tooltip visible on hover/focus |
| 4.3.16 | Loading state with progress indicator and time estimate ("Generating... ~5 seconds") | Loading UI visible during generation |
| 4.3.17 | "Download different persona" link in success message enables iteration | Link functional, returns to persona selection |
| 4.3.18 | "What to do with your Evidence Pack" guidance section bridges to Epic 5 | Guidance section visible after download |
| 4.3.19 | "Comprehensive Evidence Pack" option includes all persona sections in one PDF | Single PDF with all 4 perspectives available |
| 4.3.20 | Deployment/walkthrough completion required before form access (hard gate) | Blocker message shown if no deployment detected |

### Story 4.4: Service-Specific Success Metrics & ROI Guidance

**Given** service-specific metrics are implemented
**When** a Service Manager views the Evidence Pack
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 4.4.1 | Each scenario has `success_metrics` defined in scenarios.yaml | YAML schema validation |
| 4.4.2 | Metrics include: service_area, primary_metric, baseline, projection, roi | All fields present for all 6 scenarios |
| 4.4.3 | ROI calculation includes annual_savings, calculation formula, payback_months | Data complete for all scenarios |
| 4.4.4 | Committee-ready language provided for each scenario | `committee_language` field populated |
| 4.4.5 | Evidence Pack ROI section displays scenario-specific metrics | PDF shows correct metrics per scenario |
| 4.4.6 | Baseline assumptions documented (source, caveats) | Documentation in scenarios.yaml comments |
| 4.4.7 | All ROI projections marked as "Illustrative" with prominent header disclaimer | Disclaimer text visible at TOP of ROI section |
| 4.4.8 | Service Manager engagement target: 50%+ view ROI section | Tracked via scroll depth analytics |
| 4.4.9 | **PROMINENT** custom baseline input with "Use your council's numbers" CTA - NOT hidden/optional but featured above illustrative defaults | Editable baseline fields visible by default with clear CTA |
| 4.4.10 | Source citations provided for all baseline assumptions ("Based on LGA 2023 survey...") | Citations visible in ROI section |
| 4.4.11 | "How we calculated this" methodology section expandable in Evidence Pack | Expandable section functional in PDF |
| 4.4.12 | Each scenario includes security_posture data (compliance certs, data residency, encryption) for CTO section | Data in scenarios.yaml validated |
| 4.4.13 | Each scenario includes tco_projection data (Year 1-3 costs breakdown) for Finance section | Data in scenarios.yaml validated |
| 4.4.14 | "Download ROI Calculator Spreadsheet" option for Finance personas wanting full control over calculations | Excel/CSV download functional with formulas |

## Traceability Mapping

### Functional Requirements Coverage

| FR ID | FR Title | Story | AC Reference | Status |
|-------|----------|-------|--------------|--------|
| FR16 | "What You Experienced" reflection guide | Story 4.2 | AC 4.2.1-4.2.14 | Planned |
| FR17 | Session data capture (form responses) | Story 4.2 | AC 4.2.6, 4.2.7, 4.2.14, 4.2.15 | Planned |
| FR18 | Evidence Pack auto-population from templates | Story 4.3 | AC 4.3.2, 4.3.3, 4.3.20 | Planned |
| FR19 | Evidence Pack PDF with ROI/risk/compliance/next-steps | Story 4.1, 4.3 | AC 4.1.6, 4.3.2, 4.3.11-4.3.20 | Planned |
| FR20 | Persona-specific Evidence Pack templates | Story 4.1 | AC 4.1.2-4.1.5, AC 4.1.10-4.1.13, 4.3.12-4.3.13, 4.3.15, 4.3.19 | Planned |
| FR54 | Service-Specific Success Metrics | Story 4.4 | AC 4.4.1-4.4.14 | Planned |

### PRD Alignment

| PRD Section | Epic 4 Implementation |
|-------------|----------------------|
| "Evidence Generation" goal | Stories 4.1-4.3 deliver committee-ready PDFs |
| "Persona-specific content" | Story 4.1 template conditionals |
| "ROI quantification" | Story 4.4 success metrics |
| "Form capture" | Story 4.2 reflection guide |
| "60%+ form completion rate" | AC 4.2.8 tracking target |

### Architecture Decision Alignment

| Decision | Epic 4 Implementation | Compliance |
|----------|----------------------|------------|
| Decision 2: Build-time PDF | Story 4.3 uses Puppeteer in GitHub Actions | ✓ Compliant |
| Decision 4: Vanilla JS | Stories use progressive enhancement | ✓ Compliant |
| Static-first architecture | Client-side generation, no backend API | ✓ Compliant |
| GOV.UK Frontend | Story 4.2 form uses GOV.UK components | ✓ Compliant |

### User Journey Mapping

```
Journey Stage: EVALUATE → EVIDENCE

[Epic 3: Guided Experience]
           │
           ▼
┌─────────────────────────────┐
│ Story 4.2: Reflection Form  │ ◄── FR16, FR17
│ "Share Your Feedback"       │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Story 4.1: Template System  │ ◄── FR20
│ Persona conditionals        │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Story 4.3: PDF Generation   │ ◄── FR18, FR19
│ Auto-populated Evidence Pack│
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Story 4.4: ROI Metrics      │ ◄── FR54
│ Service-specific guidance   │
└─────────────────────────────┘
           │
           ▼
[Epic 5: Pathway Forward]
```

### Persona Coverage

| Persona | Epic 4 Support |
|---------|----------------|
| **CTO/Technical Lead** | Architecture section, security assessment, technical depth |
| **Service Manager** | Resident impact section, ROI for service area, committee language |
| **Finance/Procurement** | Cost analysis section, worst-case scenarios, budget impact |
| **Developer** | Technical implementation section, SDK support, sample code |

### Success Metrics Alignment

| Primary Metric | Epic 4 Contribution |
|----------------|---------------------|
| Informed Decision Rate (65-80%) | Evidence Pack enables committee presentations |
| Form Completion Rate (60%+) | Story 4.2 optimizes form UX |
| Evidence Pack Generation | Story 4.3 tracks generation events |
| Service Manager ROI Engagement (50%+) | Story 4.4 provides service-specific metrics |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Risk | Probability | Impact | Mitigation |
|---------|------|-------------|--------|------------|
| R4.1 | **Form completion rate <60%** - Users abandon form before Evidence Pack | Medium | High | Simplify form (Story 4.2b), add progress indicator, pre-populate where possible |
| R4.2 | **PDF generation fails in some browsers** - html2pdf.js compatibility issues | Low | Medium | Test across browsers; fallback to pre-generated template PDFs |
| R4.3 | **ROI projections challenged** - Councils question illustrative metrics | Medium | Medium | Clear disclaimers, document assumptions, allow council-specific input |
| R4.4 | **Persona selection confusion** - Users unsure which persona to select | Low | Low | Add persona descriptions with "Best for: ..." guidance |
| R4.5 | **PDF file size exceeds 2MB** - Large architecture diagrams bloat PDF | Low | Low | Optimize images, use vector SVGs, compress output |
| R4.6 | **Epic 3 dependency delay** - Walkthrough not complete, form has no context | Medium | High | HARD GATE: Form blocked until deployment detected (AC 4.3.20); Video Demo path as alternative |
| R4.7 | **Council IT policies block downloads** - Locked-down browsers prevent PDF download | Medium | High | Add shareable link (AC 4.3.14) + HTML print fallback (AC 4.3.11) |
| R4.8 | **ROI credibility rejected** - Finance personas dismiss "illustrative" numbers as vendor spin | **High** | High | CRITICAL: Prominent custom baseline input (AC 4.4.9), source citations (AC 4.4.10), methodology transparency (AC 4.4.11), ROI spreadsheet download (AC 4.4.14) |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A4.1 | Users will complete scenario walkthrough before filling form | Analytics will track walkthrough completion → form start |
| A4.2 | localStorage is available in council browsers | Test on typical council browser configurations |
| A4.3 | 4 persona types are sufficient (no "Other" needed) | User testing during canary launch |
| A4.4 | Committee-ready means single PDF, not multi-document pack | Validate with council CTO interviews |
| A4.5 | Service-specific ROI metrics are compelling to decision-makers | Track "likelihood_proceed" correlation with ROI section viewing |
| A4.6 | Client-side PDF generation is acceptable (vs server-side) | Performance testing shows <5 second generation |
| A4.7 | Epic 3 walkthrough/deployment completion is a HARD requirement for meaningful Evidence Pack | Gate form access on deployment detection (AC 4.3.20) |
| A4.8 | Current persona differentiation (1 dedicated section per persona + 1-2 new deep sections) is MVP-sufficient; deeper persona-specific content can be added iteratively based on feedback | Track persona-specific section engagement via scroll depth analytics |

### Open Questions

| ID | Question | Owner | Target Resolution |
|----|----------|-------|-------------------|
| OQ4.1 | Should Evidence Pack include actual AWS costs from deployment, or only estimates? | Product | Before Story 4.3 implementation |
| OQ4.2 | How do we handle councils that want to download ALL 4 persona PDFs? | UX | Before Story 4.3 implementation |
| OQ4.3 | Should we offer "quick form" (3 fields) vs "full form" (7 fields) options? | Product | After MVP launch based on completion rates |
| OQ4.4 | What is the email delivery mechanism for Evidence Pack? (SES? Manual?) | Tech Lead | Deferred to Phase 2 |
| OQ4.5 | Do we need version control on Evidence Pack templates? | Architect | Before launch |
| OQ4.6 | Should persona differentiation pursue Option A (deep sections per persona), Option B (unified pack with persona appendices), or Option C (tiered depth based on persona priority)? | Product + UX | Before Story 4.1 implementation |

### Technical Debt Considerations

| Item | Description | Remediation Plan |
|------|-------------|------------------|
| TD4.1 | Client-side PDF generation may not match print quality of server-side | Evaluate Puppeteer API endpoint if quality issues arise |
| TD4.2 | localStorage has 5MB limit; large form data could hit limit | Monitor usage; implement cleanup for old sessions |
| TD4.3 | No email delivery in MVP | Phase 2: Add SES integration for Evidence Pack email |
| TD4.4 | ROI metrics are hardcoded in scenarios.yaml | Phase 2: Allow council-specific baseline input |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Responsibility |
|-------|-------|-------|----------------|
| **Unit Tests** | Form validation, template rendering, PDF generation functions | Jest | Developer |
| **Integration Tests** | Form → localStorage → Template → PDF pipeline | Playwright | Developer |
| **E2E Tests** | Complete user flow: scenario → form → PDF download | Playwright | QA |
| **Accessibility Tests** | WCAG 2.2 AA compliance | Axe DevTools, pa11y | Developer + QA |
| **Cross-Browser Tests** | Chrome, Firefox, Safari, Edge | Playwright | QA |
| **Performance Tests** | PDF generation <5 seconds, form load <2 seconds | Lighthouse, custom timing | Developer |

### Test Scenarios

#### Story 4.1: Template Tests

```javascript
// test/evidence-pack-template.test.js
describe('Evidence Pack Template', () => {
  test('CTO persona renders architecture section', async () => {
    const html = await renderTemplate(scenario, 'cto');
    expect(html).toContain('Architecture & Security Assessment');
  });

  test('Service Manager persona renders resident impact section', async () => {
    const html = await renderTemplate(scenario, 'service-manager');
    expect(html).toContain('Resident Impact & Service Improvement');
  });

  test('Finance persona renders cost analysis section', async () => {
    const html = await renderTemplate(scenario, 'finance');
    expect(html).toContain('Cost Analysis & Budget Impact');
  });

  test('All personas include shared sections', async () => {
    for (const persona of ['cto', 'service-manager', 'finance', 'developer']) {
      const html = await renderTemplate(scenario, persona);
      expect(html).toContain('Evaluation Summary');
      expect(html).toContain('ROI Projection');
      expect(html).toContain('Next Steps');
    }
  });

  // New deep persona section tests (AC 4.1.10-4.1.13)
  test('CTO persona includes Security & Compliance section', async () => {
    const html = await renderTemplate(scenario, 'cto');
    expect(html).toContain('Security & Compliance');
    expect(html).toMatch(/shared responsibility|data residency|certifications/i);
  });

  test('Service Manager persona includes Citizen Journey Impact section', async () => {
    const html = await renderTemplate(scenario, 'service-manager');
    expect(html).toContain('Citizen Journey Impact');
    expect(html).toMatch(/before.*after|service experience/i);
  });

  test('Finance persona includes 3-Year TCO Projection section', async () => {
    const html = await renderTemplate(scenario, 'finance');
    expect(html).toContain('3-Year TCO Projection');
    expect(html).toMatch(/AWS|integration|training|support/i);
  });

  test('Developer persona includes Technical Runbook Summary section', async () => {
    const html = await renderTemplate(scenario, 'developer');
    expect(html).toContain('Technical Runbook Summary');
    expect(html).toMatch(/deployment|monitoring|troubleshooting/i);
  });
});
```

#### Story 4.2: Form Tests

```javascript
// test/reflection-form.test.js
describe('Reflection Guide Form', () => {
  test('validates required fields', async () => {
    await page.goto('/scenarios/council-chatbot');
    await page.click('button[type="submit"]');
    await expect(page.locator('.govuk-error-message')).toBeVisible();
  });

  test('persists data to localStorage', async () => {
    await page.fill('#what-surprised', 'Test response');
    await page.reload();
    expect(await page.inputValue('#what-surprised')).toBe('Test response');
  });

  test('validates email format', async () => {
    await page.fill('#email', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('#email-error')).toContainText('valid email');
  });
});
```

#### Story 4.3: PDF Generation Tests

```javascript
// test/pdf-generation.test.js
describe('PDF Generation', () => {
  test('generates PDF within 5 seconds', async () => {
    const start = Date.now();
    await generateEvidencePack(formData, scenario, 'cto');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  test('PDF file size under 2MB', async () => {
    const pdf = await generateEvidencePack(formData, scenario, 'cto');
    expect(pdf.size).toBeLessThan(2 * 1024 * 1024);
  });

  test('PDF includes form responses', async () => {
    const pdf = await generateEvidencePack(formData, scenario, 'cto');
    const text = await extractPdfText(pdf);
    expect(text).toContain(formData.what_surprised);
  });
});
```

#### Accessibility Tests

```javascript
// test/accessibility.test.js
describe('Accessibility', () => {
  test('form passes axe accessibility audit', async () => {
    await page.goto('/scenarios/council-chatbot');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('form is keyboard navigable', async () => {
    await page.goto('/scenarios/council-chatbot');
    await page.keyboard.press('Tab');
    await expect(page.locator('#what-surprised')).toBeFocused();
  });
});
```

### Test Data

```yaml
# test/_fixtures/form-data.yaml
valid_form_data:
  what_surprised: "How quickly the chatbot responded to council-specific questions"
  would_implement: "yes"
  production_wants: "Integration with our existing CRM system"
  concerns: "Data security and GDPR compliance"
  likelihood_proceed: 4
  council_name: "Test Council"
  email: "test@council.gov.uk"

minimal_form_data:
  what_surprised: "Speed"
  would_implement: "maybe"
  likelihood_proceed: 3

invalid_form_data:
  what_surprised: ""  # Required but empty
  would_implement: "yes"
  likelihood_proceed: 6  # Out of range
  email: "invalid-email"
```

### CI/CD Integration

```yaml
# .github/workflows/test-epic-4.yml
name: Epic 4 Tests
on:
  push:
    paths:
      - 'src/_includes/evidence-pack/**'
      - 'src/assets/js/evidence-pack.js'
      - 'test/evidence-pack*.test.js'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --grep "Evidence Pack"
      - run: npm run test:e2e -- --grep "reflection form"
      - run: npm run test:a11y -- --url /scenarios/council-chatbot

  pdf-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build:evidence-packs
      - uses: actions/upload-artifact@v4
        with:
          name: evidence-packs
          path: src/assets/pdfs/
```

### Acceptance Test Checklist

**Story 4.2 - Reflection Form:**
- [ ] "Get Your Evidence Pack" CTA banner visible after walkthrough
- [ ] Form renders with all 7 fields and correct types
- [ ] Placeholder examples visible in open-ended fields
- [ ] Required field validation works (error messages display)
- [ ] Email validation works (format checking)
- [ ] localStorage persistence works (data survives page refresh)
- [ ] Quick Form toggle available (3 fields only)
- [ ] Progress indicator visible ("Step X of Y")
- [ ] Form completion required to unlock Evidence Pack (generate button disabled until valid)
- [ ] "Email my form progress" option functional (magic link restores form state)

**Story 4.3 - PDF Generation:**
- [ ] Deployment/walkthrough gate: blocker message if no deployment detected
- [ ] Persona selection works (4 radio options)
- [ ] Persona description tooltips visible on hover/focus
- [ ] "Comprehensive Evidence Pack" option available (all personas in one PDF)
- [ ] Loading state with progress indicator visible during generation
- [ ] PDF generation completes in <5 seconds
- [ ] PDF contains form responses in Evaluation Summary
- [ ] PDF contains persona-specific sections
- [ ] PDF file size <2MB
- [ ] PDF prints correctly on A4
- [ ] Success confirmation with "Open PDF" button visible
- [ ] "Download different persona" link functional
- [ ] Preview modal shows before generation
- [ ] "Download All Personas" generates ZIP with 4 PDFs
- [ ] Fallback HTML print view works when PDF fails
- [ ] Shareable link copy button functional
- [ ] "What to do with your Evidence Pack" guidance visible

**Story 4.1 - Persona Sections (AC 4.1.10-4.1.13):**
- [ ] CTO Evidence Pack includes "Security & Compliance" section (shared responsibility, data residency, certs)
- [ ] Service Manager Evidence Pack includes "Citizen Journey Impact" section (before/after)
- [ ] Finance Evidence Pack includes "3-Year TCO Projection" section (AWS, integration, training, support)
- [ ] Developer Evidence Pack includes "Technical Runbook Summary" section (deploy, monitor, troubleshoot)

**Story 4.4 - ROI Metrics:**
- [ ] ROI disclaimer visible at TOP of section (not buried)
- [ ] Source citations visible for all baseline assumptions
- [ ] "How we calculated this" methodology section expandable
- [ ] **PROMINENT** custom baseline input with "Use your council's numbers" CTA visible by default
- [ ] Committee-ready language displayed
- [ ] security_posture data present for CTO section (compliance, data residency, encryption)
- [ ] tco_projection data present for Finance section (Year 1-3 breakdown)
- [ ] "Download ROI Calculator Spreadsheet" option functional (Excel/CSV with formulas)

**Cross-Cutting:**
- [ ] Analytics events fire (form_completed, evidence_pack_generated)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] iOS Safari PDF download works
- [ ] WCAG 2.2 AA accessibility (axe scan passes)
- [ ] Keyboard navigation works (tab through all fields)
- [ ] Mobile responsiveness (form usable on 320px width)
