# Story 20.6: Comprehensive Test Suite

Status: done

## Story

As a **developer maintaining the FOI Redaction app**,
I want **comprehensive automated tests covering all functionality**,
so that **regressions are caught early and deployments are reliable**.

## Acceptance Criteria

### AC-20.6.1: E2E Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.6.1a | Page load without JavaScript errors | Playwright test |
| AC-20.6.1b | Textarea visible and styled | Playwright test |
| AC-20.6.1c | Sample document button works | Playwright test |
| AC-20.6.1d | Redact button enables after text entry | Playwright test |
| AC-20.6.1e | Loading state displays during API call | Playwright test |
| AC-20.6.1f | Results display with all fields | Playwright test |

### AC-20.6.2: Accessibility Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.6.2a | No axe-core critical violations | Accessibility test |
| AC-20.6.2b | Skip link present and functional | Keyboard test |
| AC-20.6.2c | Proper ARIA attributes | ARIA inspection |
| AC-20.6.2d | Keyboard navigation works | Keyboard test |

### AC-20.6.3: API Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.6.3a | GET returns HTML | API test |
| AC-20.6.3b | POST returns JSON with redactedText | API test |
| AC-20.6.3c | POST returns JSON with redactions array | API test |

## Dependencies

- Stories 20.1-20.5 (FOI Redaction implemented) - DONE

## Definition of Done

- [x] E2E test file created
- [x] All tests pass (0 failures)
- [x] Accessibility tests pass
- [x] Code review approved

## Technical Notes

**Test File:** `tests/e2e/foi-redaction-ui.spec.ts`
**URL:** `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Test Execution:**
```bash
npx playwright test tests/e2e/foi-redaction-ui.spec.ts --project=desktop
38 passed (38.8s)
```

**Test Coverage:**
- Page Load: 8 tests
- Text Input Workflow: 4 tests
- Redaction Workflow: 9 tests
- Accessibility: 6 tests (axe-core, skip link, ARIA)
- Keyboard Navigation: 4 tests
- API Integration: 5 tests
- Mobile Viewport: 2 tests

**Accessibility Fix Applied:**
Added `tabindex="0"` to `#redactedOutput` div in CloudFormation template (line 504) to fix scrollable region keyboard accessibility issue.

**Stack Redeployed:** `ndx-try-foi-redaction`

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
