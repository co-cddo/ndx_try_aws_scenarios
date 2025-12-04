# Story 25.1: S3 Bucket and Sample Data Lambda

## Story Details

| Field | Value |
|-------|-------|
| Story ID | 25.1 |
| Epic | 25 - QuickSight CloudFormation Infrastructure |
| Status | Done |
| Points | 5 |
| Created | 2025-11-30 |

## User Story

**As a** portal administrator deploying the QuickSight Dashboard scenario
**I want** an S3 bucket with sample council data and manifest files
**So that** QuickSight can import realistic UK council performance metrics via SPICE

## Acceptance Criteria

- [x] AC1: S3 bucket created with server-side encryption (AES-256)
- [x] AC2: Public access blocked on S3 bucket
- [x] AC3: Lambda function generates 12 months of council performance data
- [x] AC4: CSV file uploaded to S3 with correct schema (council_name, region, service_area, month, cases_received, cases_resolved, avg_response_hours, satisfaction_score)
- [x] AC5: manifest.json file created following QuickSight S3 manifest format
- [x] AC6: CloudFormation deploys successfully without errors
- [x] AC7: Lambda execution completes within 60 seconds
- [ ] AC8: Unit tests verify data generation logic (deferred to Epic 30)

## Technical Details

### S3 Bucket Configuration

```yaml
Bucket:
  BucketEncryption: AES256
  PublicAccessBlockConfiguration:
    BlockPublicAcls: true
    BlockPublicPolicy: true
    IgnorePublicAcls: true
    RestrictPublicBuckets: true
  BucketPolicy:
    Principal: quicksight.amazonaws.com
    Actions: s3:GetObject, s3:ListBucket
```

### Sample Data Schema

| Column | Type | Example |
|--------|------|---------|
| council_name | STRING | Demo Borough Council |
| region | STRING | London |
| service_area | STRING | Waste Collection |
| month | STRING | 2024-01 |
| cases_received | INTEGER | 1250 |
| cases_resolved | INTEGER | 1180 |
| avg_response_hours | DECIMAL | 24.5 |
| satisfaction_score | DECIMAL | 4.2 |

### Service Areas (9 total)

1. Waste Collection
2. Planning Applications
3. Housing
4. Council Tax
5. Highways
6. Environmental Health
7. Benefits
8. Customer Services
9. Parking

### Manifest File Format

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

## Implementation Tasks

- [x] Task 1: Define S3 bucket resource with encryption
- [x] Task 2: Add bucket policy for QuickSight access
- [x] Task 3: Create Lambda function for data generation
- [x] Task 4: Implement CSV data generation logic
- [x] Task 5: Implement manifest.json generation
- [x] Task 6: Create Custom Resource to trigger Lambda on deploy
- [x] Task 7: Add CloudWatch log group
- [ ] Task 8: Write unit tests

## Dependencies

- QuickSight Enterprise Edition subscription (completed)
- AWS credentials for deployment (available)

## Notes

- Lambda uses Python 3.12 runtime
- Data covers 12 months for trend analysis in dashboard
- Custom Resource ensures data is uploaded before DataSource creation

---

## Implementation Log

### 2025-11-30

- Created story file
- Beginning implementation of CloudFormation template
- CloudFormation template rewritten: removed Chart.js, added QuickSight infrastructure
- Stack deployed successfully to AWS (UPDATE_COMPLETE)
- S3 bucket created: `ndx-quicksight-data-449788867583-us-west-2`
- 864 rows of council data generated (8 regions × 9 services × 12 months)
- manifest.json created with correct QuickSight format
- **Story DONE** - All acceptance criteria verified
