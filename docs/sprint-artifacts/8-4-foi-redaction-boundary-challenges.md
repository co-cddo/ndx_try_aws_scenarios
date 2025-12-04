# Story 8.4: FOI Redaction Boundary Challenges

## Story Details
- **Epic:** 8 - FOI Redaction Exploration
- **Status:** Done
- **Priority:** Medium

## User Story
As a council officer, I want to test the limits of PII detection so I understand edge cases and when human review is essential.

## Acceptance Criteria
- [x] 3 boundary challenges covering edge cases
- [x] Challenge 1: Zero PII Document - Clean document handling
- [x] Challenge 2: High PII Density Document - Performance with many entities
- [x] Challenge 3: Unusual Encodings - Non-standard text formats
- [x] Each challenge has learning objective, expected behavior, business implication
- [x] Recovery guidance for each challenge
- [x] Progress tracking and completion marking

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/foi-redaction.yaml` - 3 limit challenge definitions
- `src/walkthroughs/foi-redaction/explore/limits.njk` - Limits page

### Challenge Details
1. **Zero PII Document**
   - Learning: System handles clean documents gracefully
   - Expected: No entities flagged, processing completes
   - Implication: Faster processing for non-sensitive documents

2. **High PII Density Document**
   - Learning: Performance with many PII entities
   - Expected: All entities detected, may require pagination
   - Implication: Complex documents need review workflow

3. **Unusual Encodings**
   - Learning: UTF-8 vs other encodings
   - Expected: May miss entities in non-standard encodings
   - Implication: Pre-processing may be needed

### Technical Details
- Reuses limit challenge card styling from Epic 6
- Safe-badge component for reassurance
- Recovery instructions in expandable details
- Progress bar with completion tracking

## Completion Notes
- Completed: 2025-11-28
- Build verified: 79 files
- All challenges render correctly
