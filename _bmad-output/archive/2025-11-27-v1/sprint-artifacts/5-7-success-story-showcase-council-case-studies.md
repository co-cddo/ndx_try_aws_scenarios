# Story 5-7: Success Story Showcase - Council Case Studies

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** Medium (builds trust through social proof)

## User Story

As a **council evaluator**,
I want **to see success stories from other councils who implemented these scenarios**
So that **I can build confidence in the solutions and learn from their experiences**.

## Background

This story creates:
1. Success stories page with case study format
2. Placeholder case studies (to be populated with real stories)
3. Template for future case studies

## Acceptance Criteria (MVP)

### AC 5.7.1: Success Stories Page Exists
- [ ] Success stories page at `/success-stories/`
- [ ] Page uses GOV.UK Frontend layout
- [ ] Accessible with proper heading structure

### AC 5.7.2: Case Study Template
- [ ] Consistent case study card format
- [ ] Fields: Council, Scenario, Outcome, Quote (optional)
- [ ] GOV.UK card pattern used

### AC 5.7.3: Placeholder Content
- [ ] At least 3 placeholder case studies
- [ ] Clearly marked as "Coming Soon" or illustrative
- [ ] Realistic but fictional council names

### AC 5.7.4: Case Study Structure
- [ ] Challenge section
- [ ] Solution section
- [ ] Results section
- [ ] Quote/Testimonial (optional)

### AC 5.7.5: Call to Action
- [ ] "Share Your Story" section
- [ ] Contact form link
- [ ] Incentive to participate

### AC 5.7.6: Accessibility
- [ ] Page passes pa11y-ci tests
- [ ] Card content accessible
- [ ] All content keyboard accessible

## Technical Implementation

### File Structure
```
src/
├── success-stories.njk   # Success stories page
└── _data/
    └── success-stories.yaml   # Case study data
```

### Data Structure
```yaml
# src/_data/success-stories.yaml
coming_soon: true  # Flag to show placeholder notice

stories:
  - id: story-1
    council: "Riverside Borough Council"
    council_type: "District Council"
    region: "South East"
    scenario: "council-chatbot"
    scenario_name: "Council Chatbot"
    headline: "Reduced call centre volume by 35%"
    challenge: "High volume of routine enquiries overwhelming contact centre"
    solution: "Deployed AI chatbot for 24/7 citizen support"
    results:
      - "35% reduction in call volume"
      - "24/7 availability for residents"
      - "Staff freed for complex cases"
    quote: "The chatbot handles routine queries brilliantly, letting our team focus on residents who need personal support."
    quote_attribution: "Service Manager, Customer Services"
    status: "placeholder"  # placeholder or verified

  - id: story-2
    council: "Greenfield County Council"
    council_type: "County Council"
    region: "East Midlands"
    scenario: "planning-ai"
    scenario_name: "Planning Application AI"
    headline: "Cut planning document processing time by 60%"
    challenge: "Manual review of planning documents causing delays"
    solution: "AI document processing for planning applications"
    results:
      - "60% faster document processing"
      - "Improved accuracy in data extraction"
      - "Better applicant experience"
    quote: "What used to take hours now takes minutes. Our planners can focus on decisions, not data entry."
    quote_attribution: "Head of Planning Services"
    status: "placeholder"

  - id: story-3
    council: "Northgate District Council"
    council_type: "District Council"
    region: "North West"
    scenario: "foi-redaction"
    scenario_name: "FOI Redaction"
    headline: "Achieved consistent redaction across all FOI requests"
    challenge: "Inconsistent redaction and high workload for information team"
    solution: "AI-assisted redaction for FOI responses"
    results:
      - "100% consistent redaction standards"
      - "50% time saving on complex requests"
      - "Reduced risk of data breaches"
    quote: "The AI catches things we might miss when processing high volumes. It's like having an extra pair of expert eyes."
    quote_attribution: "Information Governance Officer"
    status: "placeholder"
```

### Page Template
```njk
---
title: Success Stories
layout: page
description: See how councils are using NDX:Try scenarios
permalink: /success-stories/
---

{% if successStories.coming_soon %}
<div class="govuk-notification-banner" role="region" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner">
  <div class="govuk-notification-banner__header">
    <h2 class="govuk-notification-banner__title" id="govuk-notification-banner-title">
      Coming Soon
    </h2>
  </div>
  <div class="govuk-notification-banner__content">
    <p class="govuk-notification-banner__heading">
      We're collecting success stories from councils using NDX:Try scenarios.
    </p>
    <p class="govuk-body">
      The examples below are illustrative placeholders showing the format of future case studies.
    </p>
  </div>
</div>
{% endif %}

<div class="govuk-grid-row">
{% for story in successStories.stories %}
  <div class="govuk-grid-column-one-third">
    <!-- Case study card -->
  </div>
{% endfor %}
</div>
```

## Dependencies

- GOV.UK Frontend 5.13.0
- scenarios.yaml (for linking)

## Definition of Done

- [ ] All 6 acceptance criteria pass
- [ ] Success stories page created
- [ ] Placeholder case studies added
- [ ] pa11y accessibility tests pass
- [ ] Build succeeds

## Notes

- All placeholder stories clearly marked as illustrative
- Template ready for real case studies when available
- Contact form links to existing contact page
