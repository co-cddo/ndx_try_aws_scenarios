# Epic Technical Specification: Pathway Forward & Partner Ecosystem

Date: 2025-11-28
Author: cns
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers the **"What's Next" pathway and partner ecosystem integration** that transforms the evaluation experience from "I tried this scenario" into "Here's my clear next step." This is the critical bridge between experiential proof and procurement action.

The epic addresses the final barrier in the council evaluation journey: after completing a scenario and generating an Evidence Pack, councils need clear guidance on how to proceed with implementation. Without this, even positive evaluations may stall due to uncertainty about next steps, partner selection, or internal approval processes.

This epic delivers 3 stories covering Next Steps guidance, Success Metrics analytics framework, and G-Cloud/Partner pathway integration - all essential for achieving the platform's primary success metric of 65-80% informed decision rate and completing the user journey from discovery to action.

**Key Value Proposition**: Turn scenario evaluation completion into clear procurement pathways with:
- Structured "What's Next" guidance based on evaluation outcomes
- Analytics to track which scenarios and paths drive the most engagement
- Integration with G-Cloud catalog and approved partner ecosystem for seamless handoff

## Objectives and Scope

### Objectives

1. **Clear pathway guidance**: Provide scenario-specific "What's Next" guidance that converts evaluation completion into defined procurement actions
2. **Analytics-driven insights**: Implement success metrics tracking to measure platform effectiveness and identify optimization opportunities
3. **Partner ecosystem integration**: Connect councils with G-Cloud approved partners and AWS Partner Network for implementation support
4. **Journey completion**: Close the loop from scenario discovery → evaluation → informed decision → partner connection

### In Scope

- "What's Next" guidance component with conditional recommendations based on evaluation outcome
- Next Steps page template with persona-specific pathways (4 personas)
- Success metrics analytics framework tracking key conversion events
- G-Cloud catalog integration via static links to pre-filtered search results
- Partner listing component showing AWS Partner Network members by scenario
- Follow-up engagement capture (optional email collection for partner matching)
- Analytics dashboard data model for tracking platform effectiveness
- WCAG 2.2 AA accessibility for all new components

### Out of Scope

- Real-time G-Cloud API integration (using static links only for MVP)
- Automated partner matching or CRM integration (Phase 2)
- Custom analytics dashboard UI (data model only; visualization via Google Analytics)
- Partner portal or partner-facing features
- Automated email follow-up sequences (manual follow-up only for MVP)
- Multi-language translation of pathway content
- Integration with council procurement systems

## System Architecture Alignment

### Architecture Constraints (from Architecture Document)

This epic operates within the **static-first architecture** established in the Architecture decisions:

1. **Decision 1 - Static Site Generation (Eleventy)**: All pathway content and partner listings are pre-generated at build time. No dynamic server-side rendering.

2. **Decision 3 - GOV.UK Forms Service**: Follow-up engagement forms (partner matching requests) use GOV.UK Forms service for data collection, maintaining GDPR compliance.

3. **Decision 4 - Vanilla JavaScript**: Client-side analytics tracking uses vanilla JavaScript with progressive enhancement. No framework dependencies.

4. **Decision 5 - CloudFormation Resource Tagging**: Analytics leverage existing resource tagging strategy for deployment tracking, extending to pathway events.

5. **Decision 6 - GOV.UK Frontend**: All new components use GOV.UK Frontend patterns for consistent design and built-in accessibility.

### Components Referenced

| Component | Role in Epic 5 |
|-----------|---------------|
| `src/_includes/components/next-steps.njk` | "What's Next" guidance component |
| `src/_includes/components/journey-timeline.njk` | Visual timeline showing user's current position |
| `src/_includes/components/partner-fit-indicator.njk` | Council size/type fit badge for partners |
| `src/_includes/components/expectations-setter.njk` | "What happens next" guidance before partner contact |
| `src/_includes/components/post-contact-confirmation.njk` | Confirmation page after partner form link |
| `src/_includes/components/gcloud-buyer-journey.njk` | 5-step G-Cloud procurement visual guide |
| `src/_includes/components/readiness-checklist.njk` | Pre-procurement self-assessment with traffic lights |
| `src/_includes/components/peer-council-matching.njk` | "Councils like yours" peer matching section |
| `src/_includes/components/funding-pathways.njk` | AWS credits/DLUHC/LGA funding guidance |
| `src/_data/scenarios.yaml` | Extended with partner and G-Cloud links |
| `src/_data/partners.yaml` | NEW: Partner ecosystem data (with council_fit, engagement) |
| `src/_data/peer-councils.yaml` | NEW: Reference councils for peer matching |
| `src/_data/funding-options.yaml` | NEW: Funding pathway information |
| `src/assets/js/analytics.js` | Extended for pathway event tracking |
| `src/assets/downloads/stakeholder-checklist.pdf` | Downloadable stakeholder communication checklist |
| `src/next-steps/{scenario}.md` | Scenario-specific next steps pages |

### Data Flow

```
User completes Evidence Pack (Epic 4)
        ↓
"What's Next" section displays (Story 5.1)
        ↓
    ┌─────────┬─────────────┬─────────────┐
    │         │             │             │
    ▼         ▼             ▼             ▼
Proceed    Maybe/Later   Not Now      Partner
pathway    pathway       pathway      Connect
    │         │             │             │
    ▼         ▼             ▼             ▼
G-Cloud    Resources    Feedback     Partner
Links      & Support    Form         Form
    │         │             │             │
    ▼         ▼             ▼             ▼
[External   [Internal    [GOV.UK     [GOV.UK
 G-Cloud]    Pages]      Forms]      Forms]
```

### Analytics Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EPIC 5 ANALYTICS FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Page Load Events:
  next_steps_viewed → scenario_id, persona, evaluation_outcome

Interaction Events:
  pathway_selected → pathway_type (proceed/maybe/not_now)
  gcloud_link_clicked → scenario_id, search_term
  partner_viewed → partner_id, scenario_id
  partner_contact_started → partner_id, scenario_id

Conversion Events:
  partner_form_submitted → partner_id, scenario_id, council_name

All events → Google Analytics (gtag.js)
                    ↓
            GA4 Dashboard
            (External to Portal)
```

## Detailed Design

### Services and Modules

#### Module 1: Next Steps Guidance Component (Story 5.1)

**Purpose**: Provide contextual "What's Next" guidance based on evaluation outcome (would_implement response from Epic 4 form).

**File Structure:**
```
src/
├── _includes/
│   ├── components/
│   │   ├── next-steps-guidance.njk   # Main guidance component
│   │   ├── pathway-card.njk          # Individual pathway option card
│   │   ├── partner-preview.njk       # Partner recommendation preview
│   │   ├── gcloud-link.njk           # G-Cloud search link component
│   │   ├── journey-timeline.njk      # Visual timeline showing current position
│   │   ├── partner-fit-indicator.njk # Council size/type fit badge
│   │   ├── expectations-setter.njk   # "What happens next" pre-form guidance
│   │   ├── post-contact-confirmation.njk # Confirmation after partner contact
│   │   ├── gcloud-buyer-journey.njk  # 5-step G-Cloud procurement explainer
│   │   ├── readiness-checklist.njk   # Pre-procurement self-assessment
│   │   ├── peer-council-matching.njk # "Councils like yours" section
│   │   ├── funding-pathways.njk      # AWS credits/DLUHC/LGA funding guidance
│   │   ├── incomplete-evaluation-banner.njk # Warning when no evaluation data
│   │   ├── change-decision-link.njk  # Return to evaluation link
│   │   ├── share-with-decisionmaker.njk # Email/print share functionality
│   │   ├── not-a-council-pathway.njk # Alternative path for NHS/schools/charities
│   │   ├── committee-resource-pack.njk # Downloadable approval resources
│   │   ├── pilot-guidance.njk        # "Start small" pilot pathway
│   │   ├── no-partners-fallback.njk  # G-Cloud search when no partners
│   │   ├── existing-partner-path.njk # "I already have a partner" option
│   │   ├── technical-compatibility.njk # IT lead compatibility checklist
│   │   ├── cost-range-indicator.njk  # Indicative cost range display
│   │   ├── tco-guidance.njk          # Total cost of ownership section
│   │   ├── procurement-route.njk     # Direct award vs competition guidance
│   │   ├── time-to-value-badge.njk   # Weeks to measurable benefit
│   │   ├── partner-tech-stack.njk    # Partner integrations display
│   │   └── security-badges.njk       # Data residency/certification badges
│   │
│   └── layouts/
│       └── next-steps.njk            # Next steps page layout
│
├── _data/
│   ├── pathways.yaml                 # Pathway definitions per outcome
│   ├── partners.yaml                 # Partner ecosystem data (with council_fit, engagement)
│   ├── peer-councils.yaml            # Reference councils for peer matching
│   └── funding-options.yaml          # AWS credits, DLUHC, LGA funding info
│
├── assets/
│   └── downloads/
│       ├── stakeholder-checklist.pdf # Downloadable communication checklist
│       ├── finance-committee-brief.pdf # One-pager for S151 officers
│       ├── change-management-checklist.pdf # Service manager transition guide
│       ├── technical-compatibility-checklist.pdf # IT lead integration checklist
│       └── requirements-templates/   # Per-scenario spec templates
│           ├── council-chatbot-spec.docx
│           ├── planning-ai-spec.docx
│           ├── quicksight-dashboard-spec.docx
│           ├── document-processing-spec.docx
│           ├── predictive-maintenance-spec.docx
│           └── citizen-feedback-spec.docx
│
└── next-steps/                       # Scenario-specific next steps
    ├── council-chatbot.md
    ├── planning-application-ai.md
    ├── quicksight-dashboard.md
    ├── document-processing.md
    ├── predictive-maintenance.md
    └── citizen-feedback-analysis.md
```

**Component Logic:**
```njk
{# next-steps-guidance.njk #}
{% macro nextStepsGuidance(scenario, evaluationOutcome, persona) %}
<div class="ndx-next-steps" data-scenario="{{ scenario.id }}" data-outcome="{{ evaluationOutcome }}">
  <h2 class="govuk-heading-l">What's Next?</h2>

  {% if evaluationOutcome == 'yes' %}
    {# Proceed pathway - ready to implement #}
    <div class="ndx-pathway ndx-pathway--proceed">
      <h3 class="govuk-heading-m">You're Ready to Proceed</h3>
      <p class="govuk-body">Based on your evaluation, here's your pathway to implementation:</p>

      <ol class="govuk-list govuk-list--number">
        <li>
          <strong>Review with stakeholders</strong>
          <p class="govuk-body-s">Share your Evidence Pack with your committee</p>
        </li>
        <li>
          <strong>Find approved suppliers</strong>
          <p class="govuk-body-s">Browse G-Cloud for implementation partners</p>
          {% include "components/gcloud-link.njk" %}
        </li>
        <li>
          <strong>Start procurement</strong>
          <p class="govuk-body-s">Use your Evidence Pack as the business case foundation</p>
        </li>
      </ol>

      {% include "components/partner-preview.njk" %}
    </div>

  {% elif evaluationOutcome == 'maybe' %}
    {# Maybe pathway - needs more information #}
    <div class="ndx-pathway ndx-pathway--maybe">
      <h3 class="govuk-heading-m">Need More Time to Decide?</h3>
      <p class="govuk-body">That's perfectly fine. Here are some options:</p>

      <div class="govuk-grid-row">
        <div class="govuk-grid-column-one-half">
          <h4 class="govuk-heading-s">Explore More Scenarios</h4>
          <p class="govuk-body-s">Try another scenario to compare approaches</p>
          <a href="/scenarios" class="govuk-button govuk-button--secondary">
            Browse Scenarios
          </a>
        </div>
        <div class="govuk-grid-column-one-half">
          <h4 class="govuk-heading-s">Speak to an Expert</h4>
          <p class="govuk-body-s">Get answers to your specific questions</p>
          <a href="{{ forms.partner_contact.live_url }}" class="govuk-button govuk-button--secondary">
            Request a Conversation
          </a>
        </div>
      </div>
    </div>

  {% else %}
    {# No pathway - not proceeding #}
    <div class="ndx-pathway ndx-pathway--not-now">
      <h3 class="govuk-heading-m">Not the Right Fit?</h3>
      <p class="govuk-body">Thank you for exploring this scenario. Your feedback helps us improve.</p>

      <div class="govuk-inset-text">
        <p>Would you like to tell us why this scenario didn't meet your needs?</p>
        <a href="{{ forms.feedback.live_url }}" class="govuk-link">Share feedback</a>
      </div>

      <h4 class="govuk-heading-s">You might also be interested in:</h4>
      {% for related in scenario.related_scenarios %}
        {% include "components/scenario-card-mini.njk" %}
      {% endfor %}
    </div>
  {% endif %}
</div>
{% endmacro %}
```

#### Module 2: Success Metrics Analytics Framework (Story 5.2)

**Purpose**: Track platform effectiveness through defined conversion events and journey metrics.

**Implementation:**
```javascript
// src/assets/js/analytics.js - Extended for Epic 5

// Epic 5 Analytics Events
const EPIC5_EVENTS = {
  // Page views
  NEXT_STEPS_VIEWED: 'next_steps_viewed',
  PARTNER_PAGE_VIEWED: 'partner_page_viewed',

  // Interactions
  PATHWAY_SELECTED: 'pathway_selected',
  GCLOUD_LINK_CLICKED: 'gcloud_link_clicked',
  PARTNER_VIEWED: 'partner_viewed',
  PARTNER_CONTACT_STARTED: 'partner_contact_started',

  // Conversions
  PARTNER_FORM_SUBMITTED: 'partner_form_submitted',
  JOURNEY_COMPLETED: 'journey_completed'
};

// Track Next Steps page view
function trackNextStepsView(scenarioId, persona, evaluationOutcome) {
  gtag('event', EPIC5_EVENTS.NEXT_STEPS_VIEWED, {
    'scenario_id': scenarioId,
    'persona': persona,
    'evaluation_outcome': evaluationOutcome,
    'timestamp': new Date().toISOString()
  });
}

// Track pathway selection
function trackPathwaySelection(pathwayType, scenarioId) {
  gtag('event', EPIC5_EVENTS.PATHWAY_SELECTED, {
    'pathway_type': pathwayType, // 'proceed', 'maybe', 'not_now'
    'scenario_id': scenarioId
  });
}

// Track G-Cloud link click
function trackGCloudClick(scenarioId, searchTerm) {
  gtag('event', EPIC5_EVENTS.GCLOUD_LINK_CLICKED, {
    'scenario_id': scenarioId,
    'search_term': searchTerm,
    'destination': 'g-cloud'
  });
}

// Track partner interaction
function trackPartnerView(partnerId, scenarioId) {
  gtag('event', EPIC5_EVENTS.PARTNER_VIEWED, {
    'partner_id': partnerId,
    'scenario_id': scenarioId
  });
}

// Track journey completion (full funnel)
function trackJourneyCompleted(scenarioId, persona, pathwayType) {
  gtag('event', EPIC5_EVENTS.JOURNEY_COMPLETED, {
    'scenario_id': scenarioId,
    'persona': persona,
    'pathway_type': pathwayType,
    'journey_duration': calculateJourneyDuration() // From session start
  });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auto-track Next Steps page view
  const nextStepsContainer = document.querySelector('.ndx-next-steps');
  if (nextStepsContainer) {
    const { scenario, outcome, persona } = nextStepsContainer.dataset;
    trackNextStepsView(scenario, persona, outcome);
  }

  // Track G-Cloud link clicks
  document.querySelectorAll('[data-track="gcloud"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const { scenario, search } = e.target.dataset;
      trackGCloudClick(scenario, search);
    });
  });

  // Track partner card clicks
  document.querySelectorAll('[data-track="partner"]').forEach(card => {
    card.addEventListener('click', (e) => {
      const { partnerId, scenario } = e.target.closest('[data-partner-id]').dataset;
      trackPartnerView(partnerId, scenario);
    });
  });
});
```

**Success Metrics Definitions:**

| Metric | Calculation | Target | Source |
|--------|-------------|--------|--------|
| **Informed Decision Rate** | (proceed + not_now) / total_completions | 65-80% | pathway_selected events |
| **Partner Engagement Rate** | partner_viewed / next_steps_viewed | 30%+ | Event ratio |
| **G-Cloud Conversion** | gcloud_link_clicked / proceed_pathway | 50%+ | Event ratio |
| **Journey Completion Rate** | journey_completed / scenario_started | 40%+ | Event ratio |
| **Form Completion Rate** | form_submitted / form_started | 60%+ | Form events |

#### Module 3: G-Cloud & Partner Integration (Story 5.3)

**Purpose**: Connect councils with approved implementation partners via G-Cloud catalog links and partner ecosystem data.

**G-Cloud Integration (Static Links):**
```yaml
# src/_data/scenarios.yaml - Extended for Epic 5
scenarios:
  - id: council-chatbot
    # ... existing fields ...

    # NEW: G-Cloud integration
    gcloud:
      search_term: "AI chatbot local government"
      category: "Cloud software"
      lot: "Cloud software"
      pre_filtered_url: "https://www.digitalmarketplace.service.gov.uk/g-cloud/search?q=AI+chatbot+local+government&lot=cloud-software"

    # NEW: Recommended partners
    recommended_partners:
      - id: partner-001
        relevance: "Specializes in council contact centers"
      - id: partner-002
        relevance: "AWS Premier Partner with UK Gov experience"
```

**Partner Data Model:**
```yaml
# src/_data/partners.yaml
partners:
  - id: partner-001
    name: "Example Gov Tech Partner"
    tier: "AWS Premier Partner"
    gcloud_supplier_id: "12345"
    specializations:
      - "Local Government"
      - "AI/ML Solutions"
      - "Contact Center Modernization"
    regions:
      - "UK-wide"
    case_studies:
      - council: "Example Council"
        scenario: "council-chatbot"
        outcome: "50% reduction in call handling time"
    contact:
      form_url: "https://forms.service.gov.uk/partner-contact/partner-001"
    logo: "/assets/images/partners/partner-001.png"

  - id: partner-002
    name: "Cloud Solutions Ltd"
    tier: "AWS Advanced Partner"
    gcloud_supplier_id: "67890"
    specializations:
      - "Local Government"
      - "Data Analytics"
      - "Infrastructure Modernization"
    regions:
      - "South East"
      - "London"
    case_studies:
      - council: "Another Council"
        scenario: "quicksight-dashboard"
        outcome: "Real-time performance visibility"
    contact:
      form_url: "https://forms.service.gov.uk/partner-contact/partner-002"
    logo: "/assets/images/partners/partner-002.png"
```

**Partner Listing Component:**
```njk
{# partner-listing.njk #}
{% macro partnerListing(scenario) %}
<section class="ndx-partners" aria-labelledby="partners-heading">
  <h3 class="govuk-heading-m" id="partners-heading">
    Recommended Implementation Partners
  </h3>

  <p class="govuk-body">
    These AWS Partners have experience delivering {{ scenario.name }} solutions
    for UK local government:
  </p>

  <div class="govuk-grid-row">
    {% for partnerRef in scenario.recommended_partners %}
      {% set partner = partners | getPartnerById(partnerRef.id) %}
      <div class="govuk-grid-column-one-half">
        <div class="ndx-partner-card"
             data-partner-id="{{ partner.id }}"
             data-scenario="{{ scenario.id }}"
             data-track="partner">

          <img src="{{ partner.logo }}"
               alt="{{ partner.name }} logo"
               class="ndx-partner-card__logo">

          <h4 class="govuk-heading-s">{{ partner.name }}</h4>
          <p class="govuk-body-s govuk-!-margin-bottom-1">
            <strong>{{ partner.tier }}</strong>
          </p>
          <p class="govuk-body-s">{{ partnerRef.relevance }}</p>

          <ul class="govuk-list govuk-list--bullet govuk-body-s">
            {% for spec in partner.specializations | slice(0, 3) %}
              <li>{{ spec }}</li>
            {% endfor %}
          </ul>

          {% if partner.case_studies | length > 0 %}
            <details class="govuk-details govuk-!-margin-bottom-2">
              <summary class="govuk-details__summary">
                <span class="govuk-details__summary-text">View case study</span>
              </summary>
              <div class="govuk-details__text">
                <p><strong>{{ partner.case_studies[0].council }}</strong></p>
                <p>{{ partner.case_studies[0].outcome }}</p>
              </div>
            </details>
          {% endif %}

          <a href="{{ partner.contact.form_url }}"
             class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
             data-track="partner-contact"
             data-partner-id="{{ partner.id }}">
            Contact this partner
          </a>
        </div>
      </div>
    {% endfor %}
  </div>

  <div class="govuk-inset-text">
    <p class="govuk-body-s">
      All partners listed are members of the AWS Partner Network and appear on
      the G-Cloud framework.
      <a href="{{ scenario.gcloud.pre_filtered_url }}"
         class="govuk-link"
         data-track="gcloud"
         data-scenario="{{ scenario.id }}"
         data-search="{{ scenario.gcloud.search_term }}">
        Browse all suppliers on G-Cloud
      </a>
    </p>
  </div>
</section>
{% endmacro %}
```

### Data Models and Contracts

#### Pathway Data Model

```typescript
interface PathwayData {
  // Pathway identification
  type: 'proceed' | 'maybe' | 'not_now';
  scenario_id: string;
  persona: 'cto' | 'service-manager' | 'finance' | 'developer';

  // Content configuration
  heading: string;
  description: string;
  steps: PathwayStep[];

  // Actions
  primary_action: PathwayAction;
  secondary_actions: PathwayAction[];
}

interface PathwayStep {
  number: number;
  title: string;
  description: string;
  link?: string;
  link_text?: string;
}

interface PathwayAction {
  type: 'link' | 'button' | 'form';
  label: string;
  url: string;
  track_event: string;
  external: boolean;
}
```

#### Partner Data Model

```typescript
interface Partner {
  // Identity
  id: string;
  name: string;
  tier: 'AWS Premier Partner' | 'AWS Advanced Partner' | 'AWS Select Partner';
  gcloud_supplier_id: string;

  // Capabilities
  specializations: string[];
  regions: string[];
  services: string[];

  // Evidence
  case_studies: CaseStudy[];

  // Contact
  contact: {
    form_url: string;
    email?: string;
    phone?: string;
  };

  // Branding
  logo: string;
  description: string;
}

interface CaseStudy {
  council: string;
  scenario: string;
  outcome: string;
  testimonial?: string;
  date?: string;
}

// Journey Mapping enhancement: Council fit and engagement fields
interface PartnerFitProfile {
  // Council size fit
  council_fit: {
    sizes: ('small' | 'medium' | 'large' | 'county')[]; // Which council sizes this partner excels with
    description: string; // e.g., "Works well with mid-size councils (50-200 employees)"
  };

  // Engagement expectations
  engagement: {
    typical_response_time: string; // e.g., "1-2 business days"
    initial_meeting_format: string; // e.g., "30-minute discovery call"
    what_happens_next: string[]; // Steps after contact form submission
  };
}

// Competitive Analysis enhancement: Peer council matching
interface PeerCouncil {
  id: string;
  name: string;
  type: 'district' | 'borough' | 'county' | 'unitary' | 'metropolitan';
  size: 'small' | 'medium' | 'large';
  region: string; // e.g., "South East", "North West"
  population: number;
  scenarios_implemented: string[]; // Scenario IDs
  willing_to_share: boolean; // Can be contacted by peers
  contact?: {
    name: string;
    role: string;
    email?: string; // Only if willing_to_share
  };
  testimonial?: string;
}

// Competitive Analysis enhancement: Funding pathway options
interface FundingOption {
  id: string;
  name: string;
  provider: 'AWS' | 'DLUHC' | 'LGA' | 'Other';
  type: 'credits' | 'grant' | 'funding' | 'support';
  description: string;
  eligibility: string[];
  typical_value: string; // e.g., "£5,000-£25,000 in credits"
  application_url: string;
  deadline?: string; // If time-limited
  scenarios_applicable: string[]; // Which scenarios qualify
}

// Competitive Analysis enhancement: Readiness assessment
interface ReadinessCheck {
  id: string;
  question: string;
  help_text: string;
  weight: number; // Importance 1-3
  remediation: string; // What to do if not ready
}

interface ReadinessAssessment {
  checks: ReadinessCheck[];
  thresholds: {
    green: number;  // Score >= this = ready
    amber: number;  // Score >= this = nearly ready
    // Below amber = not ready
  };
}

// Stakeholder Analysis enhancement: Partner technical profile
interface PartnerTechnicalProfile {
  // IT Lead concerns
  integrations: {
    crm: string[];        // e.g., ["Dynamics 365", "Salesforce", "Civica"]
    case_management: string[]; // e.g., ["Firmstep", "Jadu", "Granicus"]
    apis: string[];       // e.g., ["REST", "GraphQL", "SOAP"]
    data_formats: string[]; // e.g., ["JSON", "CSV", "XML"]
  };

  // Security certifications
  security: {
    data_residency: 'UK-only' | 'EU' | 'Global';
    certifications: ('ISO27001' | 'Cyber Essentials' | 'Cyber Essentials Plus' | 'SOC2')[];
    gdpr_compliant: boolean;
    pen_test_date?: string; // Last penetration test
  };

  // Implementation details
  implementation: {
    typical_duration_weeks: { min: number; max: number };
    includes_training: boolean;
    support_levels: ('L1' | 'L2' | 'L3')[];
  };
}

// Stakeholder Analysis enhancement: Scenario cost profile
interface ScenarioCostProfile {
  // Finance Officer concerns
  indicative_range: {
    year_1: { min: number; max: number; currency: 'GBP' };
    ongoing_annual: { min: number; max: number; currency: 'GBP' };
  };

  // TCO components
  cost_components: {
    licensing: string;      // e.g., "Per user/month" or "Flat annual"
    implementation: string; // e.g., "One-time setup fee"
    training: string;       // e.g., "Included" or "£X per day"
    support: string;        // e.g., "Included in license" or "Separate contract"
    data_migration: string; // e.g., "Varies by volume"
  };

  // Time to value
  time_to_value_weeks: { min: number; max: number };

  // Procurement
  procurement: {
    typical_route: 'direct_award' | 'further_competition' | 'either';
    threshold_guidance: string; // e.g., "Direct award typically <£25k"
    timeline_weeks: { direct: number; competition: number };
  };
}
```

#### Analytics Event Schema

```typescript
interface AnalyticsEvent {
  event_name: string;
  timestamp: string;
  session_id: string;
  user_id?: string; // Anonymous if not provided

  // Context
  scenario_id?: string;
  persona?: string;
  pathway_type?: string;

  // Specific event data
  properties: {
    [key: string]: string | number | boolean;
  };
}

// Event type definitions
type Epic5EventTypes =
  | 'next_steps_viewed'
  | 'pathway_selected'
  | 'gcloud_link_clicked'
  | 'partner_viewed'
  | 'partner_contact_started'
  | 'partner_form_submitted'
  | 'journey_completed';
```

#### Session State Model

```typescript
interface SessionState {
  // Journey tracking
  session_id: string;
  started_at: string;
  last_activity: string;

  // Progress tracking
  scenarios_viewed: string[];
  scenarios_completed: string[];
  evidence_packs_generated: string[];

  // Decision tracking
  evaluation_outcomes: {
    [scenario_id: string]: {
      would_implement: 'yes' | 'maybe' | 'no';
      likelihood_proceed: number;
      timestamp: string;
    };
  };

  // Pathway tracking
  pathways_selected: {
    scenario_id: string;
    pathway_type: string;
    timestamp: string;
  }[];

  // Contact tracking
  partner_contacts_initiated: {
    partner_id: string;
    scenario_id: string;
    timestamp: string;
  }[];
}
```

### APIs and Interfaces

Since this is a static site without backend API, all integrations use external services or static data.

#### External Integrations

**G-Cloud Digital Marketplace (Static Links)**
```
Outbound: Portal → G-Cloud
Method: Pre-built URLs with search parameters
URL Pattern: https://www.digitalmarketplace.service.gov.uk/g-cloud/search?q={search_term}&lot={lot}
Authentication: None (public marketplace)
Rate Limits: N/A (just links)
```

**GOV.UK Forms Service (Partner Contact)**
```
Outbound: Portal → GOV.UK Forms
Method: Form submission via GOV.UK Forms hosted forms
URL Pattern: https://forms.service.gov.uk/{form_id}
Data Handling: GOV.UK Forms stores responses (GDPR compliant)
Portal Access: None (manual export only)
```

**Google Analytics 4 (Tracking)**
```
Outbound: Portal → GA4
Method: gtag.js event tracking
Property: GA4 Measurement ID (configured in site.yaml)
Events: Custom events as defined in analytics.js
Data Retention: Per GA4 property settings
```

#### Internal Interfaces

**Eleventy Data Cascade**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW AT BUILD TIME                      │
└─────────────────────────────────────────────────────────────────┘

src/_data/
├── scenarios.yaml    ──┐
├── partners.yaml     ──┼──▶ Eleventy Data Cascade ──▶ Templates
├── pathways.yaml     ──┤
├── forms.yaml        ──┤
└── site.yaml         ──┘

Access in templates:
  {{ scenarios | getScenarioById(scenario_id) }}
  {{ partners | getPartnerById(partner_id) }}
  {{ pathways[evaluationOutcome] }}
  {{ forms.partner_contact.live_url }}
```

**Custom Eleventy Filters**

```javascript
// eleventy.config.js - filters for Epic 5

module.exports = function(eleventyConfig) {
  // Get partner by ID
  eleventyConfig.addFilter('getPartnerById', function(partners, id) {
    return partners.find(p => p.id === id);
  });

  // Get partners for scenario
  eleventyConfig.addFilter('getPartnersForScenario', function(scenario, partners) {
    return scenario.recommended_partners.map(ref =>
      partners.find(p => p.id === ref.id)
    ).filter(Boolean);
  });

  // Format G-Cloud URL
  eleventyConfig.addFilter('gcloudSearchUrl', function(searchTerm) {
    const encoded = encodeURIComponent(searchTerm);
    return `https://www.digitalmarketplace.service.gov.uk/g-cloud/search?q=${encoded}`;
  });
};
```

**localStorage Interface**

```javascript
// Session state management for pathway tracking
const SESSION_KEY = 'ndx_session_state';

const sessionState = {
  // Read current state
  get() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : this.createNew();
    } catch {
      return this.createNew();
    }
  },

  // Create new session
  createNew() {
    return {
      session_id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      scenarios_viewed: [],
      scenarios_completed: [],
      evidence_packs_generated: [],
      evaluation_outcomes: {},
      pathways_selected: [],
      partner_contacts_initiated: []
    };
  },

  // Update and persist
  update(changes) {
    const current = this.get();
    const updated = {
      ...current,
      ...changes,
      last_activity: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return updated;
  },

  // Record pathway selection
  recordPathway(scenarioId, pathwayType) {
    const current = this.get();
    current.pathways_selected.push({
      scenario_id: scenarioId,
      pathway_type: pathwayType,
      timestamp: new Date().toISOString()
    });
    this.update(current);
  }
};
```

### Workflows and Sequencing

#### User Flow: Evidence Pack → Next Steps → Partner Connection

```
┌─────────────────────────────────────────────────────────────────┐
│                    EPIC 5 USER WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

[Epic 4 Complete] → User has Evidence Pack
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 1: Next Steps Page Loads           │
│ - Based on would_implement response     │
│ - Scenario-specific content             │
│ - Persona-appropriate guidance          │
└─────────────────────────────────────────┘
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ "Yes" Pathway │ │"Maybe" Pathway│ │ "No" Pathway  │
│ → Proceed     │ │ → Explore more│ │ → Feedback    │
└───────────────┘ └───────────────┘ └───────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Step 2a:      │ │ Step 2b:      │ │ Step 2c:      │
│ G-Cloud Link  │ │ Browse More   │ │ Feedback Form │
│ Partner List  │ │ Expert Chat   │ │ Related Scen. │
└───────────────┘ └───────────────┘ └───────────────┘
        │                 │                 │
        ▼                 │                 │
┌───────────────┐         │                 │
│ Step 3:       │         │                 │
│ Partner Card  │         │                 │
│ Click         │         │                 │
└───────────────┘         │                 │
        │                 │                 │
        ▼                 │                 │
┌───────────────┐         │                 │
│ Step 4:       │         │                 │
│ Partner Form  │ ◄───────┘                 │
│ (GOV.UK Forms)│                           │
└───────────────┘                           │
        │                                   │
        ▼                                   │
┌───────────────┐                           │
│ Step 5:       │                           │
│ Journey       │ ◄─────────────────────────┘
│ Complete      │
└───────────────┘
```

#### Story Sequencing

```
Story 5.1: Next Steps Guidance
    ↓ (pathway component must exist first)
Story 5.2: Success Metrics  ←──┐
    ↓ (analytics infrastructure)│
Story 5.3: Partner Integration ─┘ (can parallel with 5.2)
```

**Recommended Implementation Order:**
1. **Story 5.1** first - establishes pathway component and page structure
2. **Story 5.2** in parallel - analytics can be added to existing components
3. **Story 5.3** builds on 5.1 - adds partner data and G-Cloud links

#### Analytics Tracking Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS TRACKING FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Page Load:
  └─ next_steps_viewed (scenario_id, persona, outcome)

User Actions:
  ├─ pathway_selected (pathway_type)
  │     └─ "proceed" | "maybe" | "not_now"
  │
  ├─ gcloud_link_clicked (scenario_id, search_term)
  │     └─ External navigation to G-Cloud
  │
  ├─ partner_viewed (partner_id, scenario_id)
  │     └─ Partner card click/expand
  │
  └─ partner_contact_started (partner_id, scenario_id)
        └─ Partner form link click

Conversion:
  └─ journey_completed (scenario_id, persona, pathway_type)
        └─ Full funnel completion marker
```

#### Build-Time Generation

```yaml
# GitHub Actions - Next Steps Pages
name: Generate Next Steps Pages
on:
  push:
    paths:
      - 'src/_data/scenarios.yaml'
      - 'src/_data/partners.yaml'
      - 'src/_data/pathways.yaml'

jobs:
  generate:
    steps:
      - run: npm run build
      # Eleventy generates:
      # - /next-steps/council-chatbot/index.html
      # - /next-steps/planning-application-ai/index.html
      # - etc. for each scenario
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Next Steps page load | <2 seconds | Lighthouse performance score |
| Partner card render | <100ms | Time from data load to display |
| Analytics event fire | <50ms | Time from action to gtag call |
| G-Cloud link response | <500ms | Time to external redirect |
| localStorage read/write | <10ms | Session state operations |
| Total JavaScript bundle | <50KB | Combined analytics + session JS |

**Optimization Strategies:**
- Static HTML generation eliminates server round-trips
- Partner data pre-loaded in page (no AJAX calls)
- Analytics events fire asynchronously (non-blocking)
- Lazy-load partner logos below fold
- Minimal JavaScript footprint (vanilla JS only)

### Security

| Requirement | Implementation |
|-------------|----------------|
| No PII transmission | Partner contact forms hosted on GOV.UK Forms (external) |
| Session data local-only | localStorage never transmitted to portal backend |
| External link warnings | G-Cloud links marked with external link icon |
| GDPR compliance | Privacy notice on partner contact CTAs |
| No tracking pixels | GA4 only, no third-party trackers |
| XSS prevention | All user data sanitized before template insertion |

**Data Handling:**
- Partner contact form data stored in GOV.UK Forms (GDPR compliant)
- Session state in localStorage cleared after 30 days of inactivity (extended from 7 days to accommodate council procurement cycles)
- No cookies set by portal (GA4 may set its own)
- Analytics events contain no PII (scenario IDs and pathway types only)
- Partner IDs are public (no sensitive data)

### Reliability/Availability

| Requirement | Target | Fallback |
|-------------|--------|----------|
| Page availability | 99.9% (GitHub Pages SLA) | Static pages always load |
| G-Cloud link availability | N/A (external) | Link still works; G-Cloud may be down |
| Partner data freshness | Updated at build time | Stale data acceptable (manual update cycle) |
| Analytics reliability | Best effort | Events may be lost if user blocks GA |
| localStorage availability | 95%+ | Graceful degradation; features still work |

**Error Handling:**
- If localStorage unavailable: Session state not persisted, but pages still functional
- If GA4 blocked: Silent failure, no user-facing errors
- If G-Cloud down: External site issue, not portal responsibility
- If partner form unavailable: GOV.UK Forms responsibility

**Graceful Degradation:**
```
Primary: Full experience with analytics + session tracking
    ↓ (if localStorage unavailable)
Fallback 1: Pages work, no session persistence
    ↓ (if JavaScript disabled)
Fallback 2: Static content visible, no analytics, links still work
```

### Observability

| Event | Data Captured | Purpose |
|-------|---------------|---------|
| `next_steps_viewed` | scenario_id, persona, outcome | Funnel tracking |
| `pathway_selected` | pathway_type, scenario_id | Decision distribution |
| `gcloud_link_clicked` | scenario_id, search_term | Conversion to G-Cloud |
| `partner_viewed` | partner_id, scenario_id | Partner engagement |
| `partner_contact_started` | partner_id, scenario_id | Lead generation |
| `journey_completed` | scenario_id, persona, pathway, duration | Full funnel completion |

**Metrics Dashboard (GA4 Custom Reports):**

| Report | Metrics | Dimensions |
|--------|---------|------------|
| Journey Funnel | Completion rate by stage | Scenario, Persona |
| Pathway Distribution | % proceed/maybe/not_now | Scenario |
| Partner Engagement | Views, contact starts | Partner, Scenario |
| G-Cloud Conversion | Click-through rate | Scenario |
| Session Duration | Average journey time | Pathway type |

**Monitoring:**
- No server-side monitoring (static site)
- GA4 real-time dashboard for live event monitoring
- GitHub Actions build logs for deployment issues
- No error tracking service needed (static pages)

**Proactive Monitoring (Pre-mortem derived):**
- Weekly: Automated G-Cloud URL validation (CI script)
- Weekly: Partner contact form accessibility check
- Daily: Alert if pathway_selected "Maybe" rate > 70% (indicates pathway mismatch)
- Monthly: Partner data freshness review

## Dependencies and Integrations

### Epic Dependencies

| Dependency | Type | Impact | Status |
|------------|------|--------|--------|
| **Epic 1 - Portal Foundation** | Required | Base layout, navigation, GOV.UK Frontend | Must be complete |
| **Epic 2 - Deployment** | Optional | Deployment completion triggers next steps | Can work without |
| **Epic 3 - Guided Experiences** | Required | Scenario walkthrough provides context | Must be complete |
| **Epic 4 - Evidence Generation** | Required | Evidence Pack and evaluation outcome drive pathways | Must be complete |

### Story Dependencies Within Epic 5

```
Story 5.1 (Next Steps Guidance)
    │
    ├───→ Story 5.2 (Analytics) - analytics events added to guidance component
    │
    └───→ Story 5.3 (Partner Integration) - partner section added to guidance

Story 5.2 (Analytics) - independent, can start in parallel
    │
    └───→ Story 5.3 (Partners) - partner events tracked by analytics

Story 5.3 (Partners) - depends on 5.1 for placement
```

### External Dependencies

| Dependency | Version/Service | Purpose | Fallback |
|------------|-----------------|---------|----------|
| **Google Analytics 4** | GA4 (gtag.js) | Event tracking and reporting | None (analytics optional) |
| **GOV.UK Forms Service** | Production service | Partner contact forms | Direct email links |
| **G-Cloud Digital Marketplace** | Public site | Supplier search links | Manual search instructions |
| **GOV.UK Frontend** | 5.13.0 | Design system components | Already in place from Epic 1 |
| **Eleventy** | ^3.x | Template processing | Already in place from Epic 1 |

### NPM Package Additions for Epic 5

No additional npm packages required. Epic 5 uses existing dependencies:

```json
{
  "dependencies": {
    "@x-govuk/govuk-eleventy-plugin": "^7.0.0",
    "govuk-frontend": "5.13.0"
  }
}
```

**Note:** Analytics uses gtag.js loaded via CDN, not an npm package.

### Integration Points

#### Integration 1: Epic 4 → Epic 5 (Evaluation Outcome)

**Source:** Epic 4 reflection form (`would_implement` field)
**Consumer:** Epic 5 Next Steps component

```javascript
// Reading evaluation outcome from localStorage
const evaluationData = JSON.parse(localStorage.getItem('ndx_reflection_form'));
const outcome = evaluationData?.would_implement; // 'yes' | 'maybe' | 'no'

// Passed to Next Steps page via URL or session
// /next-steps/council-chatbot?outcome=yes&persona=cto
```

#### Integration 2: Scenario Data → Partner Recommendations

**Source:** `src/_data/scenarios.yaml`
**Consumer:** Partner listing component

```yaml
# scenarios.yaml field additions for Epic 5
scenarios:
  - id: council-chatbot
    # ... existing fields ...
    gcloud:
      search_term: "AI chatbot local government"
      pre_filtered_url: "https://www.digitalmarketplace.service.gov.uk/..."
    recommended_partners:
      - id: partner-001
        relevance: "Specializes in council contact centers"
```

#### Integration 3: Partner Data → Contact Forms

**Source:** `src/_data/partners.yaml`
**Consumer:** Partner card component → GOV.UK Forms

```yaml
# partners.yaml
partners:
  - id: partner-001
    contact:
      form_url: "https://forms.service.gov.uk/partner-contact/partner-001"
```

#### Integration 4: Analytics Events → GA4

**Source:** Portal JavaScript (analytics.js)
**Consumer:** Google Analytics 4

```javascript
// Configuration in site.yaml
// ga4_measurement_id: "G-XXXXXXXXXX"

// Event transmission
gtag('event', 'partner_viewed', {
  'partner_id': 'partner-001',
  'scenario_id': 'council-chatbot'
});
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EPIC 5 DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Epic 4       │────▶│ localStorage │────▶│ Next Steps   │
│ Form Data    │     │ (session)    │     │ Component    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
       ┌─────────────────────────────────────────┼─────────────────┐
       │                                         │                 │
       ▼                                         ▼                 ▼
┌──────────────┐                          ┌──────────────┐  ┌──────────────┐
│ scenarios.   │                          │ partners.    │  │ pathways.    │
│ yaml         │                          │ yaml         │  │ yaml         │
└──────────────┘                          └──────────────┘  └──────────────┘
       │                                         │                 │
       │                                         │                 │
       ▼                                         ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next Steps Page (Rendered HTML)               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ Pathway    │  │ G-Cloud    │  │ Partner    │                 │
│  │ Guidance   │  │ Links      │  │ Cards      │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
       │                   │                 │
       │                   │                 │
       ▼                   ▼                 ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐
│ GA4 Events   │    │ G-Cloud      │  │ GOV.UK Forms │
│ (Analytics)  │    │ (External)   │  │ (External)   │
└──────────────┘    └──────────────┘  └──────────────┘
```

## Acceptance Criteria (Authoritative)

### Story 5.1: "What's Next" - Contextual Pathway Guidance

**Given** the Next Steps guidance component is implemented
**When** a user completes scenario evaluation and views the Next Steps page
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 5.1.1 | Next Steps page exists for each of the 6 scenarios | Pages accessible at `/next-steps/{scenario-id}/` |
| 5.1.2 | Page displays "Proceed" pathway when would_implement = 'yes' | Visual inspection with test data |
| 5.1.3 | Page displays "Maybe/Later" pathway when would_implement = 'maybe' | Visual inspection with test data |
| 5.1.4 | Page displays "Not Now" pathway when would_implement = 'no' | Visual inspection with test data |
| 5.1.5 | Proceed pathway includes: stakeholder review, G-Cloud link, procurement guidance | Content verification |
| 5.1.6 | Maybe pathway includes: explore more scenarios, request expert conversation | Content verification |
| 5.1.7 | Not Now pathway includes: feedback form link, related scenarios | Content verification |
| 5.1.8 | Component uses GOV.UK Frontend patterns (buttons, cards, inset text) | Visual inspection against Design System |
| 5.1.9 | Component passes WCAG 2.2 AA accessibility (focus, keyboard nav) | Axe DevTools scan passes |
| 5.1.10 | Page loads in <2 seconds | Lighthouse performance score |
| 5.1.11 | Evaluation outcome read from localStorage session data | Developer tools verification |
| 5.1.12 | Fourth pathway "Yes, but need time" with procurement timeline guidance | Content displays for users needing more time before formal procurement |
| 5.1.13 | Pathway includes estimated procurement timeline (4-12 weeks typical) | Timeline guidance visible on Proceed pathway |
| 5.1.14 | Visual timeline graphic showing journey stages with current position | SVG/CSS graphic displays on all pathways |
| 5.1.15 | Downloadable stakeholder communication checklist for "Proceed" pathway | PDF/printable checklist available |
| 5.1.16 | G-Cloud buyer journey explainer with 5-step visual guide (Search → Shortlist → Compare → Award → Contract) | Visual guide visible on Proceed pathway |
| 5.1.17 | Pre-procurement readiness checklist with traffic light indicator (Budget? Stakeholders? Requirements?) | Self-assessment displays before G-Cloud link |
| 5.1.18 | "Not ready yet" pathway with preparatory steps for users who fail readiness check | Alternative guidance displays when not ready |
| 5.1.19 | "Incomplete evaluation" banner when visiting Next Steps without evaluation data in localStorage | Warning banner with link to complete evaluation |
| 5.1.20 | "Change my decision" link allowing users to return to evaluation and update their outcome | Link visible on all pathways; updates session state |
| 5.1.21 | "Share with decision-maker" email/print functionality for users without procurement authority | Share button generates email draft or print view |
| 5.1.22 | Readiness-aware CTA: if checklist score < amber, "Get ready first" becomes primary action | Dynamic CTA based on readiness assessment |
| 5.1.23 | "Not a council?" alternative pathway for NHS, schools, charities with adjusted guidance | Detection via explicit question or referrer |
| 5.1.24 | All pathway selection works without JavaScript (progressive enhancement) | Functional test with JS disabled |
| 5.1.25 | "Prepare for committee" downloadable resource pack for users needing approval | PDF pack with talking points, cost summary, risks |
| 5.1.26 | "Start with a pilot" guidance for risk-averse councils wanting smaller scope | Pilot pathway option visible on Proceed pathway |
| 5.1.27 | Technical compatibility checklist for IT leads (integrations, data formats, APIs) | Checklist visible on Proceed pathway for technical users |
| 5.1.28 | Indicative cost range displayed before G-Cloud link (e.g., "£10k-50k typical Y1") | Cost range visible to set budget expectations |
| 5.1.29 | TCO guidance section covering hidden costs (training, migration, support, licensing) | "Full cost picture" expandable section on Proceed pathway |
| 5.1.30 | "Finance committee brief" downloadable one-pager with cost/benefit summary | PDF download for S151 officers |
| 5.1.31 | Direct award vs further competition guidance based on value thresholds | Procurement route guidance visible before G-Cloud link |
| 5.1.32 | Typical procurement timeline guidance (2-6 weeks direct award, 6-12 weeks competition) | Timeline visible on Proceed pathway |
| 5.1.33 | "Time to value" indicator showing typical weeks from go-live to measurable benefit | Time-to-value badge per scenario |
| 5.1.34 | Change management checklist (staff comms, training plan, rollback procedure) | Downloadable checklist for service managers |

### Story 5.2: Success Metrics Analytics Framework

**Given** the analytics framework is implemented
**When** users interact with Next Steps and Partner pages
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 5.2.1 | `next_steps_viewed` event fires on page load | GA4 DebugView shows event |
| 5.2.2 | `pathway_selected` event fires when user chooses a pathway | GA4 DebugView shows event with pathway_type |
| 5.2.3 | `gcloud_link_clicked` event fires on G-Cloud link click | GA4 DebugView shows event with search_term |
| 5.2.4 | `partner_viewed` event fires when partner card expanded/clicked | GA4 DebugView shows event with partner_id |
| 5.2.5 | `partner_contact_started` event fires on partner form link click | GA4 DebugView shows event |
| 5.2.6 | `journey_completed` event fires when user completes full funnel | GA4 DebugView shows event with journey_duration |
| 5.2.7 | All events include scenario_id and persona dimensions | Event parameters verified |
| 5.2.8 | Events fire asynchronously without blocking UI | No visible delay on user actions |
| 5.2.9 | Analytics gracefully degrades if GA blocked | No JavaScript errors if gtag unavailable |
| 5.2.10 | Session state persists across page navigation | localStorage contains session data |
| 5.2.11 | Informed Decision Rate calculable from GA4 data | Custom report shows proceed + not_now / total |
| 5.2.12 | Partner Engagement Rate calculable from GA4 data | Custom report shows partner_viewed / next_steps_viewed |

### Story 5.3: G-Cloud & Partner Ecosystem Integration

**Given** the partner ecosystem integration is implemented
**When** a user views partner recommendations on the Next Steps page
**Then**:

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| 5.3.1 | G-Cloud search link displayed for each scenario | Link visible on Proceed pathway |
| 5.3.2 | G-Cloud link opens Digital Marketplace with pre-filtered search | External link navigates to correct URL |
| 5.3.3 | G-Cloud link includes external link icon and opens in new tab | `target="_blank"` and icon present |
| 5.3.4 | Partner listing shows 2-4 recommended partners per scenario | Visual inspection of partner cards |
| 5.3.5 | Partner card displays: name, tier, specializations, case study | All fields visible on card |
| 5.3.6 | Partner card includes "Contact this partner" button | Button visible and styled correctly |
| 5.3.7 | Partner contact button links to GOV.UK Forms (external) | Link navigates to forms.service.gov.uk |
| 5.3.8 | `partners.yaml` contains at least 6 partners with complete data | YAML schema validation |
| 5.3.9 | Each scenario has at least 2 recommended_partners | scenarios.yaml validation |
| 5.3.10 | Partner logos load correctly with alt text | Visual inspection + accessibility check |
| 5.3.11 | Partner case study expandable via GOV.UK Details component | Click interaction works |
| 5.3.12 | All partners listed are AWS Partner Network members | Data accuracy verification |
| 5.3.13 | All partners listed appear on G-Cloud framework | Data accuracy verification |
| 5.3.14 | Privacy notice displayed before partner contact form | Text visible above CTA |
| 5.3.15 | "Why we recommend" disclosure explaining partner selection criteria | Transparency text visible on partner section |
| 5.3.16 | At least 1 council testimonial per recommended partner | Testimonial displayed on partner card |
| 5.3.17 | Partner cards show council size/type fit (e.g., "Works well with mid-size councils") | Fit indicator visible on partner card |
| 5.3.18 | Expectations setter before partner contact ("What happens next" guidance) | Pre-form guidance text visible |
| 5.3.19 | Post-contact confirmation page with clear next steps and response timeframe | Confirmation displayed after form submission link |
| 5.3.20 | "Councils like yours" peer matching section with size/region filtering | Peer council section displays relevant matches |
| 5.3.21 | Funding pathway guidance (AWS Public Sector credits, DLUHC Digital, LGA signposting) | Funding options visible on Proceed pathway |
| 5.3.22 | G-Cloud search fallback when no partners available for scenario | "Search G-Cloud directly" prominent when partner list empty |
| 5.3.23 | "I already have a partner" alternative path with guidance for existing relationships | Link to skip partner selection with implementation guidance |
| 5.3.24 | Partner cards show supported integrations and tech stack (CRM, case mgmt, APIs) | Tech compatibility info visible on partner cards |
| 5.3.25 | Data residency and security certification badges on partner cards (UK data, ISO27001, Cyber Essentials) | Security badges visible for IT governance |
| 5.3.26 | Downloadable requirements specification template per scenario | "Download spec template" button per scenario |
| 5.3.27 | Partner cards show typical implementation duration (e.g., "4-8 weeks typical") | Duration badge visible on partner cards |

## Traceability Mapping

### Functional Requirements Coverage

| FR ID | FR Title | Story | AC Reference | Status |
|-------|----------|-------|--------------|--------|
| FR21 | "What's Next" contextual guidance | Story 5.1 | AC 5.1.1-5.1.11 | Planned |
| FR22 | Pathway selection based on evaluation outcome | Story 5.1 | AC 5.1.2-5.1.4 | Planned |
| FR23 | G-Cloud catalog integration (links) | Story 5.3 | AC 5.3.1-5.3.3 | Planned |
| FR24 | Partner recommendations per scenario | Story 5.3 | AC 5.3.4-5.3.7 | Planned |
| FR25 | Success metrics tracking framework | Story 5.2 | AC 5.2.1-5.2.12 | Planned |
| FR26 | Journey completion analytics | Story 5.2 | AC 5.2.6, 5.2.11 | Planned |
| FR27 | Partner contact form integration | Story 5.3 | AC 5.3.6-5.3.7, 5.3.14 | Planned |

### PRD Alignment

| PRD Section | Epic 5 Implementation |
|-------------|----------------------|
| "Pathway Forward" goal | Story 5.1 delivers contextual next steps guidance |
| "Partner ecosystem integration" | Story 5.3 connects councils with approved partners |
| "Success metrics tracking" | Story 5.2 implements analytics framework |
| "65-80% informed decision rate" | AC 5.2.11 enables calculation of this KPI |
| "G-Cloud integration" | Story 5.3 provides pre-filtered search links |
| "Evaluation → Action conversion" | Full epic closes the evaluation-to-action gap |

### Architecture Decision Alignment

| Decision | Epic 5 Implementation | Compliance |
|----------|----------------------|------------|
| Decision 1: Static Site | All pages pre-generated at build time | ✓ Compliant |
| Decision 3: GOV.UK Forms | Partner contact forms use GOV.UK Forms | ✓ Compliant |
| Decision 4: Vanilla JS | Analytics uses vanilla JavaScript, no framework | ✓ Compliant |
| Decision 5: Resource Tagging | Analytics events extend tracking strategy | ✓ Compliant |
| Decision 6: GOV.UK Frontend | All components use GOV.UK patterns | ✓ Compliant |
| Static-first architecture | No backend APIs, external integrations only | ✓ Compliant |

### User Journey Mapping

```
Journey Stage: EVIDENCE → PATHWAY → ACTION

[Epic 4: Evidence Pack]
           │
           ▼
┌─────────────────────────────────┐
│ Story 5.1: Next Steps Guidance  │ ◄── FR21, FR22
│ "What's Next" contextual paths  │
└─────────────────────────────────┘
           │
           ├─────────────┬─────────────┐
           │             │             │
           ▼             ▼             ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Proceed Path  │ │ Maybe Path    │ │ Not Now Path  │
│ → G-Cloud     │ │ → Explore     │ │ → Feedback    │
│ → Partners    │ │ → Expert      │ │ → Related     │
└───────────────┘ └───────────────┘ └───────────────┘
           │             │             │
           ▼             │             │
┌───────────────┐        │             │
│ Story 5.3:    │ ◄──────┴─────────────┘
│ Partner Conn. │ ◄── FR23, FR24, FR27
└───────────────┘
           │
           ▼
┌───────────────┐
│ Story 5.2:    │ ◄── FR25, FR26
│ Analytics     │ (tracks all interactions)
└───────────────┘
           │
           ▼
[Journey Complete: Informed Decision Made]
```

### Persona Coverage

| Persona | Epic 5 Support |
|---------|----------------|
| **CTO/Technical Lead** | Pathway guidance includes technical partner recommendations, architecture expertise matching |
| **Service Manager** | Pathway guidance emphasizes service improvement outcomes, case studies from similar councils |
| **Finance/Procurement** | G-Cloud links for approved procurement routes, cost-focused partner matching |
| **Developer** | Partner recommendations include technical implementation specialists |

### Success Metrics Alignment

| Primary Metric | Epic 5 Contribution |
|----------------|---------------------|
| Informed Decision Rate (65-80%) | Story 5.1 pathways + Story 5.2 tracking enables measurement |
| Partner Engagement Rate (30%+) | Story 5.3 partner cards + Story 5.2 tracking |
| G-Cloud Conversion (50%+) | Story 5.3 links + Story 5.2 click tracking |
| Journey Completion Rate (40%+) | Story 5.2 full funnel tracking |
| Average Journey Duration | Story 5.2 session duration tracking |

### Epic Dependency Chain

```
Epic 1 ──────────────────────────────────────────────────┐
(Portal Foundation)                                       │
        │                                                 │
        ▼                                                 │
Epic 2 ──────────────────────────────────────────────────┤
(Deployment)                                              │
        │                                                 │
        ▼                                                 │
Epic 3 ──────────────────────────────────────────────────┤
(Guided Experiences)                                      │
        │                                                 │
        ▼                                                 │
Epic 4 ──────────────────────────────────────────────────┤
(Evidence Generation)                                     │
        │                                                 │
        ▼                                                 │
Epic 5 ◄──────────────────────────────────────────────────┘
(Pathway Forward & Partners)
```

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Risk | Probability | Impact | Mitigation |
|---------|------|-------------|--------|------------|
| R5.1 | **Partner data becomes stale** - Partners change G-Cloud status, contact info, or leave APN | Medium | Medium | Quarterly review cycle; partner self-service update process (Phase 2) |
| R5.2 | **G-Cloud URLs change** - Digital Marketplace changes URL structure | Low | High | Monitor G-Cloud for changes; abstract URLs in config; test links in CI |
| R5.3 | **Low partner engagement** - Users don't click through to partner forms | Medium | Medium | A/B test partner card design; add testimonials; improve relevance matching |
| R5.4 | **Analytics blocked by browsers/extensions** - Users block GA4 tracking | Medium | Low | Accept partial data; use aggregated metrics; no critical features depend on analytics |
| R5.5 | **GOV.UK Forms service unavailable** - Partner contact forms inaccessible | Low | Medium | Fallback to direct email links; display partner email addresses |
| R5.6 | **Pathway logic doesn't match user expectations** - Users confused by outcome-based routing | Low | Medium | User testing during canary launch; clear explanation of pathway logic |
| R5.7 | **Evaluation outcome not persisted** - localStorage cleared before Next Steps | Low | Low | Default to "Maybe" pathway; prompt user to re-select |
| R5.8 | **Analytics blocked by council IT policies** - 40%+ of council users may block GA4 | High | High | Add server-side event backup; first-party cookie fallback; accept partial data |
| R5.9 | **Session expires during procurement cycle** - 7-day localStorage expiry too short for council timelines | Medium | Medium | Extend retention to 30 days; add "email my progress" option for longer cycles |
| R5.10 | **Peer council contact details become stale** - Staff turnover makes reference contacts invalid | Medium | Medium | Quarterly contact validation; auto-hide councils with bounced emails |
| R5.11 | **Funding information becomes outdated** - AWS credits or DLUHC programs change/end | Medium | High | Monthly funding review; clear "last updated" dates; fallback messaging |
| R5.12 | **Readiness checklist creates friction** - Users abandon if too many "not ready" indicators | Low | Medium | A/B test checklist placement; make optional on repeat visits; encouraging tone |
| R5.13 | **Non-council users confused by council-specific content** - NHS/schools reach dead ends | Medium | Medium | "Not a council?" pathway provides alternative guidance; track usage |
| R5.14 | **Progressive enhancement failure** - Core functionality breaks without JS | Low | High | Mandatory no-JS testing in CI; server-rendered fallbacks for critical paths |
| R5.15 | **Decision change creates analytics confusion** - Users flip-flop between pathways | Low | Low | Track decision_changed event; report on final pathway only |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A5.1 | Users complete Epic 4 evaluation before reaching Next Steps | Analytics will track navigation patterns; fallback content for direct visits |
| A5.2 | 3 pathway types (proceed/maybe/not_now) are sufficient | User testing during canary; track "Other" selections if added |
| A5.3 | AWS Partners with G-Cloud presence are available for each scenario | Partner recruitment underway; at least 2 partners per scenario required |
| A5.4 | G-Cloud pre-filtered search links are stable | Digital Marketplace URL structure documented; test monthly |
| A5.5 | GA4 provides sufficient analytics granularity | Custom events validated in GA4 DebugView; reports tested pre-launch |
| A5.6 | Councils will engage with partner recommendations | Track engagement rate; target 30%+ partner card clicks |
| A5.7 | Static partner data is acceptable (vs real-time API) | Partner data updated at build time; manual refresh acceptable for MVP |
| A5.8 | Peer councils will consent to be listed as references | Outreach to pilot councils underway; minimum 3 peer councils per scenario required |
| A5.9 | AWS Public Sector credits program is available for UK councils | Validate with AWS Partner team; alternative funding sources as backup |
| A5.10 | G-Cloud buyer journey steps remain stable | CCS documentation monitored for changes; content reviewed quarterly |
| A5.11 | Partners will provide technical integration details for data model | Partner onboarding questionnaire includes tech stack fields |
| A5.12 | Cost ranges can be published without commercial sensitivity issues | Partners approve indicative ranges; ranges are broad enough to avoid issues |
| A5.13 | Direct award thresholds are standard across councils (typically £25k) | Guidance includes "check your own standing orders" disclaimer |
| A5.14 | Security certifications are verifiable and current | Partners provide certification dates; annual verification process |

### Open Questions

| ID | Question | Owner | Target Resolution |
|----|----------|-------|-------------------|
| OQ5.1 | Should we show different partners for different regions? | Product | Before Story 5.3 implementation |
| OQ5.2 | What is the process for partners to update their listings? | Operations | Before launch |
| OQ5.3 | Should we track outbound clicks to GOV.UK Forms partner contacts? | Analytics | Before Story 5.2 implementation |
| OQ5.4 | Do we need consent for localStorage session tracking? | Legal/Privacy | Before launch |
| OQ5.5 | Should the "Maybe" pathway include a follow-up email option? | Product | Deferred to Phase 2 |
| OQ5.6 | How do we handle councils that want to compare multiple scenarios? | UX | Before Story 5.1 implementation |
| OQ5.7 | Should GA4 Measurement ID be configurable per environment? | Tech Lead | Before Story 5.2 implementation |
| OQ5.8 | How do we obtain consent from peer councils to share their contact details? | Operations | Before Story 5.3 implementation |
| OQ5.9 | Should the readiness checklist block progression or just advise? | UX/Product | Before Story 5.1 implementation |
| OQ5.10 | What is the process to validate AWS Public Sector credits eligibility? | AWS Partner | Before launch |
| OQ5.11 | How do we verify partner security certifications are current? | Operations | Before Story 5.3 implementation |
| OQ5.12 | Should cost ranges be partner-provided or scenario-based averages? | Product/Finance | Before Story 5.1 implementation |
| OQ5.13 | Who creates and maintains the requirements specification templates? | Content/Tech | Before Story 5.3 implementation |
| OQ5.14 | Should finance committee brief be customizable or fixed template? | Product | Before Story 5.1 implementation |

### Technical Debt Considerations

| Item | Description | Remediation Plan |
|------|-------------|------------------|
| TD5.1 | Partner data is static (not API-driven) | Phase 2: Partner self-service portal or API integration |
| TD5.2 | G-Cloud links are hardcoded per scenario | Phase 2: Dynamic G-Cloud API integration |
| TD5.3 | Analytics depends on third-party GA4 | Monitor for alternatives; ensure graceful degradation |
| TD5.4 | No automated partner data validation | Add YAML schema validation in CI; scheduled link checking |
| TD5.5 | Session state in localStorage only | Phase 2: Optional account creation for cross-device persistence |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Responsibility |
|-------|-------|-------|----------------|
| **Unit Tests** | Analytics functions, session state, Eleventy filters | Jest | Developer |
| **Integration Tests** | Pathway logic, data cascade, localStorage persistence | Playwright | Developer |
| **E2E Tests** | Full user flow: evaluation → next steps → partner contact | Playwright | QA |
| **Accessibility Tests** | WCAG 2.2 AA compliance for all new pages | Axe DevTools, pa11y | Developer + QA |
| **Analytics Tests** | GA4 event validation | GA4 DebugView | Developer |
| **Link Validation** | G-Cloud URLs, partner form URLs | Custom CI script | Automated |

### Test Scenarios

#### Story 5.1: Next Steps Guidance Tests

```javascript
// test/next-steps-guidance.test.js
describe('Next Steps Guidance Component', () => {
  test('displays Proceed pathway when outcome is yes', async () => {
    localStorage.setItem('ndx_reflection_form', JSON.stringify({
      would_implement: 'yes'
    }));
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('.ndx-pathway--proceed')).toBeVisible();
    await expect(page.locator('text=You\'re Ready to Proceed')).toBeVisible();
  });

  test('displays Maybe pathway when outcome is maybe', async () => {
    localStorage.setItem('ndx_reflection_form', JSON.stringify({
      would_implement: 'maybe'
    }));
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('.ndx-pathway--maybe')).toBeVisible();
    await expect(page.locator('text=Need More Time to Decide?')).toBeVisible();
  });

  test('displays Not Now pathway when outcome is no', async () => {
    localStorage.setItem('ndx_reflection_form', JSON.stringify({
      would_implement: 'no'
    }));
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('.ndx-pathway--not-now')).toBeVisible();
    await expect(page.locator('text=Not the Right Fit?')).toBeVisible();
  });

  test('defaults to Maybe pathway when no outcome stored', async () => {
    localStorage.removeItem('ndx_reflection_form');
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('.ndx-pathway--maybe')).toBeVisible();
  });

  // Edge case tests
  test('shows incomplete evaluation banner when no evaluation data', async () => {
    localStorage.removeItem('ndx_reflection_form');
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('.ndx-incomplete-evaluation-banner')).toBeVisible();
    await expect(page.locator('text=complete your evaluation')).toBeVisible();
  });

  test('change decision link returns to evaluation page', async () => {
    localStorage.setItem('ndx_reflection_form', JSON.stringify({
      would_implement: 'yes'
    }));
    await page.goto('/next-steps/council-chatbot/');
    await page.click('[data-action="change-decision"]');
    await expect(page).toHaveURL(/\/scenarios\/council-chatbot.*evaluation/);
  });

  test('pathway works without JavaScript (progressive enhancement)', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto('/next-steps/council-chatbot/');
    // Core content should still be visible
    await expect(page.locator('h2:has-text("What\'s Next")')).toBeVisible();
    // Links should work
    const gcloudLink = page.locator('a[href*="digitalmarketplace"]');
    await expect(gcloudLink).toBeVisible();
  });

  test('page loads in under 2 seconds', async () => {
    const start = Date.now();
    await page.goto('/next-steps/council-chatbot/');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
```

#### Story 5.2: Analytics Framework Tests

```javascript
// test/analytics.test.js
describe('Analytics Framework', () => {
  let gtagCalls = [];

  beforeEach(() => {
    // Mock gtag
    window.gtag = (...args) => gtagCalls.push(args);
    gtagCalls = [];
  });

  test('fires next_steps_viewed on page load', async () => {
    await page.goto('/next-steps/council-chatbot/');
    await page.waitForTimeout(100); // Wait for event

    const viewEvent = gtagCalls.find(call =>
      call[0] === 'event' && call[1] === 'next_steps_viewed'
    );
    expect(viewEvent).toBeDefined();
    expect(viewEvent[2].scenario_id).toBe('council-chatbot');
  });

  test('fires gcloud_link_clicked on G-Cloud link click', async () => {
    await page.goto('/next-steps/council-chatbot/');
    await page.click('[data-track="gcloud"]');

    const clickEvent = gtagCalls.find(call =>
      call[0] === 'event' && call[1] === 'gcloud_link_clicked'
    );
    expect(clickEvent).toBeDefined();
    expect(clickEvent[2].scenario_id).toBe('council-chatbot');
  });

  test('fires partner_viewed on partner card click', async () => {
    await page.goto('/next-steps/council-chatbot/');
    await page.click('[data-track="partner"]');

    const viewEvent = gtagCalls.find(call =>
      call[0] === 'event' && call[1] === 'partner_viewed'
    );
    expect(viewEvent).toBeDefined();
    expect(viewEvent[2].partner_id).toBeDefined();
  });

  test('gracefully handles missing gtag', async () => {
    window.gtag = undefined;
    // Should not throw error
    await expect(page.goto('/next-steps/council-chatbot/')).resolves.not.toThrow();
  });
});
```

#### Story 5.3: Partner Integration Tests

```javascript
// test/partner-integration.test.js
describe('Partner Integration', () => {
  test('displays at least 2 partner cards per scenario', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const partnerCards = await page.locator('.ndx-partner-card').count();
    expect(partnerCards).toBeGreaterThanOrEqual(2);
  });

  test('partner card shows name, tier, and specializations', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const card = page.locator('.ndx-partner-card').first();

    await expect(card.locator('.govuk-heading-s')).toBeVisible(); // Name
    await expect(card.locator('text=AWS')).toBeVisible(); // Tier contains AWS
    await expect(card.locator('.govuk-list--bullet')).toBeVisible(); // Specializations
  });

  test('partner contact button links to GOV.UK Forms', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const contactButton = page.locator('[data-track="partner-contact"]').first();
    const href = await contactButton.getAttribute('href');

    expect(href).toContain('forms.service.gov.uk');
  });

  test('G-Cloud link opens in new tab with correct URL', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const gcloudLink = page.locator('[data-track="gcloud"]');

    const target = await gcloudLink.getAttribute('target');
    const href = await gcloudLink.getAttribute('href');

    expect(target).toBe('_blank');
    expect(href).toContain('digitalmarketplace.service.gov.uk');
  });

  test('case study expandable via Details component', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const details = page.locator('.govuk-details').first();

    // Initially closed
    await expect(details.locator('.govuk-details__text')).not.toBeVisible();

    // Click to open
    await details.locator('.govuk-details__summary').click();
    await expect(details.locator('.govuk-details__text')).toBeVisible();
  });

  // Edge case tests
  test('shows G-Cloud fallback when no partners available', async () => {
    // Test with a scenario that has no partners configured
    await page.goto('/next-steps/scenario-without-partners/');
    await expect(page.locator('.ndx-no-partners-fallback')).toBeVisible();
    await expect(page.locator('text=Search G-Cloud directly')).toBeVisible();
  });

  test('shows "I already have a partner" option', async () => {
    await page.goto('/next-steps/council-chatbot/');
    await expect(page.locator('[data-action="existing-partner"]')).toBeVisible();
    await page.click('[data-action="existing-partner"]');
    await expect(page.locator('.ndx-existing-partner-guidance')).toBeVisible();
  });
});
```

#### Accessibility Tests

```javascript
// test/accessibility.test.js
describe('Accessibility', () => {
  test('next steps page passes axe accessibility audit', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('partner cards are keyboard navigable', async () => {
    await page.goto('/next-steps/council-chatbot/');
    await page.keyboard.press('Tab');

    // Should be able to tab to partner contact button
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-track')
    );
    expect(['gcloud', 'partner', 'partner-contact']).toContain(focusedElement);
  });

  test('external links have appropriate ARIA attributes', async () => {
    await page.goto('/next-steps/council-chatbot/');
    const externalLinks = await page.locator('a[target="_blank"]');

    for (const link of await externalLinks.all()) {
      // Should indicate opens in new tab
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text.includes('opens in') || ariaLabel?.includes('new')).toBeTruthy();
    }
  });
});
```

### Test Data

```yaml
# test/_fixtures/session-data.yaml
proceed_session:
  would_implement: "yes"
  likelihood_proceed: 5
  scenario_id: "council-chatbot"
  persona: "cto"

maybe_session:
  would_implement: "maybe"
  likelihood_proceed: 3
  scenario_id: "council-chatbot"
  persona: "service-manager"

not_now_session:
  would_implement: "no"
  likelihood_proceed: 1
  scenario_id: "council-chatbot"
  persona: "finance"

# test/_fixtures/partners.yaml
test_partners:
  - id: test-partner-001
    name: "Test Partner One"
    tier: "AWS Premier Partner"
    gcloud_supplier_id: "12345"
    specializations:
      - "Local Government"
      - "AI/ML"
    contact:
      form_url: "https://forms.service.gov.uk/test-partner-001"
```

### CI/CD Integration

```yaml
# .github/workflows/test-epic-5.yml
name: Epic 5 Tests
on:
  push:
    paths:
      - 'src/_includes/components/next-steps*.njk'
      - 'src/_includes/components/partner*.njk'
      - 'src/_data/partners.yaml'
      - 'src/_data/pathways.yaml'
      - 'src/assets/js/analytics.js'
      - 'src/next-steps/**'
      - 'test/**/epic-5*.test.js'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --grep "Epic 5"

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e -- --grep "next steps"

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:a11y -- --sitemap _site/sitemap.xml --include "/next-steps/*"

  link-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: node scripts/validate-external-links.js
```

### Acceptance Test Checklist

- [ ] Next Steps pages exist for all 6 scenarios
- [ ] Pathway displays correctly based on would_implement value
- [ ] Proceed pathway shows G-Cloud link and partner cards
- [ ] Maybe pathway shows explore and expert options
- [ ] Not Now pathway shows feedback form and related scenarios
- [ ] Analytics events fire correctly (verified in GA4 DebugView)
- [ ] Session state persists across page navigation
- [ ] Partner cards display all required fields
- [ ] Partner contact buttons link to GOV.UK Forms
- [ ] G-Cloud links open Digital Marketplace with correct search
- [ ] External links open in new tab with appropriate indicators
- [ ] All pages pass WCAG 2.2 AA accessibility (axe scan)
- [ ] Keyboard navigation works throughout
- [ ] Page loads in <2 seconds (Lighthouse)
- [ ] Graceful degradation when localStorage unavailable
- [ ] Graceful degradation when GA4 blocked

**Edge Case Checklist:**
- [ ] Incomplete evaluation banner displays when no evaluation data
- [ ] "Change my decision" link returns to evaluation correctly
- [ ] "Share with decision-maker" generates email/print view
- [ ] Readiness-aware CTA changes based on checklist score
- [ ] "Not a council?" pathway accessible and provides relevant guidance
- [ ] All pathways functional without JavaScript enabled
- [ ] "Prepare for committee" resource pack downloadable
- [ ] "Start with a pilot" guidance visible on Proceed pathway
- [ ] G-Cloud fallback displays when no partners available
- [ ] "I already have a partner" path provides implementation guidance

**Stakeholder-Specific Checklist:**
- [ ] Technical compatibility checklist visible for IT leads
- [ ] Indicative cost range displays before G-Cloud link
- [ ] TCO guidance section expandable with hidden cost details
- [ ] Finance committee brief PDF downloadable
- [ ] Direct award vs competition guidance visible
- [ ] Procurement timeline guidance visible
- [ ] "Time to value" badge displays per scenario
- [ ] Change management checklist downloadable
- [ ] Partner cards show tech stack/integrations
- [ ] Partner cards show security certification badges
- [ ] Requirements spec templates downloadable per scenario
- [ ] Partner cards show implementation duration
