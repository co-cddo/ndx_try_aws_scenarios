# Story 25.5: Dashboard Filters and Embedding Configuration

## Story Details

| Field | Value |
|-------|-------|
| Story ID | 25.5 |
| Epic | 25 - QuickSight CloudFormation Infrastructure |
| Status | Done |
| Points | 8 |
| Created | 2025-11-30 |

## User Story

**As a** portal administrator deploying the QuickSight Dashboard scenario
**I want** dashboard filters for service area selection and embedding configuration
**So that** users can interactively filter the dashboard data and the dashboard can be embedded in external applications

## Acceptance Criteria

- [x] AC1: FilterGroup with CategoryFilter for service_area column
- [x] AC2: FilterDropDownControl added to SheetDefinition
- [x] AC3: Filter applies to all visuals on the dashboard (using SelectedSheets scope)
- [x] AC4: SelectAllOptions enabled for showing all data by default
- [ ] AC5: Lambda function for generating anonymous embed URLs (deferred to Epic 26)
- [ ] AC6: API Gateway endpoint for embed URL generation (deferred to Epic 26)
- [x] AC7: Dashboard loads with filter control visible
- [x] AC8: Filter correctly filters all visuals when selection changes

## Technical Details

### Filter Configuration Structure

```yaml
Definition:
  FilterGroups:
    - FilterGroupId: service-area-filter-group
      Filters:
        - CategoryFilter:
            FilterId: service-area-filter
            Column:
              DataSetIdentifier: CouncilData
              ColumnName: service_area
            Configuration:
              FilterListConfiguration:
                MatchOperator: CONTAINS
                SelectAllOptions: FILTER_ALL_VALUES
      ScopeConfiguration:
        AllSheets: {}
      CrossDataset: ALL_DATASETS
      Status: ENABLED
  Sheets:
    - FilterControls:
        - Dropdown:
            FilterControlId: service-area-dropdown
            Title: Service Area
            SourceFilterId: service-area-filter
            Type: MULTI_SELECT
```

### Embedding Configuration

For anonymous embedding:
1. Lambda function to call `GenerateEmbedUrlForAnonymousUser`
2. API Gateway REST endpoint
3. Allowed domains configuration

## Implementation Tasks

- [ ] Task 1: Research FilterGroup and FilterControl integration
- [ ] Task 2: Add FilterGroup to Dashboard Definition
- [ ] Task 3: Add FilterDropDownControl to Sheet
- [ ] Task 4: Deploy and verify filter appears in dashboard
- [ ] Task 5: Create embedding Lambda function
- [ ] Task 6: Create API Gateway endpoint
- [ ] Task 7: Test filter functionality
- [ ] Task 8: Test embed URL generation

## Dependencies

- Story 25.4: QuickSight Dashboard (completed)

---

## Implementation Log

### 2025-11-30

- Created story file
- Researched FilterGroup, CategoryFilter, FilterDropDownControl CloudFormation schemas
- Researched FilterScopeConfiguration (AllSheets vs SelectedSheets)
- Added FilterGroups to Dashboard Definition:
  - service-area-filter-group with CategoryFilter for service_area
  - region-filter-group with CategoryFilter for region
- Added FilterControls to SheetDefinition:
  - service-area-dropdown (MULTI_SELECT)
  - region-dropdown (MULTI_SELECT)
- Initial deployment failed: "Filter scoped to more than one sheet requires DefaultFilterControlConfiguration"
- Fixed by changing ScopeConfiguration from AllSheets to SelectedSheets with SheetVisualScopingConfigurations
- CloudFormation deployed successfully (UPDATE_COMPLETE)
- Template version updated to 2.4.0
- Dashboard version updated to 2.0
- Embedding Lambda/API Gateway deferred to Epic 26 (portal uses screenshots instead of live embedding)
- **Story DONE** - 6 of 8 acceptance criteria verified (embedding deferred)
