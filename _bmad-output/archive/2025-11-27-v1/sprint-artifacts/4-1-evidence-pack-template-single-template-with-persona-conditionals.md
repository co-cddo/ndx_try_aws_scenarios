# Story 4-1: Evidence Pack Template - Single Template with Persona Conditionals

**Epic:** 4 - Evidence Generation & Committee-Ready Artifacts
**Status:** Drafted
**Priority:** High (foundation for all Epic 4 stories)

## User Story

As a **council evaluator** who has completed a scenario walkthrough,
I want **persona-specific Evidence Pack templates**
So that **I can generate committee-ready PDF documentation tailored to my audience (CTO, Service Manager, Finance, or Developer)**.

## Background

This story establishes the foundational template system for Evidence Pack generation. A single Nunjucks base template with conditional logic generates 4 persona-specific variants per scenario. This design choice minimizes maintenance burden while allowing deep customization per audience.

The template system outputs HTML designed for PDF conversion via Puppeteer (build-time) or html2pdf.js (client-side), with CSS print media queries for A4 paper formatting.

## Acceptance Criteria

### AC 4.1.1: Single Template with Persona Conditionals
- [ ] Template file exists at `src/_includes/evidence-pack/base.njk`
- [ ] Template accepts `persona` parameter: 'cto', 'service-manager', 'finance', 'developer'
- [ ] Template accepts `scenario` data object from scenarios.yaml
- [ ] Template accepts `session` data object (form responses)

### AC 4.1.2: CTO Architecture Section
- [ ] CTO version includes "Architecture & Security Assessment" section
- [ ] Section displays AWS service architecture diagram reference
- [ ] Section includes security considerations and compliance notes

### AC 4.1.3: Service Manager Resident Impact Section
- [ ] Service Manager version includes "Resident Impact & Service Improvement" section
- [ ] Section displays service delivery benefits
- [ ] Section includes citizen experience improvements

### AC 4.1.4: Finance Cost Analysis Section
- [ ] Finance version includes "Cost Analysis & Budget Impact" section
- [ ] Section displays cost breakdown and worst-case scenarios
- [ ] Section includes budget justification language

### AC 4.1.5: Developer Technical Implementation Section
- [ ] Developer version includes "Technical Implementation Details" section
- [ ] Section displays technical stack and integration points
- [ ] Section includes deployment considerations

### AC 4.1.6: Shared Sections (All Personas)
- [ ] All versions include "Evaluation Summary" section
- [ ] All versions include "ROI Projection" section
- [ ] All versions include "Next Steps" section
- [ ] Shared sections render correctly for all 4 personas

### AC 4.1.7: Print Styling
- [ ] Template uses CSS `@media print` for print-friendly styling
- [ ] PDF renders correctly on A4 paper (tested)
- [ ] Page breaks occur at logical section boundaries
- [ ] No content overflow or truncation

### AC 4.1.8: Accessibility
- [ ] PDF passes accessibility check (text-selectable, not image-based)
- [ ] Semantic HTML structure (headings, lists, tables)
- [ ] High contrast colors for readability

### AC 4.1.9: Performance
- [ ] Template renders in <2 seconds during build
- [ ] No external resource dependencies that would slow rendering

### AC 4.1.10: CTO Security & Compliance Section
- [ ] CTO Evidence Pack includes "Security & Compliance" section
- [ ] Section covers shared responsibility model
- [ ] Section covers data residency (UK region)
- [ ] Section lists relevant certifications (ISO 27001, SOC 2, etc.)

### AC 4.1.11: Service Manager Citizen Journey Impact Section
- [ ] Service Manager Evidence Pack includes "Citizen Journey Impact" section
- [ ] Section shows before/after service experience comparison
- [ ] Section includes qualitative improvements

### AC 4.1.12: Finance 3-Year TCO Projection Section
- [ ] Finance Evidence Pack includes "3-Year TCO Projection" section
- [ ] Section breaks down costs: AWS services, integration, training, support
- [ ] Section shows Year 1, Year 2, Year 3 projections

### AC 4.1.13: Developer Technical Runbook Summary Section
- [ ] Developer Evidence Pack includes "Technical Runbook Summary" section
- [ ] Section covers deployment steps
- [ ] Section covers monitoring setup
- [ ] Section covers troubleshooting guidance

## Technical Implementation

### File Structure
```
src/
├── _includes/
│   ├── evidence-pack/
│   │   ├── base.njk              # Base Evidence Pack template
│   │   ├── sections/
│   │   │   ├── cover.njk         # Cover page with scenario/council info
│   │   │   ├── executive-summary.njk
│   │   │   ├── architecture.njk  # CTO-specific section
│   │   │   ├── security-compliance.njk # CTO deep section
│   │   │   ├── resident-impact.njk # Service Manager-specific
│   │   │   ├── citizen-journey.njk # Service Manager deep section
│   │   │   ├── cost-analysis.njk # Finance-specific
│   │   │   ├── tco-projection.njk # Finance deep section
│   │   │   ├── technical-impl.njk # Developer-specific
│   │   │   ├── technical-runbook.njk # Developer deep section
│   │   │   ├── evaluation-summary.njk # Shared section
│   │   │   ├── roi-projection.njk # Shared section
│   │   │   └── next-steps.njk    # Shared section
│   │   └── partials/
│   │       ├── persona-header.njk
│   │       └── print-styles.njk
│   └── components/
│       └── evidence-cta.njk      # "Generate Evidence Pack" CTA
└── evidence-pack/
    └── index.njk                 # Evidence Pack generation page
```

### Template Data Contract
```typescript
interface EvidencePackTemplateData {
  scenario: {
    id: string;
    name: string;
    description: string;
    aws_services: string[];
    estimated_cost: string;
    maximum_cost: string;
    time_estimate: string;
    success_metrics: SuccessMetrics;
    security_posture: SecurityPosture;
    tco_projection: TcoProjection;
  };
  persona: 'cto' | 'service-manager' | 'finance' | 'developer';
  session: {
    what_surprised: string;
    would_implement: 'yes' | 'maybe' | 'no';
    production_wants?: string;
    concerns?: string;
    likelihood_proceed: number;
    council_name?: string;
    evaluation_date: string;
  };
}
```

### Print CSS Requirements
- A4 page size (210mm x 297mm)
- 15mm margins
- Page breaks before major sections
- No orphaned headers
- Hide navigation elements
- Ensure all content visible in print

## Dependencies

- GOV.UK Frontend 5.13.0 (existing)
- Eleventy 2.x with Nunjucks (existing)
- scenarios.yaml with success_metrics data (Story 4.4 enhancement)

## Definition of Done

- [ ] All 13 acceptance criteria pass
- [ ] Template generates valid HTML for all 4 personas
- [ ] Print preview shows correct A4 formatting
- [ ] Code review approved
- [ ] pa11y accessibility tests pass for Evidence Pack page
- [ ] No console errors in browser

## Notes

- This story creates the template structure; PDF generation is in Story 4.3
- Form data population is in Story 4.2
- Success metrics data is enhanced in Story 4.4
- Use placeholder data for testing until Stories 4.2 and 4.4 are complete
