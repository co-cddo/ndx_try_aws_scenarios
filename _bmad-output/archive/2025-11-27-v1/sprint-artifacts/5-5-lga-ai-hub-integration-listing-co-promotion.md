# Story 5-5: LGA AI Hub Integration - Listing Co-Promotion

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** Medium (builds ecosystem awareness)

## User Story

As a **council officer discovering AI tools**,
I want **to find NDX:Try via the LGA AI Hub**
So that **I can discover this resource through my trusted local government network**.

## Background

This story implements:
1. LGA branding/acknowledgment on the portal
2. Content suitable for LGA AI Hub listing
3. Co-promotion messaging and links

## Acceptance Criteria (MVP)

### AC 5.5.1: LGA Acknowledgment
- [ ] Footer includes LGA acknowledgment text
- [ ] Appropriate branding guidelines followed
- [ ] Link to LGA AI Hub

### AC 5.5.2: About Page Integration
- [ ] About page mentions LGA AI Hub partnership
- [ ] Explains how NDX:Try fits in AI ecosystem
- [ ] Clear value proposition for councils

### AC 5.5.3: LGA Hub Listing Content
- [ ] Listing description text prepared (in about page)
- [ ] Category tags defined (AI, Cloud, Innovation)
- [ ] Contact information for listing

### AC 5.5.4: Co-Promotion Links
- [ ] Link to LGA AI Hub in footer or about page
- [ ] Appropriate external link indicators
- [ ] Opens in new tab

### AC 5.5.5: Accessibility
- [ ] All new content passes pa11y-ci tests
- [ ] Links have accessible names
- [ ] All content keyboard accessible

## Technical Implementation

### Files to Modify
```
src/
├── _includes/
│   └── footer.njk   # Add LGA acknowledgment
└── about.md         # Create about page with LGA info (if not exists)
```

### Footer Addition
```html
<div class="govuk-footer__meta-item">
  <p class="govuk-body-s">
    Part of the <a href="https://www.local.gov.uk/our-support/cyber-digital-and-technology/artificial-intelligence" class="govuk-link" target="_blank" rel="noopener noreferrer">LGA AI Hub<span class="govuk-visually-hidden"> (opens in new tab)</span></a> ecosystem
  </p>
</div>
```

### About Page Content
- NDX:Try overview
- Partnership with LGA
- How to get involved
- Contact information

## Dependencies

- GOV.UK Frontend 5.13.0
- LGA branding approval (assumed for MVP)

## Definition of Done

- [ ] All 5 acceptance criteria pass
- [ ] LGA acknowledgment in footer
- [ ] About page with LGA integration content
- [ ] pa11y accessibility tests pass
- [ ] Build succeeds

## Notes

- LGA AI Hub listing itself is external (manual submission)
- This story prepares portal content for listing
- Branding follows LGA guidelines
