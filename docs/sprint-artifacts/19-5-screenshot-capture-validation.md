# Story 19.5: Screenshot Capture & Validation

Status: done

## Story

As a **NDX:Try content maintainer**,
I want **automated screenshots of the Planning AI web interface**,
so that **walkthroughs show accurate UI visuals**.

## Acceptance Criteria

### AC-19.5.1: Screenshot Coverage

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.5.1a | Initial upload interface captured | File exists |
| AC-19.5.1b | Sample document selected state captured | File exists |
| AC-19.5.1c | Loading/analyzing state captured | File exists |
| AC-19.5.1d | Results with extracted data captured | File exists |
| AC-19.5.1e | Results with analysis/recommendation captured | File exists |

### AC-19.5.2: Screenshot Quality

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.5.2a | High resolution (1920x1080 minimum) | File inspection |
| AC-19.5.2b | PNG format for quality | File format |
| AC-19.5.2c | File size reasonable (<500KB) | File size |
| AC-19.5.2d | UI elements clearly visible | Visual inspection |

### AC-19.5.3: Playwright Test

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.5.3a | Test file exists at tests/screenshots/planning-ai.spec.ts | File check |
| AC-19.5.3b | All tests pass | Test execution |
| AC-19.5.3c | Screenshots saved to correct directory | File location |

## Tasks / Subtasks

- [ ] Task 1: Create Playwright test file
  - [ ] 1.1 Create tests/screenshots/planning-ai.spec.ts
  - [ ] 1.2 Configure viewport for screenshots
  - [ ] 1.3 Add screenshot capture for each state

- [ ] Task 2: Capture screenshots
  - [ ] 2.1 Initial page load
  - [ ] 2.2 Sample document selected
  - [ ] 2.3 Loading state
  - [ ] 2.4 Results display

- [ ] Task 3: Verify screenshots
  - [ ] 3.1 Run playwright test
  - [ ] 3.2 Check file sizes and quality
  - [ ] 3.3 Copy to walkthrough assets

## Technical Notes

**Screenshot Directory:** `src/assets/images/screenshots/planning-ai/`

**Playwright Test Structure:**
```typescript
import { test, expect } from '@playwright/test';

const PLANNING_AI_URL = 'https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/';
const SCREENSHOT_DIR = 'src/assets/images/screenshots/planning-ai/';

test.describe('Planning AI Screenshot Capture', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('captures upload interface', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}01-upload-interface.png` });
  });
});
```

## Dependencies

- Story 19.4 (CloudFormation deployed) - DONE
- Playwright installed

## Definition of Done

- [ ] Playwright test file created
- [ ] All screenshots captured
- [ ] Screenshots saved to correct directory
- [ ] Code review approved

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Files Modified:**
- `tests/screenshots/planning-ai.spec.ts` - Updated with proper UI state captures

**Test Execution:**
```bash
npx playwright test tests/screenshots/planning-ai.spec.ts --project=desktop
16 passed (1.0m)
```

**Screenshots Captured:**

1. **Walkthrough Steps**
   - `step-1-cloudformation-outputs.png` - CloudFormation stack outputs
   - `step-1-application-interface.png` - Initial page load
   - `step-2-upload-interface.png` - Drag-and-drop zone visible
   - `step-2-sample-selected.png` - Sample document selected state (NEW)
   - `step-2-processing-status.png` - Loading spinner during analysis
   - `step-3-extraction-results.png` - Extracted data grid
   - `step-3-analysis-recommendation.png` - AI recommendation badge (NEW)
   - `step-3-issues-recommendations.png` - Issues and recommendations lists (NEW)
   - `step-4-full-results.png` - Complete results view (NEW)
   - `step-4-textract-console.png` - Lambda function console

2. **Exploration Screenshots**
   - `explore-architecture-overview.png` - CloudFormation resources
   - `explore-textract-detail.png` - Lambda functions list
   - `explore-custom-queries.png` - Function configuration
   - `explore-different-documents.png` - S3 bucket contents
   - `explore-accuracy-testing.png` - Application interface
   - `explore-production-considerations.png` - CloudWatch logs

**Key Test Updates:**
- Added proper UI interaction (click sample button, analyze, wait for results)
- Capture loading state mid-animation
- Scroll to specific sections for focused screenshots
- Wait for selectors (.results.visible, .recommendation) before capture

---

_Story created: 2025-11-30_
_Epic: 19 - Planning Application AI Web Application_
