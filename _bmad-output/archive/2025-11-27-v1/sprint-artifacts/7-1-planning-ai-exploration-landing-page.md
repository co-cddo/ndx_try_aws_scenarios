# Story 7.1: Planning AI Exploration Landing Page

Status: done

## Story

As a **council user who completed the Planning AI walkthrough**,
I want **an exploration landing page with clear navigation**,
so that **I can explore document processing AI deeper**.

## Acceptance Criteria

1. **Given** I'm on the Planning AI exploration page, **When** it loads, **Then** I see persona selection (Visual-First vs Console+Code)
2. **Given** persona paths, **Then** I see time estimates for each path
3. **Given** exploration categories, **Then** I see links to Experiments, Architecture, Limits, Production
4. **Given** progress tracking, **Then** I see completion indicator

## Tasks / Subtasks

- [x] Task 1: Create exploration landing page
  - [x] Create `src/walkthroughs/planning-ai/explore/index.njk`
  - [x] Persona selection cards with time estimates
- [x] Task 2: Create exploration YAML data
  - [x] Create `src/_data/exploration/planning-ai.yaml`

## Dev Notes

Reuses components from Epic 6 Council Chatbot exploration.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-7.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created planning-ai exploration landing page following Epic 6 patterns
2. Created planning-ai.yaml with document-processing specific activities
3. Reused exploration layout and components from Epic 6

### File List

**Created:**
- `src/walkthroughs/planning-ai/explore/index.njk`
- `src/_data/exploration/planning-ai.yaml`
