# Epic Technical Specification: Screenshot Content Population

Date: 2025-11-29
Author: Claude Code
Epic ID: 13
Status: Ready for Implementation

---

## Overview

Epic 13 delivers the core value of the v1.5 extension: **real AWS Console screenshots integrated into every walkthrough step**. Building on Sprint 0's automated screenshot capture infrastructure, this epic creates the components, data structures, and integrations needed to display contextually relevant screenshots throughout the portal.

The core user value is: **"I can see exactly what the AWS Console looks like for each step, helping me follow along and understand what to expect."** This transforms abstract walkthrough instructions into visual, confidence-building guidance.

**Key Insight from PRD:** Screenshot content is the primary deliverable of v1.5 - without real console screenshots, walkthroughs remain theoretical. Sprint 0 built the capture pipeline; Epic 13 surfaces that content to users.

This epic implements **FRs 124-128, 146-148**, delivering:
- **Screenshot Component**: Reusable Nunjucks component with metadata display
- **Data Configuration**: Per-scenario YAML files defining screenshot mappings
- **6 Scenario Integrations**: All walkthroughs updated with real screenshots
- **Lightbox Zoom**: Click-to-expand for detailed examination
- **Fallback Handling**: Graceful degradation when screenshots unavailable

**Strategic Positioning:** Epic 13 is the "show don't tell" phase - transforming walkthrough text into visual experiences that build confidence.

## Objectives and Scope

### In Scope

- **Screenshot Component** (`/src/_includes/components/screenshot.njk`): New component displaying screenshot with metadata including:
  - Responsive `<picture>` element with WebP + PNG fallback
  - Caption display below image
  - Alt text for accessibility
  - Click-to-zoom trigger
  - Loading state/skeleton
  - S3 URL construction from scenario/filename

- **Screenshot Data Files**: Per-scenario YAML at `/src/_data/screenshots/{scenario}.yaml`:
  - council-chatbot.yaml (~25 screenshots)
  - planning-ai.yaml (~25 screenshots)
  - foi-redaction.yaml (~20 screenshots)
  - smart-car-park.yaml (~25 screenshots)
  - text-to-speech.yaml (~20 screenshots)
  - quicksight-dashboard.yaml (~25 screenshots)

- **Walkthrough Integration**: All 6 scenarios updated:
  - 4-5 walkthrough steps per scenario
  - 4 explore pages per scenario (architecture, experiments, limits, production)
  - ~120-150 total screenshot placements

- **Lightbox Component** (`/src/_includes/components/lightbox.njk`):
  - Native `<dialog>` element implementation
  - Full-screen image display
  - Keyboard navigation (Escape to close)
  - Focus trapping and return
  - Mobile pinch-to-zoom support

- **Fallback Handling**:
  - Scenario-specific placeholder SVGs
  - "Screenshot updating" message
  - Layout stability (no CLS)
  - Analytics tracking for fallback displays

### Out of Scope

- Screenshot capture/generation (Sprint 0)
- Screenshot optimization/WebP conversion (Story 16.4)
- Alt text quality audit (Story 16.1)
- Annotation overlays (Story 16.2)

### Phase 2 Commitments

- Dynamic screenshot loading based on AWS account state
- Screenshot comparison (before/after)
- User-submitted screenshots
- Screenshot versioning UI

### Scope Prioritization

**P1 - Launch Blockers:**
- Screenshot component with S3 integration
- Council Chatbot walkthrough screenshots (reference implementation)
- Lightbox zoom functionality
- Basic fallback handling

**P2 - Launch Enhancers:**
- All 6 scenario integrations
- Explore page screenshots
- Analytics integration

**P3 - Fast Follow:**
- Advanced fallback with admin notification
- Screenshot loading optimization

## System Architecture Alignment

### Architecture Components Referenced

| Decision | Component | Epic 13 Implementation |
|----------|-----------|----------------------|
| ADR-1: Portal Model | Static Site (Eleventy) | Screenshot URLs resolved at build time from YAML data |
| ADR-4: Client-Side JS | Vanilla JavaScript | Lightbox interactions, fallback detection |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Figure/figcaption patterns, button styles |
| Sprint 0: S3 Bucket | Screenshot Storage | URL pattern: `https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current/{scenario}/{filename}` |

### Screenshot Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCREENSHOT COMPONENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  BUILD TIME (Eleventy)                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ /src/_data/screenshots/{scenario}.yaml                          │     │
│  │ ┌──────────────────────────────────────────────────────────┐   │     │
│  │ │ scenario: council-chatbot                                  │   │     │
│  │ │ steps:                                                     │   │     │
│  │ │   step-1:                                                  │   │     │
│  │ │     screenshots:                                           │   │     │
│  │ │       - id: bedrock-overview                               │   │     │
│  │ │         filename: bedrock-agent-overview.png               │   │     │
│  │ │         alt: "Bedrock agent configuration..."              │   │     │
│  │ │         caption: "The Bedrock agent powers..."             │   │     │
│  │ └──────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                            │
│                              ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ /src/_includes/components/screenshot.njk                        │     │
│  │ ┌──────────────────────────────────────────────────────────┐   │     │
│  │ │ Input: scenario, step, screenshotId                        │   │     │
│  │ │ Output: <figure> with <picture>, <figcaption>              │   │     │
│  │ │ - Builds S3 URL from parameters                            │   │     │
│  │ │ - Includes lightbox trigger                                │   │     │
│  │ │ - Handles srcset for responsive images                     │   │     │
│  │ └──────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  RUNTIME (Browser)                                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ /src/assets/js/lightbox.js                                      │     │
│  │ - Opens <dialog> on click                                       │     │
│  │ - Manages focus trap                                            │     │
│  │ - Handles Escape key                                            │     │
│  │ - Returns focus on close                                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  S3 BUCKET (Sprint 0)                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ndx-try-screenshots.s3.us-west-2.amazonaws.com                  │     │
│  │ /current/{scenario}/{filename}                                  │     │
│  │ /archive/{date}/{scenario}/{filename}                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### S3 URL Pattern

```
Base URL: https://ndx-try-screenshots.s3.us-west-2.amazonaws.com
Current:  /current/{scenario}/{filename}
Archive:  /archive/{YYYY-MM-DD}/{scenario}/{filename}

Example: /current/council-chatbot/bedrock-agent-overview.png
```

## Story Dependencies and Order

```
13.1 (Screenshot Component) ──┬──► 13.2 (Data Files)
                              │
                              ├──► 13.9 (Lightbox)
                              │
                              └──► 13.10 (Fallback)

13.2 (Data Files) ──┬──► 13.3 (Council Chatbot)
                    │
                    ├──► 13.4 (Planning AI)
                    │
                    ├──► 13.5 (FOI Redaction)
                    │
                    ├──► 13.6 (Smart Car Park)
                    │
                    ├──► 13.7 (Text-to-Speech)
                    │
                    └──► 13.8 (QuickSight)
```

**Recommended Implementation Order:**
1. Story 13.1 - Screenshot Component (foundation)
2. Story 13.9 - Lightbox Component (UX enhancement)
3. Story 13.2 - Data Files (configuration)
4. Story 13.3 - Council Chatbot Integration (reference implementation)
5. Stories 13.4-13.8 - Other Scenario Integrations (parallel)
6. Story 13.10 - Fallback Handling (polish)

## Technical Decisions

### TD-13.1: New Component vs Extending walkthrough-step.njk

**Decision:** Create new `screenshot.njk` component, not extend walkthrough-step.njk

**Rationale:**
- Screenshot display needed in multiple contexts (steps, explore pages, galleries)
- Separation of concerns: walkthrough-step handles step logic, screenshot handles image display
- Reusability: screenshot component can be used standalone
- Testing: easier to test isolated component

### TD-13.2: Native `<dialog>` for Lightbox

**Decision:** Use native HTML `<dialog>` element for lightbox modal

**Rationale:**
- Native accessibility support (focus trapping, escape key)
- No JavaScript library dependency
- Browser support excellent (97%+ as of 2024)
- Aligns with existing phase-navigator.njk pattern (confirmation modal)

### TD-13.3: YAML Data Structure

**Decision:** Per-scenario YAML files with nested step structure

**Rationale:**
- Maintainability: Changes to one scenario don't affect others
- Build performance: Only parse relevant data per page
- Git history: Clear change attribution per scenario
- IDE support: YAML schema validation possible

### TD-13.4: S3 URL Construction

**Decision:** Build URLs at template render time (not runtime JavaScript)

**Rationale:**
- SEO: Real URLs in HTML for crawlers
- Caching: Browser can prefetch/cache images
- Simplicity: No JavaScript required for basic display
- Fallback detection can happen at load time

## File Structure

```
/src/
├── _data/
│   └── screenshots/
│       ├── council-chatbot.yaml
│       ├── planning-ai.yaml
│       ├── foi-redaction.yaml
│       ├── smart-car-park.yaml
│       ├── text-to-speech.yaml
│       └── quicksight-dashboard.yaml
├── _includes/
│   └── components/
│       ├── screenshot.njk          # New
│       └── lightbox.njk            # New
├── assets/
│   ├── css/
│   │   ├── _screenshot.scss        # New
│   │   └── _lightbox.scss          # New
│   ├── js/
│   │   └── lightbox.js             # New
│   └── images/
│       └── fallbacks/
│           ├── council-chatbot.svg
│           ├── planning-ai.svg
│           ├── foi-redaction.svg
│           ├── smart-car-park.svg
│           ├── text-to-speech.svg
│           └── quicksight-dashboard.svg
└── walkthroughs/
    └── {scenario}/
        ├── step-{n}.njk            # Updated
        └── explore/
            ├── architecture.njk     # Updated
            ├── experiments.njk      # Updated
            ├── limits.njk           # Updated
            └── production.njk       # Updated
```

## Component Specifications

### Screenshot Component (`screenshot.njk`)

```nunjucks
{#
  Screenshot Component (Story 13.1)

  Usage:
    {% set screenshotData = screenshots[scenario].steps[step].screenshots | first %}
    {% include "components/screenshot.njk" %}

  Or with explicit parameters:
    {% include "components/screenshot.njk" with {
      scenario: "council-chatbot",
      filename: "bedrock-overview.png",
      alt: "Bedrock agent configuration",
      caption: "The Bedrock agent powers natural language understanding"
    } %}
#}

{% set baseUrl = "https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current" %}
{% set imgUrl = baseUrl + "/" + scenario + "/" + filename %}

<figure class="ndx-screenshot" data-screenshot>
  <button type="button"
          class="ndx-screenshot__trigger"
          data-lightbox-trigger
          aria-label="View larger image: {{ alt }}">
    <picture>
      <source srcset="{{ imgUrl | replace('.png', '.webp') }}" type="image/webp">
      <img src="{{ imgUrl }}"
           alt="{{ alt }}"
           loading="lazy"
           class="ndx-screenshot__image"
           data-fallback="{{ '/assets/images/fallbacks/' + scenario + '.svg' }}"
           onerror="this.onerror=null; this.src=this.dataset.fallback;">
    </picture>
    <span class="ndx-screenshot__zoom-hint" aria-hidden="true">
      Click to enlarge
    </span>
  </button>
  {% if caption %}
  <figcaption class="ndx-screenshot__caption">{{ caption }}</figcaption>
  {% endif %}
</figure>
```

### Lightbox Component (`lightbox.njk`)

```nunjucks
{#
  Lightbox Component (Story 13.9)

  Single instance at page bottom, populated by JavaScript
#}

<dialog id="lightbox-modal" class="ndx-lightbox" aria-labelledby="lightbox-title">
  <div class="ndx-lightbox__content">
    <button type="button"
            class="ndx-lightbox__close"
            data-lightbox-close
            aria-label="Close image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
    <figure class="ndx-lightbox__figure">
      <img src="" alt="" class="ndx-lightbox__image" id="lightbox-image">
      <figcaption class="ndx-lightbox__caption" id="lightbox-caption"></figcaption>
    </figure>
  </div>
</dialog>
```

## Testing Strategy

### Unit Tests

- Screenshot component renders with all parameters
- S3 URL construction produces valid URLs
- Alt text and caption display correctly
- Fallback image loads on error

### Integration Tests

- Lightbox opens on click
- Lightbox closes on Escape
- Focus returns to trigger on close
- Images load from S3 bucket

### Accessibility Tests

- All screenshots have alt text
- Lightbox keyboard navigable
- Focus trap works correctly
- Screen reader announces image content

### Visual Regression Tests

- Screenshot component appearance
- Lightbox modal appearance
- Responsive behavior at breakpoints
- Fallback placeholder appearance

## Story Point Estimates

| Story | Description | Points |
|-------|-------------|--------|
| 13.1 | Screenshot Component | 5 |
| 13.2 | Data Files for 6 Scenarios | 8 |
| 13.3 | Council Chatbot Integration | 5 |
| 13.4 | Planning AI Integration | 5 |
| 13.5 | FOI Redaction Integration | 5 |
| 13.6 | Smart Car Park Integration | 5 |
| 13.7 | Text-to-Speech Integration | 5 |
| 13.8 | QuickSight Integration | 5 |
| 13.9 | Lightbox Component | 5 |
| 13.10 | Fallback Handling | 3 |
| **Total** | | **51** |

## Acceptance Criteria Summary

- [ ] Screenshot component displays images from S3
- [ ] All 6 scenario YAML data files created (~120-150 screenshots)
- [ ] All walkthrough steps show relevant screenshots
- [ ] All explore pages show relevant screenshots
- [ ] Lightbox opens on click, closes on Escape
- [ ] Fallback displays when screenshot unavailable
- [ ] Alt text present on all images
- [ ] Captions display below screenshots
- [ ] Mobile responsive behavior correct
- [ ] No layout shift (CLS) on image load

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| S3 bucket not accessible | Use CloudFront CDN with failover |
| Screenshots out of date | Sprint 0 pipeline runs weekly |
| Large image sizes | WebP with quality optimization (Story 16.4) |
| Missing alt text | Audit in Story 16.1 before launch |
