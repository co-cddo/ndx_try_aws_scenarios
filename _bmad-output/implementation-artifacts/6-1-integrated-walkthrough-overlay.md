# Story 6.1: Integrated Walkthrough Overlay

Status: done

## Story

As a **council officer exploring the full demo**,
I want **a unified walkthrough that connects all features**,
so that **I experience the complete scenario cohesively**.

## Acceptance Criteria

1. **AC1: Journey Coverage** - Given I am logged into Drupal admin, when I access the integrated walkthrough, then the overlay presents a journey covering all 7 AI features:
   - AI Writing Assistant (Help me write...)
   - Readability Simplification (Simplify to plain English)
   - Auto Alt-Text Generation (on media upload)
   - Text-to-Speech (Listen to Page)
   - Content Translation (75+ languages)
   - PDF-to-Web Conversion
   - Dynamic Council Generation (generated content showcase)

2. **AC2: Mini-Guide Links** - Given I am on any AI feature step in the walkthrough, when I click "Learn More", then I am linked to the appropriate mini-guide:
   - AI Content Editing mini-guide (from Stories 3.8)
   - AI Accessibility mini-guide (from Story 4.9)
   - Dynamic Council mini-guide (from Story 5.8)

3. **AC3: Progress Tracking** - Given I complete walkthrough sections, when I view the progress indicator, then I see:
   - Overall completion percentage across all features
   - Visual distinction between completed, current, and upcoming sections
   - Progress persisted across browser sessions (localStorage)

4. **AC4: Section Navigation** - Given I am in the walkthrough, when I want to jump to a specific feature, then I can:
   - Access a section menu showing all 7 AI features
   - Jump directly to any feature section
   - Return to where I left off

5. **AC5: Adaptive Behavior** - Given I have completed some sections previously, when I restart the walkthrough, then:
   - Completed sections show checkmarks
   - I can choose to replay or skip completed sections
   - New/updated features are highlighted

6. **AC6: Evidence Pack Unlock** - Given I have completed all 7 AI feature sections, when I finish the walkthrough, then:
   - A "Generate Evidence Pack" button becomes available
   - The button links to the enhanced evidence pack form (Story 6.7)
   - Completion status is tracked for pack generation

7. **AC7: Natural Flow** - Given I am progressing through the walkthrough, when I move between features, then:
   - Transitions feel natural with appropriate context
   - Each feature builds on understanding from previous features
   - The narrative connects AI capabilities to council use cases

## Tasks / Subtasks

- [x] **Task 1: Extend Walkthrough Configuration** (AC: 1, 7)
  - [x] 1.1 Create new walkthrough steps configuration for 7 AI features in `ndx_walkthrough.module`
  - [x] 1.2 Define step targets pointing to AI feature UI elements (CKEditor toolbar, media library, etc.)
  - [x] 1.3 Write step content with council-focused narrative connecting features
  - [x] 1.4 Add step metadata for feature categorization (Content, Accessibility, Generation)

- [x] **Task 2: Section Navigation System** (AC: 4)
  - [x] 2.1 Add section menu HTML to `walkthrough-modal.html.twig`
  - [x] 2.2 Create section menu logic in `walkthrough.js` (integrated rather than separate file)
  - [x] 2.3 Add CSS for section menu (dropdown style with GOV.UK patterns)
  - [x] 2.4 Implement jump-to-section with step position tracking

- [x] **Task 3: Enhanced Progress Tracking** (AC: 3, 5)
  - [x] 3.1 Extend localStorage schema to track per-feature completion
  - [x] 3.2 Add `getFeatureProgress()` and `markFeatureComplete()` functions
  - [x] 3.3 Create progress bar UI component showing overall completion
  - [x] 3.4 Implement "completed section" visual indicators (checkmarks)
  - [x] 3.5 Add replay/skip options for completed sections

- [x] **Task 4: Mini-Guide Integration** (AC: 2)
  - [x] 4.1 Add "Learn More" link to relevant walkthrough steps
  - [x] 4.2 Create route for mini-guide pages or external URLs
  - [x] 4.3 Ensure "Learn More" opens in new tab (target="_blank")
  - [x] 4.4 Add aria-describedby for accessibility

- [x] **Task 5: Evidence Pack Unlock** (AC: 6)
  - [x] 5.1 Add completion check in walkthrough final step
  - [x] 5.2 Create "Generate Evidence Pack" button conditionally shown
  - [x] 5.3 Link to `/admin/ndx/evidence-pack` route (Story 6.7)
  - [x] 5.4 Store completion timestamp in localStorage

- [x] **Task 6: Accessibility & Testing** (AC: all)
  - [x] 6.1 Verify WCAG 2.2 AA compliance for new components (focus rings, touch targets, contrast)
  - [x] 6.2 Test keyboard navigation through section menu (Tab, Escape support)
  - [x] 6.3 Verify screen reader announces section changes (aria-live, role="menu")
  - [x] 6.4 Test with prefers-reduced-motion (CSS media query disables transitions)

## Dev Notes

### Existing Module to Extend

The `ndx_walkthrough` module already exists with:
- **Module file**: `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/ndx_walkthrough.module`
- **JavaScript**: `ndx_walkthrough/js/walkthrough.js` - Complete tour engine with spotlight, navigation, localStorage
- **CSS**: `ndx_walkthrough/css/walkthrough.css` - GOV.UK Design System styling
- **Template**: `ndx_walkthrough/templates/walkthrough-modal.html.twig` - ARIA-compliant modal

### Current Implementation Details

The existing `walkthrough.js` has:
```javascript
// State management (already implemented)
getProgress(), saveProgress(), clearProgress()
// Spotlight highlighting (already implemented)
showSpotlight(target), hideSpotlight()
// Focus trapping (already implemented - WCAG compliant)
```

The 8 existing steps target admin toolbar elements. Story 6-1 requires **adding 15-20 new steps** for AI features.

### AI Feature UI Targets

| Feature | Target Selector | Location |
|---------|-----------------|----------|
| AI Writing | `#edit-ai-writing-button` or CKEditor AI dropdown | Content edit form |
| Simplify | `#edit-ai-simplify-button` | Content edit form |
| Auto Alt-Text | `.media-library-item__preview` | Media library |
| TTS | `.tts-player-button` | Public pages (need admin preview) |
| Translation | `.translation-widget` | Public pages |
| PDF Conversion | `/admin/ndx/pdf-convert` link | Admin menu |
| Council Gen | Generated content showcase | Homepage/service pages |

### Step Content Guidelines

From architecture analysis:
- **Title**: Max 60 characters
- **Body**: Max 200 characters
- **Steps per section**: 2-3 per AI feature
- **Total steps**: ~20 (7 features × ~3 steps each)

### Mini-Guide Paths

```
AI Content Editing:    /admin/help/ndx_aws_ai/content-editing
AI Accessibility:      /admin/help/ndx_aws_ai/accessibility
Dynamic Council:       /admin/help/ndx_council_generator
```

### localStorage Schema Extension

```javascript
// Current
ndxWalkthrough: { currentStep: 0, completed: false, startedAt: timestamp }

// Extended
ndxWalkthrough: {
  currentStep: 0,
  completed: false,
  startedAt: timestamp,
  features: {
    'ai-writing': { completed: false, viewedAt: null },
    'ai-simplify': { completed: false, viewedAt: null },
    'alt-text': { completed: false, viewedAt: null },
    'tts': { completed: false, viewedAt: null },
    'translation': { completed: false, viewedAt: null },
    'pdf-convert': { completed: false, viewedAt: null },
    'council-gen': { completed: false, viewedAt: null }
  },
  evidencePackUnlocked: false,
  completedAt: null
}
```

### Project Structure Notes

Files to modify/create:
```
cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/
├── ndx_walkthrough.module        # MODIFY: Add AI feature steps
├── js/
│   ├── walkthrough.js            # MODIFY: Add section nav, progress tracking
│   └── walkthrough-sections.js   # CREATE: Section menu logic
├── css/
│   └── walkthrough.css           # MODIFY: Add section menu styles
└── templates/
    └── walkthrough-modal.html.twig  # MODIFY: Add section menu, progress bar
```

### Alignment with GOV.UK Design System

- Focus rings: 3px #ffdd00
- Primary button: #00703c
- Touch targets: 44x44px minimum
- Z-index: Modal 10000, Section menu 10001

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 6.1]
- [Source: cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/js/walkthrough.js]
- [Source: cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/ndx_walkthrough.module]
- [Source: _bmad-output/project-planning-artifacts/architecture.md#Modal/Dialog Pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log

**Task 1 Plan (2026-01-03)**:
- Extend `ndx_walkthrough_get_steps()` in module file to add 15-20 steps for 7 AI features
- Group steps by feature category with metadata
- Ensure natural flow with council-focused narrative
- Keep titles < 60 chars, content < 200 chars

**Implementation (2026-01-03)**:
- Extended walkthrough to 18 steps covering all 7 AI features plus admin basics
- Added section navigation dropdown menu for jumping between features
- Implemented per-feature progress tracking in localStorage
- Added progress bar showing overall completion percentage
- Integrated Learn More links to mini-guide help pages
- Added Evidence Pack unlock button on final step

### Debug Log References

N/A - No external debugging required

### Completion Notes List

1. **Extended ndx_walkthrough.module** with:
   - 18 steps organized by feature (admin-basics, ai-writing, ai-simplify, alt-text, tts, translation, pdf-convert, council-gen)
   - New `ndx_walkthrough_get_features()` function providing feature metadata with icons
   - Updated hook_page_attachments to pass features and evidencePackUrl to JS

2. **Updated walkthrough-modal.html.twig** with:
   - Progress bar component with ARIA progressbar role
   - Section navigation toggle button with feature label
   - Dropdown menu for section navigation
   - Learn More link (hidden by default, shown for steps with learnMoreUrl)
   - Evidence Pack button (shown on final step when all features complete)

3. **Extended walkthrough.css** with:
   - Progress bar styles (green fill, GOV.UK styling)
   - Section toggle button styles
   - Section dropdown menu styles with completion checkmarks
   - Learn More link styles
   - Evidence Pack button styles (blue, prominent)
   - Responsive styles for mobile

4. **Rewrote walkthrough.js** with:
   - Extended localStorage schema for per-feature progress tracking
   - `getFeatureProgress()`, `markFeatureViewed()`, `markFeatureComplete()` functions
   - Section navigation menu (buildSectionsMenu, toggleSectionsMenu, jumpToFeature)
   - Progress bar calculation and display
   - Evidence Pack unlock logic
   - Enhanced keyboard navigation (Escape closes menu)

### File List

**Modified:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/ndx_walkthrough.module
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/templates/walkthrough-modal.html.twig
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/css/walkthrough.css
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_walkthrough/js/walkthrough.js

## Code Review Record

### Review 1 (2026-01-03)

**Issues Found:**
1. [CRITICAL] AC5 Missing Replay/Skip UI - Fixed with `showReplayNotification()` and `skipToNextIncomplete()` functions
2. [MEDIUM] Progress text position overflow - Fixed by moving to `top: 100%` with `margin-top: 4px`
3. [MEDIUM] Missing aria-describedby on Learn More - Fixed by adding `aria-describedby="ndx-walkthrough-content"`
4. [LOW] Section menu keyboard navigation incomplete - Fixed with `handleMenuArrowNavigation()` for ArrowUp/ArrowDown
5. [LOW] Feature count mismatch in comment - Fixed comment to reflect actual 19 steps
6. [LOW] Hardcoded emoji in PHP - Removed 🎉 from title

**Files Changed:**
- walkthrough.js: Added replay notification, skip to incomplete, arrow key navigation
- walkthrough.css: Added replay badge styles with fade animation
- walkthrough-modal.html.twig: Added aria-describedby to Learn More link
- ndx_walkthrough.module: Fixed comment, removed emoji from title
