# Story 4-4: Service-Specific Success Metrics & ROI Guidance

**Epic:** 4 - Evidence Generation & Committee-Ready Artifacts
**Status:** Drafted
**Priority:** High (provides ROI data for Evidence Pack)

## User Story

As a **council Service Manager or Finance Director**,
I want **service-specific success metrics and ROI projections in my Evidence Pack**
So that **I can justify procurement decisions with quantified business impact**.

## Background

This story enhances scenarios.yaml with comprehensive success_metrics data for each scenario. The data includes:
- Service area identification
- Primary metric definitions with baselines and projections
- ROI calculations with annual savings and payback period
- Committee-ready language for presentations
- Security posture data for CTO personas
- 3-year TCO projections for Finance personas

All ROI projections are marked as "Illustrative" with prominently displayed disclaimers.

## Acceptance Criteria

### AC 4.4.1: Success Metrics Data Structure
- [ ] Each scenario has `success_metrics` defined in scenarios.yaml
- [ ] YAML schema validation passes

### AC 4.4.2: Required Metrics Fields
- [ ] Metrics include: service_area, primary_metric, baseline, projection, roi
- [ ] All fields present for all 6 scenarios

### AC 4.4.3: ROI Calculation Data
- [ ] ROI includes: annual_savings, calculation formula, payback_months
- [ ] Data complete for all scenarios

### AC 4.4.4: Committee-Ready Language
- [ ] `committee_language` field populated for each scenario
- [ ] Language suitable for committee presentations

### AC 4.4.5: Evidence Pack Integration
- [ ] Evidence Pack ROI section displays scenario-specific metrics
- [ ] PDF shows correct metrics per scenario

### AC 4.4.6: Baseline Documentation
- [ ] Baseline assumptions documented (source, caveats)
- [ ] Documentation in scenarios.yaml comments

### AC 4.4.7: Illustrative Disclaimer
- [ ] All ROI projections marked as "Illustrative"
- [ ] Disclaimer visible at TOP of ROI section

### AC 4.4.10: Source Citations
- [ ] Source citations provided for baseline assumptions
- [ ] Citations visible in ROI section

### AC 4.4.12: Security Posture Data
- [ ] security_posture data present for CTO section
- [ ] Includes compliance certifications, data residency, encryption

### AC 4.4.13: TCO Projection Data
- [ ] tco_projection data present for Finance section
- [ ] Includes Year 1-3 cost breakdown

## Technical Implementation

### Data Structure Enhancement
```yaml
# scenarios.yaml - success_metrics per scenario
scenarios:
  - id: council-chatbot
    success_metrics:
      service_area: "Contact Center"
      primary_metric: "Call volume reduction"
      baseline:
        description: "5,000 calls/month, 30% routine inquiries"
        value: 1500
        unit: "routine calls/month"
        source: "LGA Contact Center Survey 2023"
      projection:
        description: "AI handles 80% of routine inquiries"
        value: 1200
        reduction_percent: 80
      roi:
        annual_savings: 72000
        calculation: "1,200 calls × £5/call × 12 months"
        payback_months: 1
        disclaimer: "Illustrative projection based on typical council operations"
      committee_language: "AI chatbot reduces inquiry handling cost by £72K annually while improving 24/7 citizen access"

    security_posture:
      certifications: ["ISO 27001", "SOC 2 Type II", "Cyber Essentials Plus"]
      data_residency: "UK (us-west-2 London region)"
      encryption: "AES-256 at rest, TLS 1.3 in transit"
      data_handling: "No data leaves UK; AWS shared responsibility model"

    tco_projection:
      year_1:
        aws_services: 2400
        integration: 5000
        training: 2000
        support: 1000
        total: 10400
      year_2:
        aws_services: 2400
        integration: 0
        training: 500
        support: 1000
        total: 3900
      year_3:
        aws_services: 2600
        integration: 0
        training: 500
        support: 1000
        total: 4100
```

### Template Updates

Update Evidence Pack templates to display:
- ROI metrics in roi-projection.njk
- Security data in security-compliance.njk
- TCO data in tco-projection.njk

## Dependencies

- Story 4.1 (Evidence Pack Template) - complete
- scenarios.yaml structure - exists
- GOV.UK Frontend - existing

## Definition of Done

- [ ] All 10 acceptance criteria pass
- [ ] scenarios.yaml contains success_metrics for all 6 scenarios
- [ ] Evidence Pack displays metrics correctly
- [ ] pa11y accessibility tests pass
- [ ] Code review approved

## Notes

- ROI figures are illustrative defaults
- Custom baseline input deferred to Phase 2
- All projections include clear disclaimers
- Source citations required for credibility
