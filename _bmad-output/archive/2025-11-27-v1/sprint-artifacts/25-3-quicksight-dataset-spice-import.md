# Story 25.3: QuickSight DataSet with SPICE Import

## Story Details

| Field | Value |
|-------|-------|
| Story ID | 25.3 |
| Epic | 25 - QuickSight CloudFormation Infrastructure |
| Status | Done |
| Points | 8 |
| Created | 2025-11-30 |

## User Story

**As a** portal administrator deploying the QuickSight Dashboard scenario
**I want** a QuickSight DataSet with SPICE import and calculated columns
**So that** data is optimized for fast query performance in dashboards

## Acceptance Criteria

- [x] AC1: AWS::QuickSight::DataSet resource created
- [x] AC2: PhysicalTableMap defines S3Source correctly
- [x] AC3: InputColumns match CSV schema exactly (8 columns)
- [x] AC4: SPICE import completes successfully (180,600 bytes)
- [x] AC5: LogicalTableMap with calculated column (resolution_rate)
- [x] AC6: SPICE auto-purchase enabled via UpdateSPICECapacityConfiguration API
- [x] AC7: DataSet visible in QuickSight Console with data

## Technical Details

### DataSet Schema (InputColumns)

| Column | Type |
|--------|------|
| council_name | STRING |
| region | STRING |
| service_area | STRING |
| month | STRING |
| cases_received | INTEGER |
| cases_resolved | INTEGER |
| avg_response_hours | DECIMAL |
| satisfaction_score | DECIMAL |

### Calculated Column

```yaml
CalculatedColumns:
  - ColumnId: resolution_rate
    ColumnName: resolution_rate
    Expression: cases_resolved / cases_received
```

### SPICE Configuration

```yaml
ImportMode: SPICE
IngestionWaitPolicy:
  IngestionWaitTimeInHours: 2
  WaitForSpiceIngestion: true
```

## Implementation Tasks

- [ ] Task 1: Create AWS::QuickSight::DataSet resource
- [ ] Task 2: Define PhysicalTableMap with S3Source
- [ ] Task 3: Add InputColumns for all 8 fields
- [ ] Task 4: Create LogicalTableMap with alias
- [ ] Task 5: Add resolution_rate calculated column
- [ ] Task 6: Configure SPICE import mode
- [ ] Task 7: Add IngestionWaitPolicy
- [ ] Task 8: Deploy and verify data in QuickSight

## Dependencies

- Story 25.2: QuickSight DataSource (completed)

---

## Implementation Log

### 2025-11-30

- Created story file
- Beginning implementation of QuickSight DataSet
- Initial SPICE deployment failed: "Insufficient SPICE capacity"
- Enabled SPICE auto-purchase via `aws quicksight update-spice-capacity-configuration --purchase-mode AUTO_PURCHASE`
- Redeployed CloudFormation with SPICE mode
- DataSet created successfully with 180,600 bytes in SPICE
- Verified all 8 input columns + 1 calculated column (resolution_rate)
- Type casts working: cases_received/cases_resolved as INTEGER, avg_response_hours/satisfaction_score as DECIMAL
- **Story DONE** - All acceptance criteria verified
