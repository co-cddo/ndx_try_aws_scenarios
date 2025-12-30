# Story 2.7: Playwright Screenshot Foundation

Status: done

## Story

As a **developer maintaining the walkthrough**,
I want **automated screenshot capture**,
So that **documentation stays current with minimal manual effort**.

## Acceptance Criteria

1. **Given** a deployed LocalGov Drupal instance
   **When** the Playwright test suite runs
   **Then** screenshots are captured for:
   - Homepage and key navigation pages
   - Admin dashboard
   - Content edit screens
   - DEMO banner visibility
   **And** screenshots are saved with consistent naming convention
   **And** screenshots are stored in the portal assets directory
   **And** a manifest file tracks screenshot metadata (path, description, captured date)
   **And** failed captures are reported clearly

## Tasks / Subtasks

- [x] **Task 1: Create Drupal screenshot test file** (AC: 1)
  - [x] 1.1 Create `tests/drupal-screenshots.spec.ts` for Drupal site captures
  - [x] 1.2 Define test configuration for authenticated Drupal access
  - [x] 1.3 Add environment variable support for DRUPAL_URL, DRUPAL_USER, DRUPAL_PASS
  - [x] 1.4 Create helper functions for login flow

- [x] **Task 2: Implement homepage screenshot capture** (AC: 1)
  - [x] 2.1 Capture LocalGov Drupal homepage (public view)
  - [x] 2.2 Capture key navigation pages (Services, Guides, News)
  - [x] 2.3 Verify DEMO banner is visible in screenshots
  - [x] 2.4 Save to `src/assets/images/screenshots/localgov-drupal/`

- [x] **Task 3: Implement admin dashboard capture** (AC: 1)
  - [x] 3.1 Authenticate with provided credentials
  - [x] 3.2 Capture admin dashboard overview (/admin/content)
  - [x] 3.3 Capture content listing page (/admin/structure/content-types)
  - [x] 3.4 Capture content edit form for a service page (/node/1/edit)

- [x] **Task 4: Create screenshot manifest system** (AC: 1)
  - [x] 4.1 Create `src/_data/screenshots/localgov-drupal.yaml` manifest
  - [x] 4.2 Define schema for screenshot metadata (path, description, captured date)
  - [x] 4.3 Add generateManifest() function to update manifest after capture run
  - [x] 4.4 Integrate manifest with check-screenshots.js (added localgov-drupal to SCENARIOS)

- [x] **Task 5: Implement consistent naming convention** (AC: 1)
  - [x] 5.1 Define naming pattern: `{name}-{viewport}.png`
  - [x] 5.2 Apply desktop (1280x800) and mobile (375x667) viewports
  - [x] 5.3 Document naming convention in test file comments

- [x] **Task 6: Add error handling and reporting** (AC: 1)
  - [x] 6.1 Implement try/catch around screenshot capture
  - [x] 6.2 Log clear error messages for failed captures
  - [x] 6.3 Continue with remaining screenshots on individual failures
  - [x] 6.4 Generate summary report at end of test run

- [x] **Task 7: Add npm scripts for Drupal screenshots** (AC: 1)
  - [x] 7.1 Add `test:drupal-screenshots` script to package.json
  - [x] 7.2 Document required environment variables in test file
  - [x] 7.3 Add example usage in script comments

- [x] **Task 8: Verify and test** (AC: 1)
  - [x] 8.1 Build succeeds (103 files written)
  - [x] 8.2 TypeScript compiles without errors
  - [x] 8.3 Directory structure created for screenshots
  - [x] 8.4 check-screenshots.js includes localgov-drupal scenario

## Dev Notes

### Architecture Compliance

This story creates the Playwright infrastructure for capturing screenshots of deployed LocalGov Drupal sites, enabling documentation automation.

**From Architecture:**
- Playwright for E2E screenshot capture (ADR pattern)
- Tests in `tests/` directory
- Screenshots in `src/assets/images/screenshots/`
- YAML manifests in `src/_data/screenshots/`

**From UX Design Specification:**
- Desktop (1280x800) and mobile (375x667) viewports
- Full page captures for documentation
- DEMO banner must be visible in public screenshots

### Technical Implementation

**Drupal Authentication Flow:**
- Navigate to /user/login
- Enter credentials from environment variables
- Wait for admin dashboard to load
- Capture authenticated pages

**Screenshot Configuration:**
- fullPage: true for content pages
- animations: disabled for consistency
- Wait for networkidle before capture

**Environment Variables:**
- DRUPAL_URL: Base URL of deployed Drupal site
- DRUPAL_USER: Admin username (from CloudFormation outputs)
- DRUPAL_PASS: Admin password (from Secrets Manager)

**Test Skip Behavior:**
- Tests skip automatically if DRUPAL_URL not set
- Admin tests skip if DRUPAL_PASS not set
- Individual capture failures don't fail entire suite

### Dependencies

- Playwright already installed (@playwright/test)
- Existing playwright.config.ts
- Existing check-screenshots.js script
- LocalGov Drupal deployment (Epic 1)

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.7]
- [Pattern: tests/screenshot-capture.spec.ts] - Existing screenshot test patterns
- [Pattern: scripts/check-screenshots.js] - Screenshot validation script
- [Config: playwright.config.ts] - Existing Playwright configuration

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- Created tests/drupal-screenshots.spec.ts with full Playwright test suite
- Tests capture public pages (homepage, services, guides, news) and admin pages
- Includes DEMO banner verification and close-up capture
- Authentication flow with environment variable credentials
- Manifest auto-generation after test run
- Summary report with capture statistics
- Added test:drupal-screenshots npm script
- Updated check-screenshots.js to include localgov-drupal scenario
- Created screenshot directory and initial manifest file

### File List

**Files Created:**
- tests/drupal-screenshots.spec.ts
- src/_data/screenshots/localgov-drupal.yaml
- src/assets/images/screenshots/localgov-drupal/.gitkeep

**Files Modified:**
- package.json (added test:drupal-screenshots script)
- scripts/check-screenshots.js (added localgov-drupal to SCENARIOS)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created | SM Agent |
| 2025-12-30 | Story implemented - Playwright screenshot foundation complete | Dev Agent |
| 2025-12-30 | Senior Developer Review notes appended | AI Reviewer |

## Senior Developer Review (AI)

### Reviewer
AI Code Review Agent

### Date
2025-12-30

### Outcome
**APPROVE** - All acceptance criteria implemented with proper patterns.

### Summary
Story 2.7 (Playwright Screenshot Foundation) has been successfully implemented with:
- Drupal screenshot test suite for public and admin pages
- Environment variable configuration for flexible deployment targeting
- Automatic manifest generation with screenshot metadata
- Error handling with graceful degradation
- Integration with existing screenshot validation infrastructure

### Key Findings

**No HIGH or MEDIUM severity findings.**

**LOW severity observations:**
- Note: Login occurs per-test for admin pages (acceptable for isolation)
- Note: DEMO banner test uses flexible selector with OR pattern (good defensive approach)
- Note: Manifest overwrites on each run rather than appending (correct behavior for automation)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1-a | Screenshots captured for homepage and navigation pages | IMPLEMENTED | drupal-screenshots.spec.ts:46-67 (publicPages array) |
| AC1-b | Screenshots captured for admin dashboard | IMPLEMENTED | drupal-screenshots.spec.ts:72-88 (adminPages array) |
| AC1-c | Screenshots captured for content edit screens | IMPLEMENTED | drupal-screenshots.spec.ts:83-87 (/node/1/edit) |
| AC1-d | DEMO banner visibility check | IMPLEMENTED | drupal-screenshots.spec.ts:196-216 (checkDemoBanner) |
| AC1-e | Consistent naming convention | IMPLEMENTED | drupal-screenshots.spec.ts:158 ({name}-{viewport}.png) |
| AC1-f | Screenshots stored in portal assets directory | IMPLEMENTED | drupal-screenshots.spec.ts:30 (SCREENSHOT_DIR) |
| AC1-g | Manifest file tracks metadata | IMPLEMENTED | drupal-screenshots.spec.ts:221-257 (generateManifest) |
| AC1-h | Failed captures reported clearly | IMPLEMENTED | drupal-screenshots.spec.ts:187-189 (error logging) |

**Summary: 8 of 8 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create Drupal screenshot test file | [x] | VERIFIED | tests/drupal-screenshots.spec.ts (388 lines) |
| Task 2: Implement homepage screenshot capture | [x] | VERIFIED | publicPages array, captureScreenshot function |
| Task 3: Implement admin dashboard capture | [x] | VERIFIED | adminPages array, loginToDrupal function |
| Task 4: Create screenshot manifest system | [x] | VERIFIED | generateManifest(), localgov-drupal.yaml |
| Task 5: Implement consistent naming convention | [x] | VERIFIED | {name}-{viewport}.png pattern |
| Task 6: Add error handling and reporting | [x] | VERIFIED | try/catch, console logging, Summary Report |
| Task 7: Add npm scripts | [x] | VERIFIED | package.json:18 test:drupal-screenshots |
| Task 8: Verify and test | [x] | VERIFIED | Build succeeds, TypeScript compiles |

**Summary: 8 of 8 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- Playwright test infrastructure properly configured
- Tests skip gracefully when DRUPAL_URL not set
- Admin tests skip when DRUPAL_PASS not set
- Cannot run actual screenshot capture without deployed Drupal (expected)

### Architectural Alignment

- ✅ Follows existing Playwright patterns from screenshot-capture.spec.ts
- ✅ Uses environment variables for configuration
- ✅ YAML manifest matches existing pattern in src/_data/screenshots/
- ✅ Integrated with check-screenshots.js validation
- ✅ TypeScript with proper typing

### Security Notes

- Credentials passed via environment variables (not hardcoded)
- DRUPAL_PASS not logged
- No secrets exposed in manifest file

### Best-Practices and References

- [Playwright Test Documentation](https://playwright.dev/docs/test-configuration)
- [Existing Pattern: tests/screenshot-capture.spec.ts]
- [Existing Pattern: scripts/check-screenshots.js]

### Action Items

**Advisory Notes (no code changes required):**
- Note: Consider adding retry logic for flaky network conditions in production use
- Note: Future enhancement could add viewport size validation before capture
