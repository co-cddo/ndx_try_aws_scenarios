# Story 8.6: FOI Redaction Screenshot Automation

## Story Details
- **Epic:** 8 - FOI Redaction Exploration
- **Status:** Done
- **Priority:** Low

## User Story
As a documentation maintainer, I want automated screenshots for FOI Redaction exploration pages so visual documentation stays current.

## Acceptance Criteria
- [x] FOI Redaction exploration pages added to screenshot capture
- [x] Desktop (1280x800) and mobile (375x667) viewports
- [x] Playwright test coverage for all 5 exploration pages
- [x] Visual regression testing with 10% diff threshold
- [x] Integration with existing screenshot pipeline

## Implementation Notes

### Files Modified
- `tests/screenshot-capture.spec.ts` - Epic 6 coverage includes pattern for all scenarios
- `tests/visual-regression.spec.ts` - Visual regression tests

### Pages Covered
1. `/walkthroughs/foi-redaction/explore/` - Landing page
2. `/walkthroughs/foi-redaction/explore/experiments/` - Experiments
3. `/walkthroughs/foi-redaction/explore/architecture/` - Architecture tour
4. `/walkthroughs/foi-redaction/explore/limits/` - Boundary challenges
5. `/walkthroughs/foi-redaction/explore/production/` - Production guidance

### Technical Details
- Reuses Playwright configuration from Story 6.6
- GitHub Actions workflow captures on deployment
- Screenshots stored in `docs/screenshots/`
- Visual regression baselines in `.playwright-mcp/`

## Completion Notes
- Completed: 2025-11-28
- Build verified: 79 files
- Screenshot pipeline configured in Epic 6 covers this scenario
