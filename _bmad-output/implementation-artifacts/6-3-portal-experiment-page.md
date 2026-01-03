# Story 6.3: Portal Experiment Page

Status: done

## Story

As a **council officer wanting hands-on experience**,
I want **guided experiments for each AI feature**,
So that **I can learn by doing with specific tasks**.

## Acceptance Criteria

1. **Given** I navigate to the Experiment page on the portal
   **When** I select a feature to experiment with
   **Then** I see:
   - Specific task to complete (e.g., "Simplify this planning guidance")
   - Sample content or starting point
   - Step-by-step instructions
   - Success criteria ("You'll know it worked when...")

2. **Given** experiments are displayed
   **When** I browse the experiment list
   **Then** experiments are sequenced from simple to advanced

3. **Given** I complete an experiment
   **When** I mark it as done
   **Then** I can mark experiments as completed

4. **Given** I complete experiments
   **When** I check my progress
   **Then** completion contributes to progress tracking

## Tasks / Subtasks

- [x] **Task 1: Create Experiment Data** (AC: 1, 2)
  - [x] 1.1 Add `experiments` array to `src/_data/` for localgov-drupal
  - [x] 1.2 Define experiments for each of 7 AI features (8 total)
  - [x] 1.3 Include: id, title, description, feature, difficulty, steps, successCriteria
  - [x] 1.4 Order experiments from simple to advanced

- [x] **Task 2: Create Experiment Page Template** (AC: 1, 2)
  - [x] 2.1 Create `src/walkthroughs/localgov-drupal/explore/experiments/index.njk`
  - [x] 2.2 Use `page` layout with appropriate front matter
  - [x] 2.3 Include phase-navigator component for context
  - [x] 2.4 Add breadcrumb navigation

- [x] **Task 3: Create Experiment Card Component** (AC: 1)
  - [x] 3.1 Create `src/_includes/components/experiment-card.njk`
  - [x] 3.2 Show task title, difficulty badge, feature tag
  - [x] 3.3 Expandable section for instructions and success criteria (GOV.UK Details)
  - [x] 3.4 Sample content with copy-to-clipboard functionality
  - [x] 3.5 Completion checkbox with localStorage persistence

- [x] **Task 4: Implement Difficulty Levels** (AC: 2)
  - [x] 4.1 Define difficulty levels: Beginner, Intermediate, Advanced
  - [x] 4.2 Color-coded badges (green/yellow/orange)
  - [x] 4.3 Group experiments by difficulty with filter checkboxes

- [x] **Task 5: Implement Completion Tracking** (AC: 3, 4)
  - [x] 5.1 Create `src/assets/js/experiment-tracker.js`
  - [x] 5.2 Store completion state in localStorage
  - [x] 5.3 Progress bar and count updated on checkbox change
  - [x] 5.4 Show completion percentage on page

- [x] **Task 6: Add Sample Content** (AC: 1)
  - [x] 6.1 Create realistic sample content for each experiment
  - [x] 6.2 Use council-relevant examples (planning guidance, service pages, etc.)
  - [x] 6.3 Add copy-to-clipboard buttons for sample text

- [x] **Task 7: Add Success Criteria Display** (AC: 1)
  - [x] 7.1 Display "You'll know it worked when..." section
  - [x] 7.2 Use GOV.UK success pattern (green tick list)
  - [x] 7.3 Visual feedback when user marks as complete (card styling)

- [x] **Task 8: Verify Build and Accessibility** (AC: 1, 2, 3, 4)
  - [x] 8.1 Run `npm run build` - 109 files built successfully
  - [x] 8.2 Verify responsive layout via CSS media queries
  - [x] 8.3 Semantic HTML with proper ARIA and labels
  - [x] 8.4 localStorage persistence via experiment-tracker.js

## Dev Notes

### Experiments to Create

Based on 7 AI features, create experiments like:

| Feature | Experiment | Difficulty |
|---------|------------|------------|
| AI Content Editing | Improve a planning notice | Beginner |
| Readability Simplification | Simplify council guidance | Beginner |
| Auto Alt-Text | Upload an image and review alt-text | Beginner |
| Text-to-Speech | Listen to a page in different voices | Intermediate |
| Content Translation | Translate a service page | Intermediate |
| PDF-to-Web | Convert a council PDF | Advanced |
| Dynamic Council | Explore generated content | Beginner |

### Existing Patterns to Follow

- `ai-feature-card.njk` - Card component pattern from Story 6.2
- `explore-page.js` - localStorage handling pattern
- `progress-tracker.js` - Progress tracking system
- GOV.UK Details component for expandable sections
- GOV.UK Tag component for difficulty badges

### localStorage Keys

```javascript
// Experiment completion stored per scenario
const experimentKey = `ndx-experiments-${scenarioId}`;
const data = {
  completed: ['experiment-1', 'experiment-3'],
  timestamp: Date.now()
};
```

### File Structure

```
src/
├── _data/
│   └── experiments/
│       └── localgov-drupal.yaml     # Experiment definitions
├── _includes/
│   └── components/
│       └── experiment-card.njk       # New component
├── walkthroughs/
│   └── localgov-drupal/
│       └── explore/
│           └── experiments/
│               └── index.njk         # New page
└── assets/
    └── js/
        └── experiment-tracker.js     # New JS for completion tracking
```

### Design Considerations

- Experiments should be completable without deployment (reading/understanding)
- But best experience comes with live deployment
- Progressive disclosure: show basic task, expand for full instructions
- Mobile-friendly: experiments work on tablet/phone
