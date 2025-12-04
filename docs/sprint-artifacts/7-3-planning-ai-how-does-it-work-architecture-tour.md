# Story 7.3: Planning AI "How Does It Work?" Architecture Tour

Status: done

## Story

As a **council user exploring document processing AI**,
I want **visual and console architecture tours**,
so that **I understand how documents flow through AWS services**.

## Acceptance Criteria

1. **Given** architecture page, **Then** I see tabbed Visual and Console tours
2. **Given** Visual Tour, **Then** I see step-by-step diagrams with explanations
3. **Given** Console Tour, **Then** I see AWS Console links with guidance
4. **Given** fallback banner, **Then** stack expiry warning shown if needed

## Tasks / Subtasks

- [x] Task 1: Create architecture page
  - [x] Create `src/walkthroughs/planning-ai/explore/architecture.njk`
  - [x] Tabbed interface with Visual and Console tours

## Dev Notes

Architecture covers S3, Textract, Comprehend, Bedrock, Step Functions.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-7.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created architecture page with tabbed Visual/Console interface
2. Visual tour covers document upload through results storage
3. Console tour covers S3, Textract, Lambda, Step Functions, CloudWatch
4. Includes fallback banner for expired stacks

### File List

**Created:**
- `src/walkthroughs/planning-ai/explore/architecture.njk`
