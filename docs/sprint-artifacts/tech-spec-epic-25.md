# Epic Technical Specification: QuickSight CloudFormation Infrastructure

Date: 2025-11-30
Author: Claude (AI-assisted)
Epic ID: 25
Status: Active
PRD Reference: docs/prd-quicksight-migration.md

---

## Overview

Epic 25 establishes the foundational QuickSight infrastructure deployed via CloudFormation. This epic migrates the current Chart.js simulation to real Amazon QuickSight resources, enabling councils to experience authentic AWS analytics capabilities.

The current implementation (`cloudformation/scenarios/quicksight-dashboard/template.yaml`, 596 lines) uses Lambda with embedded Python/HTML/JavaScript serving a Chart.js dashboard. This migration replaces it with:

- Real QuickSight DataSource, DataSet, and Dashboard resources
- SPICE in-memory caching for fast analytics queries
- Registered user embedding for authenticated dashboard access
- Lambda-generated sample data loaded into S3 for QuickSight consumption

**Key Simplification:** Anonymous embedding is NOT required. Registered user embedding behind session authentication is acceptable. This eliminates the $250/month session capacity pricing requirement.

## Objectives and Scope

### In Scope

**CloudFormation Resources:**
- `AWS::S3::Bucket` - Sample data storage with manifest files
- `AWS::Lambda::Function` - Data generator producing CSV/JSON for QuickSight
- `AWS::QuickSight::DataSource` - S3 manifest connection
- `AWS::QuickSight::DataSet` - SPICE import configuration
- `AWS::QuickSight::Analysis` - Dashboard design (via Definition approach)
- `AWS::QuickSight::Dashboard` - Published dashboard for embedding
- `AWS::IAM::Role` - QuickSight service and embedding permissions

**Sample Data Pipeline:**
- Lambda generates realistic UK council service performance data
- CSV files stored in S3 with proper manifest.json structure
- SPICE ingestion configured with reasonable wait policies

**Embedding Infrastructure:**
- Registered user embedding via `GenerateEmbedUrlForRegisteredUser` API
- Lambda function for embed URL generation
- IAM permissions scoped to specific dashboard resources

### Out of Scope

- Anonymous embedding (not required per user clarification)
- Session capacity pricing configuration
- Frontend SDK integration (Epic 27)
- Walkthrough content updates (Epic 28)
- Screenshot capture automation (Epic 29)

## Technical Architecture

### Resource Deployment Sequence

```
1. S3 Bucket (sample data storage)
   ↓
2. Lambda Function (data generator) → Uploads CSV + manifest.json to S3
   ↓
3. AWS::QuickSight::DataSource (S3 manifest reference)
   ↓
4. AWS::QuickSight::DataSet (SPICE import from DataSource)
   ↓
5. AWS::QuickSight::Dashboard (using Definition approach - no template needed)
   ↓
6. Lambda Function (embed URL generator for registered users)
```

### Key Technical Decisions

**1. Definition-Based Dashboard Creation**

Using the `Definition` property instead of `SourceEntity.SourceTemplate` avoids the circular dependency between Analysis and Template resources:

```yaml
AWS::QuickSight::Dashboard:
  Properties:
    Definition:
      DataSetIdentifierDeclarations:
        - Identifier: CouncilData
          DataSetArn: !GetAtt CouncilDataSet.Arn
      Sheets:
        - SheetId: main-dashboard
          Name: Council Performance
          Visuals: [...]
```

**2. S3 Manifest File Structure**

```json
{
  "fileLocations": [{
    "URIs": [
      "https://bucket.s3.region.amazonaws.com/data/council-metrics.csv"
    ]
  }],
  "globalUploadSettings": {
    "format": "CSV",
    "delimiter": ",",
    "textqualifier": "\"",
    "containsHeader": true
  }
}
```

**3. SPICE Import Configuration**

```yaml
AWS::QuickSight::DataSet:
  Properties:
    ImportMode: SPICE
    IngestionWaitPolicy:
      IngestionWaitTimeInHours: 2
      WaitForSpiceIngestion: true
```

**4. Registered User Embedding**

```python
quicksight.generate_embed_url_for_registered_user(
    AwsAccountId=account_id,
    UserArn=f'arn:aws:quicksight:{region}:{account_id}:user/default/{username}',
    SessionLifetimeInMinutes=600,
    ExperienceConfiguration={
        'Dashboard': {
            'InitialDashboardId': dashboard_id
        }
    }
)
```

### Sample Data Schema

**Council Service Performance Data (CSV):**

| Column | Type | Description |
|--------|------|-------------|
| council_name | STRING | Demo Borough Council |
| region | STRING | London, North West, etc. |
| service_area | STRING | Waste, Planning, Housing, etc. |
| month | STRING | YYYY-MM format |
| cases_received | INTEGER | Monthly case count |
| cases_resolved | INTEGER | Resolved cases |
| avg_response_hours | DECIMAL | Average response time |
| satisfaction_score | DECIMAL | 1-5 scale |

**Data Volume:**
- 9 service areas
- 12 months of data
- ~108 data points per council
- SPICE capacity: < 10 MB

### Dashboard Visuals

**Sheet 1: Overview Dashboard**
- KPI cards: Total Cases, Resolution Rate, Avg Satisfaction
- Bar chart: Cases by Service Area
- Bar chart: Satisfaction by Service Area
- Table: Service breakdown with sortable columns

**Sheet 2: Trends (optional for MVP)**
- Line chart: Monthly case trends
- Comparison metrics: Period-over-period changes

## Story Breakdown

### Story 25.1: S3 Bucket and Sample Data Lambda

**Acceptance Criteria:**
1. S3 bucket created with encryption and public access blocked
2. Lambda function generates realistic UK council data
3. CSV file uploaded to S3 with proper structure
4. manifest.json file created and uploaded
5. CloudFormation deploys successfully
6. Unit tests for data generation logic

**Technical Notes:**
- Bucket name: `ndx-quicksight-data-${AWS::AccountId}-${AWS::Region}`
- Lambda runtime: Python 3.12
- Data covers 12 months, 9 service areas

### Story 25.2: QuickSight DataSource (S3 Manifest)

**Acceptance Criteria:**
1. AWS::QuickSight::DataSource resource created
2. S3 manifest file correctly referenced
3. Permissions configured for QuickSight admin user
4. DataSource passes validation
5. CloudFormation DependsOn correctly chains from S3 bucket
6. DataSource visible in QuickSight Console

**Technical Notes:**
- Type: S3
- ManifestFileLocation references bucket and key
- Principal permissions for QuickSight user

### Story 25.3: QuickSight DataSet with SPICE Import

**Acceptance Criteria:**
1. AWS::QuickSight::DataSet resource created
2. PhysicalTableMap defines S3Source correctly
3. InputColumns match CSV schema exactly
4. SPICE import completes successfully
5. LogicalTableMap with calculated columns (resolution_rate)
6. IngestionWaitPolicy configured for stack creation
7. DataSet visible in QuickSight Console with data

**Technical Notes:**
- ImportMode: SPICE
- Wait for ingestion: true
- Calculated column: resolution_rate = cases_resolved / cases_received

### Story 25.4: QuickSight Analysis and Dashboard

**Acceptance Criteria:**
1. AWS::QuickSight::Dashboard created using Definition approach
2. Dashboard contains KPI visuals, bar charts, and data table
3. Filters enabled for service area selection
4. Dashboard loads successfully in QuickSight Console
5. Visuals display correct data from SPICE
6. GOV.UK-appropriate color scheme applied where possible

**Technical Notes:**
- Use Definition property (not SourceEntity)
- DashboardPublishOptions configured
- AdHocFilteringOption: ENABLED
- ExportToCSVOption: ENABLED (for demo purposes)

### Story 25.5: Embedding Configuration

**Acceptance Criteria:**
1. IAM role for embed URL generation created
2. Lambda function generates registered user embed URLs
3. `GenerateEmbedUrlForRegisteredUser` API call succeeds
4. Embed URL valid and loads dashboard in iframe
5. IAM permissions scoped to specific namespace and dashboard
6. Lambda function URL or API Gateway endpoint available

**Technical Notes:**
- Registered user embedding (not anonymous)
- Session lifetime: 600 minutes
- Domain allowlist configuration (optional for authenticated)

### Story 25.6: Integration Testing and Validation

**Acceptance Criteria:**
1. Full CloudFormation stack deploys without errors
2. SPICE data refresh completes within 5 minutes
3. Dashboard loads in < 3 seconds
4. All visuals display correct data
5. Embed URL generation succeeds
6. Stack delete cleanly removes all resources
7. Integration tests pass in CI pipeline

**Technical Notes:**
- Deploy to AWS account for validation
- Test stack create/update/delete lifecycle
- Verify no orphaned resources

## Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| QuickSight Enterprise Edition | AWS Account | Subscribed |
| QuickSight admin user | IAM | To be created |
| S3 bucket permissions for QuickSight | IAM | CloudFormation managed |
| AWS credentials for deployment | CI/CD | Available |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Definition-based dashboard complexity | Medium | Medium | Start with simple visuals, iterate |
| SPICE ingestion timing | Low | Medium | Configure generous IngestionWaitPolicy |
| QuickSight user principal resolution | Medium | High | Test with actual QuickSight user ARN early |
| CloudFormation validation errors | Medium | Medium | Deploy incrementally, validate each resource |

## Success Criteria

- [ ] CloudFormation stack deploys successfully
- [ ] All 6 QuickSight resources created (S3, Lambda, DataSource, DataSet, Dashboard, EmbedLambda)
- [ ] SPICE data loads within 5 minutes
- [ ] Dashboard displays correct council metrics
- [ ] Embed URL generation returns valid URL
- [ ] No Chart.js references remain in CloudFormation template
- [ ] All tests pass

## Files to Create/Modify

**Create:**
- `cloudformation/scenarios/quicksight-dashboard/template.yaml` (rewrite)
- `tests/cloudformation/quicksight-dashboard.test.ts` (new)

**Modify:**
- `docs/sprint-artifacts/sprint-status.yaml` (status updates)

---

## Implementation Notes

### QuickSight User Principal

The CloudFormation template requires a QuickSight user principal for permissions. Format:
```
arn:aws:quicksight:${AWS::Region}:${AWS::AccountId}:user/default/${QuickSightUsername}
```

Before deployment, ensure QuickSight user exists via:
```bash
aws quicksight list-users --aws-account-id ACCOUNT_ID --namespace default
```

### Custom Resource for Data Upload

Consider using a CloudFormation Custom Resource (Lambda-backed) to:
1. Generate sample data
2. Upload CSV to S3
3. Upload manifest.json to S3
4. Trigger before DataSource creation

### Dashboard Definition Structure

The Definition approach requires detailed visual specifications. Example structure:
```yaml
Definition:
  DataSetIdentifierDeclarations:
    - Identifier: CouncilData
      DataSetArn: !GetAtt DataSet.Arn
  Sheets:
    - SheetId: main
      Name: Overview
      Visuals:
        - KPIVisual:
            VisualId: total-cases-kpi
            ...
```

Refer to AWS documentation for complete visual specification formats.

---

_This tech spec supports Epic 25 of the QuickSight Migration project (Epic 25-30). Subsequent epics cover sample data pipeline (26), portal embedding integration (27), walkthrough content migration (28), screenshot pipeline (29), and testing/QA (30)._
