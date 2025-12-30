# Story 2.4: Basic Walkthrough Content

Status: done

## Story

As a **council officer new to LocalGov Drupal**,
I want **step-by-step guide pages on the portal**,
So that **I can follow a structured path through the demo**.

## Acceptance Criteria

1. **Given** I am on the walkthrough pages
   **When** I follow the steps
   **Then** I find guides covering:
   - Getting your credentials and logging in
   - Exploring the homepage and navigation
   - Editing existing content
   - Understanding the DEMO banner
   - Preparing for cleanup
   **And** each step includes descriptive text and screenshots
   **And** steps are numbered and progress is visible
   **And** I can navigate forward, back, or jump to specific steps

## Tasks / Subtasks

- [x] **Task 1: Create story file** (AC: 1)
  - [x] 1.1 Create story file with acceptance criteria

- [ ] **Task 2: Add LocalGov Drupal to walkthroughs.yaml** (AC: 1)
  - [ ] 2.1 Add walkthrough metadata with 5 steps
  - [ ] 2.2 Define step titles matching AC

- [ ] **Task 3: Create walkthrough index page** (AC: 1)
  - [ ] 3.1 Create `src/walkthroughs/localgov-drupal/index.njk`
  - [ ] 3.2 Add value proposition and prerequisites
  - [ ] 3.3 List what users will learn

- [ ] **Task 4: Create step 1 - Getting credentials and logging in** (AC: 1)
  - [ ] 4.1 Create `src/walkthroughs/localgov-drupal/step-1.njk`
  - [ ] 4.2 Instructions for finding credentials
  - [ ] 4.3 Login process walkthrough

- [ ] **Task 5: Create step 2 - Exploring homepage and navigation** (AC: 1)
  - [ ] 5.1 Create `src/walkthroughs/localgov-drupal/step-2.njk`
  - [ ] 5.2 Overview of LocalGov Drupal homepage
  - [ ] 5.3 Navigation structure explanation

- [ ] **Task 6: Create step 3 - Editing existing content** (AC: 1)
  - [ ] 6.1 Create `src/walkthroughs/localgov-drupal/step-3.njk`
  - [ ] 6.2 Content editing instructions
  - [ ] 6.3 WYSIWYG editor overview

- [ ] **Task 7: Create step 4 - Understanding the DEMO banner** (AC: 1)
  - [ ] 7.1 Create `src/walkthroughs/localgov-drupal/step-4.njk`
  - [ ] 7.2 Explain DEMO banner purpose
  - [ ] 7.3 Why it cannot be dismissed

- [ ] **Task 8: Create step 5 - Preparing for cleanup** (AC: 1)
  - [ ] 8.1 Create `src/walkthroughs/localgov-drupal/step-5.njk`
  - [ ] 8.2 CloudFormation stack deletion instructions
  - [ ] 8.3 Cost awareness information

- [ ] **Task 9: Create completion page** (AC: 1)
  - [ ] 9.1 Create `src/walkthroughs/localgov-drupal/complete.njk`
  - [ ] 9.2 Key takeaways summary
  - [ ] 9.3 Next steps and related scenarios

- [ ] **Task 10: Build and verify** (AC: 1)
  - [ ] 10.1 Run 11ty build
  - [ ] 10.2 Verify pages generated correctly
  - [ ] 10.3 Test navigation between steps

## Dev Notes

### Architecture Compliance

This story implements basic walkthrough content from Epic 2:

**From Epic 2:**
- Step-by-step guide pages on the portal
- Covers: credentials, login, exploring, editing, DEMO banner, cleanup
- Each step includes descriptive text and screenshots
- Steps are numbered with visible progress

**From UX Design:**
- Uses walkthrough.njk layout with progress bar and step navigation
- GOV.UK Design System patterns
- Accessible navigation (keyboard, screen reader)

### Technical Requirements

**Walkthrough Structure:**
- Uses existing `layouts/walkthrough.njk` layout
- Uses `walkthrough-step.njk` component for step content
- Data in `walkthroughs.yaml` for step metadata

**Required Files:**
- `src/walkthroughs/localgov-drupal/index.njk` - Landing page
- `src/walkthroughs/localgov-drupal/step-1.njk` - Credentials & login
- `src/walkthroughs/localgov-drupal/step-2.njk` - Homepage & navigation
- `src/walkthroughs/localgov-drupal/step-3.njk` - Editing content
- `src/walkthroughs/localgov-drupal/step-4.njk` - DEMO banner
- `src/walkthroughs/localgov-drupal/step-5.njk` - Cleanup
- `src/walkthroughs/localgov-drupal/complete.njk` - Completion page

### Dependencies

- Story 2.2 (Deployment Progress) - Users deploy before walkthrough
- Story 2.3 (Credentials Card) - References credentials card
- Story 1.10 (DEMO Banner) - Explains DEMO banner feature

### References

- Existing walkthrough pattern: `src/walkthroughs/council-chatbot/`
- GOV.UK Design System: https://design-system.service.gov.uk/

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

(To be filled upon completion)

### File List

**Files Created:**
(To be filled upon completion)

**Files Modified:**
(To be filled upon completion)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created | SM Agent |
