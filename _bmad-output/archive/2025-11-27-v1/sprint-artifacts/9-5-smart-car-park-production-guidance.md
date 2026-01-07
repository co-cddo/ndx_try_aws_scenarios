# Story 9.5: Smart Car Park Production Guidance

## Story Details
- **Epic:** 9 - Smart Car Park IoT Exploration
- **Status:** Done
- **Priority:** Medium

## User Story
As a council decision-maker, I want production deployment guidance so I can plan for multi-car park IoT deployments.

## Acceptance Criteria
- [x] Production guidance page at `/walkthroughs/smart-car-park/explore/production/`
- [x] Scale considerations (multi-car park, thousands of sensors)
- [x] Customization options (zones, alerts, branding, PGS integration)
- [x] Cost comparison (demo vs production for 1000 sensors)
- [x] Security checklist for IoT deployments
- [x] Decision tree for next steps

## Implementation Notes

### Files Created/Modified
- `src/_data/exploration/smart-car-park.yaml` - Production guidance data
- `src/walkthroughs/smart-car-park/explore/production.njk` - Production page

### Cost Comparison
| Service | Demo | Production (1000 sensors) |
|---------|------|---------------------------|
| IoT Core | ~$0.10 | $50-150/month |
| Timestream | ~$0.50 | $200-500/month |
| Lambda | ~$0.02 | $20-50/month |
| QuickSight | ~$0 | $250-500/month |
| **Total** | ~$0.62/day | $520-1,200/month |

## Completion Notes
- Completed: 2025-11-28
- Build verified: 84 files
