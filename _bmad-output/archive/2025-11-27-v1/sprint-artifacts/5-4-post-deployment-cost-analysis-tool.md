# Story 5-4: Post-Deployment Cost Analysis Tool

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** Medium (helps councils track actual costs)

## User Story

As a **council Finance Director or Service Manager**,
I want **a cost analysis tool page that helps track post-deployment costs**
So that **I can compare projected vs actual costs and demonstrate ROI**.

## Background

This story creates a static page with:
1. AWS Cost Explorer guidance for tracking deployed scenario costs
2. Cost comparison worksheet (printable)
3. Links to AWS Pricing Calculator
4. Tips for cost optimization

## Acceptance Criteria (MVP)

### AC 5.4.1: Cost Analysis Page Exists
- [ ] Cost analysis page at `/cost-analysis/`
- [ ] Page uses GOV.UK Frontend layout
- [ ] Accessible with proper heading structure

### AC 5.4.2: AWS Cost Explorer Guidance
- [ ] Instructions for accessing AWS Cost Explorer
- [ ] How to filter by service/tag
- [ ] Screenshot or diagram (optional)

### AC 5.4.3: Cost Comparison Section
- [ ] Projected vs Actual comparison table template
- [ ] Categories: Compute, Storage, Data Transfer, Other
- [ ] Printable format

### AC 5.4.4: Cost Optimization Tips
- [ ] At least 5 cost optimization tips
- [ ] Links to AWS documentation
- [ ] Scenario-specific suggestions

### AC 5.4.5: External Links
- [ ] Link to AWS Pricing Calculator
- [ ] Link to AWS Cost Explorer documentation
- [ ] All external links open in new tab with indicator

### AC 5.4.6: Accessibility
- [ ] Page passes pa11y-ci tests
- [ ] Tables have proper headers
- [ ] All content keyboard accessible

## Technical Implementation

### File Structure
```
src/
└── cost-analysis.md   # Cost analysis documentation page
```

### Key Content Sections

1. **Introduction**: Why track costs, benefits of monitoring
2. **AWS Cost Explorer Guide**: Step-by-step instructions
3. **Cost Comparison Worksheet**: Printable table
4. **Optimization Tips**: Actionable advice
5. **Resources**: External links

## Dependencies

- GOV.UK Frontend 5.13.0
- AWS Cost Explorer (external)

## Definition of Done

- [ ] All 6 acceptance criteria pass
- [ ] Cost analysis page created
- [ ] AWS guidance documented
- [ ] pa11y accessibility tests pass
- [ ] Build succeeds

## Notes

- This is documentation/guidance, not a live calculator
- Actual cost tracking happens in AWS console
- Keeping scope focused for MVP
