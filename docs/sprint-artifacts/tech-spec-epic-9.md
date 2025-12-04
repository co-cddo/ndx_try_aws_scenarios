# Epic Technical Specification: Smart Car Park IoT Exploration

Date: 2025-11-28
Author: cns
Epic ID: 9
Status: Draft

---

## Overview

Epic 9 extends the hands-on exploration framework to the Smart Car Park IoT scenario. Users will explore real-time data flows, IoT simulation, dashboard interactivity, and sensor failure handling.

This epic follows the patterns established in Epic 6 (Reference Implementation), reusing exploration components and reducing implementation effort by ~40%.

**User Value Statement:** "I understand how IoT data flows, how dashboards update in real-time, and what happens when sensors fail."

## Objectives and Scope

### In Scope

- **Story 9.1:** Exploration Landing Page with IoT-focused persona paths
- **Story 9.2:** 5 guided experiments (sensor toggle, dashboard updates, traffic patterns, alerts, zone filtering)
- **Story 9.3:** Architecture tour covering IoT Core, Timestream, QuickSight, Lambda
- **Story 9.4:** 3 boundary challenges (all sensors offline, rapid changes, invalid data)
- **Story 9.5:** Production guidance for car park system integration
- **Story 9.6:** Screenshot automation for Smart Car Park exploration pages
- Reuse of Epic 6 components
- IoT-specific data file: `src/_data/exploration/smart-car-park.yaml`

### Out of Scope

- Modifications to the core Smart Car Park CloudFormation template
- Changes to the basic walkthrough (Story 3.5)
- Real IoT device integration

### Dependencies

- **Epic 6 (Contexted):** Reusable components established
- **Story 3.5 (Done):** Smart Car Park IoT Walkthrough must exist
- **Deployed Smart Car Park scenario:** Live endpoints for experiments

## System Architecture Alignment

### Smart Car Park IoT Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     IoT Sensors (Simulated)                  │
│                     ├── Bay 1: OCCUPIED/VACANT               │
│                     ├── Bay 2: OCCUPIED/VACANT               │
│                     └── Bay N: OCCUPIED/VACANT               │
└────────────────────┬────────────────────────────────────────┘
                     │ MQTT Messages
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     AWS IoT Core                             │
│                     ├── Message Routing                      │
│                     ├── Device Shadow                        │
│                     └── Rule Actions                         │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│ Timestream       │  │ Lambda (Processing)                  │
│ (Time Series DB) │  │ ├── Aggregate Counts                 │
│ ├── sensor_data  │  │ ├── Calculate Occupancy %            │
│ └── bay_history  │  │ └── Trigger Alerts                   │
└────────┬─────────┘  └──────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     QuickSight Dashboard                     │
│                     ├── Real-time Occupancy                  │
│                     ├── Historical Trends                    │
│                     └── Zone Breakdown                       │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/smart-car-park/explore/index.njk` | Exploration landing page | 9.1 |
| `src/walkthroughs/smart-car-park/explore/experiments.njk` | 5 guided experiments | 9.2 |
| `src/walkthroughs/smart-car-park/explore/architecture.njk` | Visual + Console tours | 9.3 |
| `src/walkthroughs/smart-car-park/explore/limits.njk` | 3 boundary challenges | 9.4 |
| `src/walkthroughs/smart-car-park/explore/production.njk` | Production guidance | 9.5 |
| `src/_data/exploration/smart-car-park.yaml` | Exploration activity metadata | 9.1-9.5 |
| `src/assets/images/exploration/smart-car-park/` | Screenshot directory | 9.6 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/smart-car-park.yaml
scenario_id: smart-car-park
scenario_title: Smart Car Park IoT
total_time_estimate: "45 minutes"
activities:
  - id: exp1
    title: "Toggle Sensor States"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "See how individual sensor changes update the overall occupancy"
    is_first: true
    safe_badge: true
    interaction: "Click bay buttons to toggle OCCUPIED/VACANT"
    expected_output: "Dashboard updates in real-time (1-2 second delay)"
    screenshot: "experiments/exp1-sensor-toggle.png"

  - id: exp2
    title: "Watch Dashboard Real-Time Updates"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "IoT data flows continuously without page refresh"
    safe_badge: true
    interaction: "Toggle multiple sensors and watch the dashboard"
    expected_output: "Occupancy percentage and charts update live"
    screenshot: "experiments/exp2-realtime-updates.png"

  - id: exp3
    title: "Rush Hour Simulation"
    category: experiments
    persona: both
    time_estimate: "10 min"
    learning: "See how the system handles sudden traffic patterns"
    safe_badge: true
    interaction: "Click 'Simulate Rush Hour' to fill 80% of bays quickly"
    expected_output: "Dashboard shows rapid occupancy increase, alert triggered"
    screenshot: "experiments/exp3-rush-hour.png"

  - id: exp4
    title: "Trigger Capacity Alert"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Alerts help manage parking availability proactively"
    safe_badge: true
    interaction: "Fill bays until 90% capacity reached"
    expected_output: "Capacity warning banner appears"
    screenshot: "experiments/exp4-capacity-alert.png"

  - id: exp5
    title: "Filter by Zone"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Zone filtering helps focus on specific car park areas"
    safe_badge: true
    interaction: "Use zone dropdown to filter dashboard view"
    expected_output: "Dashboard shows only selected zone data"
    screenshot: "experiments/exp5-zone-filter.png"

  # Architecture Tour
  - id: arch-visual
    title: "Visual Architecture Tour"
    category: architecture
    persona: visual
    time_estimate: "10 min"
    learning: "How IoT data flows from sensors to dashboard"
    steps:
      - title: "Sensor Sends Message"
        description: "Each parking bay sensor sends its status to the cloud"
        screenshot: "architecture/step1-sensor.png"
      - title: "IoT Core Routes Message"
        description: "AWS IoT Core receives and routes the message"
        screenshot: "architecture/step2-iot-core.png"
      - title: "Data Stored in Timestream"
        description: "Time-series database stores historical data"
        screenshot: "architecture/step3-timestream.png"
      - title: "Lambda Calculates Aggregates"
        description: "Lambda function calculates occupancy percentages"
        screenshot: "architecture/step4-lambda.png"
      - title: "QuickSight Displays Dashboard"
        description: "Dashboard shows real-time and historical views"
        screenshot: "architecture/step5-quicksight.png"

  - id: arch-console
    title: "Console Architecture Tour"
    category: architecture
    persona: technical
    time_estimate: "15 min"
    learning: "Navigate AWS Console to see IoT data flow"
    steps:
      - title: "IoT Core Message Broker"
        console_url: "https://console.aws.amazon.com/iot/home#/test"
        what_to_look_for: "MQTT topics, message payloads"
        screenshot: "architecture/console-iot.png"
      - title: "Timestream Query Editor"
        console_url: "https://console.aws.amazon.com/timestream/"
        what_to_look_for: "sensor_data table, historical queries"
        screenshot: "architecture/console-timestream.png"
      - title: "Lambda Processing Function"
        console_url: "https://console.aws.amazon.com/lambda/"
        what_to_look_for: "Aggregation logic, CloudWatch logs"
        screenshot: "architecture/console-lambda.png"
      - title: "QuickSight Dashboard"
        console_url: "https://quicksight.aws.amazon.com/"
        what_to_look_for: "Dataset connections, visual configurations"
        screenshot: "architecture/console-quicksight.png"

  # Boundary Challenges
  - id: limit1
    title: "All Sensors Offline"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "System degrades gracefully when sensors fail"
    challenge_description: "Click 'All Offline' to simulate total sensor failure"
    expected_behavior: "Dashboard shows 'No Data' state, last known values displayed"
    business_implication: "Monitoring alerts needed for sensor health"
    recovery: "Click 'Restore Sensors' to reconnect"
    screenshot: "limits/limit1-offline.png"

  - id: limit2
    title: "Rapid State Changes"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "System handles high-frequency updates"
    challenge_description: "Click 'Rapid Toggle' to change states 10x per second"
    expected_behavior: "Dashboard may lag briefly, then catches up"
    business_implication: "Rate limiting protects system resources"
    recovery: "Dashboard auto-recovers within seconds"
    screenshot: "limits/limit2-rapid.png"

  - id: limit3
    title: "Invalid Sensor Data"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Data validation prevents dashboard corruption"
    challenge_description: "Click 'Send Invalid' to simulate corrupted sensor message"
    expected_behavior: "Invalid message logged, dashboard unaffected"
    business_implication: "IoT rules filter bad data before dashboard"
    recovery: "No recovery needed - invalid data rejected"
    screenshot: "limits/limit3-invalid.png"
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Real-time update latency | <2 seconds | WebSocket connection |
| Dashboard refresh | 1 second intervals | QuickSight auto-refresh |
| Sensor simulation response | <500ms | Lambda edge |

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Sensor message delivery | 99%+ | IoT Core QoS 1 |
| Dashboard availability | 99.9% | QuickSight SLA |

## Acceptance Criteria (Authoritative)

### Story 9.1: Exploration Landing Page

- [ ] Persona selection for IoT focus
- [ ] 5 Visual-First activities covering real-time data
- [ ] 5 Console activities for IoT Core exploration
- [ ] Unique focus areas: real-time updates, simulation, alerts
- [ ] Reuses Epic 6 layout and components

### Story 9.2: "What Can I Change?" Experiments

- [ ] Experiment 1: Sensor state toggle
- [ ] Experiment 2: Real-time dashboard updates
- [ ] Experiment 3: Rush hour simulation
- [ ] Experiment 4: Capacity alert trigger
- [ ] Experiment 5: Zone filtering
- [ ] Interactive sensor simulator

### Story 9.3: "How Does It Work?" Architecture Tour

- [ ] Visual Tour: IoT data flow (5 steps)
- [ ] Console Tour: IoT Core, Timestream, Lambda, QuickSight
- [ ] Real-time data visualization
- [ ] Message flow demonstration

### Story 9.4: "Test the Limits" Boundary Exercise

- [ ] Challenge 1: All sensors offline
- [ ] Challenge 2: Rapid state changes
- [ ] Challenge 3: Invalid sensor data
- [ ] Each shows expected behavior and recovery

### Story 9.5: "Take It Further" Production Guidance

- [ ] Physical sensor integration guidance
- [ ] Scaling to multiple car parks
- [ ] Alert escalation workflows
- [ ] Historical analytics use cases
- [ ] Cost projections

### Story 9.6: Screenshot Automation Pipeline

- [ ] Smart Car Park pages added to shared pipeline
- [ ] Dashboard state screenshots captured
- [ ] Sensor simulation states documented

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 9.1 | FR57, FR58, FR59, FR60, FR90 | NFR37, NFR39, NFR40 |
| 9.2 | FR65, FR66, FR67, FR68 | NFR37, NFR39, NFR40 |
| 9.3 | FR69, FR70, FR71, FR83 | NFR37, NFR38, NFR39 |
| 9.4 | FR72, FR73, FR74 | NFR37, NFR39 |
| 9.5 | FR75, FR76, FR77 | NFR39 |
| 9.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket connection drops | Low | Medium | Auto-reconnect with backoff |
| Simulation overwhelms Lambda | Low | Low | Rate limiting in IoT rules |

### Assumptions

- IoT Core simulator UI available in demo account
- Timestream database persists demo session
- QuickSight dashboard refreshes automatically

## Test Strategy Summary

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| Sensor toggle flow | Playwright E2E | GitHub Actions |
| Real-time updates | WebSocket test | GitHub Actions |
| Dashboard refresh | Visual regression | GitHub Actions |

### Manual Testing Checklist

- [ ] Sensor toggle updates dashboard in <2 seconds
- [ ] Rush hour simulation fills bays correctly
- [ ] Capacity alert triggers at threshold
- [ ] Zone filter shows correct subset
- [ ] Offline simulation shows fallback state
