# Story 7.5: Planning AI "Take It Further" Production Guidance

Status: done

## Story

As a **council user planning to recommend document processing AI**,
I want **production deployment guidance**,
so that **I can present accurate information to decision makers**.

## Acceptance Criteria

1. **Given** production page, **Then** I see 5 guidance sections
2. **Given** scale section, **Then** I see document volume, processing, storage, integration guidance
3. **Given** costs section, **Then** I see demo vs production cost comparison
4. **Given** security section, **Then** I see hardening checklist
5. **Given** next steps, **Then** I see decision tree

## Tasks / Subtasks

- [x] Task 1: Create production page
  - [x] Create `src/walkthroughs/planning-ai/explore/production.njk`
  - [x] Display 5 sections from production_guidance YAML

## Dev Notes

Costs specific to Textract, Comprehend, Bedrock services.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-7.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created production guidance page with 5 sections
2. Costs specific to document processing (Textract, Comprehend, Bedrock)
3. Security checklist includes S3 encryption, GDPR compliance
4. Decision tree links to evidence pack and next steps

### File List

**Created:**
- `src/walkthroughs/planning-ai/explore/production.njk`
