# Story 7.2: Planning AI "What Can I Change?" Experiments

Status: done

## Story

As a **council user exploring document processing AI**,
I want **guided experiments to test different document types and formats**,
so that **I understand how input quality affects extraction accuracy**.

## Acceptance Criteria

1. **Given** I'm on experiments page, **Then** I see 5 document processing experiments
2. **Given** each experiment, **Then** I see: title, time estimate, learning outcome, expected behavior
3. **Given** experiments, **Then** they cover: document quality, handwriting, multi-page, formats, partial forms
4. **Given** safe badge, **Then** experiments are clearly marked as safe to try

## Tasks / Subtasks

- [x] Task 1: Create experiments page
  - [x] Create `src/walkthroughs/planning-ai/explore/experiments.njk`
  - [x] Display 5 experiments from YAML data

## Dev Notes

Reuses experiment-card.njk component from Epic 6.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-7.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created experiments page with 5 document-focused experiments
2. Experiments cover quality, handwriting, multi-page, formats, partial forms
3. Reused experiment-card.njk component

### File List

**Created:**
- `src/walkthroughs/planning-ai/explore/experiments.njk`
