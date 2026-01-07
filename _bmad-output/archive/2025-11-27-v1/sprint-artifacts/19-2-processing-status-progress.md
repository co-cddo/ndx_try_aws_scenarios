# Story 19.2: Processing Status & Progress

Status: done

## Story

As a **council planning officer**,
I want **to see clear progress feedback when my document is being analyzed**,
so that **I know the system is working and approximately how long to wait**.

## Acceptance Criteria

### AC-19.2.1: Loading State

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.2.1a | Loading spinner visible during analysis | Visual inspection |
| AC-19.2.1b | "Analyzing document..." message displayed | Visual inspection |
| AC-19.2.1c | Upload zone hidden during processing | Visual inspection |
| AC-19.2.1d | Buttons hidden during processing | Visual inspection |

### AC-19.2.2: Accessibility

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.2.2a | Loading area has aria-live="polite" | HTML inspection |
| AC-19.2.2b | Spinner is aria-hidden="true" | HTML inspection |
| AC-19.2.2c | Status message readable by screen readers | ARIA test |

### AC-19.2.3: Visual Design

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.2.3a | Spinner uses GOV.UK blue (#1d70b8) | CSS inspection |
| AC-19.2.3b | Centered in content area | Visual inspection |
| AC-19.2.3c | Smooth animation (CSS spin) | Visual inspection |

## Tasks / Subtasks

- [x] Task 1: Add loading indicator HTML
  - [x] 1.1 Create loading div with spinner
  - [x] 1.2 Add status message text
  - [x] 1.3 Style spinner with animation

- [x] Task 2: Add loading state management
  - [x] 2.1 Show loading on analyze click
  - [x] 2.2 Hide upload zone during processing
  - [x] 2.3 Hide buttons during processing
  - [x] 2.4 Hide loading when results ready

## Technical Notes

Already implemented in Story 19.1 as part of the complete web interface. The loading state includes:
- CSS spinner with animation
- "Analyzing document..." heading
- "Extracting key details and generating recommendations" subtext
- aria-live="polite" for accessibility
- Proper show/hide transitions

## Dependencies

- Story 19.1 (Upload Interface Foundation) - DONE

## Definition of Done

- [x] Loading spinner visible during API call
- [x] Status message displayed
- [x] Accessibility attributes present
- [x] Code review approved

## Dev Record

### Session Log

**2025-11-30 - Implemented as part of Story 19.1**

**Developer:** Claude Code

This functionality was implemented as part of Story 19.1's complete web interface.

**Implementation Location:**
- `cloudformation/scenarios/planning-ai/template.yaml` lines 333-350 (CSS), 493-498 (HTML), 602-622 (JS)

**Features Delivered:**
- Loading spinner with CSS animation
- "Analyzing document..." message
- "Extracting key details and generating recommendations" subtext
- Upload zone and buttons hidden during processing
- aria-live="polite" for screen reader announcements
- Smooth show/hide transitions

**Verification:**
- Spinner appears on "Analyze Document" click ✓
- Upload area hides during processing ✓
- Spinner uses #1d70b8 border color ✓
- Accessibility attributes present ✓

---

_Story created: 2025-11-30_
_Epic: 19 - Planning Application AI Web Application_
