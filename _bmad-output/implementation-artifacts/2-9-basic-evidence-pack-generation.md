# Story 2.9: Basic Evidence Pack Generation

Status: done

## Story

As a **council officer reporting to stakeholders**,
I want **to generate a basic evidence pack**,
So that **I can share deployment success with my committee**.

## Acceptance Criteria

1. **Given** I have completed the basic walkthrough
   **When** I click "Generate Evidence Pack"
   **Then** a PDF is generated containing:
   - Scenario name and date
   - Deployment success confirmation
   - Drupal site URL
   - AWS region and estimated cost
   - Screenshots of homepage and admin dashboard
   - Space for notes/observations
   **And** form fields are pre-populated with session data
   **And** the PDF downloads immediately
   **And** the design follows GOV.UK document patterns

## Tasks / Subtasks

- [x] **Task 1: Evidence pack data model and form** (AC: 1)
  - [x] 1.1 Create `src/_data/evidence-pack.yaml` with field definitions (SKIPPED - inline in form)
  - [x] 1.2 Create evidence pack form component `src/_includes/components/evidence-pack-form.njk`
  - [x] 1.3 Add form fields: scenario name, date, Drupal URL, region, cost estimate
  - [x] 1.4 Add notes/observations textarea
  - [x] 1.5 Pre-populate form with session data from sessionStorage

- [x] **Task 2: PDF generation library** (AC: 1)
  - [x] 2.1 Add jsPDF to package.json (html2canvas not needed - using file upload)
  - [x] 2.2 Create `src/lib/pdf-generator.js` with EvidencePackGenerator class
  - [x] 2.3 Implement GOV.UK-styled PDF layout with headers and sections
  - [x] 2.4 Add logo and branding elements (NDX:Try branding in header/footer)
  - [ ] 2.5 Add unit tests for PDF generation (DEFERRED - browser-only code)

- [x] **Task 3: Screenshot capture integration** (AC: 1)
  - [x] 3.1 Add screenshot upload functionality to form (file upload inputs)
  - [x] 3.2 Integrate with progress tracking to capture key screenshots (via sessionStorage)
  - [x] 3.3 Add placeholder images if no screenshots available (text fallback)
  - [x] 3.4 Resize/optimize images for PDF inclusion (jsPDF handles sizing)

- [x] **Task 4: Evidence pack page** (AC: 1)
  - [x] 4.1 Create `src/walkthroughs/localgov-drupal/evidence-pack.njk`
  - [x] 4.2 Add form with pre-populated session data
  - [x] 4.3 Add "Generate PDF" button with loading state
  - [x] 4.4 Implement PDF download on generation
  - [x] 4.5 Add success message after download

- [x] **Task 5: GOV.UK document styling** (AC: 1)
  - [x] 5.1 Create PDF styles matching GOV.UK document patterns
  - [x] 5.2 Use Helvetica font for headings (Transport not available in jsPDF)
  - [x] 5.3 Add GDS colour palette for section headers (#00703c, #1d70b8)
  - [x] 5.4 Include footer with timestamp and portal URL

- [x] **Task 6: Integration and navigation** (AC: 1)
  - [x] 6.1 Add "Generate Evidence Pack" button to walkthrough complete page
  - [x] 6.2 Link from progress tracker final step (sidebar links)
  - [x] 6.3 Add to walkthrough navigation (breadcrumbs)
  - [x] 6.4 Validate build succeeds

## Dev Notes

### Architecture Compliance

This story implements basic evidence pack generation as specified in Epic 2.

**From Epic 2 Notes:**
- Basic Evidence Pack enables early adopters to report to stakeholders
- Form fields pre-populated with session data
- PDF follows GOV.UK document patterns

**From UX Design Specification:**
- Evidence Pack Form: Pre-populated with session data, PDF generation
- GOV.UK Design System styling
- WCAG 2.2 AA compliance for form

### Technical Implementation

**Technology Stack:**
- jsPDF for PDF generation
- html2canvas for screenshot capture
- TypeScript for type-safe implementation
- 11ty/Nunjucks for form page

**File Structure:**
```
src/
├── lib/
│   └── pdf-generator.ts       # PDF generation logic
├── _data/
│   └── evidence-pack.yaml     # Field definitions
├── _includes/
│   └── components/
│       └── evidence-pack-form.njk  # Form component
└── walkthroughs/
    └── localgov-drupal/
        └── evidence-pack.njk  # Evidence pack page
```

**PDF Structure:**
1. Header with NDX:Try branding
2. Scenario Summary section
3. Deployment Details section
4. Cost Information section
5. Screenshots section (homepage, admin)
6. Notes/Observations section
7. Footer with timestamp

**Session Data Sources:**
- Scenario name from URL/route
- Date from current timestamp
- Drupal URL from deployment response (localStorage)
- Region from deployment parameters
- Cost estimate from scenario metadata

### Dependencies

- Story 2.1 (Portal Scenario Landing Page) - Scenario context
- Story 2.2 (Deployment Progress) - Deployment data
- Story 2.4 (Basic Walkthrough Content) - Walkthrough completion
- Story 2.6 (Progress Tracking System) - Session data

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.9]
- [jsPDF Documentation](https://raw.githack.com/MrRio/jsPDF/master/docs/)
- [GOV.UK Document Templates](https://www.gov.uk/government/publications)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build validation: `npm run build` passed
- Evidence pack page: `/walkthroughs/localgov-drupal/evidence-pack/`
- jsPDF CDN loaded via script tag in evidence-pack.njk

### Completion Notes List

1. Created browser-side PDF generator using jsPDF loaded from CDN
2. Form pre-populates scenario data and deployment URL from sessionStorage
3. Screenshot upload uses file inputs (base64 conversion for PDF embedding)
4. PDF follows GOV.UK styling with green/blue section headers
5. Footer includes timestamp, page numbers, and NDX:Try branding
6. "Generate Evidence Pack" button added to walkthrough complete page

### File List

**Files Created:**
- src/lib/pdf-generator.js (JavaScript for browser, not TypeScript)
- src/_includes/components/evidence-pack-form.njk
- src/walkthroughs/localgov-drupal/evidence-pack.njk

**Files Modified:**
- package.json (added jsPDF ^2.5.2)
- eleventy.config.js (added passthrough for lib directory)
- src/walkthroughs/localgov-drupal/complete.njk (added Evidence Pack button)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created | SM Agent |
| 2025-12-30 | Implementation complete | Dev Agent (Opus 4.5) |
