# Story 9.4: Smart Car Park Boundary Challenges

## Story Details
- **Epic:** 9 - Smart Car Park IoT Exploration
- **Status:** Done
- **Priority:** Medium

## User Story
As a council officer, I want to test the limits of the IoT system so I understand failure scenarios and recovery.

## Acceptance Criteria
- [x] 3 boundary challenges covering IoT edge cases
- [x] Challenge 1: All Sensors Offline
- [x] Challenge 2: Rapid State Changes
- [x] Challenge 3: Invalid Sensor Data
- [x] Each challenge has expected behavior, business implication, recovery steps
- [x] Progress tracking and completion marking

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/smart-car-park.yaml` - 3 limit challenge definitions
- `src/walkthroughs/smart-car-park/explore/limits.njk` - Limits page

### Challenge Details
1. **All Sensors Offline** - Last-known state preservation
2. **Rapid State Changes** - High-frequency update handling
3. **Invalid Sensor Data** - Message validation and rejection

## Completion Notes
- Completed: 2025-11-28
- Build verified: 84 files
