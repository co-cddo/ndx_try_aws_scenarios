# Story 20.5: Screenshot Capture & Validation

Status: done

## Story

As a **content maintainer**,
I want **automated screenshots of the FOI Redaction web application**,
so that **walkthroughs and documentation stay current with the deployed UI**.

## Acceptance Criteria

### AC-20.5.1: Screenshot Tests

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.5.1a | Screenshot test file exists | File inspection |
| AC-20.5.1b | Captures initial page state | Test execution |
| AC-20.5.1c | Captures sample document loaded state | Test execution |
| AC-20.5.1d | Captures redaction results | Test execution |

### AC-20.5.2: Screenshot Quality

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.5.2a | Screenshots saved as PNG | File inspection |
| AC-20.5.2b | Desktop viewport (1280x720) | Image inspection |
| AC-20.5.2c | Screenshots in correct directory | File inspection |

## Dependencies

- Stories 20.1-20.4 (FOI Redaction deployed) - DONE

## Definition of Done

- [ ] Screenshot test file created
- [ ] All screenshots captured successfully
- [ ] Screenshots in playwright-screenshots/foi-redaction/
- [ ] Tests pass without errors

## Technical Notes

**Test File:** `tests/screenshots/foi-redaction.spec.ts`
**URL:** `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Test Execution:**
```bash
npx playwright test tests/screenshots/foi-redaction.spec.ts --project=desktop
16 passed (5.9m)
```

**Screenshots Captured:**
- step-1-text-input-interface.png - Initial input form
- step-2-sample-document-loaded.png - Sample FOI text loaded
- step-2-character-count.png - Character counter
- step-3-loading-state.png - Processing spinner
- step-3-redaction-results-summary.png - Results overview
- step-3-summary-cards.png - Metrics cards
- step-4-redacted-document-output.png - Redacted text
- step-4-redaction-markers.png - PII markers
- step-4-redaction-details-table.png - Details table
- step-5-confidence-bars.png - Confidence visualization
- step-5-sandbox-note.png - Info panel
- step-5-full-results.png - Full page capture
- AWS Console screenshots (Lambda, S3, CloudWatch)

**Screenshot Directory:** `src/assets/images/screenshots/foi-redaction/`

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
