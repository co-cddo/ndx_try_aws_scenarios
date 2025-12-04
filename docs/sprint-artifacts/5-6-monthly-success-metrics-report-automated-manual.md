# Story 5-6: Monthly Success Metrics Report - Automated/Manual

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** Medium (enables ongoing success tracking)

## User Story

As a **platform team member**,
I want **a monthly metrics report template and process**
So that **I can regularly communicate platform impact to stakeholders**.

## Background

This story creates:
1. Monthly report template (markdown)
2. Metrics collection checklist
3. Sample report with placeholder data
4. Process documentation

## Acceptance Criteria (MVP)

### AC 5.6.1: Report Template Exists
- [ ] Monthly report template at `/docs/templates/monthly-report.md`
- [ ] Template includes all key metrics sections
- [ ] Clear placeholders for data

### AC 5.6.2: Metrics Checklist
- [ ] Checklist of metrics to collect
- [ ] GA4 report references
- [ ] Data sources documented

### AC 5.6.3: Report Sections
- [ ] Executive Summary section
- [ ] Key Metrics section (with targets)
- [ ] Scenario Performance section
- [ ] Recommendations section

### AC 5.6.4: Sample Report
- [ ] Sample report with illustrative data
- [ ] Shows expected format
- [ ] Demonstrates interpretation

### AC 5.6.5: Process Documentation
- [ ] When to generate (monthly cadence)
- [ ] Who generates (roles)
- [ ] Distribution list/process

### AC 5.6.6: Accessibility
- [ ] Template follows accessible document structure
- [ ] Clear headings and organization

## Technical Implementation

### File Structure
```
docs/
└── templates/
    ├── monthly-report-template.md   # Report template
    └── sample-report-2025-01.md     # Sample report
```

### Report Template Structure
```markdown
# NDX:Try Monthly Success Report - [Month Year]

## Executive Summary
[2-3 sentence summary of month's performance]

## Key Metrics

| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Informed Decision Rate | 65-80% | [X]% | ↑/↓/→ |
| Journey Completion Rate | 40%+ | [X]% | ↑/↓/→ |
| G-Cloud Click-Through | 50%+ | [X]% | ↑/↓/→ |
| Partner Engagement | 30%+ | [X]% | ↑/↓/→ |

## Scenario Performance

| Scenario | Views | Completions | Rate |
|----------|-------|-------------|------|
| Council Chatbot | [X] | [X] | [X]% |
| Planning AI | [X] | [X] | [X]% |
| ... | ... | ... | ... |

## Insights & Recommendations
- [Key insight 1]
- [Key insight 2]
- [Recommendation for next month]

## Data Collection Notes
- Data source: GA4 Property [ID]
- Reporting period: [Date] to [Date]
- Known issues: [Any data quality notes]
```

## Dependencies

- Story 5.3 (Analytics Dashboard) - metrics definitions
- GA4 property configured

## Definition of Done

- [ ] All 6 acceptance criteria pass
- [ ] Report template created
- [ ] Sample report created
- [ ] Process documented
- [ ] Template follows accessible structure

## Notes

- Reports are manual for MVP (no automated generation)
- GA4 exports provide raw data
- Template is markdown for easy editing
