# Story 24.6: QuickSight Dashboard Documentation Clarification

Status: done

## Story

**As a** council evaluator,
**I want** clear documentation about the sandbox vs production architecture,
**So that** I understand the difference between the Chart.js demo and production QuickSight.

## Acceptance Criteria

### AC-24.6.1: Walkthrough Text Clarified

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.6.1a | Sandbox notice added to walkthrough landing page | Visual inspection |
| AC-24.6.1b | Explains Chart.js is used for sandbox demo | Content review |
| AC-24.6.1c | References QuickSight licensing for production | Content review |

### AC-24.6.2: Architecture Diagram Updated

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.6.2a | CloudFormation sample-note clarified | Template inspection |
| AC-24.6.2b | Sandbox vs production architecture explained | Content review |
| AC-24.6.2c | Production services listed (QuickSight, Athena, Glue) | Content review |

### AC-24.6.3: Production Guidance Added

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-24.6.3a | QuickSight pricing documented ($18/reader, $24/author) | Content review |
| AC-24.6.3b | SPICE caching benefits explained | Content review |
| AC-24.6.3c | Typical production cost estimate provided | Content review |

## Dependencies

- Story 24.1 (Deploy All Stacks) - DONE
- Tech spec tech-spec-epic-24.md - DONE

## Tasks

1. [x] Update CloudFormation template sample-note
2. [x] Add sandbox notice to walkthrough landing page
3. [x] Add production guidance to walkthrough completion page
4. [x] Update deployment-endpoints.yaml with clarifications
5. [x] Deploy updated CloudFormation template
6. [x] Verify changes display correctly

## Technical Notes

### Documentation-Only Story

Per tech spec: "Story 24.6 (QuickSight Docs) - No code changes" - this story focuses on documentation clarity rather than implementation changes.

### Key Clarifications Made

1. **CloudFormation Template** (`cloudformation/scenarios/quicksight-dashboard/template.yaml`):
   - Updated sample-note to explicitly state "Chart.js with Lambda-generated sample data"
   - Added production guidance about QuickSight, Glue, and Athena

2. **Walkthrough Landing Page** (`src/walkthroughs/quicksight-dashboard/index.njk`):
   - Added prominent sandbox notice warning
   - Clarified demo uses Chart.js without licensing costs
   - Referenced QuickSight pricing for production

3. **Walkthrough Completion Page** (`src/walkthroughs/quicksight-dashboard/complete.njk`):
   - Added "Sandbox vs Production Architecture" section
   - Listed all production services with pricing
   - Provided typical production cost estimate (£200-400/month)

4. **Deployment Endpoints** (`docs/deployment-endpoints.yaml`):
   - Added `mode: Chart.js visualization (sandbox)`
   - Added `note` field explaining sandbox vs production
   - Split services into `services_used` (sandbox) and `production_services`

### Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SANDBOX ARCHITECTURE (Current Demo)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Browser ─────► Lambda Function URL ─────► Lambda             │
│                                              │                │
│                                         Returns HTML          │
│                                         with Chart.js         │
│                                              │                │
│                                    ┌─────────┴─────────┐      │
│                                    │                   │      │
│                                    ▼                   ▼      │
│                               KPI Cards          Bar/Pie      │
│                               (hardcoded)        Charts       │
│                                                  (Chart.js)   │
│                                                               │
│  Cost: £0.00/month (no QuickSight licensing)                  │
└─────────────────────────────────────────────────────────────┘
```

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              PRODUCTION ARCHITECTURE (QuickSight)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Council Data ──► S3 Bucket ──► Glue Crawler ──► Athena      │
│  (CSV exports)     (data lake)  (schema)         (SQL)       │
│                                                    │          │
│                                                    ▼          │
│                                              QuickSight       │
│                                              Dashboard        │
│                                                    │          │
│                                    ┌───────────────┼──────┐   │
│                                    ▼               ▼      ▼   │
│                               SPICE Cache   Filters   Export  │
│                               (in-memory)   Drill-    PDF/    │
│                                             down      Excel   │
│                                                               │
│  Cost: £200-400/month for 10-20 users                        │
│  - Reader: £18/user/month                                    │
│  - Author: £24/user/month (1-2 per council)                  │
│  - Athena: £2-5/month (serverless SQL)                       │
│  - SPICE: 10 GB free tier                                    │
└─────────────────────────────────────────────────────────────┘
```

### Why Chart.js for Sandbox?

1. **No Licensing Cost**: QuickSight requires per-user licensing ($18-24/month)
2. **Instant Deployment**: No QuickSight enterprise setup required
3. **Demonstrates Concepts**: Shows KPIs, charts, filtering, export
4. **Zero Friction**: Evaluators see analytics UI immediately
5. **Production Path Clear**: Completion page explains upgrade path

## Definition of Done

- [x] CloudFormation template updated with sandbox clarification
- [x] Walkthrough landing page has sandbox notice
- [x] Walkthrough completion page has production guidance
- [x] Deployment-endpoints.yaml updated
- [x] Stack deployed successfully
- [x] Verification complete

## Dev Record

### Session Log

**2025-11-30 - Story Completed**

**Developer:** Claude Code

**Implementation Details:**

1. **Template Update**: Updated CloudFormation template sample-note:
   - Before: "demonstrates Amazon QuickSight capabilities"
   - After: "uses Chart.js with Lambda-generated sample data...In production, you would use Amazon QuickSight ($18/reader/month)"

2. **Walkthrough Updates**:
   - Added GOV.UK warning-text sandbox notice to index.njk
   - Added comprehensive "Sandbox vs Production Architecture" section to complete.njk
   - Listed all production services with pricing

3. **Deployment Endpoints**: Added mode, note, and production_services fields

**Verification Results:**

| Test | Result |
|------|--------|
| CloudFormation deployed | Pass - UPDATE_COMPLETE |
| Sample-note updated | Pass - Chart.js mentioned |
| Walkthrough landing sandbox notice | Pass - Visible |
| Completion page production guidance | Pass - Pricing listed |

**Files Modified:**

- `cloudformation/scenarios/quicksight-dashboard/template.yaml` - sample-note update
- `src/walkthroughs/quicksight-dashboard/index.njk` - sandbox notice
- `src/walkthroughs/quicksight-dashboard/complete.njk` - production guidance
- `docs/deployment-endpoints.yaml` - clarifications

**Deployment:**

- Stack: `ndx-try-quicksight-dashboard` - UPDATE_COMPLETE

**Time:** ~15 minutes

---

_Story created: 2025-11-30_
_Story completed: 2025-11-30_
_Epic: 24 - Scenario Application Remediation_
