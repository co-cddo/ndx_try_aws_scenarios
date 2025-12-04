# Epic Technical Specification: Scenario-Walkthrough Linking

Date: 2025-11-29
Author: Claude Code
Epic ID: 15
Status: Ready for Implementation

---

## Overview

Epic 15 creates bidirectional connections between scenario pages and their walkthroughs, with progress tracking that persists across sessions. This epic bridges the gap between scenario discovery (Epic 1) and walkthrough engagement (Epic 13-14), ensuring users can seamlessly transition between learning about a scenario and experiencing it hands-on.

The core user value is: **"I can start a walkthrough directly from any scenario page, resume where I left off, and get intelligent recommendations for what to explore next."** This addresses the friction of disconnected navigation between scenario descriptions and hands-on experiences.

**Key Insight from PRD:** Bidirectional linking maximizes screenshot exposure - when users view a scenario, they should be one click away from the visual walkthrough experience.

This epic implements **FRs 137-140**, delivering:
- **"Start Walkthrough" CTA**: Prominent button on scenario pages
- **Progress Tracking**: localStorage-based persistence across sessions
- **Completion Page Links**: Clear next steps with evidence pack integration
- **Gallery Badges**: Walkthrough availability indicators on scenario cards
- **Cross-Scenario Recommendations**: Intelligent suggestions based on completion history

**Strategic Positioning:** Epic 15 is the "connection" phase - ensuring every entry point leads users toward screenshot-rich experiences.

## Objectives and Scope

### In Scope

- **"Start Walkthrough" CTA** on scenario detail pages:
  - Position after description, before deployment section
  - GOV.UK green button styling
  - Shows step count (e.g., "Start walkthrough (5 steps)")
  - "Continue" state if previously started
  - Analytics tracking on click

- **Progress Tracking** via localStorage:
  - Schema: `ndx_walkthrough_progress`
  - Per-scenario tracking (current step, completed steps, timestamps)
  - Progress indicator on scenario page
  - "Clear progress" with confirmation
  - Graceful degradation when localStorage unavailable

- **Completion Page Enhancements**:
  - Success message with summary
  - Primary CTA: "Generate Evidence Pack"
  - Secondary: "Return to {Scenario}"
  - Tertiary: "Try another scenario"
  - Completion analytics event

- **Scenario Gallery Badges**:
  - "Walkthrough available" badge on cards
  - Step count indicator
  - Play icon overlay
  - Direct link to walkthrough from badge

- **Cross-Scenario Recommendations**:
  - 2-3 personalized suggestions on completion
  - Based on: quiz results > category match > completion history
  - Excludes already-completed walkthroughs
  - "All complete" celebration state

### Out of Scope

- Cross-device progress sync (localStorage only)
- Partial step completion tracking (page-level only)
- Time spent tracking
- Social sharing of progress

### Phase 2 Commitments

- Cloud sync of progress (optional account)
- Progress comparison with peers
- Achievement badges/gamification
- Resumable bookmarks within steps

### Scope Prioritization

**P1 - Launch Blockers:**
- "Start Walkthrough" CTA on scenario pages
- Basic progress tracking (localStorage)
- Completion page with evidence pack link

**P2 - Launch Enhancers:**
- Progress indicator display
- Cross-scenario recommendations
- Gallery badges

**P3 - Fast Follow:**
- Recommendation personalization from quiz
- "Clear progress" functionality
- All-complete celebration

## System Architecture Alignment

### Architecture Components Referenced

| Decision | Component | Epic 15 Implementation |
|----------|-----------|----------------------|
| ADR-4: Client-Side JS | Vanilla JavaScript | Progress tracking, recommendations |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Buttons, badges, progress indicators |
| Existing: phase-state.js | localStorage pattern | Extend for walkthrough progress |
| Existing: analytics.js | Event tracking | Add walkthrough events |

### Progress Tracking Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROGRESS TRACKING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  localStorage Schema: "ndx_walkthrough_progress"                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ {                                                                │     │
│  │   "council-chatbot": {                                          │     │
│  │     "currentStep": 3,                                           │     │
│  │     "totalSteps": 4,                                            │     │
│  │     "completedSteps": [1, 2],                                   │     │
│  │     "startedAt": "2025-11-29T14:00:00Z",                        │     │
│  │     "lastVisited": "2025-11-29T14:30:00Z",                      │     │
│  │     "completed": false                                           │     │
│  │   },                                                             │     │
│  │   "planning-ai": {                                               │     │
│  │     "currentStep": 5,                                           │     │
│  │     "totalSteps": 4,                                            │     │
│  │     "completedSteps": [1, 2, 3, 4],                             │     │
│  │     "startedAt": "2025-11-28T10:00:00Z",                        │     │
│  │     "lastVisited": "2025-11-28T11:00:00Z",                      │     │
│  │     "completed": true,                                           │     │
│  │     "completedAt": "2025-11-28T11:00:00Z"                       │     │
│  │   }                                                              │     │
│  │ }                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  SCENARIO PAGE                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ┌──────────────────────────────────────────────────────────┐   │     │
│  │ │                     Progress Indicator                     │   │     │
│  │ │  ████████████░░░░░░░░░░░░ 50% complete (Step 2 of 4)     │   │     │
│  │ └──────────────────────────────────────────────────────────┘   │     │
│  │                                                                 │     │
│  │ ┌────────────────────┐  ┌────────────────────┐                │     │
│  │ │ Continue Walkthrough│  │ Restart from start │                │     │
│  │ │    (Step 3 of 4)    │  │                    │                │     │
│  │ └────────────────────┘  └────────────────────┘                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  WALKTHROUGH PAGE                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ On page load:                                                   │     │
│  │   1. Read current step from URL path                            │     │
│  │   2. Update localStorage with current step                      │     │
│  │   3. Mark previous steps as completed                           │     │
│  │                                                                 │     │
│  │ On completion page load:                                        │     │
│  │   1. Mark scenario as completed                                 │     │
│  │   2. Fire analytics event                                       │     │
│  │   3. Show recommendations                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  RECOMMENDATION ENGINE                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ Priority:                                                       │     │
│  │   1. Quiz results (if stored in ndx_quiz_results)              │     │
│  │   2. Same category as completed                                │     │
│  │   3. Different category (variety)                              │     │
│  │                                                                 │     │
│  │ Filters:                                                        │     │
│  │   - Exclude completed walkthroughs                              │     │
│  │   - Prefer not-yet-started over in-progress                    │     │
│  │   - Limit to 2-3 recommendations                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION POINTS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Scenario Detail Page (/scenarios/{id}/)                                 │
│  ├── Insert CTA after description                                        │
│  ├── Read progress from localStorage                                     │
│  └── Update button text based on state                                   │
│                                                                           │
│  Scenario Gallery (/scenarios/)                                           │
│  ├── Add walkthrough badge to card component                             │
│  └── Badge links to /walkthroughs/{id}/                                  │
│                                                                           │
│  Walkthrough Pages (/walkthroughs/{id}/step-{n}/)                        │
│  ├── Update localStorage on page load                                    │
│  └── Mark step as visited                                                │
│                                                                           │
│  Walkthrough Complete (/walkthroughs/{id}/complete/)                     │
│  ├── Mark walkthrough as completed                                       │
│  ├── Fire analytics event                                                │
│  └── Generate recommendations                                            │
│                                                                           │
│  Evidence Pack (/evidence-pack/{id}/)                                    │
│  └── Pre-fill scenario if coming from completion page                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Story Dependencies and Order

```
15.1 (Start CTA) ──► 15.2 (Progress Tracking) ──► 15.3 (Completion Links)
                                                          │
                                                          ▼
15.4 (Gallery Badges) ◄──────────────────────────── 15.5 (Recommendations)
```

**Recommended Implementation Order:**
1. Story 15.2 - Progress Tracking (foundation for all else)
2. Story 15.1 - Start Walkthrough CTA (uses progress tracking)
3. Story 15.3 - Completion Page Links
4. Story 15.4 - Scenario Gallery Badges (can parallel with 15.3)
5. Story 15.5 - Cross-Scenario Recommendations

## Technical Decisions

### TD-15.1: localStorage Schema Design

**Decision:** Unified object with scenario keys, not separate keys per scenario

**Rationale:**
- Single read/write for all progress data
- Easier to clear all progress
- Smaller storage footprint (shared metadata)
- Simpler JSON serialization

### TD-15.2: Completion Criteria

**Decision:** Viewing the completion page marks walkthrough as completed

**Rationale:**
- Simple, deterministic trigger
- No ambiguity about "partial completion"
- Users who reach completion page have engaged meaningfully
- Easy to implement and debug

### TD-15.3: Graceful Degradation

**Decision:** Silent fallback when localStorage unavailable

**Rationale:**
- Progress is enhancement, not core functionality
- Don't block users in private browsing
- No error messages that confuse users
- CTAs still work (just without "Continue" state)

### TD-15.4: Recommendation Algorithm

**Decision:** Simple priority-based selection (quiz > category > variety)

**Rationale:**
- Predictable, explainable recommendations
- No complex ML or matching algorithms
- Works with limited data (6 scenarios)
- Easy to tune and adjust

### TD-15.5: Quiz Integration

**Decision:** Read existing `ndx_quiz_results` if available, don't require it

**Rationale:**
- Not all users take quiz
- Recommendations work without quiz data
- Progressively enhanced experience
- No new quiz storage needed

## File Structure

```
/src/
├── _includes/
│   ├── layouts/
│   │   └── scenario.njk                # Updated with CTA
│   └── components/
│       ├── walkthrough-cta.njk         # New
│       ├── progress-indicator.njk      # New
│       ├── completion-next-steps.njk   # New
│       └── scenario-card.njk           # Updated with badge
├── assets/
│   ├── css/
│   │   ├── _walkthrough-cta.scss       # New
│   │   └── _progress-indicator.scss    # New
│   └── js/
│       ├── progress-tracker.js         # New
│       └── recommendations.js          # New
└── walkthroughs/
    └── {scenario}/
        └── complete.njk                # Updated with recommendations
```

## Component Specifications

### Walkthrough CTA Component

```nunjucks
{#
  Walkthrough CTA (Story 15.1)

  Expects: scenarioData from scenarios.yaml
#}

<div class="ndx-walkthrough-cta" data-walkthrough-cta data-scenario="{{ scenarioData.id }}">
  {# Progress indicator - populated by JS #}
  <div class="ndx-walkthrough-cta__progress" data-progress-display hidden>
    <div class="govuk-!-margin-bottom-2">
      <strong class="govuk-tag govuk-tag--blue">In Progress</strong>
    </div>
    <div class="ndx-progress-bar">
      <div class="ndx-progress-bar__fill" data-progress-fill style="width: 0%"></div>
    </div>
    <p class="govuk-body-s govuk-!-margin-top-1" data-progress-text>
      Step <span data-current-step>0</span> of <span data-total-steps>0</span>
    </p>
  </div>

  {# CTA Buttons #}
  <div class="govuk-button-group">
    {# Primary CTA - changes based on progress state #}
    <a href="/walkthroughs/{{ scenarioData.id }}/"
       role="button"
       draggable="false"
       class="govuk-button govuk-button--start"
       data-module="govuk-button"
       data-walkthrough-start>
      <span data-cta-text>Start walkthrough ({{ scenarioData.walkthroughSteps }} steps)</span>
      <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z"/>
      </svg>
    </a>

    {# Restart button - shown only when in progress #}
    <button type="button"
            class="govuk-button govuk-button--secondary"
            data-restart-walkthrough
            hidden>
      Restart from beginning
    </button>
  </div>
</div>
```

### Progress Tracker JavaScript

```javascript
/**
 * Progress Tracker (Story 15.2)
 *
 * Manages walkthrough progress in localStorage
 */

const STORAGE_KEY = 'ndx_walkthrough_progress';

const ProgressTracker = {
  /**
   * Check if localStorage is available
   */
  isAvailable() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get all progress data
   */
  getAll() {
    if (!this.isAvailable()) return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  },

  /**
   * Get progress for a specific scenario
   */
  get(scenarioId) {
    const all = this.getAll();
    return all[scenarioId] || null;
  },

  /**
   * Update progress for a scenario
   */
  update(scenarioId, stepNumber, totalSteps) {
    if (!this.isAvailable()) return;

    const all = this.getAll();
    const existing = all[scenarioId] || {
      startedAt: new Date().toISOString(),
      completedSteps: []
    };

    // Mark all steps up to current as completed
    for (let i = 1; i < stepNumber; i++) {
      if (!existing.completedSteps.includes(i)) {
        existing.completedSteps.push(i);
      }
    }

    all[scenarioId] = {
      ...existing,
      currentStep: stepNumber,
      totalSteps: totalSteps,
      lastVisited: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Mark a walkthrough as completed
   */
  complete(scenarioId) {
    if (!this.isAvailable()) return;

    const all = this.getAll();
    if (all[scenarioId]) {
      all[scenarioId].completed = true;
      all[scenarioId].completedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  },

  /**
   * Clear progress for a scenario
   */
  clear(scenarioId) {
    if (!this.isAvailable()) return;

    const all = this.getAll();
    delete all[scenarioId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Get completed scenario IDs
   */
  getCompleted() {
    const all = this.getAll();
    return Object.keys(all).filter(id => all[id].completed);
  }
};

// Export for use in other scripts
window.ProgressTracker = ProgressTracker;
```

### Completion Next Steps Component

```nunjucks
{#
  Completion Next Steps (Story 15.3)

  Displayed on walkthrough complete pages
#}

<div class="govuk-panel govuk-panel--confirmation">
  <h1 class="govuk-panel__title">Walkthrough complete!</h1>
  <div class="govuk-panel__body">
    You've explored {{ scenarioData.title }} and experienced {{ scenarioData.awsServices | length }} AWS services in action.
  </div>
</div>

<div class="govuk-!-margin-top-6">
  <h2 class="govuk-heading-m">What's next?</h2>

  <div class="govuk-grid-row">
    <div class="govuk-grid-column-one-third">
      <h3 class="govuk-heading-s">Generate Evidence Pack</h3>
      <p class="govuk-body-s">Create your business case with what you've learned.</p>
      <a href="/evidence-pack/{{ scenarioData.id }}/"
         role="button"
         draggable="false"
         class="govuk-button"
         data-module="govuk-button">
        Generate Evidence Pack
      </a>
    </div>

    <div class="govuk-grid-column-one-third">
      <h3 class="govuk-heading-s">Return to Scenario</h3>
      <p class="govuk-body-s">Review deployment options and details.</p>
      <a href="/scenarios/{{ scenarioData.id }}/"
         class="govuk-button govuk-button--secondary"
         data-module="govuk-button">
        Back to {{ scenarioData.title }}
      </a>
    </div>

    <div class="govuk-grid-column-one-third">
      <h3 class="govuk-heading-s">Try Another</h3>
      <p class="govuk-body-s">Explore more scenarios.</p>
      <a href="/scenarios/"
         class="govuk-button govuk-button--secondary"
         data-module="govuk-button">
        Browse Scenarios
      </a>
    </div>
  </div>
</div>

{# Recommendations - populated by JS #}
<div class="ndx-recommendations govuk-!-margin-top-8" data-recommendations hidden>
  <h2 class="govuk-heading-m">Recommended for you</h2>
  <div class="govuk-grid-row" data-recommendation-cards>
    {# Cards inserted by JavaScript #}
  </div>
</div>

{# All complete state #}
<div class="ndx-all-complete govuk-!-margin-top-8" data-all-complete hidden>
  <div class="govuk-inset-text">
    <p><strong>Congratulations!</strong> You've completed all available walkthroughs.</p>
    <p>Ready to build your business case? Generate an evidence pack to share with your stakeholders.</p>
  </div>
</div>
```

### Scenario Card Badge Update

```nunjucks
{#
  Updated Scenario Card with Walkthrough Badge (Story 15.4)

  Add to existing scenario-card.njk
#}

{# Inside existing card markup, add badge #}
{% if scenarioData.hasWalkthrough %}
  <div class="ndx-scenario-card__badge">
    <a href="/walkthroughs/{{ scenarioData.id }}/"
       class="govuk-tag govuk-tag--green ndx-scenario-card__walkthrough-badge"
       aria-label="Walkthrough available for {{ scenarioData.title }}: {{ scenarioData.walkthroughSteps }} steps">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M4 2l6 4-6 4V2z" fill="currentColor"/>
      </svg>
      {{ scenarioData.walkthroughSteps }}-step guide
    </a>
  </div>
{% endif %}
```

## Testing Strategy

### Unit Tests

- ProgressTracker stores/retrieves data correctly
- Completion criteria triggers on complete page
- Recommendations filter out completed scenarios
- CTA text changes based on progress state
- Clear progress removes data

### Integration Tests

- Progress persists across page navigation
- Progress survives browser restart
- CTA links to correct step based on progress
- Completion page shows recommendations
- Gallery badge links work

### Accessibility Tests

- Progress indicator announced to screen readers
- CTA buttons keyboard accessible
- Recommendations have proper ARIA
- Color not only indicator of state

### Visual Regression Tests

- CTA states (start, continue)
- Progress indicator appearance
- Gallery badge positioning
- Completion page layout

## Story Point Estimates

| Story | Description | Points |
|-------|-------------|--------|
| 15.1 | "Start Walkthrough" CTA | 5 |
| 15.2 | Progress Tracking (localStorage) | 5 |
| 15.3 | Completion Page Links | 3 |
| 15.4 | Scenario Gallery Badges | 3 |
| 15.5 | Cross-Scenario Recommendations | 5 |
| **Total** | | **21** |

## Acceptance Criteria Summary

- [ ] "Start Walkthrough" CTA appears on all scenario detail pages
- [ ] CTA shows "Continue" when progress exists
- [ ] Progress saves to localStorage on step visits
- [ ] Progress indicator displays percentage and step count
- [ ] "Clear progress" button works with confirmation
- [ ] Completion page marks walkthrough as completed
- [ ] Completion page links to evidence pack
- [ ] 2-3 recommendations shown on completion
- [ ] Gallery cards show walkthrough badges
- [ ] Badge links directly to walkthrough index
- [ ] Analytics events fire for start/continue/complete
- [ ] Works without localStorage (graceful degradation)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| localStorage unavailable | Graceful degradation, no errors shown |
| Progress data corruption | Validate JSON on read, reset if invalid |
| Stale quiz results | Check timestamp, use fallback recommendations |
| Too many recommendations | Hard limit of 3, prioritize by relevance |
