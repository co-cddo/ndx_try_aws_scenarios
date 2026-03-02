---
title: 'Smart Car Park IoT Core Conversion'
slug: 'smart-car-park-iot-core-conversion'
created: '2026-03-02'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - AWS IoT Core (MQTT, Topic Rules)
  - AWS Lambda (Python 3.12)
  - Amazon Timestream (single data store - time-series + current state)
  - Amazon CloudWatch (Dashboard, Alarms)
  - Amazon EventBridge (scheduled simulation)
  - CloudFormation (SAM transform)
files_to_modify:
  - cloudformation/scenarios/smart-car-park/template.yaml
  - cloudformation/scenarios/smart-car-park/BLUEPRINT.md
  - src/walkthroughs/smart-car-park/index.njk
  - src/walkthroughs/smart-car-park/step-1.njk
  - src/walkthroughs/smart-car-park/step-2.njk
  - src/walkthroughs/smart-car-park/step-3.njk
  - src/walkthroughs/smart-car-park/step-4.njk
  - src/walkthroughs/smart-car-park/complete.njk
  - src/_data/smart-car-park-sample-data.yaml
  - src/_data/scenarios.yaml
  - src/_data/screenshots/smart-car-park.yaml
code_patterns:
  - CloudFormation with SAM transform (AWS::Serverless)
  - Lambda inline Python (ZipFile)
  - Lambda Function URLs for public access
  - GOV.UK Design System for walkthrough UI
  - Nunjucks templates with YAML data files
test_patterns: []
---

# Tech-Spec: Smart Car Park IoT Core Conversion

**Created:** 2026-03-02

## Overview

### Problem Statement

The smart car park scenario claims to demonstrate AWS IoT but doesn't actually use any IoT services. The CloudFormation template deploys a single Lambda with inline Python that manually randomizes occupancy data on button click. There is no IoT Core, no continuous data simulation, no CloudWatch dashboards, and no alarms. The walkthrough pages describe an elaborate IoT architecture (IoT Core → Lambda → DynamoDB → CloudWatch) that simply does not exist in the deployed stack.

### Solution

Rewrite the CloudFormation template to deploy a genuine AWS IoT stack: IoT Core with MQTT topic rules, a simulator Lambda on an EventBridge schedule publishing realistic sensor MQTT messages, a processor Lambda triggered by IoT Rules that writes time-series data to Amazon Timestream and publishes CloudWatch custom metrics, a real CloudWatch dashboard with multiple widgets, CloudWatch alarms, plus an improved Lambda HTML dashboard accessible via Function URL. Update all walkthrough portal pages to accurately reflect the deployed architecture.

### Scope

**In Scope:**
- CloudFormation template rewrite with full IoT Core resources (Thing, Policy, TopicRule)
- Simulator Lambda on EventBridge schedule (every 1-2 min) publishing MQTT messages to IoT Core
- Processor Lambda triggered by IoT TopicRule writing to Timestream + CloudWatch metrics
- Amazon Timestream database and table as single data store (memory store: 24h, magnetic store: 7 days). Current state via `WHERE time > ago(5m)` query, history via `WHERE time > ago(24h)`
- No DynamoDB — Timestream handles both current state and historical queries (memory store queries return in 50-200ms, fine for single-user demo)
- Real AWS::CloudWatch::Dashboard with 4 high-impact widgets (occupancy line graph, zone breakdown, available spaces count, sensor health)
- CloudWatch alarms (high occupancy, sensor offline)
- Improved Lambda HTML dashboard (keep Function URL for easy browser access)
- Update all walkthrough pages (index.njk, step-1 through step-4) to match deployed reality
- Update BLUEPRINT.md
- Update sample data YAML to align with deployed architecture
- Align on single data model: 1 multi-storey car park, 50 sensors, 3 zones (Ground, Level 1, Level 2)

**Out of Scope:**
- Physical IoT sensors / LoRaWAN gateway
- Changes to other scenarios
- Changes to portal infrastructure, quiz, scenario selector
- Changes to explore/ pages or next-steps pages
- Changes to the all-demo template

## Context for Development

### Codebase Patterns

- CloudFormation templates use SAM transform and inline Lambda code (ZipFile)
- Lambda Function URLs provide public unauthenticated access to dashboards
- Walkthrough pages are Nunjucks templates using GOV.UK Design System classes
- Sample data lives in `src/_data/` YAML files consumed by Nunjucks templates
- Screenshots config in `src/_data/screenshots/smart-car-park.yaml`
- Target deployment region: **us-east-1** (all services confirmed available)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/smart-car-park/template.yaml` | Main CloudFormation template (complete rewrite) |
| `cloudformation/scenarios/smart-car-park/BLUEPRINT.md` | ISB blueprint registration docs |
| `src/walkthroughs/smart-car-park/index.njk` | Walkthrough landing page |
| `src/walkthroughs/smart-car-park/step-1.njk` | Step 1: Access dashboard |
| `src/walkthroughs/smart-car-park/step-2.njk` | Step 2: View real-time data |
| `src/walkthroughs/smart-car-park/step-3.njk` | Step 3: IoT data flow |
| `src/walkthroughs/smart-car-park/step-4.njk` | Step 4: Trends & ROI |
| `src/_data/smart-car-park-sample-data.yaml` | Sample data config |
| `cloudformation/scenarios/council-chatbot/template.yaml` | Reference: another scenario template pattern |

### Technical Decisions

1. **Timestream as single data store**: Deploying to us-east-1 where Timestream is fully available. Purpose-built for IoT time-series data with built-in memory→magnetic tiering, time-series SQL functions (interpolation, smoothing, windowed aggregation), and automatic retention management. Current state served via `WHERE time > ago(5m)` query against memory store (50-200ms latency, fine for single-user demo). No DynamoDB needed — simplifies architecture, fewer resources, fewer IAM policies.
2. **Timestream multi-measure records**: Each sensor event written as a single multi-measure record with dimensions (`sensor_id`, `zone`) and measures (`occupied` VARCHAR, `confidence` DOUBLE, `battery_level` DOUBLE). One `write_records()` call per sensor batch, not one per measure.
3. **IoT Core with simulated device**: Deploy an IoT Thing + Policy (declarative/demonstrative - shows what a registered device looks like). The simulator Lambda uses the IoT Data Plane `iot-data:Publish` API via IAM to send MQTT messages. The `AWS::IoT::TopicRule` does the real work - triggering the processor Lambda on matching MQTT messages. Architecturally identical to a real deployment where a LoRaWAN gateway publishes to IoT Core.
4. **EventBridge schedule for simulation**: Invoke the simulator every 1-2 minutes, creating a continuous stream of realistic data. No more manual button-click simulation.
5. **Dual dashboards**: Lambda Function URL HTML dashboard for zero-friction access (no console login needed) + real `AWS::CloudWatch::Dashboard` for the native AWS console experience. Walkthrough guides users to both.
6. **Single data model: 1 multi-storey car park, 50 sensors, 3 zones**: Align the CloudFormation template with the walkthrough sample data. Ground Floor (20 spaces), Level 1 (15 spaces), Level 2 (15 spaces). More granular and interesting than the old 4-separate-car-parks model.
7. **4 CloudWatch dashboard widgets** (not 6): Prioritise high-impact: occupancy line graph over 24h, zone breakdown stacked area, available spaces number widget, sensor health table. Heatmap and avg duration are nice-to-have but add complexity for less demonstrable value.
8. **IoT TopicRule passes raw JSON**: No SQL transformation in the rule - processor Lambda handles all logic. Keeps the rule simple and the processing testable.
9. **Processor Lambda publishes `SensorsReportingCount` CloudWatch metric**: Count of sensors in each batch (expected: 50). Prevents alarms from being stuck in INSUFFICIENT_DATA state. SensorOfflineAlarm fires if count drops below 45.
10. **No caching in dashboard Lambda**: Single-user demo, no need for query result caching. Keep it simple.

### Party Mode Insights (incorporated)

- Three inline Lambda functions (simulator ~80 lines, processor ~100 lines, dashboard ~300 lines) will make a large template but is manageable
- IoT Thing/Policy are declarative - actual MQTT publish uses IAM `iot-data:Publish`, not MQTT client certificates
- Remove the unused S3 bucket and DynamoDB table from the current template
- Walkthrough pages need clear dual-path guidance: Function URL dashboard link AND CloudWatch console link
- BLUEPRINT.md deployment timeout should increase to 15-20 minutes for IoT + Timestream resource provisioning
- Keep processor Lambda in the IoT Rule path (not TopicRule direct-to-Timestream TimestreamAction) for teachability - users understand Lambda-in-the-middle better than rule-direct-write
- Post-deploy smoke test checklist: simulator Lambda invocation count > 0, Timestream table has records, CloudWatch dashboard loads, Function URL returns 200, alarms in OK state (not INSUFFICIENT_DATA)

### Adversarial Review Fixes (incorporated)

- **F1 fix**: Task 9 must remove `SimulatedSensors` from `scenarios.yaml` parameters block. New template has no such parameter.
- **F2 fix**: Task 1 must add 3 `AWS::Logs::LogGroup` resources (one per Lambda), `RetentionInDays: 7`. Prevents orphaned log groups on delete.
- **F3 fix**: Task 1 IAM policies must specify resource ARNs: Timestream permissions scoped to `!Sub 'arn:aws:timestream:${AWS::Region}:${AWS::AccountId}:database/${TimestreamDatabase}'` and `.../table/${TimestreamTable}`. `DescribeEndpoints` requires `Resource: '*'`.
- **F4 fix**: Notes section query examples marked as illustrative. Dashboard Lambda uses `os.environ['TIMESTREAM_DB']` and `os.environ['TIMESTREAM_TABLE']`. Hyphenated DB names require double-quoting in Timestream SQL.
- **F5 fix**: Removed `IoTEndpoint` from Outputs. 4 outputs, not 5. Users can run `aws iot describe-endpoint` if needed.
- **F6 fix**: Task 8 scope expanded to update iotDataFlow steps 3-5 (topic name → `carpark/sensors/batch`, batch processing description, array parsing).
- **F7 fix**: AC-5 updated: "Sensor Health table" → "Sensors Reporting number widget".
- **F8 fix**: Task 11 widget order aligned with Task 5 dashboard order: (1) Total Occupancy, (2) Zone Breakdown, (3) Available Spaces, (4) Sensors Reporting.
- **F9 fix**: Task 3 notes: explicit `str(sensor['occupied']).lower()` for VARCHAR serialization. Prevents `'True'` vs `'true'` mismatch.
- **F10 fix**: Task 5 includes JSON skeleton for metric math expression widget.
- **F11 fix**: Task 7 explicitly updates BOTH timeout values in BLUEPRINT.md (Step 3: 15→20, Verification: 12→20) plus DynamoDB description string.
- **F12 fix**: `TotalOccupancy` is a count (0-50), not percentage. Task 5 label: "Occupied Spaces" not "Occupancy %". Alarm threshold 45 = 90% of 50.
- **F13**: £145/year cost figure left as-is — Timestream cost for this demo workload is comparable (~£120-180/year range). Approximate figure acceptable.
- **F14 fix**: Task 10 explicitly updates DynamoDB→Timestream in index.njk inset text AWS services summary.
- **F15 fix**: Task 13 scope expanded: complete.njk has 4-6 replacements including IT Committee DynamoDB description, SLA references, service lists.
- **F17 fix**: Task 9 explicitly states required capabilities: `CAPABILITY_AUTO_EXPAND` + `CAPABILITY_NAMED_IAM`.
- **F19 fix**: Removed "follow council-chatbot pattern" references. Tasks specify explicit `AWS::Serverless::Function` with `FunctionName: !Sub` naming and direct IAM role structure.
- **F20 fix**: Screenshots YAML added as Task 14. Deploy + capture + upload as Tasks 15-17.
- **F16, F18 accepted as-is**: DependsOn chain is illustrative; IoT deletion risk acceptable for demo.

### Party Mode Round 5 Insights (incorporated)

- **Batch MQTT messages**: Simulator publishes 1 batched MQTT message per cycle containing all 50 sensor readings (not 50 individual messages). Topic: `carpark/sensors/batch`. TopicRule fires once per cycle. Processor Lambda receives array, loops through, writes all records in single `write_records()` call. One set of CloudWatch metrics per cycle. Cleaner, cheaper, matches gateway abstraction.
- **Sensor Health widget simplified**: Replace 50-metric `SensorLastSeen` table widget with single `SensorsReportingCount` number widget (count of sensors that reported in last cycle). Avoids 50-metric explosion, practical in CloudWatch. Per-sensor detail available in Function URL dashboard instead.
- **SensorOfflineAlarm simplified**: Alarm on `SensorsReportingCount < 45` instead of per-sensor missing data. Cleaner threshold.
- **Simulator seeding**: Seed from `hour * 60 + minute` for time-of-day pattern, use `hash(sensor_id)` as per-sensor offset. ~5-10% of sensors flip state per cycle for realistic transitions. No external state storage needed.
- **AC-13 added**: Verify simulator produces realistic occupancy rates (15-95%, varying by zone), not stuck at 0% or 100%.

### Party Mode Round 4 Insights (incorporated)

- **Files list corrected**: Added `src/_data/scenarios.yaml` (awsServices, skillsLearned, deploymentPhases updates at lines 622-730) and `src/walkthroughs/smart-car-park/complete.njk` (DynamoDB→Timestream in takeaway cards). Total: 10 files.
- **Template size estimate ~38KB**: 3 inline Lambdas (~23KB) + CFN resources (~8KB) + CloudWatch dashboard JSON (~4KB) + IAM (~3KB). Under 51,200 byte direct-body limit but tight. Hard target: keep under 45KB.
- **IoT endpoint discovery**: Simulator Lambda needs `iot:DescribeEndpoint` IAM permission to discover account-specific IoT Data endpoint at runtime. One extra API call on cold start — simpler than custom resource.
- **CloudWatch Dashboard JSON**: Embedding 4-widget dashboard body as `!Sub`-interpolated JSON inside YAML is the most error-prone part. Should be its own focused implementation task, not buried in "write template."
- **DependsOn chain**: Timestream DB → Table → Processor Lambda → IoT TopicRule → IoT Thing/Policy → Simulator Lambda → EventBridge Rule. Each task must note its dependencies.
- **Timestream deletion safe**: `AWS::Timestream::Table` deletes via CloudFormation even with data. Table→Database ordering handled automatically via `!Ref`. No custom resource needed.
- **Testing strategy = manual deployment verification**: No test framework for inline ZipFile Lambdas. Acceptance = 7-check smoke test (see Testing Strategy section).

### Party Mode Round 3 Insights (incorporated)

- **Walkthrough updates are NOT optional** - ship with template or scenario is broken. But prioritise factual corrections over aspirational improvements.
- **Walkthrough dual-dashboard UX flow**: Step 1 → Function URL (instant gratification), Step 2 → CloudWatch console (deeper exploration), Step 3 → IoT data flow (now truthful), Step 4 → minimal changes (business content)
- **Sample data YAML**: Only update `iotDataFlow.steps` (DynamoDB→Timestream) and `cloudWatchDashboard.widgets` (match actual 4 widgets). Leave business/ROI content untouched.
- **index.njk**: Update "1000 Data Points" static claim to reflect continuous live data generation
- **Risks to track**:
  1. Template size: 3 inline Lambdas. CFN limit 51,200 bytes (body) / 460,800 bytes (S3). Verify during implementation.
  2. IoT provisioning order: `DependsOn` chain needed — IoT resources → Simulator Lambda → EventBridge Rule
  3. Timestream endpoint discovery: adds ~500ms to first Lambda cold start. Set all Lambda timeouts to 60s.
  4. Verify `{% for zone in carParkConfig.zones %}` loop in index.njk still works with updated sample data

## Implementation Plan

### Tasks

#### CloudFormation Template (`cloudformation/scenarios/smart-car-park/template.yaml`)

- [x] Task 1: Template skeleton, Timestream resources, and IAM roles
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Replace entire file. Start with SAM transform header, Description, Parameters (StackName default). Create `TimestreamDatabase` (`AWS::Timestream::Database`), `TimestreamTable` (`AWS::Timestream::Table` with MemoryStoreRetentionPeriodInHours: 24, MagneticStoreRetentionPeriodInDays: 7, multi-measure schema). Create 3 IAM roles: `SimulatorLambdaRole` (iot-data:Publish, iot:DescribeEndpoint, logs), `ProcessorLambdaRole` (timestream:WriteRecords, timestream:DescribeEndpoints, cloudwatch:PutMetricData, logs), `DashboardLambdaRole` (timestream:Select, timestream:DescribeEndpoints, logs). Follow council-chatbot pattern for role structure.
  - Notes: Table uses `!Ref TimestreamDatabase`. Database name: `!Sub '${AWS::StackName}-car-park'`. Table name: `sensor_readings`. IAM resource ARNs: Timestream permissions scoped to `!Sub 'arn:aws:timestream:${AWS::Region}:${AWS::AccountId}:database/${TimestreamDatabase}'` and `.../table/${TimestreamTable}'`. `DescribeEndpoints` requires `Resource: '*'`. Each Lambda gets an `AWS::Logs::LogGroup` with `RetentionInDays: 7` and `LogGroupName: !Sub '/aws/lambda/${FunctionName}'`. All Lambda functions use explicit `FunctionName: !Sub 'ndx-try-${AWS::StackName}-{name}'`. DependsOn: Table depends on Database (implicit via `!Ref`).

- [x] Task 2: Simulator Lambda + EventBridge schedule
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Add `SimulatorFunction` (`AWS::Serverless::Function`, Python 3.12, inline ZipFile ~80 lines). Lambda discovers IoT endpoint via `boto3.client('iot').describe_endpoint(endpointType='iot:Data-ATS')`. Publishes a single batched MQTT message to topic `carpark/sensors/batch` containing all 50 sensor readings. Payload: `{"readings": [{"sensor_id": "GF-01", "zone": "ground", "occupied": true/false, "confidence": 0.95, "battery_level": 87.5}, ...], "timestamp": "ISO8601", "batch_size": 50}`. Occupancy follows realistic time-of-day patterns (peak 85%, off-peak 60%, overnight 20%). Add `SimulatorSchedule` (`AWS::Events::Rule` with ScheduleExpression `rate(2 minutes)`) + `SimulatorPermission` (Lambda invoke permission for EventBridge). Timeout: 60s, MemorySize: 128.
  - Notes: Zone distribution: Ground (GF-01 to GF-20), Level1 (L1-01 to L1-15), Level2 (L2-01 to L2-15). Deterministic seeding: `hour * 60 + minute` for time-of-day pattern, `hash(sensor_id)` as per-sensor offset. ~5-10% of sensors flip state per cycle for realistic transitions. No external state needed. Ground fills first (90% peak), Level1 next (87%), Level2 last (73%). Battery levels: random 20-100%. Single batched message per cycle — matches gateway abstraction (LoRaWAN gateway aggregates sensor readings).

- [x] Task 3: Processor Lambda + IoT Core resources
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Add `ProcessorFunction` (`AWS::Serverless::Function`, Python 3.12, inline ZipFile ~100 lines). Receives batched IoT TopicRule payload (array of 50 sensor readings). Loops through readings, writes all as multi-measure records to Timestream in a single `write_records()` call (dimensions: sensor_id, zone; measures: occupied VARCHAR, confidence DOUBLE, battery_level DOUBLE). Publishes CloudWatch custom metrics to `NDXTry/SmartCarPark` namespace: `OccupiedSpaces` (by zone dimension), `TotalOccupancy`, `SensorsReportingCount` (count of sensors in batch). Timeout: 60s, MemorySize: 128. Environment variables: `TIMESTREAM_DB` (`!Ref TimestreamDatabase`), `TIMESTREAM_TABLE` (`sensor_readings`). Add `IoTThing` (`AWS::IoT::Thing`, name: `!Sub '${AWS::StackName}-sensor-gateway'`), `IoTPolicy` (`AWS::IoT::Policy`, allows `iot:Publish` on `carpark/*`), `IoTTopicRule` (`AWS::IoT::TopicRule`, sql: `SELECT * FROM 'carpark/sensors/batch'`, action: Lambda invoke `ProcessorFunction`). Add `ProcessorIoTPermission` (`AWS::Lambda::Permission` for iot.amazonaws.com).
  - Notes: TopicRule passes raw JSON (no SQL transformation — Decision #8). IoT Thing/Policy are declarative only (Decision #3). DependsOn: ProcessorFunction must exist before TopicRule. Timestream `write_records()` uses multi-measure format per Decision #2. Single invocation per cycle (batch message), not 50 invocations. Metrics published once per cycle with final values — no intermediate noise. **Critical**: `occupied` field stored as VARCHAR — must serialize as `str(sensor['occupied']).lower()` to produce `'true'`/`'false'` (not Python `'True'`/`'False'`). Queries use `occupied = 'true'` string comparison.

- [x] Task 4: Dashboard Lambda + Function URL
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Add `DashboardFunction` (`AWS::Serverless::Function`, Python 3.12, inline ZipFile ~300 lines). Serves HTML on GET via Function URL (`AuthType: NONE`). Queries Timestream for current state (`WHERE time > ago(5m) GROUP BY zone`) and 24h history (`WHERE time > ago(24h)` binned by 15m). Renders responsive HTML dashboard with: header (car park name, last updated), zone cards (Ground/L1/L2 with occupied/total/percentage), overall stats (total occupied, available, percentage), 24h sparkline using inline SVG, sensor health summary. Environment variables: `TIMESTREAM_DB`, `TIMESTREAM_TABLE`. Add `DashboardFunctionUrl` (`AWS::Lambda::Url`), `DashboardFunctionUrlPermission` (`AWS::Lambda::Permission` for `FunctionUrlAuthType: NONE`). Timeout: 60s, MemorySize: 256.
  - Notes: Follow council-chatbot pattern for Function URL + Permission resources. HTML uses inline CSS (no external assets). No caching (Decision #10). Timestream endpoint discovery on cold start adds ~500ms — acceptable for demo.

- [x] Task 5: CloudWatch Dashboard JSON
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Add `CarParkDashboard` (`AWS::CloudWatch::Dashboard`). Dashboard body is JSON with 4 widgets: (1) **Total Occupancy Over Time** — line graph, metric `TotalOccupancy` from `NDXTry/SmartCarPark`, period 300, stat Average, 24h view. (2) **Occupancy by Zone** — stacked area chart, metric `OccupiedSpaces` with zone dimension (Ground, Level1, Level2), period 300, 24h view. (3) **Available Spaces** — number widget, metric expression `50 - TotalOccupancy`, stat Latest. (4) **Sensors Reporting** — number widget, metric `SensorsReportingCount`, stat Latest, showing count of sensors reporting per cycle (expected: 50). Use `!Sub` for region interpolation in metric JSON. Dashboard name: `!Sub '${AWS::StackName}-dashboard'`.
  - Notes: Most error-prone part of the template (Round 4 insight). `TotalOccupancy` is a count (0-50), NOT a percentage — label widget 1 as "Occupied Spaces" not "Occupancy %". Widget 3 (Available Spaces) uses metric math expression — JSON skeleton: `{"type":"metric","properties":{"metrics":[["NDXTry/SmartCarPark","TotalOccupancy",{"id":"m1","visible":false}],[{"expression":"50-m1","label":"Available Spaces","id":"e1"}]],"view":"singleValue","period":300,"region":"${AWS::Region}"}}`. Widget 4 simplified from 50-row table to single number — per-sensor detail available in Function URL dashboard. Use `Fn::Sub` with single quotes around the JSON body to avoid YAML escaping issues. Consider using `|` block scalar for readability.

- [x] Task 6: CloudWatch Alarms + Stack Outputs
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Add `HighOccupancyAlarm` (`AWS::CloudWatch::Alarm`, metric `TotalOccupancy`, threshold 45/50 = 90%, ComparisonOperator GreaterThanThreshold, EvaluationPeriods 2, Period 300, Statistic Average). Add `SensorOfflineAlarm` (`AWS::CloudWatch::Alarm`, metric `SensorsReportingCount`, threshold 45, ComparisonOperator LessThanThreshold, EvaluationPeriods 2, Period 300, TreatMissingData: breaching). Add Outputs: `DashboardURL` (Function URL value), `CloudWatchDashboardURL` (`!Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${CarParkDashboard}'`), `TimestreamDatabase` (!Ref), `StackRegion` (!Ref AWS::Region).
  - Notes: Alarms use `ActionsEnabled: false` (no SNS topic in demo). `SensorsReportingCount` metric published by Processor Lambda ensures alarms have data from first cycle. No INSUFFICIENT_DATA state. SensorOfflineAlarm fires if fewer than 45 of 50 sensors report — simpler than per-sensor alarm.

#### Supporting Files

- [x] Task 7: Update BLUEPRINT.md
  - File: `cloudformation/scenarios/smart-car-park/BLUEPRINT.md`
  - Action: Update capabilities list to include IoT Core, Timestream, CloudWatch Dashboard, CloudWatch Alarms, EventBridge. Update BOTH timeout values: Step 3 config timeout (15→20 minutes) AND verification expected completion (12→20 minutes). Update resource list (remove S3 bucket, DynamoDB; add IoT Thing/Policy/TopicRule, Timestream DB/Table, EventBridge Rule, CloudWatch Dashboard/Alarms). Update outputs list to match Task 6 (4 outputs: DashboardURL, CloudWatchDashboardURL, TimestreamDatabase, StackRegion). Update Step 2 description string to remove DynamoDB reference (`"NDX:Try Smart Car Park - Real-time parking availability with IoT sensors and Timestream"`).
  - Notes: Keep existing ISB blueprint structure. Only change factual content.

- [x] Task 8: Update sample data YAML
  - File: `src/_data/smart-car-park-sample-data.yaml`
  - Action: Update `iotDataFlow.steps` — step 3: topic `carpark/sensors/batch` (not per-sensor), step 4: batch processing description ("Processor Lambda receives batch of 50 readings"), step 5: array parsing ("Loops through readings array, writes to Timestream"), step 6: replace DynamoDB with Timestream (component: "Amazon Timestream", action: "Stores sensor readings as time-series records", technology: "Timestream Write API — multi-measure records", output: "Queryable time-series data with automatic retention"). Update `cloudWatchDashboard.widgets` to match actual 4 widgets: (1) Total Occupancy line graph, (2) Occupancy by Zone stacked area, (3) Available Spaces number, (4) Sensors Reporting number. Remove heatmap and avg duration. Leave all business/ROI content, zone definitions, sensor types, occupancy patterns, and alarm definitions untouched.
  - Notes: Verify `carParkConfig.zones` structure unchanged so `{% for zone in carParkConfig.zones %}` loops still work in index.njk.

- [x] Task 9: Update scenarios.yaml
  - File: `src/_data/scenarios.yaml`
  - Action: In the `smart-car-park` entry (~lines 622-730): Update `awsServices` from `[Lambda, DynamoDB, S3]` to `[IoT Core, Lambda, Timestream, CloudWatch, EventBridge]`. Update `skillsLearned` from `[DynamoDB, Lambda]` to `[IoT Core, Timestream, Lambda, CloudWatch]`. Update `deployment.deploymentPhases` to reflect IoT Core/Timestream/EventBridge resource creation. Update `deployment.outputs` to match Task 6 (4 outputs: DashboardURL, CloudWatchDashboardURL, TimestreamDatabase, StackRegion). Update `deployment.deploymentTime` from "8 to 12 minutes" to "15 to 20 minutes". **Remove `SimulatedSensors: 20` from `parameters` block** — new template has no such parameter. Ensure `capabilities` includes both `CAPABILITY_AUTO_EXPAND` and `CAPABILITY_NAMED_IAM`.
  - Notes: Do not change scenario description, difficulty, category, or other metadata. Only update service/deployment factual content.

#### Walkthrough Pages

- [x] Task 10: Update index.njk
  - File: `src/walkthroughs/smart-car-park/index.njk`
  - Action: Replace "1000 Data Points" static claim with language reflecting continuous live data generation ("Live data generated every 2 minutes by IoT simulator" or similar). Verify IoT flow diagram components match actual architecture (IoT Core → Lambda → Timestream → CloudWatch). Update AWS services summary inset text: replace "DynamoDB (history storage)" with "Timestream (time-series storage)". Verify zone loop `{% for zone in carParkConfig.zones %}` still renders correctly with unchanged sample data structure.
  - Notes: The existing IoT flow description was aspirational — it now becomes truthful. Check for any other DynamoDB references in the file.

- [x] Task 11: Update step-1.njk and step-2.njk
  - File: `src/walkthroughs/smart-car-park/step-1.njk`
  - Action: Update to dual-dashboard guidance. Primary path: "Find the DashboardURL in CloudFormation Outputs, open in browser" (instant gratification). Secondary path: "Find CloudWatchDashboardURL for native AWS console experience." Remove any DynamoDB references. Update expected output descriptions.
  - File: `src/walkthroughs/smart-car-park/step-2.njk`
  - Action: Rewrite widget guide to match actual 4 widgets in dashboard order (not 5-6). Remove "Average Parking Duration" and "Sensor Status Table" descriptions. Update to match Task 5 dashboard order: (1) Total Occupancy Over Time line graph, (2) Occupancy by Zone stacked area, (3) Available Spaces number widget, (4) Sensors Reporting number widget. Update troubleshooting section: replace DynamoDB references with Timestream. Replace `SmartCarPark-SensorReadings` DynamoDB table references with Timestream console guidance.
  - Notes: Widget order in walkthrough MUST match widget order in CloudWatch dashboard (Task 5) so users see what the walkthrough describes. Step 2 is the heavier half of this task.

- [x] Task 12: Update step-3.njk
  - File: `src/walkthroughs/smart-car-park/step-3.njk`
  - Action: Replace DynamoDB service card with Timestream service card (role: "Store time-series sensor readings", what it does: stores multi-measure records with automatic memory→magnetic tiering, what's useful: purpose-built for IoT time-series, cost estimate). Update Lambda service card to reference Timestream instead of DynamoDB ("stores it in Timestream" not "stores it in DynamoDB"). Update troubleshooting section: replace DynamoDB table check with Timestream query check. Update "verify data is flowing" checkpoint #1: Timestream console instead of DynamoDB console.
  - Notes: The `{% for flowStep in iotDataFlow.steps %}` loop pulls from sample data YAML (Task 8 updates). The hardcoded AWS service cards below need manual DynamoDB→Timestream replacement. Keep cost estimates realistic.

- [x] Task 13: Update step-4.njk and complete.njk
  - File: `src/walkthroughs/smart-car-park/step-4.njk`
  - Action: Minimal changes. Leave ROI calculator, occupancy patterns, and zone insights untouched (business content, not technical). No DynamoDB references to update in this file.
  - File: `src/walkthroughs/smart-car-park/complete.njk`
  - Action: Update takeaway card #4: replace "IoT Core, Lambda, DynamoDB, and CloudWatch" with "IoT Core, Lambda, Timestream, and CloudWatch". Update Finance Committee talking points: DynamoDB→Timestream. Update IT Committee section: replace full DynamoDB service description (including "99.99% availability SLA", "7-day data retention via TTL") with Timestream equivalent (built-in time-series retention, memory→magnetic tiering). Update service list in all takeaway cards. Update "What you explored" summary if it references DynamoDB.
  - Notes: step-4.njk confirmed no DynamoDB references — truly minimal. complete.njk has 4-6 replacements across multiple sections (more than initially estimated).

#### Screenshots, Deploy & Capture

- [x] Task 14: Update screenshots YAML
  - File: `src/_data/screenshots/smart-car-park.yaml`
  - Action: Rewrite the `steps` section (lines 11-117) to describe correct screenshots for the new architecture. Leave `explore` section (lines 125-178) untouched. 10 screenshots total:
    - **Step 1** (Access the Dashboard): (1) `step-1-cloudformation-outputs.png` — CFN Outputs tab showing `DashboardURL` and `CloudWatchDashboardURL` (annotate both outputs), (2) `step-1-function-url-dashboard.png` — Function URL HTML dashboard with zone cards and occupancy stats
    - **Step 2** (View Real-Time Data): (3) `step-2-cloudwatch-dashboard.png` — Full CloudWatch dashboard showing all 4 widgets with data, (4) `step-2-occupancy-graph.png` — Close-up of Total Occupancy line graph, (5) `step-2-zone-breakdown.png` — Close-up of Occupancy by Zone stacked area
    - **Step 3** (Understand IoT Data Flow): (6) `step-3-iot-mqtt-messages.png` — IoT Core MQTT test client showing batch messages on `carpark/sensors/batch`, (7) `step-3-timestream-query.png` — Timestream query editor showing sensor readings with zone/occupied columns, (8) `step-3-lambda-monitoring.png` — Processor Lambda monitoring tab showing invocation graph
    - **Step 4** (Explore Trends & ROI): (9) `step-4-occupancy-trends.png` — CloudWatch 24h occupancy line graph showing peak/off-peak patterns, (10) `step-4-cloudwatch-alarms.png` — CloudWatch Alarms page showing both alarms in OK state
  - Notes: Update step titles to match new walkthrough content. Keep annotation structure (numbered callouts, x/y percentages, labels, arrows). Remove references to map view, manual simulator interface, ML predictions.

- [ ] Task 15: Deploy stack to us-east-1
  - Action: Deploy the CloudFormation template using SAM CLI with the NDX/SandboxUser SSO profile:
    ```
    aws sso login --profile NDX/SandboxUser
    sam deploy --template-file cloudformation/scenarios/smart-car-park/template.yaml \
      --stack-name ndx-try-smart-car-park \
      --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
      --region us-east-1 \
      --resolve-s3 \
      --profile NDX/SandboxUser
    ```
    Wait for CREATE_COMPLETE. Run 7-check smoke test (see Testing Strategy). Capture stack outputs (DashboardURL, CloudWatchDashboardURL) for use in Task 16. Wait 5+ minutes for simulator to generate data before proceeding.
  - Notes: `--resolve-s3` auto-creates an S3 bucket for packaging if template exceeds 51,200 byte direct-body limit — safety net for AC-8. If deploy fails, fix template and redeploy. Do not proceed to screenshots until all 7 smoke test checks pass.

- [ ] Task 16: Capture screenshots from deployed stack
  - Action: Using the deployed stack (Task 15), capture all 10 screenshots defined in the updated screenshots YAML (Task 14). Capture at 1920x1080 resolution. For each screenshot:
    1. `step-1-cloudformation-outputs.png` — CloudFormation console → Stacks → ndx-try-smart-car-park → Outputs tab
    2. `step-1-function-url-dashboard.png` — Open DashboardURL in browser
    3. `step-2-cloudwatch-dashboard.png` — Open CloudWatchDashboardURL in browser (full dashboard view)
    4. `step-2-occupancy-graph.png` — Click/zoom on Total Occupancy widget
    5. `step-2-zone-breakdown.png` — Click/zoom on Occupancy by Zone widget
    6. `step-3-iot-mqtt-messages.png` — IoT Core console → MQTT test client → subscribe to `carpark/#`
    7. `step-3-timestream-query.png` — Timestream console → Query editor → run `SELECT * FROM ... WHERE time > ago(5m) LIMIT 20`
    8. `step-3-lambda-monitoring.png` — Lambda console → ProcessorFunction → Monitor tab
    9. `step-4-occupancy-trends.png` — CloudWatch dashboard → Total Occupancy widget (24h view)
    10. `step-4-cloudwatch-alarms.png` — CloudWatch console → Alarms → show both alarms in OK state
  - Notes: Ensure simulator has been running 5+ minutes so data is visible in all widgets. Use `--profile NDX/SandboxUser` for AWS console SSO access.

- [ ] Task 17: Process and upload screenshots to S3
  - Action: For each of the 10 captured PNGs: resize to 640w, 1024w, and 1920w variants. Convert each variant to WebP. Upload all files to `s3://ndx-try-screenshots/current/smart-car-park/` using:
    ```
    aws s3 sync ./screenshots/ s3://ndx-try-screenshots/current/smart-car-park/ \
      --profile NDX/SandboxUser
    ```
    Verify all URLs resolve (spot-check 2-3 in browser). Each PNG produces 6 files: `{name}.png`, `{name}-640w.png`, `{name}-1024w.png`, `{name}.webp`, `{name}-640w.webp`, `{name}-1024w.webp`. Total: 60 files.
  - Notes: Image processing can use `sips` (macOS built-in) for resize, `cwebp` for WebP conversion. Or use ImageMagick `convert`. Verify the annotated-screenshot.njk component's `srcset` pattern matches the uploaded filenames.

### Acceptance Criteria

- [ ] AC-1: Given the CloudFormation template is deployed to us-east-1, when stack creation completes, then status is CREATE_COMPLETE and all resources exist (IoT Thing, IoT Policy, IoT TopicRule, 3 Lambda functions, Timestream DB + Table, EventBridge Rule, CloudWatch Dashboard, 2 CloudWatch Alarms, 3 IAM Roles).

- [ ] AC-2: Given the stack is deployed, when 2 minutes have elapsed, then the SimulatorFunction has been invoked by EventBridge at least once and a batched MQTT message is visible on topic `carpark/sensors/batch` via IoT Core MQTT test client containing 50 sensor readings.

- [ ] AC-3: Given the simulator has published MQTT messages, when the IoT TopicRule matches, then the ProcessorFunction is invoked and writes multi-measure records to the Timestream table with dimensions (sensor_id, zone) and measures (occupied, confidence, battery_level).

- [ ] AC-4: Given the processor has run, when Timestream is queried with `SELECT * FROM "sensor_readings" WHERE time > ago(5m)`, then records exist for all 3 zones (ground, level1, level2) with 50 total sensor entries.

- [ ] AC-5: Given the processor has published CloudWatch metrics, when the CloudWatch Dashboard is opened, then 4 widgets render with data: Total Occupancy Over Time line graph, Occupancy by Zone stacked area, Available Spaces number (metric math expression), and Sensors Reporting number widget.

- [ ] AC-6: Given the stack is deployed and simulator has run, when the DashboardURL (Function URL) is opened in a browser, then an HTML page loads showing current occupancy by zone, overall stats, and 24h history with no errors.

- [ ] AC-7: Given CloudWatch metrics are being published, when alarms are checked, then HighOccupancyAlarm and SensorOfflineAlarm are in OK state (not INSUFFICIENT_DATA), confirming metrics are flowing.

- [x] AC-8: Given the template file is complete, when its byte size is measured, then it is under 45,000 bytes (leaving margin below the 51,200 byte CFN direct-body limit).

- [x] AC-9: Given the sample data YAML is updated, when walkthrough pages render, then `{% for zone in carParkConfig.zones %}` loop in index.njk produces correct output and `{% for flowStep in iotDataFlow.steps %}` in step-3.njk shows Timestream (not DynamoDB) in the data flow.

- [x] AC-10: Given all walkthrough pages are updated, when step-2.njk is reviewed, then it describes exactly 4 CloudWatch widgets matching the deployed dashboard, and no references to DynamoDB, S3 bucket, or "Average Parking Duration" widget exist in any walkthrough file.

- [x] AC-11: Given scenarios.yaml is updated, when the smart-car-park entry is read, then `awsServices` includes IoT Core, Lambda, Timestream, CloudWatch, EventBridge and `deployment.deploymentTime` is "15 to 20 minutes".

- [ ] AC-12: Given the stack is deleted, when deletion completes, then status is DELETE_COMPLETE and no orphaned Timestream resources remain.

- [ ] AC-13: Given the simulator has run for 10+ minutes, when Timestream is queried, then occupancy rates are between 15-95% (not stuck at 0% or 100%) and vary by zone (Ground highest, Level 2 lowest).

- [x] AC-14: Given the screenshots YAML is updated, when the `steps` section is reviewed, then it describes exactly 10 screenshots matching the new architecture with no references to map view, manual simulator, ML predictions, or DynamoDB.

- [ ] AC-15: Given the stack is deployed and simulator has run 5+ minutes, when all 10 screenshots are captured and uploaded to S3, then each screenshot URL resolves at 1920w, 1024w, and 640w in both PNG and WebP formats (60 files total).

- [ ] AC-16: Given screenshots are uploaded, when walkthrough pages are loaded in a browser, then the annotated-screenshot component renders images from S3 without falling back to SVG placeholders.

## Additional Context

### Dependencies

- AWS IoT Core available in us-east-1 (confirmed)
- Amazon Timestream available in us-east-1 (confirmed)
- IAM permissions: `iot-data:Publish`, `iot:DescribeEndpoint` for simulator Lambda
- IAM permissions: `timestream:WriteRecords`, `timestream:DescribeEndpoints` for processor Lambda
- IAM permissions: `timestream:Select`, `timestream:DescribeEndpoints` for dashboard Lambda
- CloudWatch custom metrics namespace: `NDXTry/SmartCarPark`

### Testing Strategy

**Approach:** Manual deployment verification (no unit test framework for inline ZipFile Lambdas).

**Acceptance Smoke Test (7 checks):**

| # | Check | How to Verify | Expected Result |
|---|-------|--------------|-----------------|
| 1 | Stack deploys | `aws cloudformation describe-stacks` | CREATE_COMPLETE |
| 2 | Simulator runs | Lambda console → IoTSimulator → Monitor | Invocations > 0 within 2 min |
| 3 | Timestream has data | Timestream console → Query editor | Records in sensor_readings table |
| 4 | CloudWatch dashboard | CloudWatch console → Dashboards | 4 widgets rendering data |
| 5 | Function URL works | Browser → DashboardURL output | HTML page with occupancy data |
| 6 | Alarms healthy | CloudWatch → Alarms | OK state (not INSUFFICIENT_DATA) |
| 7 | IoT Core messages | IoT Core → MQTT test client → subscribe `carpark/#` | Messages arriving every 1-2 min |

**Stack deletion verification:** Confirm no orphaned Timestream resources after `DELETE_COMPLETE`.

### Notes

- Removing S3 bucket and DynamoDB table from current template - Timestream replaces both
- Current inline Lambda is ~450 lines. The rewrite splits into 3 functions: simulator (~80 lines), processor (~100 lines), dashboard (~300 lines)
- Timestream query examples (illustrative — dashboard Lambda uses `os.environ['TIMESTREAM_DB']` and `os.environ['TIMESTREAM_TABLE']`; note hyphenated DB names from `!Sub` require double-quoting in SQL):
  - Current state: `SELECT zone, COUNT(CASE WHEN occupied = 'true' THEN 1 END) as occupied_count, COUNT(*) as total_sensors FROM "{db}"."{table}" WHERE time > ago(5m) GROUP BY zone`
  - 24h history: `SELECT bin(time, 15m) as t, AVG(CASE WHEN occupied = 'true' THEN 1 ELSE 0 END) * 100 as occupancy_pct FROM "{db}"."{table}" WHERE time > ago(24h) GROUP BY bin(time, 15m)`
- The "in production uses Timestream" disclaimer is eliminated - we ARE using Timestream now
- No caching needed in dashboard Lambda - single-user demo scenario

## Review Notes
- Adversarial review completed
- Findings: 15 total, 8 fixed (F1, F2, F3, F4, F5, F7, F9, F15), 7 skipped (noise/undecided)
- Resolution approach: auto-fix
- Key fixes: IAM action `iot:Publish` (was `iot-data:Publish`), added `Environment` parameter, removed stale function name references, fixed Timestream query syntax, scoped IAM permissions, auto-generated IoT TopicRule name, sanitized error responses
