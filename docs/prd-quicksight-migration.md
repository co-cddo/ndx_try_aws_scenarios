# QuickSight Dashboard Migration - Product Requirements Document

**Author:** cns
**Date:** 2025-11-30
**Version:** 1.0

---

## Executive Summary

The QuickSight Dashboard scenario currently uses Chart.js with Lambda-generated sample data to demonstrate dashboard concepts. While functional as a prototype, this approach fails to deliver on the core NDX:Try mission: **giving councils hands-on experience with actual AWS services**.

This PRD defines the migration from the current Chart.js simulation to a real Amazon QuickSight implementation. Councils evaluating analytics capabilities need to experience QuickSight's actual interface, filtering behaviour, SPICE performance, and embedding workflow - not a JavaScript approximation.

The migration delivers:
- **Authentic QuickSight experience** - Real dashboard with interactive filters, drill-downs, and calculated fields
- **Production-representative architecture** - CloudFormation-deployed QuickSight resources that mirror real-world implementations
- **Anonymous embedding** - Public dashboard access without authentication complexity (suitable for demo scenarios)
- **Lambda for data preparation only** - Lambda generates and loads sample council data into S3, QuickSight handles all visualisation

### What Makes This Special

**"This is actually QuickSight"** - The moment when a council evaluator interacts with the dashboard and realizes they're using the same tool they would use in production.

The current Chart.js implementation, while visually similar, cannot demonstrate:
- QuickSight's actual SPICE in-memory performance
- Native filter and parameter controls
- Dashboard embedding workflow and SDK integration
- Real QuickSight calculated fields and visual types
- Authentic CloudFormation deployment experience for QuickSight resources

This migration transforms the scenario from "here's what analytics could look like" to "here's the actual tool you'd use."

---

## Project Classification

**Technical Type:** Infrastructure Migration (CloudFormation Enhancement)
**Domain:** Government Technology (GovTech) - Analytics & Data Visualisation
**Complexity:** Medium-High

This project is a **migration enhancement** within the existing NDX:Try AWS Scenarios platform:

1. **Current State** - Chart.js dashboard rendered by Lambda with hardcoded sample data
2. **Target State** - Amazon QuickSight dashboard with embedded anonymous access, SPICE-backed data, CloudFormation-deployed infrastructure

**Why Medium-High Complexity:**
- QuickSight CloudFormation resources require specific sequencing (DataSource → DataSet → Analysis → Dashboard)
- Anonymous embedding requires QuickSight session capacity pricing configuration
- SPICE data refresh orchestration needed
- Embedding SDK integration for portal display
- Walkthrough and screenshot content requires significant updates

### Domain Context

**QuickSight in UK Local Government:**
- Universal analytics need across all council services
- Dashboard democratisation - service managers need self-service reporting
- Budget constraints favour pay-per-session pricing over traditional BI tools
- SPICE in-memory caching provides fast queries without dedicated infrastructure
- Row-level security enables multi-service data sharing with appropriate access controls

---

## Success Criteria

### Primary Success Metric: Authentic QuickSight Experience

**Success = Council evaluators interact with a real QuickSight dashboard, not a simulation.**

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| Dashboard loads via QuickSight embedding | Functional test | 100% |
| Filters and parameters work natively | User interaction test | 100% |
| SPICE data refresh completes | CloudFormation deployment success | < 5 minutes |
| Anonymous embedding works without auth | Accessibility test | 100% |
| Walkthrough accurately describes QuickSight | Content review | No Chart.js references |

### Secondary Success Metrics

**Technical Quality**
| Metric | Target |
|--------|--------|
| CloudFormation deployment success rate | 95%+ |
| Dashboard load time (embedded) | < 3 seconds |
| SPICE data capacity usage | < 1 GB |
| Template validation passes | cfn-lint clean |

**Content Quality**
| Metric | Target |
|--------|--------|
| Screenshot accuracy (real QuickSight UI) | 100% |
| Walkthrough step accuracy | All steps testable |
| Architecture diagram reflects QuickSight | Updated Mermaid |

### Business Metrics

- Scenario completion rate maintained or improved (60%+ target)
- Evidence Pack generation includes QuickSight-specific content
- "What's Next" guidance includes QuickSight production recommendations

---

## Product Scope

### MVP - Core Migration

**What's In:**

**1. QuickSight Infrastructure (CloudFormation)**
- AWS::QuickSight::DataSource - S3 data source pointing to sample data bucket
- AWS::QuickSight::DataSet - SPICE dataset with council service performance data
- AWS::QuickSight::Analysis - Dashboard design/analysis asset
- AWS::QuickSight::Dashboard - Published dashboard for embedding
- Anonymous embedding configuration for public demo access

**2. Sample Data Pipeline**
- Lambda function generates realistic UK council service data (JSON/CSV)
- S3 bucket stores sample data
- Lambda triggers SPICE refresh after data generation
- Data structure: council services, monthly metrics, categories

**3. Embedded Dashboard Experience**
- Anonymous embedding URL generation (GenerateEmbedUrlForAnonymousUser API)
- JavaScript SDK integration for portal embedding
- Responsive iframe sizing
- Filter/parameter pass-through capability

**4. Updated Walkthrough Content**
- All references to Chart.js removed
- Screenshots replaced with real QuickSight UI captures
- Steps reflect actual QuickSight interaction (filters, drill-down, export)
- Architecture diagram shows QuickSight data flow

**5. Test Coverage**
- CloudFormation template validation tests
- E2E tests for embedded dashboard loading
- Screenshot capture automation for QuickSight UI
- Accessibility tests for embedded dashboard

### Growth Features (Post-MVP)

**Phase 2 Enhancements:**
- Row-level security demonstration (multi-council data filtering)
- Calculated field examples (YoY comparisons, running totals)
- Q&A natural language query demonstration
- Dashboard export to PDF functionality
- Scheduled email report demonstration

### Vision (Future)

- QuickSight Q (natural language queries) integration
- Paginated report examples for committee papers
- Embedded authoring for council customisation
- Threshold alerts and anomaly detection

### Out of Scope

- QuickSight Enterprise edition features (not needed for demo)
- Registered user embedding (adds auth complexity unnecessary for demo)
- Direct query to live databases (SPICE sufficient for demo)
- Multi-dashboard scenarios (one dashboard demonstrates core capabilities)

---

## Technical Requirements

### CloudFormation Template Architecture

**Resource Deployment Sequence:**
1. S3 Bucket (sample data storage)
2. Lambda Function (data generation)
3. QuickSight DataSource (S3 manifest)
4. QuickSight DataSet (SPICE import)
5. QuickSight Analysis (dashboard design)
6. QuickSight Dashboard (published for embedding)
7. API Gateway + Lambda (embedding URL generation)

**Key Configuration:**
```yaml
# QuickSight resources require specific permissions
AWS::QuickSight::DataSource:
  Type: S3
  DataSourceParameters:
    S3Parameters:
      ManifestFileLocation:
        Bucket: !Ref SampleDataBucket
        Key: manifest.json

AWS::QuickSight::DataSet:
  ImportMode: SPICE
  PhysicalTableMap:
    - S3Source with upload settings

AWS::QuickSight::Dashboard:
  VersionDescription: "NDX:Try Council Analytics Demo"
  DashboardPublishOptions:
    AdHocFilteringOption:
      AvailabilityStatus: ENABLED
```

**Anonymous Embedding Requirements:**
- QuickSight session capacity pricing enabled (pay-per-session)
- Namespace configuration for anonymous users
- Embedding domain allowlist (portal domain)
- Session duration configuration (60 minutes default)

### Sample Data Structure

**Council Service Performance Data:**
```json
{
  "service": "Waste Collection",
  "council": "Demo Borough Council",
  "month": "2024-11",
  "metrics": {
    "collections_completed": 45230,
    "missed_collections": 127,
    "satisfaction_score": 4.2,
    "cost_per_collection": 3.45
  },
  "category": "Environmental Services"
}
```

**Data Volume:**
- 6 council services
- 12 months of data
- ~500 data points total
- SPICE capacity: < 100 MB

### Embedding SDK Integration

**Portal Integration:**
```javascript
// QuickSight Embedding SDK
import { embedDashboard } from 'amazon-quicksight-embedding-sdk';

const embeddedDashboard = await embedDashboard({
  url: embedUrl, // From Lambda/API Gateway
  container: '#quicksight-container',
  parameters: {
    council: 'Demo Borough Council'
  },
  height: '600px',
  width: '100%'
});
```

---

## User Experience Requirements

### Walkthrough Flow (Updated)

**Step 1: Dashboard Overview**
- User sees embedded QuickSight dashboard
- "This is Amazon QuickSight - the same tool you'd use in production"
- Screenshot: Real QuickSight dashboard with GOV.UK styled data

**Step 2: Interactive Filtering**
- User clicks service filter dropdown
- Selects specific service (e.g., "Planning Applications")
- Dashboard updates to show filtered data
- Screenshot: Filter panel and updated visuals

**Step 3: Time Range Analysis**
- User adjusts date range parameter
- Observes trend changes
- Screenshot: Date picker and trend visualisation

**Step 4: Drill-Down Exploration**
- User clicks on chart element for detail
- Modal or drill-through shows granular data
- Screenshot: Drill-down view

**Step 5: Export & Share**
- User exports dashboard to PDF
- Discusses report generation for committees
- Screenshot: Export dialog

### Content Updates Required

**Files to Update:**
1. `src/scenarios/quicksight-dashboard.njk` - Scenario overview
2. `src/walkthroughs/quicksight-dashboard.njk` - Step-by-step guide
3. `src/_data/walkthroughs.yaml` - Walkthrough metadata
4. `src/_data/scenarios.yaml` - Scenario metadata
5. `cloudformation/scenarios/quicksight-dashboard/template.yaml` - Infrastructure
6. `src/assets/images/screenshots/quicksight-dashboard/` - All screenshots

**Screenshot Requirements:**
- Minimum 5 screenshots showing real QuickSight UI
- Consistent browser viewport (1280x800)
- No Chart.js or mock dashboard images
- Annotations highlighting key QuickSight features

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Dashboard embed load time | < 3 seconds | User experience |
| SPICE query response | < 1 second | Demonstrates SPICE value |
| CloudFormation deployment | < 10 minutes | Within NDX:Try standards |
| Sample data generation | < 30 seconds | Lambda timeout safety |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Anonymous embedding only | No user credentials required |
| Session isolation | Each demo gets unique session |
| Data isolation | Sample data only, no PII |
| IAM least privilege | QuickSight service role scoped to specific resources |
| Domain allowlist | Embedding restricted to NDX:Try portal domain |

### Accessibility

| Requirement | Target |
|-------------|--------|
| WCAG 2.2 AA compliance | QuickSight native + portal integration |
| Keyboard navigation | Supported via QuickSight SDK |
| Screen reader compatibility | QuickSight ARIA labels |
| Colour contrast | QuickSight themes meet standards |

### Cost

| Component | Estimated Cost | Notes |
|-----------|----------------|-------|
| QuickSight session capacity | $0.30 per session | Pay-per-session pricing |
| SPICE storage | $0.25/GB/month | < 100 MB = negligible |
| S3 storage | < $0.01/month | Sample data only |
| Lambda executions | < $0.01/deployment | Minimal invocations |

**Total estimated cost per demo deployment:** ~$0.50-1.00

---

## Epic Structure

### Epic 1: QuickSight CloudFormation Infrastructure
**Goal:** Deploy real QuickSight resources via CloudFormation

**Stories:**
1. S3 bucket and sample data Lambda (data foundation)
2. QuickSight DataSource configuration (S3 manifest)
3. QuickSight DataSet with SPICE import
4. QuickSight Analysis and Dashboard resources
5. Anonymous embedding configuration
6. Integration testing and validation

### Epic 2: Sample Data Pipeline
**Goal:** Generate realistic UK council analytics data

**Stories:**
1. Sample data schema design (services, metrics, time series)
2. Lambda data generator implementation
3. S3 manifest file generation
4. SPICE refresh trigger mechanism
5. Data validation tests

### Epic 3: Portal Embedding Integration
**Goal:** Embed QuickSight dashboard in NDX:Try portal

**Stories:**
1. Embedding URL generation Lambda
2. QuickSight Embedding SDK integration
3. Responsive container implementation
4. Parameter pass-through configuration
5. Error handling and fallback UI

### Epic 4: Walkthrough Content Migration
**Goal:** Update all content to reflect real QuickSight

**Stories:**
1. Scenario page content updates
2. Walkthrough step-by-step rewrite
3. Architecture diagram update
4. Evidence Pack QuickSight section
5. "What's Next" QuickSight guidance

### Epic 5: Screenshot Pipeline & Visual Assets
**Goal:** Capture real QuickSight UI screenshots

**Stories:**
1. Screenshot automation for QuickSight embedded view
2. Step-by-step walkthrough screenshots
3. Filter interaction screenshots
4. Export dialog screenshots
5. Screenshot verification tests

### Epic 6: Testing & Quality Assurance
**Goal:** Comprehensive test coverage

**Stories:**
1. CloudFormation template validation tests
2. E2E dashboard loading tests
3. Accessibility tests for embedded dashboard
4. Visual regression tests
5. Integration test suite
6. Documentation review and QA

---

## Dependencies & Risks

### Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| QuickSight session capacity pricing | AWS Account | Requires enablement |
| QuickSight service permissions | IAM | CloudFormation managed |
| Embedding domain allowlist | QuickSight Admin | Part of template |
| Portal JavaScript environment | Frontend | Existing capability |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| QuickSight CloudFormation limitations | Medium | High | Use Assets-as-Bundle API if needed |
| Anonymous embedding complexity | Medium | Medium | Extensive AWS documentation available |
| SPICE refresh timing | Low | Medium | Synchronous refresh with status polling |
| Session capacity cost overruns | Low | Low | Session limits and monitoring |
| QuickSight UI changes | Low | Medium | Screenshot automation catches drift |

---

## Appendix: Research Summary

### QuickSight Embedding Options Evaluated

1. **Anonymous Embedding (Selected)** - Public access, no auth required, pay-per-session
2. **Registered User Embedding** - Requires auth integration, higher complexity
3. **1-Click Enterprise Embedding** - Requires Enterprise edition, overkill for demo

### CloudFormation Resource Types Available

- `AWS::QuickSight::Dashboard`
- `AWS::QuickSight::Analysis`
- `AWS::QuickSight::Template`
- `AWS::QuickSight::DataSource`
- `AWS::QuickSight::DataSet`
- `AWS::QuickSight::Theme`
- `AWS::QuickSight::Topic` (Q integration)

### Pricing Model

- **Author licenses:** $24/month (not needed for demo)
- **Reader licenses:** $5/session (capacity pricing selected)
- **Session capacity:** $0.30/session (30-minute sessions)
- **SPICE:** $0.25/GB/month

---

_This PRD defines the migration of the QuickSight Dashboard scenario from a Chart.js prototype to authentic Amazon QuickSight infrastructure, delivering on the NDX:Try promise of hands-on AWS service experience._

_Created through collaborative discovery between cns and AI facilitator._
