# Story 24.5: Smart Car Park DynamoDB Integration

Status: done

## Story

**As a** council evaluator,
**I want** the Smart Car Park scenario to use real DynamoDB storage,
**So that** I can experience genuine IoT data persistence capability.

## Acceptance Criteria

### AC-24.5.1: DynamoDB Integration Architecture

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.5.1a | DynamoDB table created via CloudFormation | Stack inspection |
| AC-24.5.1b | Lambda has IAM permissions for DynamoDB | CloudFormation inspection |
| AC-24.5.1c | Data persists across API calls | API testing |
| AC-24.5.1d | Simulate action writes to DynamoDB | API test + table scan |

### AC-24.5.2: Data Persistence Experience

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.5.2a | Car park data initialized on first call | API test |
| AC-24.5.2b | Simulate updates visible on refresh | Manual testing |
| AC-24.5.2c | lastUpdated timestamps accurate | Response inspection |
| AC-24.5.2d | Response includes storage indicator | API test |

### AC-24.5.3: UI Updates

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.5.3a | Banner indicates DynamoDB | Visual inspection |
| AC-24.5.3b | Simulate button shows "Writing to DynamoDB" | Visual inspection |
| AC-24.5.3c | Loading message references DynamoDB | Visual inspection |

## Dependencies

- Story 24.1 (Deploy All Stacks) - DONE
- Tech spec tech-spec-epic-24.md - DONE

## Tasks

1. [x] Verify DynamoDB is available in sandbox (not SCP blocked)
2. [x] Add DynamoDB table resource to CloudFormation
3. [x] Add IAM policy for DynamoDB access
4. [x] Implement get_parking_data_from_dynamodb function
5. [x] Implement simulate_sensor_update function with DynamoDB writes
6. [x] Implement initialize_car_parks for first-time setup
7. [x] Update API response to include storage indicator
8. [x] Update UI to indicate DynamoDB usage
9. [x] Deploy updated stack
10. [x] Verify data persistence across calls

## Technical Notes

### Implementation Approach

Unlike Textract (blocked by SCP), DynamoDB is fully accessible in the AWS Innovation Sandbox. The implementation uses:

1. **DynamoDB Table**: `ndx-try-parking-data-us-west-2`
   - Partition key: `carParkId` (String)
   - Billing mode: PAY_PER_REQUEST (on-demand)
   - 4 car parks stored with occupancy data

2. **Data Flow**:
   - First call initializes data if table is empty
   - `status` action reads from DynamoDB
   - `simulate` action writes updated occupancy to DynamoDB
   - Data persists across Lambda invocations

### Key Code Components

```python
def get_parking_data_from_dynamodb(table):
    """Get all car park data from DynamoDB"""
    response = table.scan()
    items = response.get('Items', [])
    # Convert Decimal to float for JSON serialization
    return sorted(parking_data, key=lambda x: x['id'])

def simulate_sensor_update(table):
    """Simulate IoT sensor updates and write to DynamoDB"""
    for car_park in CAR_PARKS:
        table.put_item(Item={
            'carParkId': car_park['id'],
            'name': car_park['name'],
            'capacity': car_park['capacity'],
            'occupied': occupied,
            'available': available,
            'percentFull': Decimal(str(round(occupancy_pct * 100, 1))),
            'status': status,
            'hourlyRate': Decimal(str(car_park['hourlyRate'])),
            'lastUpdated': timestamp
        })
```

### API Response Example

```json
{
  "success": true,
  "timestamp": "2025-11-30T16:05:13.032285",
  "carParks": [
    {
      "id": "CP001",
      "name": "Town Centre Multi-Storey",
      "capacity": 450,
      "occupied": 245,
      "available": 205,
      "percentFull": 54.7,
      "status": "green",
      "hourlyRate": "£1.50",
      "lastUpdated": "2025-11-30T16:05:12.923154"
    }
  ],
  "totalCapacity": 1050,
  "totalAvailable": 353,
  "storage": "Amazon DynamoDB",
  "note": "Data persists in DynamoDB - in production uses IoT Core + Timestream"
}
```

### Simulate Response

```json
{
  "success": true,
  "message": "Simulated sensor data written to DynamoDB for 4 car parks",
  "timestamp": "2025-11-30T16:05:21.153219",
  "storage": "Amazon DynamoDB"
}
```

### Services Used

- Amazon DynamoDB (table storage)
- AWS Lambda (processing)
- Amazon S3 (backup storage, optional)

## Definition of Done

- [x] DynamoDB table created via CloudFormation
- [x] IAM permissions for DynamoDB configured
- [x] Data persists across API calls
- [x] Simulate action writes to DynamoDB
- [x] UI indicates DynamoDB usage
- [x] Stack deployed successfully
- [x] Verification complete

## Dev Record

### Session Log

**2025-11-30 - Story Completed**

**Developer:** Claude Code

**Implementation Details:**

1. **DynamoDB Availability**: Verified DynamoDB is NOT blocked by SCP (unlike Textract)
   - Test table creation succeeded
   - Full CRUD operations available

2. **Template Update**: Rewrote smart-car-park CloudFormation template with:
   - DynamoDB table: `ndx-try-parking-data-us-west-2`
   - IAM policy for DynamoDB operations (GetItem, PutItem, Scan, etc.)
   - Lambda environment variable `DATA_TABLE` for table name
   - Updated UI with DynamoDB branding

3. **Key Changes**:
   - Added `ParkingDataTable` resource (DynamoDB)
   - Added `DynamoDBAccess` policy to Lambda role
   - Implemented `initialize_car_parks()` for first-time setup
   - Implemented `get_parking_data_from_dynamodb()` for reads
   - Implemented `simulate_sensor_update()` for writes
   - Added `storage` field to API responses
   - Updated UI banner: "Powered by Amazon DynamoDB"

**Verification Results:**

| Test | Result |
|------|--------|
| DynamoDB table created | Pass - `ndx-try-parking-data-us-west-2` |
| Status API returns data | Pass - 4 car parks with DynamoDB storage |
| Simulate writes to DynamoDB | Pass - Data persists |
| Data persistence | Pass - lastUpdated timestamps preserved |
| UI branding | Pass - DynamoDB badge displayed |

**Files Modified:**
- `cloudformation/scenarios/smart-car-park/template.yaml` - Complete rewrite with DynamoDB

**Deployment:**
- Stack: `ndx-try-smart-car-park` - UPDATE_COMPLETE
- Table: `ndx-try-parking-data-us-west-2` - 4 items

**Time:** ~25 minutes

---

_Story created: 2025-11-30_
_Story completed: 2025-11-30_
_Epic: 24 - Scenario Application Remediation_
