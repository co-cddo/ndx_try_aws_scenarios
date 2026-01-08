# Story 6.6: Council Chatbot Screenshot Automation Pipeline

Status: done

## Story

As a **developer maintaining the exploration pages**,
I want **automated screenshot capture and visual regression testing**,
so that **screenshots stay current and UI regressions are caught early**.

## Acceptance Criteria

1. **Given** the Council Chatbot scenario is deployed, **When** the screenshot automation pipeline runs, **Then** Playwright navigates to each exploration step

2. **Given** screenshots are captured, **Then** they are saved at 1280x800 desktop and 375x667 mobile viewports

3. **Given** screenshots are generated, **Then** they are saved to `src/assets/images/walkthroughs/council-chatbot/explore/`

4. **Given** screenshot naming, **Then** format is `{step}-{description}-{viewport}.png`

5. **Given** pipeline triggers, **Then** it runs on: deployment, weekly schedule, manual trigger

6. **Given** file sizes, **Then** each is <500KB

7. **Given** visual regression testing, **Then** >10% diff is flagged

8. **Given** pipeline documentation, **Then** CONTRIBUTING.md is updated

## Tasks / Subtasks

- [x] Task 1: Create GitHub Actions workflow
  - [x] Create `.github/workflows/screenshot-capture.yml`
  - [x] Configure triggers: deployment, weekly, manual

- [x] Task 2: Create Playwright screenshot tests
  - [x] Create `tests/screenshot-capture.spec.ts`
  - [x] Capture exploration pages at desktop and mobile viewports

- [x] Task 3: Create visual regression tests
  - [x] Create `tests/visual-regression.spec.ts`
  - [x] Configure 10% diff threshold

- [x] Task 4: Update documentation
  - [x] Document pipeline in docs/screenshot-pipeline.md

## Dev Notes

This pipeline serves as shared infrastructure for Epic 7-11 screenshot automation.

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6.md#Story-6.6]
- Decision 7 Alignment: Screenshot Automation Pipeline

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-6.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created GitHub Actions workflow with 3 triggers: deployment, weekly, manual
2. Added Playwright and http-server as dev dependencies
3. Created playwright.config.ts with desktop (1280x800) and mobile (375x667) viewports
4. Screenshot tests capture all exploration pages at both viewports
5. Visual regression tests use 10% diff threshold
6. Interactive state screenshots capture expanded cards, tabs, challenges
7. Pipeline validates file sizes <500KB
8. Comprehensive documentation in docs/screenshot-pipeline.md

### File List

**Created:**
- `.github/workflows/screenshot-capture.yml` - GitHub Actions workflow
- `playwright.config.ts` - Playwright configuration
- `tests/screenshot-capture.spec.ts` - Screenshot capture tests
- `tests/visual-regression.spec.ts` - Visual regression tests
- `docs/screenshot-pipeline.md` - Pipeline documentation
- `src/assets/images/walkthroughs/council-chatbot/explore/.gitkeep` - Output directory

**Modified:**
- `package.json` - Added Playwright, http-server, and test scripts
