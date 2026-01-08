# Story 3.3: AI Component Design System

Status: done

## Story

As a **developer building AI UI components**,
I want **consistent design patterns for AI interactions**,
So that **all AI features feel cohesive and familiar to users**.

## Acceptance Criteria

1. **Given** I am implementing an AI feature UI
   **When** I use the design system components
   **Then** I have access to:
   - AI Action Button (secondary style with AI icon)
   - Loading State (spinner with "AI is thinking..." text)
   - Error State (red alert with retry option)
   - Success State (green confirmation)
   **And** all components meet WCAG 2.2 AA requirements
   **And** components use GOV.UK Design System colour palette
   **And** loading states include aria-live announcements
   **And** components are documented with usage examples

## Tasks / Subtasks

- [x] **Task 1: Create ndx_aws_ai Drupal theme components** (AC: 1)
  - [x] 1.1 Create `templates/` directory for Twig templates
  - [x] 1.2 Create `css/` directory for component styles
  - [x] 1.3 Create `js/` directory for component behaviours
  - [x] 1.4 Create `ndx_aws_ai.libraries.yml` for asset registration

- [x] **Task 2: AI Action Button component** (AC: 1)
  - [x] 2.1 Create `templates/ai-action-button.html.twig` template
  - [x] 2.2 Style with GOV.UK secondary button + AI icon (#1d70b8 border)
  - [x] 2.3 Add hover/focus/active states with 3px yellow focus ring (#ffdd00)
  - [x] 2.4 Minimum touch target size 44x44px
  - [x] 2.5 Create reusable Twig pattern for consistent usage

- [x] **Task 3: Loading State component** (AC: 1)
  - [x] 3.1 Create `templates/ai-loading-state.html.twig` with spinner + text
  - [x] 3.2 Create CSS spinner animation (GOV.UK blue #1d70b8)
  - [x] 3.3 Add aria-live="polite" for screen reader announcements
  - [x] 3.4 Support prefers-reduced-motion media query
  - [x] 3.5 Default text: "AI is thinking..." (configurable)

- [x] **Task 4: Error State component** (AC: 1)
  - [x] 4.1 Create `templates/ai-error-state.html.twig` with message + retry
  - [x] 4.2 Style with GOV.UK error pattern (red #d4351c left border)
  - [x] 4.3 Include role="alert" for immediate screen reader announcement
  - [x] 4.4 Add retry button that triggers callback
  - [x] 4.5 Support custom error messages and codes

- [x] **Task 5: Success State component** (AC: 1)
  - [x] 5.1 Create `templates/ai-success-state.html.twig` with confirmation
  - [x] 5.2 Style with GOV.UK success pattern (green #00703c)
  - [x] 5.3 Include checkmark icon and optional dismiss action
  - [x] 5.4 Add aria-live="polite" announcement
  - [x] 5.5 Support auto-dismiss after 5 seconds (configurable)

- [x] **Task 6: JavaScript behaviours and Drupal integration** (AC: 1)
  - [x] 6.1 Create `js/ai-components.js` with Drupal behaviour attachment
  - [x] 6.2 Implement state transitions (loading → success/error)
  - [x] 6.3 Add keyboard accessibility (Enter/Space to activate buttons)
  - [x] 6.4 Implement focus management for state changes
  - [x] 6.5 Register library in module .libraries.yml

- [x] **Task 7: Documentation and usage examples** (AC: 1)
  - [x] 7.1 Create `README.md` in templates directory with component guide
  - [x] 7.2 Document Twig variables and options for each component
  - [x] 7.3 Add code examples for common usage patterns
  - [x] 7.4 Include accessibility notes for each component

## Dev Notes

### GOV.UK Design System Colour Palette

From UX Design Specification:
```css
/* Primary Colours */
--govuk-blue: #1d70b8;      /* Links, primary actions */
--govuk-black: #0b0c0c;     /* Text */
--govuk-white: #ffffff;     /* Backgrounds */

/* Status Colours */
--govuk-red: #d4351c;       /* Errors */
--govuk-green: #00703c;     /* Success */
--govuk-yellow: #ffdd00;    /* Focus, warnings */

/* Secondary */
--govuk-grey: #505a5f;      /* Secondary text */
--govuk-light-grey: #f3f2f1; /* Backgrounds */
```

### Focus Ring Specification

From UX Design:
- 3px yellow (#ffdd00) outline
- 2px offset from element
- Visible on all interactive elements

```css
.ai-component:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 2px;
}
```

### Accessibility Requirements

From UX Design - WCAG 2.2 AA:
- Minimum touch target: 44x44px
- Colour contrast ratio: 4.5:1 for text, 3:1 for UI components
- aria-live regions for dynamic content updates
- Focus traps where appropriate
- prefers-reduced-motion support

### Component Structure

```
web/modules/custom/ndx_aws_ai/
├── templates/
│   ├── ai-action-button.html.twig
│   ├── ai-loading-state.html.twig
│   ├── ai-error-state.html.twig
│   ├── ai-success-state.html.twig
│   └── README.md
├── css/
│   └── ai-components.css
├── js/
│   └── ai-components.js
└── ndx_aws_ai.libraries.yml
```

### Twig Template Variables

**AI Action Button:**
```twig
{% include '@ndx_aws_ai/ai-action-button.html.twig' with {
  label: 'Simplify text',
  icon: 'sparkle',
  action: 'simplify',
  disabled: false,
} %}
```

**Loading State:**
```twig
{% include '@ndx_aws_ai/ai-loading-state.html.twig' with {
  message: 'AI is simplifying your text...',
  show_spinner: true,
} %}
```

**Error State:**
```twig
{% include '@ndx_aws_ai/ai-error-state.html.twig' with {
  message: 'Unable to connect to AI service',
  error_code: 'SERVICE_UNAVAILABLE',
  retry_callback: 'Drupal.ndxAwsAi.retry',
} %}
```

**Success State:**
```twig
{% include '@ndx_aws_ai/ai-success-state.html.twig' with {
  message: 'Text simplified successfully',
  auto_dismiss: 5000,
} %}
```

### Drupal Behaviour Pattern

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.ndxAwsAiComponents = {
    attach: function (context, settings) {
      once('ai-action-button', '.ai-action-button', context).forEach(function (button) {
        // Attach click handlers
      });
    }
  };
})(Drupal, once);
```

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/project-planning-artifacts/ux-design-specification.md#Component Strategy]
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/TR/WCAG22/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

N/A - No debug issues encountered

### Completion Notes List

1. Created templates directory with 4 Twig component templates
2. Created ai-action-button.html.twig with icon support and GOV.UK styling
3. Created ai-loading-state.html.twig with SVG spinner and aria-live
4. Created ai-error-state.html.twig with role="alert" and retry button
5. Created ai-success-state.html.twig with auto-dismiss support
6. Created comprehensive CSS with GOV.UK Design System colours
7. Implemented prefers-reduced-motion and high contrast mode support
8. Created JavaScript behaviours with StateManager utility
9. Created ndx_aws_ai.libraries.yml for asset registration
10. Created comprehensive README.md with usage documentation

### Senior Developer Review

**Review Date:** 2025-12-30
**Reviewer:** Code Review Agent (Opus 4)
**Verdict:** APPROVED with fixes applied

#### Acceptance Criteria Validation

| AC# | Criteria | Status | Evidence |
|-----|----------|--------|----------|
| 1.1 | AI Action Button (secondary style with AI icon) | ✅ PASS | `ai-action-button.html.twig`:49-50, `ai-components.css`:66-98 |
| 1.2 | Loading State (spinner with "AI is thinking..." text) | ✅ PASS | `ai-loading-state.html.twig`:23,33-46, `ai-components.css`:140-225 |
| 1.3 | Error State (red alert with retry option) | ✅ PASS | `ai-error-state.html.twig`:31,47-54, `ai-components.css`:231-279 |
| 1.4 | Success State (green confirmation) | ✅ PASS | `ai-success-state.html.twig`:30, `ai-components.css`:285-374 |
| 1.5 | WCAG 2.2 AA requirements | ✅ PASS | Touch targets 44x44px, focus rings, aria-live, role attributes |
| 1.6 | GOV.UK Design System colour palette | ✅ PASS | `ai-components.css`:25-40 uses correct colours |
| 1.7 | Loading states include aria-live announcements | ✅ PASS | `ai-loading-state.html.twig`:29, `ai-components.js`:103-108 |
| 1.8 | Components are documented with usage examples | ✅ PASS | `templates/README.md` comprehensive docs |

#### Issues Found and Fixed

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| MEDIUM | `.ai-action-button:active` had `top: 2px` but missing `position: relative` | Added `position: relative` to base `.ai-action-button` rule |
| LOW | `StateManager.setState` dispatched event with wrong `previousState` value | Captured `previousState` before updating `this.currentState` |

#### Task Verification

All 7 tasks (27 subtasks) verified complete with file:line evidence.

### File List

**Files to Create:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/templates/ai-action-button.html.twig
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/templates/ai-loading-state.html.twig
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/templates/ai-error-state.html.twig
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/templates/ai-success-state.html.twig
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/templates/README.md
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/css/ai-components.css
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/js/ai-components.js
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.libraries.yml

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with comprehensive UI component specifications | SM Agent |
| 2025-12-30 | Implementation completed (Tasks 1-7) | Dev Agent |
| 2025-12-30 | Code review passed, 2 issues fixed, marked done | Review Agent |
