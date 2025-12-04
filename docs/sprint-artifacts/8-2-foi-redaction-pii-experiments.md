# Story 8.2: FOI Redaction PII Detection Experiments

## Story Details
- **Epic:** 8 - FOI Redaction Exploration
- **Status:** Done
- **Priority:** High

## User Story
As a council officer exploring FOI redaction, I want 5 guided experiments so I can understand how PII detection works with different data types.

## Acceptance Criteria
- [x] 5 guided experiments covering PII detection scenarios
- [x] Experiment 1: Obvious PII Detection (names, addresses, phone numbers)
- [x] Experiment 2: Subtle PII Detection (email signatures, dates)
- [x] Experiment 3: False Positive Identification
- [x] Experiment 4: Confidence Threshold Adjustment
- [x] Experiment 5: Before/After Redaction Comparison
- [x] Each experiment has learning objective, steps, expected outcome
- [x] Progress tracking per experiment
- [x] Completion marking functionality

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/foi-redaction.yaml` - 5 experiment definitions
- `src/walkthroughs/foi-redaction/explore/experiments.njk` - Experiments page

### Experiment Details
1. **Obvious PII Detection** - Standard PII types reliably detected
2. **Subtle PII Detection** - Context-dependent PII requiring attention
3. **False Positive Identification** - Non-PII flagged as PII
4. **Threshold Adjustment** - Impact of confidence thresholds
5. **Before/After Comparison** - Visual redaction verification

### Technical Details
- Reuses `experiment-card.njk` component from Epic 6
- Progress bar showing completion status
- LocalStorage tracking for each experiment
- GOV.UK accessible patterns

## Completion Notes
- Completed: 2025-11-28
- Build verified: 79 files
- All experiments render correctly
