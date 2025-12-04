# Story 5-3: Analytics Dashboard - Informed Decision Rate Key Metrics

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** High (enables measurement of success metrics)

## User Story

As a **platform team member**,
I want **an analytics dashboard page showing key success metrics**
So that **I can track the platform's effectiveness and identify optimization opportunities**.

## Background

This story creates a static analytics page that explains how to calculate key metrics from GA4 data. Since we're using GA4 for analytics (not a custom backend), the "dashboard" is documentation of:
1. Key metrics definitions
2. GA4 custom report setup instructions
3. Sample metric targets

## Acceptance Criteria (MVP)

### AC 5.3.1: Analytics Page Exists
- [ ] Analytics page at `/analytics/`
- [ ] Page uses GOV.UK Frontend layout
- [ ] Accessible with proper heading structure

### AC 5.3.2: Key Metrics Documentation
- [ ] Defines "Informed Decision Rate" calculation
- [ ] Defines "Partner Engagement Rate" calculation
- [ ] Defines "Journey Completion Rate" calculation
- [ ] Defines "G-Cloud Click-Through Rate" calculation

### AC 5.3.3: Metric Definitions
- [ ] Each metric has: description, formula, target, interpretation
- [ ] Uses GOV.UK summary list pattern

### AC 5.3.4: GA4 Report Setup Guide
- [ ] Instructions for creating custom GA4 reports
- [ ] Screenshots or step references (optional)
- [ ] Event names documented from Story 5-2

### AC 5.3.5: Target Metrics Display
- [ ] Primary target: 65-80% informed decision rate
- [ ] Secondary targets documented
- [ ] Clear explanation of what "success" looks like

### AC 5.3.6: Accessibility
- [ ] Page passes pa11y-ci tests
- [ ] Proper heading hierarchy
- [ ] All content keyboard accessible

## Technical Implementation

### File Structure
```
src/
└── analytics.md   # Analytics documentation page
```

### Page Content Structure
```markdown
---
title: Analytics & Success Metrics
layout: page
description: How we measure platform success
---

## Key Success Metrics

### Primary Metric: Informed Decision Rate

**Definition**: Percentage of users who reach a clear decision (proceed or not proceed) after completing a scenario evaluation.

**Formula**: `(pathway_selected where type='proceed' OR type='not_now') / total pathway_selected × 100`

**Target**: 65-80%

**Interpretation**: Higher = platform is helping councils make clear decisions

---

### Secondary Metrics

#### Partner Engagement Rate
- **Formula**: `partner_viewed / next_steps_viewed × 100`
- **Target**: 30%+
- **Meaning**: Users considering implementation partners

#### G-Cloud Click-Through Rate
- **Formula**: `gcloud_link_clicked / next_steps_viewed × 100`
- **Target**: 50%+
- **Meaning**: Users exploring procurement options

#### Journey Completion Rate
- **Formula**: `evidence_pack_downloaded / scenario_viewed × 100`
- **Target**: 40%+
- **Meaning**: Users completing full evaluation journey

---

## GA4 Custom Reports

### Setting Up Informed Decision Rate Report

1. In GA4, go to Explore > Create new report
2. Add dimension: `pathway_type`
3. Add metric: Event count
4. Filter: Event name = `pathway_selected`
5. Create calculated metric for rate

### Event Reference

| Event Name | Parameters | When Fired |
|------------|------------|------------|
| next_steps_viewed | scenario_id | Next Steps page load |
| pathway_selected | scenario_id, pathway_type | Pathway displays |
| gcloud_link_clicked | scenario_id, search_term | G-Cloud link click |
| evidence_pack_downloaded | scenario_id, persona | PDF download |
```

## Dependencies

- Story 5.2 (Analytics Events) - complete
- GA4 property configured (placeholder ID in site.yaml)

## Definition of Done

- [ ] All 6 acceptance criteria pass
- [ ] Analytics page created at /analytics/
- [ ] Key metrics documented with formulas
- [ ] pa11y accessibility tests pass
- [ ] Build succeeds

## Notes

- This is documentation, not a live dashboard
- GA4 provides the actual visualization
- Keeping scope focused for MVP
