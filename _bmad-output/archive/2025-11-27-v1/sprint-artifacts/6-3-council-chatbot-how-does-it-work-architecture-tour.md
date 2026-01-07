# Story 6.3: Council Chatbot "How Does It Work?" Architecture Tour

Status: done

## Story

As a **council user who wants to understand the technology**,
I want **to take a guided tour of the chatbot's architecture**,
so that **I can explain the technical components to stakeholders or evaluate technical fit**.

## Acceptance Criteria

1. **Given** I'm on the chatbot exploration page (Story 6.1), **When** I select "How Does It Work?", **Then** I see two tour paths: Visual Tour and Console Tour

2. **Given** I select Visual Tour, **Then** I see 5 steps with annotated diagrams explaining the request/response flow

3. **Given** I view any Visual Tour step, **Then** I see: title, description, annotated screenshot

4. **Given** I select Console Tour, **Then** I see 5 steps with AWS Console deep links

5. **Given** I view any Console Tour step, **Then** I see: title, what to look for, console link, screenshot

6. **Given** I click an AWS Console link, **Then** I'm directed to the correct AWS Console page for that resource

7. **Given** my deployed stack has expired, **Then** I see a "Stack Expired" banner with option to redeploy or view static screenshots

8. **Given** I'm using assistive technology, **Then** the tour is fully accessible with ARIA landmarks and keyboard navigation

## Tasks / Subtasks

- [x] Task 1: Create architecture tour page (AC: 1)
  - [x] Create `src/walkthroughs/council-chatbot/explore/architecture.njk`
  - [x] Implement tabs for Visual/Console tour switching using GOV.UK tabs
  - [x] Navigation available from exploration landing page

- [x] Task 2: Create visual tour component (AC: 2, 3)
  - [x] Inline visual tour steps in architecture page
  - [x] Display numbered steps with images and descriptions
  - [x] Add alternating layout (image left/right) using CSS grid

- [x] Task 3: Create console tour component (AC: 4, 5, 6)
  - [x] Inline console tour steps in architecture page
  - [x] Include AWS Console deep links with target="_blank" rel="noopener noreferrer"
  - [x] Add "what to look for" guidance for each step

- [x] Task 4: Implement stack expiration handling (AC: 7)
  - [x] Uses stackExpired variable passed to fallback-banner.njk
  - [x] Display fallback banner with redeploy link
  - [x] Show static screenshots as fallback

- [x] Task 5: Add accessibility features (AC: 8)
  - [x] Add ARIA roles to tabs (tablist, tab, tabpanel)
  - [x] Tab switching is keyboard accessible (GOV.UK tabs component)
  - [x] Proper heading hierarchy (h2 > h3 > h4)

- [ ] Task 6: Integration testing (deferred to CI)
  - [ ] Test visual tour step navigation
  - [ ] Test console tour links open correctly
  - [ ] Verify fallback displays when stack expired

## Dev Notes

### Architecture Patterns

- **Progressive disclosure**: Visual tour for non-technical users, Console tour for developers
- **Tabbed interface**: Uses GOV.UK tabs component for tour type selection
- **External links**: Console links open in new tabs with security attributes

### Component Structure

| Component | Path | Purpose |
|-----------|------|---------|
| Architecture page | `src/walkthroughs/council-chatbot/explore/architecture.njk` | Main container with tabs |
| Visual tour step | Inline in page | Individual step with diagram |
| Console tour step | Inline in page | Individual step with console link |

### AWS Console Deep Links

| Resource | URL Pattern |
|----------|-------------|
| Lambda | `https://console.aws.amazon.com/lambda/home#/functions/{name}` |
| Bedrock | `https://console.aws.amazon.com/bedrock/home` |
| DynamoDB | `https://console.aws.amazon.com/dynamodbv2/home#table?name={name}` |
| CloudWatch | `https://console.aws.amazon.com/cloudwatch/home` |
| API Gateway | `https://console.aws.amazon.com/apigateway/home` |

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6.md#Story-6.3]
- [Source: Story 6.1 and 6.2 implementation patterns]

### Learnings from Previous Stories

- Architecture data already exists in council-chatbot.yaml (arch-visual, arch-console activities)
- Fallback banner component already implemented (Story 6.1)
- Tab components follow GOV.UK Frontend patterns

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/tech-spec-epic-6.md
- docs/sprint-artifacts/6-1-council-chatbot-exploration-landing-page.md

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build log: `npm run build` - Wrote 67 files in 0.97 seconds

### Completion Notes List

1. Created architecture page with tabbed interface for Visual/Console tours
2. Visual tour uses alternating layout (image left/right) for visual interest
3. Console tour includes AWS Console deep links with accessibility attributes
4. Both tours use data from council-chatbot.yaml (arch-visual, arch-console activities)
5. Reused fallback-banner.njk for stack expiration handling
6. Analytics tracking on tab selection

### File List

**Created:**
- `src/walkthroughs/council-chatbot/explore/architecture.njk` - Architecture tour page

**Modified:**
- None (reuses existing components and data)
