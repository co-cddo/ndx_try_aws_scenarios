# Story 6.5: Portal Extend Page

Status: done

## Story

As a **council officer ready to move forward**,
I want **"what's next" guidance and resources**,
So that **I know how to proceed after the demo**.

## Acceptance Criteria

1. **Given** I navigate to the Extend page on the portal
   **When** the page loads
   **Then** I see:
   - Next steps for different personas (officer, IT, procurement)
   - Links to LocalGov Drupal community resources
   - AWS partner contact information
   - Production deployment considerations
   - Security and compliance guidance
   - Related NDX scenarios to explore

2. **Given** external resources are displayed
   **When** I click on them
   **Then** resources open in new tabs with proper security attributes

3. **Given** the page loads
   **When** I view the content
   **Then** content is tailored to UK public sector context

4. **Given** I want to provide feedback
   **When** I look for a way to contact
   **Then** the page includes a feedback/contact link

## Tasks / Subtasks

- [x] **Task 1: Create Extend Data** (AC: 1, 3)
  - [x] 1.1 Create `src/_data/extend/localgov-drupal.yaml`
  - [x] 1.2 Define next steps per persona (officer, IT, procurement)
  - [x] 1.3 Define LocalGov Drupal community resources
  - [x] 1.4 Define AWS partner information
  - [x] 1.5 Define production considerations
  - [x] 1.6 Define related scenarios

- [x] **Task 2: Create Extend Page Template** (AC: 1, 3, 4)
  - [x] 2.1 Create `src/walkthroughs/localgov-drupal/explore/extend/index.njk`
  - [x] 2.2 Use `page` layout with appropriate front matter
  - [x] 2.3 Include phase-navigator and breadcrumb navigation
  - [x] 2.4 Add persona-based next steps sections
  - [x] 2.5 Add feedback/contact section

- [x] **Task 3: Create Next Steps Component** (AC: 1, 3)
  - [x] 3.1 Create `src/_includes/components/next-steps-card.njk`
  - [x] 3.2 Display persona name and icon
  - [x] 3.3 List actionable steps with links
  - [x] 3.4 Use GOV.UK card/inset text patterns

- [x] **Task 4: Add External Links Section** (AC: 2)
  - [x] 4.1 Link to LocalGov Drupal website and community
  - [x] 4.2 Link to AWS partner resources
  - [x] 4.3 All external links have target="_blank" rel="noopener noreferrer"
  - [x] 4.4 External link icon pattern from GOV.UK

- [x] **Task 5: Add Related Scenarios Section** (AC: 1)
  - [x] 5.1 Display related NDX scenarios (3 scenarios)
  - [x] 5.2 Use scenario card pattern from existing components
  - [x] 5.3 Link to other scenario pages

- [x] **Task 6: Add Feedback Section** (AC: 4)
  - [x] 6.1 Add contact/feedback call-to-action
  - [x] 6.2 Link to email (ndx@dsit.gov.uk)
  - [x] 6.3 Clear call-to-action button

- [x] **Task 7: Verify Build and Accessibility** (AC: 1, 2, 3, 4)
  - [x] 7.1 Run `npm run build` - 111 files generated
  - [x] 7.2 Verify responsive layout via CSS media queries
  - [x] 7.3 Verify screen reader accessibility - 18 visually-hidden texts
  - [x] 7.4 Test external links - 15 with noopener noreferrer

## Dev Notes

### Personas and Next Steps

| Persona | Focus | Key Actions |
|---------|-------|-------------|
| Content Officer | Day-to-day editing | Join LocalGov Drupal community, explore AI features |
| IT/Technical | Implementation | Review architecture, contact AWS partner |
| Procurement | Decision-making | Request evidence pack, G-Cloud framework info |

### External Resources

| Resource | URL |
|----------|-----|
| LocalGov Drupal | https://localgovdrupal.org/ |
| LocalGov Drupal GitHub | https://github.com/localgovdrupal |
| AWS Public Sector | https://aws.amazon.com/government-education/government/uk/ |
| G-Cloud Framework | https://www.digitalmarketplace.service.gov.uk/ |

### Related Scenarios

Link to other NDX scenarios that complement LocalGov Drupal:
- Council Chatbot (AI customer service)
- Planning AI (document processing)
- Text-to-Speech (accessibility)

### Existing Patterns to Follow

- `ai-feature-card.njk` - Card component pattern
- `experiment-card.njk` - Expandable card pattern
- `phase-navigator.njk` - Phase/progress tracking
- GOV.UK Design System external link patterns

### File Structure

```
src/
├── _data/
│   └── extend/
│       └── localgov-drupal.yaml     # Extend page data
├── _includes/
│   └── components/
│       └── next-steps-card.njk      # New component
├── walkthroughs/
│   └── localgov-drupal/
│       └── explore/
│           └── extend/
│               └── index.njk        # New page
```

### UK Public Sector Context

- Reference GOV.UK guidance and standards
- Mention WCAG 2.2 and EAA June 2025 deadline
- G-Cloud and Digital Marketplace for procurement
- LGA AI Hub for sharing and learning

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Story created from epics | SM Agent |
