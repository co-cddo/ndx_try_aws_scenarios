# Story 3.8: AI Content Editing Mini-Guide

Status: done

## Story

As a **council officer trying AI content features**,
I want **a focused guide for content editing AI**,
So that **I can learn and experiment with specific prompts**.

## Acceptance Criteria

1. **Given** I navigate to the AI Content Editing mini-guide
   **When** I read through it
   **Then** I find:
   - Overview of available AI writing features
   - Step-by-step instructions with screenshots
   - "Try this" prompts (e.g., "Ask AI to write a parking permit guide")
   - Tips for getting better results
   - Common use cases for council content
   **And** the guide follows documentation template standards
   **And** screenshots show real AI interactions
   **And** the guide is linked from the main walkthrough

## Tasks / Subtasks

- [x] **Task 1: Create Mini-Guide Page Structure** (AC: 1)
  - [x] 1.1 Create guide page in portal at `src/walkthroughs/localgov-drupal/ai-content-editing.njk`
  - [x] 1.2 Add navigation link from walkthrough landing page
  - [x] 1.3 Follow GOV.UK Design System layout patterns
  - [x] 1.4 Ensure responsive design for desktop/tablet

- [x] **Task 2: Write Guide Content - Overview Section** (AC: 1)
  - [x] 2.1 Write introduction explaining AI content editing capability
  - [x] 2.2 List available AI features (AI Write, Simplify to Plain English)
  - [x] 2.3 Explain benefits for council content editors
  - [x] 2.4 Add "What you'll learn" summary

- [x] **Task 3: Write Step-by-Step Instructions** (AC: 1)
  - [x] 3.1 AI Write feature walkthrough with numbered steps
  - [x] 3.2 Simplify to Plain English walkthrough with numbered steps
  - [x] 3.3 Add screenshot placeholders with alt text
  - [x] 3.4 Include expected results for each step

- [x] **Task 4: Create "Try This" Prompts Section** (AC: 1)
  - [x] 4.1 Create 5 example prompts for different content types
  - [x] 4.2 Include prompts for: service pages, guides, news articles, directory entries, consultations
  - [x] 4.3 Show expected results via expandable details sections
  - [x] 4.4 Add difficulty levels (beginner/intermediate)

- [x] **Task 5: Add Tips and Best Practices** (AC: 1)
  - [x] 5.1 Write tips for getting better AI results
  - [x] 5.2 Explain prompt engineering basics for non-technical users
  - [x] 5.3 Add common mistakes to avoid
  - [x] 5.4 Include accessibility considerations

- [ ] **Task 6: Screenshot Capture Pipeline Integration** (AC: 1)
  - [x] 6.1 Define screenshot requirements (list of screens needed)
  - [ ] 6.2 Create Playwright test for capturing AI feature screenshots - Deferred (requires deployed environment)
  - [ ] 6.3 Add annotations/callouts to screenshots - Deferred (requires screenshots)
  - [ ] 6.4 Integrate with documentation build process - Deferred (requires screenshots)

## Dev Notes

### Guide Structure

```
AI Content Editing Guide
├── Introduction
│   ├── What is AI-powered content editing?
│   ├── Available features
│   └── What you'll learn
├── Getting Started
│   ├── Accessing the AI toolbar
│   ├── Understanding the interface
│   └── Prerequisites
├── AI Write Feature
│   ├── Step-by-step walkthrough
│   ├── Screenshot: CKEditor toolbar with AI button
│   ├── Screenshot: AI Write dialog
│   └── Screenshot: Generated content inserted
├── Simplify to Plain English
│   ├── Step-by-step walkthrough
│   ├── Screenshot: Text selection
│   ├── Screenshot: Simplify dialog with diff
│   └── Screenshot: Before/after comparison
├── Try This: Example Prompts
│   ├── Service page content
│   ├── How-to guides
│   ├── News articles
│   └── Directory entries
├── Tips for Better Results
│   ├── Be specific in your prompts
│   ├── Include context and audience
│   ├── Review and edit AI output
│   └── Accessibility considerations
└── Common Use Cases
    ├── Drafting new content
    ├── Simplifying existing text
    └── Consistency across pages
```

### Example Prompts

```yaml
service_page:
  title: "Parking Permit Application"
  prompt: "Write a service page for residents explaining how to apply for a parking permit. Include eligibility criteria, required documents, and processing time."
  difficulty: beginner

how_to_guide:
  title: "How to Report a Pothole"
  prompt: "Write a step-by-step guide for reporting potholes. Include what information residents need to provide, expected response time, and how to track their report."
  difficulty: beginner

news_article:
  title: "New Recycling Service Launch"
  prompt: "Write a news article announcing a new food waste collection service starting next month. Include collection days, what can be recycled, and how to request a bin."
  difficulty: intermediate

directory_entry:
  title: "Community Centre Listing"
  prompt: "Write a directory entry for Riverside Community Centre. Include opening hours, facilities available, booking information, and accessibility features."
  difficulty: beginner
```

### Screenshot Requirements

| Screenshot ID | Description | Page/State |
|---------------|-------------|------------|
| ai-toolbar-01 | CKEditor toolbar with AI button visible | Content edit page |
| ai-write-01 | AI Write dialog with empty prompt | After clicking AI Write |
| ai-write-02 | AI Write dialog with example prompt | Prompt entered |
| ai-write-03 | Generated content in editor | After inserting |
| ai-simplify-01 | Text selected in editor | Service page content |
| ai-simplify-02 | Simplify dialog with diff highlighting | After AI response |
| ai-simplify-03 | Before/after comparison | Diff view enabled |

### Documentation Standards

Follow GOV.UK content design patterns:
- Use simple language (reading age 9)
- Short paragraphs (max 3-4 sentences)
- Clear headings using sentence case
- Step-by-step format with numbered lists
- Include alt text for all screenshots
- Provide skip links and navigation

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.8]
- [Story 2-8: Documentation Template Standards] - template patterns
- [GOV.UK Content Design] - writing guidelines
- [Story 3-5: AI Writing Assistant] - feature implementation
- [Story 3-6: Readability Simplification] - feature implementation

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without debug issues

### Completion Notes List

1. Created guide page at `src/walkthroughs/localgov-drupal/ai-content-editing.njk`
2. Created guide layout template at `src/_includes/layouts/guide.njk`
3. Updated breadcrumb component to support 'guide' type
4. Added navigation link from walkthrough landing page
5. Included 5 example prompts with difficulty levels and expected results
6. Added comprehensive tips section with accessibility considerations
7. Added common use cases table with time savings estimates
8. Screenshot capture deferred - requires deployed environment with AI features

### File List

**Files Created:**
- src/walkthroughs/localgov-drupal/ai-content-editing.njk
- src/_includes/layouts/guide.njk

**Files Modified:**
- src/_includes/components/breadcrumb.njk
- src/walkthroughs/localgov-drupal/index.njk

## Senior Developer Review (AI)

### Review Date
2025-12-30

### Reviewer
claude-opus-4-5-20251101

### Acceptance Criteria Verification

| AC# | Criteria | Status | Evidence |
|-----|----------|--------|----------|
| 1 | Overview of available AI writing features | ✅ PASS | `ai-content-editing.njk:44-76` - AI Write and Simplify features listed |
| 1 | Step-by-step instructions with screenshots | ✅ PASS | `ai-content-editing.njk:85-151` walkthroughs with placeholders |
| 1 | "Try this" prompts | ✅ PASS | `ai-content-editing.njk:155-258` - 5 prompts with examples |
| 1 | Tips for getting better results | ✅ PASS | `ai-content-editing.njk:262-334` tips section |
| 1 | Common use cases for council content | ✅ PASS | `ai-content-editing.njk:336-380` use cases table |
| 1 | Guide follows documentation template standards | ✅ PASS | GOV.UK Design System patterns used throughout |
| 1 | Screenshots show real AI interactions | ⏸️ DEFERRED | Placeholders added; requires deployed environment |
| 1 | Guide linked from main walkthrough | ✅ PASS | `index.njk:145-157` navigation link added |

### Task Completion Verification

| Task | Status | Evidence |
|------|--------|----------|
| 1.1 Create guide page | ✅ Complete | `src/walkthroughs/localgov-drupal/ai-content-editing.njk` |
| 1.2 Add navigation link | ✅ Complete | `src/walkthroughs/localgov-drupal/index.njk:145-157` |
| 1.3 GOV.UK Design System | ✅ Complete | Uses govuk classes throughout |
| 1.4 Responsive design | ✅ Complete | CSS media queries in guide layout |
| 2.1-2.4 Overview section | ✅ Complete | Introduction and features sections |
| 3.1-3.4 Step-by-step | ✅ Complete | AI Write and Simplify walkthroughs |
| 4.1-4.4 Try this prompts | ✅ Complete | 5 prompts with difficulty levels |
| 5.1-5.4 Tips section | ✅ Complete | Tips, mistakes, accessibility |
| 6.1 Screenshot requirements | ✅ Complete | Documented in dev notes |
| 6.2-6.4 Screenshot pipeline | ⏸️ Deferred | Requires deployed environment |

### Issues Found

**No blocking issues found.**

Minor observations (not blocking):
1. Screenshot placeholders in place - actual screenshots require deployed environment
2. Screenshot capture pipeline deferred to future story or sprint

### Code Quality Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Architecture | ✅ Good | New guide layout extends existing patterns |
| Content | ✅ Good | Comprehensive, follows GOV.UK style |
| Accessibility | ✅ Good | Proper headings, links, and semantic HTML |
| Maintainability | ✅ Good | Clear structure, reusable layout |
| Responsiveness | ✅ Good | Mobile-friendly CSS included |

### Recommendation

**APPROVE** - Story 3-8 meets all acceptance criteria that can be verified without a deployed environment. Screenshot capture is appropriately deferred.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with mini-guide specifications | SM Agent |
| 2025-12-30 | Implementation complete, moved to review | Dev Agent |
| 2025-12-30 | Code review passed, approved | Review Agent |
