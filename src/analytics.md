---
title: Analytics & Success Metrics
layout: page
description: How we measure platform success and track key performance indicators
---

## Key Success Metrics

Our platform effectiveness is measured through four key metrics, tracked via Google Analytics 4.

### Primary Metric: Informed Decision Rate

<dl class="govuk-summary-list">
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">Definition</dt>
    <dd class="govuk-summary-list__value">Percentage of users who reach a clear decision (proceed or not proceed) after completing a scenario evaluation</dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">Formula</dt>
    <dd class="govuk-summary-list__value"><code>(pathway_selected[proceed] + pathway_selected[not_now]) / total pathway_selected × 100</code></dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">Target</dt>
    <dd class="govuk-summary-list__value">65-80%</dd>
  </div>
</dl>

### Secondary Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Partner Engagement Rate | `partner_viewed / next_steps_viewed × 100` | 30%+ |
| G-Cloud Click-Through Rate | `gcloud_link_clicked / next_steps_viewed × 100` | 50%+ |
| Journey Completion Rate | `evidence_pack_downloaded / scenario_viewed × 100` | 40%+ |

## Analytics Events Reference

All events are implemented in `/assets/js/analytics.js` and fire automatically based on user interactions.

| Event Name | Parameters | When Fired |
|------------|------------|------------|
| `next_steps_viewed` | scenario_id | Next Steps page load |
| `pathway_selected` | scenario_id, pathway_type | Pathway displays (proceed/not_now) |
| `gcloud_link_clicked` | scenario_id, search_term | G-Cloud link clicked |
| `evidence_pack_downloaded` | scenario_id, persona | PDF generated |
| `quiz_completed` | recommended_scenario | Quiz submission |
| `scenario_viewed` | scenario_id | Scenario detail page load |
| `partner_viewed` | scenario_id, partner_name | Partner contact viewed |

## GA4 Custom Reports

### Creating the Informed Decision Rate Report

To create an Informed Decision Rate report in GA4:

1. Navigate to **Explore** > **Create new exploration**
2. Add dimension: `pathway_type`
3. Add metric: Event count
4. Add filter: Event name equals `pathway_selected`
5. Create calculated field for percentage:
   ```
   (Events where pathway_type = 'proceed' + Events where pathway_type = 'not_now') / Total pathway_selected events × 100
   ```

### Partner Engagement Rate Report

1. Create a new exploration
2. Add dimensions: `scenario_id`
3. Add metrics: Count of `next_steps_viewed` and count of `partner_viewed`
4. Calculate ratio: `partner_viewed / next_steps_viewed × 100`

### G-Cloud Click-Through Rate Report

1. Create a new exploration
2. Add dimensions: `scenario_id`, `search_term`
3. Add metrics: Count of `next_steps_viewed` and count of `gcloud_link_clicked`
4. Calculate ratio: `gcloud_link_clicked / next_steps_viewed × 100`

## Monitoring Best Practices

### Daily Checks

- Review Informed Decision Rate trend
- Check for anomalies in event volumes
- Verify no broken tracking implementations

### Weekly Analysis

- Compare scenario performance
- Analyze G-Cloud search terms
- Review partner engagement patterns
- Identify high-performing quiz questions

### Monthly Reporting

Use the [monthly report template](/templates/monthly-report-template/) to document:

- Key metrics vs targets
- Scenario performance trends
- Insights and recommendations
- Action items for improvement

## Event Implementation

Events are tracked using Google Analytics 4 via the gtag() function. All analytics code is implemented in `/assets/js/analytics.js` and follows privacy-first principles:

- No personally identifiable information (PII) is collected
- IP addresses are anonymized
- Cookie consent is required before tracking
- Data retention follows GOV.UK standards

## Data Privacy

This platform complies with:

- UK GDPR requirements
- GOV.UK privacy standards
- Local government data protection guidelines

For details, see our [Privacy Policy](/privacy/).

## Getting Access to Analytics

Platform administrators can request GA4 access by contacting the NDX:Try team via the [contact form](/contact/).

Required information:

- Your council name
- Your role (CTO, Service Manager, etc.)
- Justification for access
- Expected reporting frequency

## Further Reading

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GOV.UK Analytics Guidance](https://www.gov.uk/service-manual/measuring-success)
