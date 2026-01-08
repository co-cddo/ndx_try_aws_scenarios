# Epic Technical Specification: Navigation & Sample Data Clarity

Date: 2025-11-29
Author: cns
Epic ID: 12
Status: Draft

---

## Overview

Epic 12 addresses two critical UX gaps identified during post-implementation user feedback: **navigation disconnection** between scenario phases (TRY → WALK THROUGH → EXPLORE) and **sample data confusion** around "Re-seed" functionality. This epic implements a persistent phase navigator component and contextual sample data explanation panels across all 18+ scenario, walkthrough, and exploration pages.

The implementation follows the static-first architecture philosophy established in Epic 1-5, using client-side JavaScript for progressive enhancement and GOV.UK Frontend components for accessibility compliance. All features degrade gracefully when JavaScript is disabled.

## Objectives and Scope

### In Scope

- **FR100**: Phase Navigator Component - horizontal progress indicator showing three-phase journey
- **FR101**: Sample Data Explanation Panels - GOV.UK Details component with contextual data explanations
- **FR106**: Journey Progress Analytics - events for phase changes and completion tracking
- Reusable Nunjucks component (`phase-navigator.njk`) applicable to 18+ pages
- Mobile-responsive design with sticky bottom bar for viewports <768px
- URL parameter state management for shareable progress
- Skeleton loading states and noscript fallback
- WCAG 2.1 AA accessibility compliance

### Out of Scope

- **FR102** (Enhanced Static Data Presets) - DEFERRED to Phase 2 per First Principles analysis
- **FR103-105** (Lambda-based data generation) - DEFERRED to Phase 2/3 conditional implementation
- Changes to CloudFormation templates or deployment flows
- Backend infrastructure or API endpoints (static-first preserved)

## System Architecture Alignment

Epic 12 integrates with the existing static-first architecture (Architecture Doc Sections 1-16):

**Portal Integration:**
- New Nunjucks component: `src/_includes/components/phase-navigator.njk`
- New data file: `src/_data/phase-config.yaml` for phase definitions
- Extension to `analytics.js` for new events
- CSS additions following BEM naming: `ndx-phase-navigator`, `ndx-sample-data-panel`

**State Management:**
- URL parameters (primary): `?phase=try&completed=try,walkthrough`
- sessionStorage (backup): Fallback when URL manipulation not possible
- No backend required - maintains static-first philosophy

**Design System:**
- GOV.UK Frontend Step-by-step navigation pattern as reference
- GOV.UK Details component for sample data explanations
- Touch targets minimum 44x44px per mobile accessibility guidelines

---

## Detailed Design

### Services and Modules

| Module | Responsibility | Location | Owner |
|--------|---------------|----------|-------|
| Phase Navigator Component | Render phase progress, handle state transitions | `_includes/components/phase-navigator.njk` | Frontend |
| Phase State Manager | URL param read/write, sessionStorage sync | `assets/js/phase-state.js` | Frontend |
| Sample Data Panel Component | Render explanation details per scenario | `_includes/components/sample-data-panel.njk` | Frontend |
| Analytics Extension | Track journey events | `assets/js/analytics.js` (extended) | Frontend |
| Phase Configuration | Define phases, times, benefits per scenario | `_data/phase-config.yaml` | Content |

### Data Models and Contracts

**Phase Configuration Schema (`src/_data/phase-config.yaml`):**
```yaml
phases:
  - id: try
    label: "TRY"
    sublabel: "Deploy & Experience"
    time: "5 min"
    benefit: "See it work in your AWS account"
    order: 1
  - id: walkthrough
    label: "WALK THROUGH"
    sublabel: "Guided Demo"
    time: "10 min"
    benefit: "Follow step-by-step guidance"
    order: 2
  - id: explore
    label: "EXPLORE"
    sublabel: "Go Deeper"
    time: "15+ min"
    benefit: "Experiment and understand"
    order: 3
    optional: true
    fork: true

costReassurance: "This demo costs nothing to deploy"

scenarios:
  council-chatbot:
    phases: [try, walkthrough, explore]
    evidencePackPhase: walkthrough
  # ... other scenarios
```

**Sample Data Configuration Extension (`src/_data/sample-data-config.yaml`):**
```yaml
sampleData:
  council-chatbot:
    title: "Council Chatbot Sample Data"
    summary: "About this sample data"
    description: "Simulated council FAQ data for demonstration"
    purpose: "Pre-loaded so you can explore immediately without setup"
    reseedAction: "Resets conversation history to fresh starting state"
    costIndicator: "✓ Free - no AWS charges for this action"
    methodology: "Generated from anonymized GOV.UK content patterns"
  # ... other scenarios
```

**URL State Schema:**
```
?phase=walkthrough&completed=try&scenario=council-chatbot&started=1732873200000
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `phase` | string | Current active phase (try/walkthrough/explore) |
| `completed` | string | Comma-separated completed phases |
| `scenario` | string | Current scenario ID |
| `started` | number | Phase start timestamp (milliseconds) |

### APIs and Interfaces

**No REST APIs** - static-first architecture preserved.

**JavaScript API (phase-state.js):**

```typescript
interface PhaseState {
  currentPhase: 'try' | 'walkthrough' | 'explore';
  completedPhases: string[];
  scenario: string;
  startedAt: number;
}

// Read state from URL or sessionStorage
function getPhaseState(): PhaseState;

// Update state (writes to URL and sessionStorage)
function setPhaseState(state: Partial<PhaseState>): void;

// Mark current phase as completed and advance
function completePhase(): void;

// Check if stack is expired (90 minutes from started)
function isStackExpired(): boolean;

// Get shareable URL with current state
function getShareableUrl(): string;
```

### Workflows and Sequencing

**User Journey Flow:**

```
1. User lands on Scenario Page
   └── Phase Navigator shows: TRY (active) | WALK THROUGH | EXPLORE
       └── Cost reassurance: "This demo costs nothing to deploy"

2. User clicks "Deploy" → CloudFormation Console
   └── Navigator updates: TRY (in progress)
       └── Time remaining shown during deployment

3. Deployment completes
   └── Navigator updates: TRY ✓ | WALK THROUGH (active) | EXPLORE
       └── Transition CTA: "Great! Now let's walk through what you just deployed"

4. User completes walkthrough
   └── Navigator shows branching visual:
       └── Main path: "Generate Evidence Pack" (primary CTA)
       └── Fork: "Go Deeper" (EXPLORE) - optional continuation

5. User selects Evidence Pack OR Explore
   └── If Evidence Pack: Exit to Epic 4 flow
   └── If Explore: Navigator updates: TRY ✓ | WALK THROUGH ✓ | EXPLORE (active)
```

**Parallel Entry Handling:**

```
1. User navigates directly to /walkthroughs/council-chatbot/
   └── Phase state checked: phase=undefined, completed=[]

2. No TRY phase completed detected
   └── Navigator shows: TRY (not started) | WALK THROUGH | EXPLORE
       └── Prompt: "To get the full experience, start by deploying the demo"
       └── CTA: "Start Journey" → Scenario page

3. User can still browse walkthrough (read-only)
   └── Live functionality requires deployment
```

**Stale Session Handling:**

```
1. User returns after 90+ minutes (stack expired)
   └── Check: Date.now() - startedAt > 90 * 60 * 1000

2. If expired:
   └── Navigator shows: "Your demo environment has expired"
       └── Options:
           ├── "Re-deploy" → Restart from TRY phase
           └── "Continue without deployment" → Zero-deployment path (screenshots)
```

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Navigator render time | <100ms | Inline critical CSS, deferred JS |
| Page load impact | <50KB added | Minified CSS/JS, no external dependencies |
| Layout shift | CLS < 0.1 | Skeleton placeholder with fixed dimensions |
| Mobile interaction | <100ms response | Native click handlers, no framework overhead |

### Security

| Requirement | Implementation |
|-------------|----------------|
| No sensitive data in URL | Phase state only (no PII) |
| XSS prevention | Template escaping via Nunjucks |
| No external requests | All state local (URL/sessionStorage) |
| CSP compatible | Inline styles in <style> tag, no eval() |

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| JavaScript disabled | Noscript message + static links functional |
| sessionStorage unavailable | URL-only fallback |
| Corrupted state | Default to TRY phase, clear invalid params |
| Network offline | Static content remains accessible |

### Observability

| Event | Data Captured | Purpose |
|-------|---------------|---------|
| `journey_phase_changed` | scenario_id, from_phase, to_phase, timestamp | Track phase transitions |
| `journey_drop_off` | scenario_id, phase, timestamp, completion_percent | Identify abandonment points |
| `journey_completed` | scenario_id, total_time, path_taken | Measure completion rate (>60% target) |

---

## Dependencies and Integrations

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| eleventy | ^3.0.0 | Build-time template processing |
| govuk-frontend | ^5.13.0 | Design system components |
| @x-gov/eleventy-plugin-govuk-frontend | ^1.0.0 | GOV.UK Eleventy integration |

### Integration Points

| System | Integration Type | Details |
|--------|-----------------|---------|
| Epic 1 (Portal Foundation) | Template extension | Navigator added to base layout |
| Epic 2 (Deployment) | State detection | Read deployment progress events |
| Epic 3 (Walkthroughs) | Navigation update | Add navigator to all walkthrough pages |
| Epic 6-11 (Exploration) | Phase completion | Explore phase triggers from navigator |
| Analytics (FR33) | Event extension | New journey_* events added |

---

## Acceptance Criteria (Authoritative)

### Story 12.1: Phase Navigator Component

| AC# | Criterion | Test Method |
|-----|-----------|-------------|
| AC1 | Navigator displays TRY, WALK THROUGH, EXPLORE with time estimates | Visual inspection |
| AC2 | Current phase shows "You are here" indicator | Visual + ARIA check |
| AC3 | Completed phases show checkmark with "completed" ARIA label | Screen reader test |
| AC4 | Cost reassurance "This demo costs nothing to deploy" appears first | Content verification |
| AC5 | Scenario cards show "3 phases" badge and "Start Free Journey · 15 min" CTA | Visual inspection |
| AC6 | Navigator appears on deployment progress page with real-time updates | Integration test |
| AC7 | Branching visual shows Evidence Pack as main path, Explore as fork | Visual inspection |
| AC8 | Transition CTA appears at walkthrough completion with benefit text | User flow test |
| AC9 | Parallel entry detection prompts "Start from TRY phase" | Direct URL access test |
| AC10 | Stale session (>90 min) shows expired state with re-deploy option | Time manipulation test |
| AC11 | Mobile (<768px) shows sticky bottom bar with 44x44px touch targets | Device testing |
| AC12 | Navigator uses `<nav role="navigation" aria-label="Journey progress">` | ARIA audit |
| AC13 | Current phase has `aria-current="step"` | ARIA audit |
| AC14 | Keyboard navigation works through all phases | Tab navigation test |
| AC15 | Colour is not the only state indicator (icons + text used) | Visual + contrast test |
| AC16 | Noscript shows "Enable JavaScript for journey tracking" | JS disabled test |
| AC17 | Skeleton screens prevent layout shift during load | CLS measurement |
| AC18 | `journey_phase_changed` and `journey_drop_off` events fire correctly | Analytics verification |

### Story 12.2: Sample Data Explanation Panels

| AC# | Criterion | Test Method |
|-----|-----------|-------------|
| AC19 | GOV.UK Details component with "About this sample data" summary | Visual inspection |
| AC20 | Key information visible (not collapsed by default) | Default state check |
| AC21 | Panels positioned within visual proximity of data/Re-seed buttons | Layout verification |
| AC22 | Content explains: realistic but fictional, what it represents, no real council connection | Content review |
| AC23 | Consistent terminology across all 6 scenarios | Cross-scenario audit |
| AC24 | WCAG 2.1 AA compliance for expand/collapse | Axe/WAVE audit |
| AC25 | Keyboard operation fully supported | Tab + Enter test |

---

## Traceability Mapping

| AC# | FR# | Component | Test Type |
|-----|-----|-----------|-----------|
| AC1-AC8 | FR100 | phase-navigator.njk | Integration |
| AC9-AC10 | FR100 | phase-state.js | Unit + Integration |
| AC11-AC17 | FR100 | CSS + JS | Accessibility + Performance |
| AC18 | FR106 | analytics.js | Analytics verification |
| AC19-AC25 | FR101 | sample-data-panel.njk | Integration + Accessibility |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| URL state conflicts with existing query params | Low | Medium | Use `ndx_` prefix for all params |
| Mobile bottom bar overlaps content | Medium | Medium | Add safe area insets + content padding |
| Analytics events not captured by existing pipeline | Low | High | Verify event schema compatibility |

### Assumptions

- Existing analytics infrastructure (FR33) supports new event types
- GOV.UK Step-by-step pattern licensing allows adaptation
- All 18+ target pages have consistent layout structure for navigator injection

### Open Questions

| Question | Decision Needed By | Owner |
|----------|-------------------|-------|
| Should navigator persist in header on scroll or be viewport-fixed? | Story 12.1 start | UX |
| What happens if user bookmarks mid-walkthrough URL? | Story 12.1 start | Dev |

---

## Test Strategy Summary

### Test Levels

| Level | Coverage | Tools |
|-------|----------|-------|
| Unit | phase-state.js functions | Jest |
| Integration | Component rendering, state sync | Playwright |
| Accessibility | WCAG 2.1 AA compliance | Axe, WAVE, manual screen reader |
| Visual Regression | Navigator appearance across viewports | Playwright screenshots |
| Performance | Load time, CLS, interaction latency | Lighthouse |

### Test Coverage of ACs

- AC1-AC8: Integration tests via Playwright
- AC9-AC10: Unit tests + Integration tests
- AC11-AC17: Accessibility audit + Performance measurement
- AC18: Analytics event verification
- AC19-AC25: Integration tests + Accessibility audit

### Edge Cases

| Scenario | Expected Behavior | Test Method |
|----------|-------------------|-------------|
| localStorage disabled | URL-only state management | Browser settings test |
| Very long scenario names | Text truncation with tooltip | Visual inspection |
| Rapid phase transitions | Debounced event firing | Automated rapid clicking |
| Browser back/forward | State synchronized | History navigation test |
| Multiple tabs same scenario | Independent state per tab | Multi-tab test |
