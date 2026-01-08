# Story 2.10: Cleanup Instructions

Status: done

## Story

As a **council officer finished with the demo**,
I want **clear stack deletion guidance**,
So that **I don't incur ongoing AWS costs**.

## Acceptance Criteria

1. **Given** I am ready to end my demo session
   **When** I navigate to the cleanup section
   **Then** I find:
   - Step-by-step CloudFormation deletion instructions
   - Direct link to CloudFormation console filtered to my stack
   - Warning about data loss (EFS files, database)
   - Confirmation that costs stop after deletion
   - Estimated cleanup time
   **And** instructions include screenshots of the deletion process
   **And** common errors (e.g., non-empty S3 buckets) are addressed

## Tasks / Subtasks

- [x] **Task 1: Cleanup component** (AC: 1)
  - [x] 1.1 Create `src/_includes/components/cleanup-instructions.njk`
  - [x] 1.2 Add step-by-step numbered list for CloudFormation deletion
  - [x] 1.3 Add direct link to CloudFormation console (us-east-1)
  - [x] 1.4 Include estimated cleanup time (5-10 minutes)

- [x] **Task 2: Warning and data loss information** (AC: 1)
  - [x] 2.1 Add warning callout about data loss (EFS, RDS)
  - [x] 2.2 Add confirmation that costs stop after deletion
  - [x] 2.3 Include inset text about 2-hour auto-delete

- [x] **Task 3: Common errors and troubleshooting** (AC: 1)
  - [x] 3.1 Add expandable details section for common issues
  - [x] 3.2 Include S3 bucket non-empty error and resolution
  - [x] 3.3 Include Lambda function cleanup if needed
  - [x] 3.4 Add link to AWS support if stuck

- [x] **Task 4: Screenshots placeholder** (AC: 1)
  - [x] 4.1 Add screenshot placeholders for deletion process
  - [x] 4.2 Reference Playwright screenshot foundation for future capture
  - [x] 4.3 Use consistent image styling from docs templates

- [x] **Task 5: Integration with walkthrough pages** (AC: 1)
  - [x] 5.1 Add cleanup section to complete.njk pages
  - [x] 5.2 Ensure cleanup is visible on all scenario walkthroughs
  - [x] 5.3 Link from evidence pack page sidebar

## Dev Notes

### Architecture Compliance

This story provides clear cleanup guidance as specified in Epic 2.

**From Epic 2 Notes:**
- Cleanup Instructions ensure users don't incur ongoing costs
- 2-hour auto-delete provides safety net
- Clear stack deletion process

**From UX Design Specification:**
- Warning callout pattern for data loss
- Expandable details for troubleshooting
- Direct console links for quick action

### Technical Implementation

**Technology Stack:**
- 11ty/Nunjucks components
- GOV.UK Design System patterns (warning text, details, inset text)
- Static screenshot placeholders

**Existing Patterns:**
- Warning text already in complete.njk
- Cleanup section exists but needs enhancement
- CloudFormation console links already present

### Dependencies

- Story 2.4 (Basic Walkthrough Content) - Walkthrough pages
- Story 2.7 (Playwright Screenshot Foundation) - Screenshot capture for docs

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.10]
- [CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
- [GOV.UK Warning Text](https://design-system.service.gov.uk/components/warning-text/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation proceeded without errors

### Completion Notes List

1. Created reusable `cleanup-instructions.njk` component with:
   - Step-by-step CloudFormation deletion instructions (5 numbered steps)
   - Direct console link to us-east-1 CloudFormation stacks
   - GOV.UK warning text pattern for data loss (RDS, EFS)
   - Cost confirmation panel confirming charges stop after deletion
   - Inset text explaining 2-hour auto-delete safety net
   - Three expandable troubleshooting sections (DELETE_FAILED, can't find stack, keep exploring)
   - Screenshot placeholders for future Playwright capture
   - WCAG 2.2 AA compliant with proper ARIA attributes

2. Integrated component into all 7 scenario complete pages:
   - localgov-drupal/complete.njk
   - council-chatbot/complete.njk
   - foi-redaction/complete.njk
   - planning-ai/complete.njk
   - text-to-speech/complete.njk
   - smart-car-park/complete.njk
   - quicksight-dashboard/complete.njk

3. Removed duplicated inline cleanup sections from each page, replacing with single component include

4. Component uses `scenarioId` variable from page frontmatter for stack name prefix

### File List

**Files Created:**
- src/_includes/components/cleanup-instructions.njk

**Files Modified:**
- src/walkthroughs/localgov-drupal/complete.njk
- src/walkthroughs/council-chatbot/complete.njk
- src/walkthroughs/foi-redaction/complete.njk
- src/walkthroughs/planning-ai/complete.njk
- src/walkthroughs/text-to-speech/complete.njk
- src/walkthroughs/smart-car-park/complete.njk
- src/walkthroughs/quicksight-dashboard/complete.njk

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created | SM Agent |
| 2025-12-30 | Implementation complete - reusable cleanup component | Dev Agent |
