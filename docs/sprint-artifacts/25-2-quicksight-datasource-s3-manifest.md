# Story 25.2: QuickSight DataSource (S3 Manifest)

## Story Details

| Field | Value |
|-------|-------|
| Story ID | 25.2 |
| Epic | 25 - QuickSight CloudFormation Infrastructure |
| Status | Done |
| Points | 8 |
| Created | 2025-11-30 |

## User Story

**As a** portal administrator deploying the QuickSight Dashboard scenario
**I want** a QuickSight DataSource connected to the S3 manifest file
**So that** QuickSight can access the council performance data for analytics

## Acceptance Criteria

- [x] AC1: AWS::QuickSight::DataSource resource created
- [x] AC2: S3 manifest file correctly referenced
- [x] AC3: Permissions configured for QuickSight admin user
- [x] AC4: DataSource passes validation (Status: CREATION_SUCCESSFUL)
- [x] AC5: CloudFormation DependsOn correctly chains from S3 bucket
- [x] AC6: DataSource visible in QuickSight Console

## Technical Details

### DataSource Configuration

```yaml
AWS::QuickSight::DataSource:
  Type: S3
  DataSourceParameters:
    S3Parameters:
      ManifestFileLocation:
        Bucket: !Ref DataBucket
        Key: manifests/council-data-manifest.json
```

### Required IAM Permissions

- QuickSight service principal access to S3 bucket
- QuickSight user permissions for DataSource management

## Implementation Tasks

- [ ] Task 1: Add IAM role for QuickSight S3 access
- [ ] Task 2: Create AWS::QuickSight::DataSource resource
- [ ] Task 3: Configure permissions for QuickSight admin user
- [ ] Task 4: Add CloudFormation outputs for DataSource
- [ ] Task 5: Deploy and verify in QuickSight Console

## Dependencies

- Story 25.1: S3 bucket and sample data Lambda (completed)
- QuickSight admin user exists in account

## Notes

- DataSource type is S3 (not Athena, RDS, etc.)
- Uses manifest.json to locate CSV file
- QuickSight user ARN: `arn:aws:quicksight:us-west-2:449788867583:user/default/AWSReservedSSO_ndx_IsbAdminsPS_53e05916f706247a/ndx@dsit.gov.uk`

---

## Implementation Log

### 2025-11-30

- Created story file
- Beginning implementation of QuickSight DataSource
- Added QuickSightUsername parameter
- Created QuickSightS3AccessRole IAM role
- Created CouncilDataSource with S3 manifest reference
- CloudFormation deployed successfully (UPDATE_COMPLETE)
- DataSource verified in QuickSight API (Status: CREATION_SUCCESSFUL)
- **Story DONE** - All acceptance criteria verified
