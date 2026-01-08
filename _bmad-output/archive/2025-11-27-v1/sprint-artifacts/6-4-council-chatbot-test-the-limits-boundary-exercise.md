# Story 6.4: Council Chatbot "Test the Limits" Boundary Exercise

Status: done

## Story

As a **council user evaluating the chatbot for production use**,
I want **to safely test the chatbot's boundaries and limits**,
so that **I understand how it handles edge cases before recommending deployment**.

## Acceptance Criteria

1. **Given** I'm on the chatbot exploration page (Story 6.1), **When** I select "Test the Limits", **Then** I see 3 boundary challenges

2. **Given** I view Challenge 1 "Token Overload", **Then** I see instructions for testing long text input and expected behavior

3. **Given** I view Challenge 2 "Sensitive Topics", **Then** I see guidance on testing sensitive content handling

4. **Given** I view Challenge 3 "Rate Limiting", **Then** I see instructions for testing rapid-fire requests

5. **Given** I view any challenge, **Then** I see: "Safe to try" badge, expected behavior, business implication, recovery instructions

6. **Given** I attempt any challenge, **Then** the system handles gracefully without permanent damage

7. **Given** I'm using assistive technology, **Then** all challenges are accessible with proper ARIA labels

## Tasks / Subtasks

- [x] Task 1: Create limits page (AC: 1)
  - [x] Create `src/walkthroughs/council-chatbot/explore/limits.njk`
  - [x] Display 3 boundary challenges from YAML data (limit1, limit2, limit3)
  - [x] Navigation available from exploration landing page

- [x] Task 2: Create limit card component (AC: 2, 3, 4, 5)
  - [x] Inline limit card styling in limits.njk page
  - [x] Include safe badge, expected behavior, business implication, recovery
  - [x] Add "Mark as complete" button with completion tracking

- [x] Task 3: Add accessibility features (AC: 7)
  - [x] Add ARIA labels to challenge cards (aria-labelledby)
  - [x] Keyboard navigation works for all interactive elements

- [ ] Task 4: Integration testing (deferred to CI)
  - [ ] Verify all 3 challenges display correctly
  - [ ] Test completion tracking

## Dev Notes

### Data Structure

The limits data is already in council-chatbot.yaml with activities: limit1, limit2, limit3.

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6.md#Story-6.4]
- [Source: Story 6.1 limit card implementation in index.njk]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-6.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created limits page with 3 boundary challenges from YAML data
2. Used orange color scheme to differentiate from other exploration sections
3. Included copy-to-clipboard for sample text inputs
4. Reused safe-badge.njk component for consistency
5. Progress tracking integrated with ExplorationState

### File List

**Created:**
- `src/walkthroughs/council-chatbot/explore/limits.njk` - Boundary challenges page
