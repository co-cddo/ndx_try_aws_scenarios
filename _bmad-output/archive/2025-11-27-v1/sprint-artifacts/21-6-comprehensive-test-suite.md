# Story 21.6: Comprehensive Test Suite

Status: done

## Story

As a **developer maintaining the Smart Car Park app**,
I want **comprehensive automated tests covering all functionality**,
so that **regressions are caught early and deployments are reliable**.

## Acceptance Criteria

### AC-21.6.1: E2E Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-21.6.1a | Page load without JavaScript errors | Playwright test |
| AC-21.6.1b | Dashboard displays 4 car park cards | Playwright test |
| AC-21.6.1c | Summary panel shows metrics | Playwright test |
| AC-21.6.1d | Refresh button updates data | Playwright test |
| AC-21.6.1e | Simulate button generates new data | Playwright test |
| AC-21.6.1f | Auto-refresh toggle works | Playwright test |

### AC-21.6.2: Accessibility Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-21.6.2a | No axe-core critical violations | Accessibility test |
| AC-21.6.2b | Skip link present and functional | Keyboard test |
| AC-21.6.2c | Proper ARIA attributes on progress bars | ARIA inspection |
| AC-21.6.2d | Keyboard navigation works | Keyboard test |
| AC-21.6.2e | Color contrast meets WCAG 4.5:1 | Color contrast test |

### AC-21.6.3: API Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-21.6.3a | GET returns HTML | API test |
| AC-21.6.3b | POST returns JSON with carParks array | API test |
| AC-21.6.3c | POST returns totalCapacity (1050) | API test |
| AC-21.6.3d | Simulate action returns success | API test |

## Dependencies

- Stories 21.1-21.5 (Smart Car Park implemented) - DONE

## Definition of Done

- [x] E2E test file created
- [x] All 39 tests pass (0 failures)
- [x] Accessibility tests pass
- [x] Code review approved

## Technical Notes

**Test File:** `tests/e2e/smart-car-park-ui.spec.ts`
**URL:** `https://bg5qycgpwjzibzdtd2f2i6rzsu0rvxha.lambda-url.us-west-2.on.aws/`

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Test Execution:**
```bash
npx playwright test tests/e2e/smart-car-park-ui.spec.ts --project=desktop
39 passed (43.0s)
```

**Test Coverage:**
- Page Load: 9 tests
- Car Park Cards: 6 tests
- Interactions: 4 tests
- Accessibility: 6 tests (axe-core, skip link, ARIA)
- Keyboard Navigation: 4 tests
- API Integration: 6 tests
- Mobile Viewport: 4 tests

**Accessibility Fixes Applied:**
1. Added `aria-label` to progress bars: `aria-label="${carPark.name} occupancy ${carPark.percentFull} percent"`
2. Fixed amber badge color contrast by adding `color: #0b0c0c` for dark text on #f47738 background (5.59:1 ratio)

**Mobile Test Fix:**
Changed `await refreshBtn.tap()` to `await refreshBtn.click()` as tap() requires hasTouch context.

**Stack Redeployed:** `ndx-try-smart-car-park`

---

_Story created: 2025-11-30_
_Epic: 21 - Smart Car Park IoT Web Application_
