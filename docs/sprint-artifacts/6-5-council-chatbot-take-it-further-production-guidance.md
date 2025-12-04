# Story 6.5: Council Chatbot "Take It Further" Production Guidance

Status: done

## Story

As a **council user planning to recommend the chatbot for production**,
I want **to understand what changes for production deployment**,
so that **I can present accurate cost, security, and scale information to decision makers**.

## Acceptance Criteria

1. **Given** I'm on the chatbot exploration page, **When** I select "Take It Further", **Then** I see production guidance sections

2. **Given** I view "What Would Change at Scale", **Then** I see guidance on users, data, availability, and security

3. **Given** I view "Customization Options", **Then** I see options with effort estimates (knowledge base, personality, integrations, languages)

4. **Given** I view "Cost Projection", **Then** I see demo vs production cost comparison table

5. **Given** I view "Security Hardening", **Then** I see a checklist of security measures

6. **Given** I view "Next Steps", **Then** I see a decision tree linking to next actions

## Tasks / Subtasks

- [x] Task 1: Create production guidance page
  - [x] Create `src/walkthroughs/council-chatbot/explore/production.njk`
  - [x] Display 5 sections from production_guidance YAML data

- [x] Task 2: Create cost comparison table component
  - [x] Create table showing demo vs production costs

- [x] Task 3: Create security checklist component
  - [x] Display security hardening items

- [x] Task 4: Add next steps decision tree
  - [x] Link to relevant next actions

## Dev Notes

Production guidance data is in council-chatbot.yaml under `production_guidance` key.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-6.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created production guidance page with 5 sections from YAML data
2. Scale section uses summary list for topic display
3. Customization section uses table with effort estimates
4. Costs section uses table comparing demo vs production costs
5. Security section uses custom checklist component
6. Decision tree provides clear next steps with two paths
7. Accessible ARIA labels on all sections

### File List

**Created:**
- `src/walkthroughs/council-chatbot/explore/production.njk` - Production guidance page
