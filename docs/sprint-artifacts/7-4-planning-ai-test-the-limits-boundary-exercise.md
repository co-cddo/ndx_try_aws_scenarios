# Story 7.4: Planning AI "Test the Limits" Boundary Exercise

Status: done

## Story

As a **council user evaluating document processing AI**,
I want **to safely test boundary conditions**,
so that **I understand edge cases before recommending deployment**.

## Acceptance Criteria

1. **Given** limits page, **Then** I see 3 boundary challenges
2. **Given** each challenge, **Then** I see: safe badge, expected behavior, business implication, recovery
3. **Given** challenges, **Then** they cover: empty document, large document, corrupted file
4. **Given** ARIA labels, **Then** challenges are accessible

## Tasks / Subtasks

- [x] Task 1: Create limits page
  - [x] Create `src/walkthroughs/planning-ai/explore/limits.njk`
  - [x] Display 3 boundary challenges

## Dev Notes

Challenges focus on document-specific edge cases.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-7.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created limits page with 3 document-specific boundary challenges
2. Challenges cover empty, large, and corrupted documents
3. Reused limit challenge styling from Epic 6

### File List

**Created:**
- `src/walkthroughs/planning-ai/explore/limits.njk`
