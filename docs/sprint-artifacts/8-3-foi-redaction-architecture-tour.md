# Story 8.3: FOI Redaction Architecture Tour

## Story Details
- **Epic:** 8 - FOI Redaction Exploration
- **Status:** Done
- **Priority:** Medium

## User Story
As a technical user exploring FOI redaction, I want visual and console tours so I can understand how the PII detection and redaction workflow operates.

## Acceptance Criteria
- [x] Architecture page at `/walkthroughs/foi-redaction/explore/architecture/`
- [x] Visual tour with step-by-step explanation
- [x] Console tour with AWS Console deep links
- [x] GOV.UK tabs for tour selection
- [x] Completion tracking for each tour
- [x] Links to next exploration sections

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/foi-redaction.yaml` - Architecture tour definitions
- `src/walkthroughs/foi-redaction/explore/architecture.njk` - Architecture page

### Visual Tour Steps
1. Document Upload - FOI document submitted
2. S3 Storage - Secure document storage
3. Lambda Trigger - Processing initiated
4. Comprehend PII - Entity detection with confidence scores
5. Redaction Generation - PII locations marked
6. Review Interface - Human verification workflow

### Console Tour Sections
- S3 Bucket - Document storage
- Lambda Function - Processing logic
- Comprehend Results - PII detection output
- DynamoDB - Audit trail

### Technical Details
- GOV.UK tabs component for tour switching
- Console URLs point to AWS Console (requires deployment)
- Fallback banner for non-deployed users
- Completion buttons for each tour

## Completion Notes
- Completed: 2025-11-28
- Build verified: 79 files
- Both tours render correctly
