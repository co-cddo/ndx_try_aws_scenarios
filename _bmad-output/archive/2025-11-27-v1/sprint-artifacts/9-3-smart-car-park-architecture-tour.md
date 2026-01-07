# Story 9.3: Smart Car Park Architecture Tour

## Story Details
- **Epic:** 9 - Smart Car Park IoT Exploration
- **Status:** Done
- **Priority:** Medium

## User Story
As a technical user exploring smart parking, I want visual and console tours so I can understand the IoT data pipeline.

## Acceptance Criteria
- [x] Architecture page at `/walkthroughs/smart-car-park/explore/architecture/`
- [x] Visual tour covering IoT Core, Timestream, Lambda, QuickSight
- [x] Console tour with AWS Console deep links
- [x] GOV.UK tabs for tour selection
- [x] Completion tracking for each tour

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/smart-car-park.yaml` - Architecture tour definitions
- `src/walkthroughs/smart-car-park/explore/architecture.njk` - Architecture page

### Visual Tour Steps
1. Sensor Layer - MQTT messages from sensors
2. IoT Core Ingestion - Message routing and device shadows
3. Time Series Storage - Timestream for historical data
4. Processing Layer - Lambda for aggregations
5. Dashboard Presentation - QuickSight visualization
6. Alert Pipeline - SNS notifications

## Completion Notes
- Completed: 2025-11-28
- Build verified: 84 files
