# Epic Technical Specification: Sprint 0 - AWS Federation Screenshot Automation Infrastructure

Date: 2025-11-29
Author: BMAD Workflow
Epic ID: sprint-0
Status: Draft

---

## Overview

Sprint 0 establishes shared AWS Federation and Playwright infrastructure enabling automated screenshot capture across all 6 scenarios. This foundational sprint creates the technical capabilities required for Epics 6-11 (Hands-On Exploration) to deliver rich, accurate AWS Console screenshots without manual maintenance.

The infrastructure supports test-driven screenshot capture where every documentation screenshot is a byproduct of a passing E2E test, ensuring screenshots can never be out of sync with actual functionality.

**Investment Model:**
- Sprint 0 adds 26 story points but saves 30 points across Epic 6-11 (5 points × 6 epics)
- **Net reduction:** 4 story points while making screenshot automation viable

**Critical Constraint:** Sprint 0 MUST complete before Epic 6 begins. Epic 6-11 screenshot stories (Story X.6) depend on this infrastructure.

## Objectives and Scope

### In Scope

- **S0.1:** IAM service account with scoped federation permissions (sts:GetFederationToken)
- **S0.2:** Playwright library for AWS Console authentication via federation tokens
- **S0.3:** GitHub Actions pipeline for scheduled/manual screenshot capture across 6 scenarios
- **S0.4:** Visual regression detection with pixelmatch, baseline management in S3, approval workflow
- **S0.5:** Reference deployment stack for consistent screenshot source environment

### Out of Scope

- Exploration page screenshots (handled in Epic 6-11 using S0 infrastructure)
- Demo video recording (Epic 2, uses separate tooling)
- User deployment stacks (separate from reference stack)
- Cross-account screenshot capture (future Phase 2 consideration)

### Key FRs Covered

| FR | Description |
|----|-------------|
| FR107 | AWS STS GetFederationToken with DurationSeconds: 3600 |
| FR108 | SigninToken generation via federation endpoint |
| FR109 | Console Login URL construction |
| FR110 | Playwright browser session management |
| FR111 | Screenshot orchestration as scheduled pipeline |
| FR112 | Visual regression detection with pixelmatch |
| FR113 | Stack-aware screenshot capture with dynamic resource discovery |
| FR114 | Fallback screenshot library for stack-agnostic alternatives |
| FR115 | Screenshot automation independent of user deployments |
| FR120 | Screenshots from Playwright E2E tests |
| FR122 | Playwright E2E test suite per scenario |
| FR123 | Playwright + AWS Federation integration |

### Key NFRs Covered

| NFR | Description |
|-----|-------------|
| NFR48 | Federation policy explicit deny on modify/delete actions |
| NFR49 | Server-side only - credentials never exposed in client code |
| NFR50 | 1-hour session max, no refresh capability |
| NFR51 | 95%+ screenshot capture success rate |
| NFR52 | 30-second per-screenshot max, 30-minute full batch |
| NFR53 | S3 retention policy (10 versions, 90-day Glacier transition) |
| NFR54 | CloudWatch metrics and alerting |
| NFR55 | Tests are single source of truth for screenshots |
| NFR56 | Automatic screenshot refresh on passing tests |

## System Architecture Alignment

### Architecture Components

Sprint 0 introduces the following components to the existing architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ screenshot-  │  │ visual-      │  │ baseline-update.yml  │   │
│  │ capture.yml  │  │ regression   │  │                      │   │
│  │              │  │ .yml         │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Playwright Test Framework                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        src/lib/aws-federation.ts (S0.2)                  │   │
│  │  - openAwsConsoleInPlaywright(destination)               │   │
│  │  - closeConsoleSession()                                 │   │
│  │  - FederatedCredentials interface                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Services                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │    IAM      │  │    STS      │  │  AWS Console           │   │
│  │  (S0.1)     │  │ Federation  │  │  (authenticated)       │   │
│  │             │  │             │  │                        │   │
│  └─────────────┘  └─────────────┘  └────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │    S3       │  │ CloudWatch  │  │    SNS                 │   │
│  │ Screenshots │  │  Metrics    │  │  Notifications         │   │
│  │  (S0.3/4)   │  │  (S0.4)     │  │    (S0.3)              │   │
│  └─────────────┘  └─────────────┘  └────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Reference Deployment Stack (S0.5)              │   │
│  │  - Council Chatbot    - Planning AI    - FOI Redaction   │   │
│  │  - Smart Car Park     - Text-to-Speech - QuickSight      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Infrastructure Integration

- **Eleventy Build System:** No changes required; screenshots used in static site
- **GOV.UK Frontend:** No impact; screenshots are documentation artifacts
- **Existing Playwright Config:** Extend `playwright.config.ts` with federation settings
- **GitHub Actions:** Add new workflows alongside existing build-deploy pipeline

## Detailed Design

### Services and Modules

| Module | Location | Responsibility | Dependencies |
|--------|----------|----------------|--------------|
| AWS Federation Library | `src/lib/aws-federation.ts` | STS federation, SigninToken exchange, console URL construction | @aws-sdk/client-sts, axios |
| Screenshot Capture Tests | `tests/e2e/console-screenshots/` | Playwright tests that capture AWS Console screenshots | aws-federation.ts, @playwright/test |
| Visual Regression Tests | `tests/visual-regression/` | Compare new screenshots against baselines | pixelmatch, @playwright/test |
| Pipeline Orchestration | `.github/workflows/screenshot-*.yml` | CI/CD workflows for capture, regression, baseline update | GitHub Actions |
| CloudFormation Templates | `cloudformation/screenshot-automation/` | IAM user, S3 bucket, CloudWatch resources | AWS CloudFormation |

### Data Models and Contracts

**FederatedCredentials Interface (S0.2):**
```typescript
interface FederatedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

interface FederationConfig {
  accessKeyId: string;
  secretAccessKey: string;
  durationSeconds?: number; // Default: 3600 (1 hour)
  policy?: string; // Optional inline policy to restrict further
}

interface FederationResponse {
  browser: Browser;
  page: Page;
  credentials: FederatedCredentials;
}
```

**Screenshot Manifest Schema (S0.3):**
```typescript
interface ScreenshotManifest {
  batch_id: string; // "2025-11-29T03:00:00Z-abc123"
  timestamp: string; // ISO 8601
  duration_seconds: number;
  scenarios: ScenarioCapture[];
}

interface ScenarioCapture {
  scenario_name: string; // "council-chatbot"
  status: 'success' | 'partial' | 'failed';
  screenshots: ScreenshotMetadata[];
  errors?: string[];
}

interface ScreenshotMetadata {
  page: string; // "lambda-function-detail"
  filename: string; // "council-chatbot-lambda-detail-20251129T030000Z.png"
  dimensions: { width: number; height: number };
  size_bytes: number;
  timestamp: string;
  cfn_template_version?: string;
}
```

**Visual Regression Result Schema (S0.4):**
```typescript
interface RegressionResult {
  screenshot_path: string;
  baseline_path: string;
  diff_percentage: number;
  status: 'pass' | 'review' | 'fail';
  diff_image_path?: string;
}
```

### APIs and Interfaces

**AWS Federation Library API (S0.2):**

```typescript
// Main entry point - opens authenticated AWS Console session
export async function openAwsConsoleInPlaywright(
  config: FederationConfig,
  destination?: string // defaults to us-west-2 console home
): Promise<FederationResponse>;

// Cleanup function - closes browser, clears credentials
export async function closeConsoleSession(
  response: FederationResponse
): Promise<void>;

// Helper - builds console URL from resource ARN
export function buildConsoleUrl(
  arn: string,
  service: 'lambda' | 's3' | 'cloudformation' | 'dynamodb' | 'cloudwatch',
  region?: string
): string;

// Helper - gets stack outputs for dynamic resource discovery
export async function getStackOutputs(
  stackName: string,
  region?: string
): Promise<Record<string, string>>;
```

**Internal Functions (not exported):**

```typescript
// Step 1: Get federation token from STS
async function getFederationToken(
  config: FederationConfig
): Promise<FederatedCredentials>;

// Step 2: Exchange for SigninToken
async function getSigninToken(
  credentials: FederatedCredentials
): Promise<string>;

// Step 3: Build federated login URL
function buildFederationLoginUrl(
  signinToken: string,
  destination: string
): string;

// Retry logic with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number
): Promise<T>;
```

### Workflows and Sequencing

**Screenshot Capture Pipeline Flow (S0.3):**

```
┌─────────────────┐
│  Trigger Event  │
│  - Manual       │
│  - Scheduled    │
│  - Post-deploy  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pre-capture     │
│ Verification    │
│ (S0.5 stack)    │
└────────┬────────┘
         │ Stack healthy?
         ▼
    ┌────┴────┐
    │  Yes    │────────────────────┐
    └─────────┘                    │
         │                         │
         │ No                      │
         ▼                         │
┌─────────────────┐                │
│ Use Fallback    │                │
│ Screenshots     │                │
└────────┬────────┘                │
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────┐
│ For each scenario (sequential):         │
│  1. Get federation token (S0.2)         │
│  2. Open console in Playwright          │
│  3. Navigate to service pages           │
│  4. Capture 15+ screenshots             │
│  5. Upload to S3                        │
│  6. Close browser, clear credentials    │
└────────────────────────┬────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────┐
│ Generate manifest.json                  │
│ Upload to S3                            │
└────────────────────────┬────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────┐
│ Trigger visual regression (S0.4)        │
└────────────────────────┬────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────┐
│ Send notification (SNS/Slack)           │
│ - Success: "25/25 captured"             │
│ - Failure: "15/25, 3 regressions"       │
└─────────────────────────────────────────┘
```

**Visual Regression Workflow (S0.4):**

```
┌─────────────────┐
│ New screenshots │
│ uploaded to S3  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ For each screenshot:                    │
│  1. Download from S3 (current/)         │
│  2. Download baseline from S3           │
│  3. Compare with pixelmatch             │
│  4. Calculate diff percentage           │
└────────────────────────┬────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    <10% diff       10-15% diff     >15% diff
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐   ┌─────────────┐  ┌───────────┐
    │  PASS   │   │   REVIEW    │  │   FAIL    │
    │ (auto)  │   │ (PR needed) │  │ (blocked) │
    └─────────┘   └──────┬──────┘  └───────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Create PR   │
                  │ with diff   │
                  │ images      │
                  └──────┬──────┘
                         │
                    ┌────┴────┐
                    │ Approve │
                    └────┬────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Update      │
                  │ baseline    │
                  │ in S3       │
                  └─────────────┘
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Federation token acquisition | <5 seconds | Playwright test timing |
| SigninToken exchange | <3 seconds | HTTP response time |
| Console page load | <30 seconds | Playwright waitForLoadState |
| Screenshot capture | <2 seconds per image | Playwright screenshot timing |
| Full batch (6 scenarios × 15 screenshots) | <30 minutes | GitHub Actions job duration |
| Visual regression comparison | <1 second per image | pixelmatch execution time |

### Security

| Requirement | Implementation |
|-------------|----------------|
| NFR48: Explicit deny on modify/delete | IAM policy with `*:Create*`, `*:Delete*`, `*:Update*` deny |
| NFR49: Server-side credentials only | GitHub Secrets → env vars; never in client JS |
| NFR50: 1-hour session max | STS GetFederationToken DurationSeconds: 3600 |
| Credential rotation | 90-day manual rotation with documented procedure |
| Audit logging | CloudTrail enabled for all STS federation calls |
| No credential logging | Error codes only (FEDERATION_FAILED); never log secrets |

**IAM Policy (Allowlist Approach):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetFederationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:List*", "s3:Get*",
        "lambda:List*", "lambda:Get*",
        "cloudformation:Describe*", "cloudformation:List*",
        "dynamodb:Describe*", "dynamodb:List*",
        "logs:Describe*", "logs:Get*", "logs:FilterLogEvents",
        "cloudwatch:Describe*", "cloudwatch:Get*", "cloudwatch:List*",
        "iot:Describe*", "iot:List*",
        "polly:Describe*", "polly:List*",
        "comprehend:Describe*", "comprehend:List*",
        "textract:Get*",
        "bedrock:List*", "bedrock:Get*",
        "quicksight:Describe*", "quicksight:List*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "iam:*",
        "organizations:*",
        "*:Create*",
        "*:Delete*",
        "*:Update*",
        "*:Put*",
        "*:Start*",
        "*:Stop*",
        "*:Invoke*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR51: Screenshot success rate | 95%+ | Retry logic (3 attempts); circuit breaker at 50% failure |
| Pipeline availability | 99% (scheduled runs) | GitHub Actions SLA; fallback to manual trigger |
| Reference stack uptime | 99% during capture windows | Hourly health checks; auto-remediation |
| Fallback screenshot availability | 100% | Pre-captured images in S3 fallback/ prefix |
| Data durability | 99.999999999% | S3 Standard with versioning |

### Observability

| Metric | Namespace | Dimensions |
|--------|-----------|------------|
| screenshot_success_count | AWS/NDXScreenshot | scenario, region |
| screenshot_failure_count | AWS/NDXScreenshot | scenario, region, error_type |
| screenshot_drift_detected | AWS/NDXScreenshot | scenario, threshold |
| federation_latency_ms | AWS/NDXScreenshot | region |
| pipeline_duration_seconds | AWS/NDXScreenshot | trigger_type |

**CloudWatch Alarms:**
- Success rate <90%: Warning notification
- Success rate <80%: Critical notification
- Drift >20%: Investigation required
- Pipeline >45 minutes: Performance degradation

**Log Groups:**
- `/aws/lambda/ndx-reference-health-check`: Health check Lambda logs
- `/github/actions/ndx-screenshot-automation`: Pipeline execution logs (30-day retention)

## Dependencies and Integrations

### NPM Dependencies (to add to package.json)

```json
{
  "devDependencies": {
    "@aws-sdk/client-sts": "^3.600.0",
    "@aws-sdk/client-cloudformation": "^3.600.0",
    "@aws-sdk/client-s3": "^3.600.0",
    "axios": "^1.6.0",
    "pixelmatch": "^5.3.0",
    "pngjs": "^7.0.0"
  }
}
```

### GitHub Secrets Required

| Secret Name | Description | Set By |
|-------------|-------------|--------|
| AWS_FEDERATION_ACCESS_KEY_ID | IAM user access key (S0.1) | S0.1 CloudFormation output |
| AWS_FEDERATION_SECRET_ACCESS_KEY | IAM user secret key (S0.1) | S0.1 CloudFormation output |
| AWS_REGION | Primary region (us-west-2) | Manual |
| AWS_ACCOUNT_ID | AWS account ID | Manual |
| SCREENSHOT_BUCKET_NAME | S3 bucket for screenshots | S0.3 CloudFormation output |
| SNS_TOPIC_ARN | Notification topic ARN | S0.3 CloudFormation output |

### External Service Dependencies

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| AWS STS | Federation tokens | 20 req/sec/account |
| AWS Federation Endpoint | SigninToken exchange | ~10 req/sec/IP |
| AWS Console | Screenshot source | N/A |
| GitHub Actions | Pipeline execution | 20 concurrent jobs |
| S3 | Screenshot storage | 3500 PUT/sec/prefix |

## Acceptance Criteria (Authoritative)

### S0.1: AWS Federation Service Account Setup

1. **AC1.1:** IAM user `ndx-screenshot-automation` created with `sts:GetFederationToken` permission only
2. **AC1.2:** Federation policy enforces read-only console access via explicit allowlist
3. **AC1.3:** Policy includes explicit deny for Create/Delete/Update/iam:/organizations: actions
4. **AC1.4:** Access keys generated and stored in GitHub Secrets (initially)
5. **AC1.5:** CloudTrail logging enabled for all federation sessions
6. **AC1.6:** Documentation created at `docs/ops/federation-credentials.md` with rotation procedure

### S0.2: Playwright Integration Library

1. **AC2.1:** `openAwsConsoleInPlaywright(config, destination)` function exported from `src/lib/aws-federation.ts`
2. **AC2.2:** Function calls STS GetFederationToken with scoped policy
3. **AC2.3:** Function exchanges credentials for SigninToken via `https://signin.aws.amazon.com/federation`
4. **AC2.4:** Function constructs Login URL with SigninToken and destination
5. **AC2.5:** Function opens Chromium browser and navigates to Login URL
6. **AC2.6:** Function waits for authenticated state (logout button visible or timeout)
7. **AC2.7:** Handles rate limits with exponential backoff (3 retries, max 10 seconds total)
8. **AC2.8:** `closeConsoleSession()` cleans up browser context and clears credentials from memory
9. **AC2.9:** TypeScript interfaces exported: `FederatedCredentials`, `FederationConfig`, `FederationResponse`

### S0.3: Screenshot Capture Pipeline

1. **AC3.1:** GitHub Actions workflow `.github/workflows/screenshot-capture.yml` processes all 6 scenarios sequentially
2. **AC3.2:** Captures minimum 15 screenshots per scenario using S0.2 library
3. **AC3.3:** Uploads screenshots to S3 bucket with versioning enabled
4. **AC3.4:** Generates JSON manifest with metadata (timestamp, scenario, page, dimensions)
5. **AC3.5:** Sends SNS notification on completion or failure
6. **AC3.6:** Completes full batch within 30 minutes (NFR52)
7. **AC3.7:** Supports manual invocation via workflow_dispatch with scenario selector
8. **AC3.8:** Supports scheduled weekly runs (Saturday 03:00 UTC)
9. **AC3.9:** Supports post-deployment trigger after CloudFormation template changes
10. **AC3.10:** Implements retry logic (3 retries, 5-second delays) for failed page loads
11. **AC3.11:** Implements circuit breaker: halt if >50% screenshots fail in batch

### S0.4: Visual Regression Detection

1. **AC4.1:** Compares new screenshots against baselines using pixelmatch
2. **AC4.2:** Flags screenshots with >10% pixel difference for manual review
3. **AC4.3:** Auto-fails tests with >15% pixel difference (NFR56)
4. **AC4.4:** Generates visual diff report showing changed regions
5. **AC4.5:** Creates GitHub PR for manual approval of baseline changes
6. **AC4.6:** Tags screenshots with CloudFormation template version
7. **AC4.7:** S3 bucket versioning retains last 10 versions
8. **AC4.8:** Lifecycle policy transitions versions >90 days to Glacier
9. **AC4.9:** CloudWatch metrics emitted: screenshot_success_count, screenshot_failure_count, screenshot_drift_detected
10. **AC4.10:** CloudWatch alarms trigger when success rate <90% or drift >20%

### S0.5: Reference Deployment Environment

1. **AC5.1:** Dedicated CloudFormation stack `ndx-reference` deployed in same AWS account
2. **AC5.2:** Stack uses same templates as user deployments (version aligned via git tags)
3. **AC5.3:** Known-good sample data preloaded for all 6 scenarios
4. **AC5.4:** Stack maintained in COMPLETE state during screenshot windows
5. **AC5.5:** Pre-capture verification script validates stack health before capture
6. **AC5.6:** Fallback screenshots stored in S3 `fallback/` prefix with disclaimer
7. **AC5.7:** Console URLs built from stack outputs (not hardcoded ARNs)
8. **AC5.8:** Lambda function `ndx-reference-stack-health-check` runs hourly
9. **AC5.9:** Stack Policy prevents accidental modifications except by automation user

## Traceability Mapping

| AC | Spec Section | Component | Test |
|----|--------------|-----------|------|
| AC1.1-AC1.6 | Security | cloudformation/screenshot-automation/iam.yaml | test:iam-permissions |
| AC2.1-AC2.9 | APIs and Interfaces | src/lib/aws-federation.ts | test:federation-library |
| AC3.1-AC3.11 | Workflows | .github/workflows/screenshot-capture.yml | test:pipeline-e2e |
| AC4.1-AC4.10 | Workflows | tests/visual-regression/ | test:visual-regression |
| AC5.1-AC5.9 | Architecture | cloudformation/screenshot-automation/reference-stack.yaml | test:reference-stack |

| FR | Story | AC | Status |
|----|-------|----| -------|
| FR107 | S0.1 | AC1.1 | Pending |
| FR108 | S0.2 | AC2.3 | Pending |
| FR109 | S0.2 | AC2.4 | Pending |
| FR110 | S0.2 | AC2.5-AC2.6 | Pending |
| FR111 | S0.3 | AC3.1-AC3.11 | Pending |
| FR112 | S0.4 | AC4.1-AC4.5 | Pending |
| FR113 | S0.5 | AC5.7 | Pending |
| FR114 | S0.5 | AC5.6 | Pending |
| FR115 | S0.5 | AC5.1 | Pending |
| FR120 | S0.3 | AC3.2 | Pending |
| FR122 | S0.3 | AC3.1 | Pending |
| FR123 | S0.2 | AC2.1-AC2.9 | Pending |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|------------|
| R1: Federation endpoint rate limiting | HIGH | 20%+ captures fail | Exponential backoff; sequential processing |
| R2: 30-minute SLA overrun | HIGH | Pipeline unreliable | Profile locally; optimize screenshot count |
| R3: Visual regression false positives | MEDIUM | Manual review burden | 3-5 rolling baselines; lightweight approval |
| R4: Reference stack drift | MEDIUM | Screenshots don't match users | Stack Policy; automated drift detection |
| R5: Credential exposure in logs | HIGH | Security incident | Never log credentials; use error codes |

### Assumptions

| ID | Assumption | Impact if False |
|----|------------|-----------------|
| A1 | GitHub Actions provides stable IP for federation | May need dedicated runner |
| A2 | AWS Console UI stable between Saturday captures | May need more frequent runs |
| A3 | 15 screenshots per scenario sufficient | May need to increase count |
| A4 | Existing AWS credentials sufficient for S0.1 | May need elevated permissions |
| A5 | S3 Cross-Region Replication optional for MVP | Must revisit for DR requirements |

### Open Questions (Resolved)

| ID | Question | Resolution |
|----|----------|------------|
| Q1 | GitHub Secrets vs Secrets Manager? | GitHub Secrets for Sprint 0; migrate later |
| Q2 | Explicit allow vs explicit deny? | Explicit allow (allowlist) for safety |
| Q3 | Region restriction feasible? | Document as guidance; SCP for enforcement |
| Q4 | Same account vs separate? | Same account for Sprint 0 |
| Q5 | Console + exploration in S0.3? | Console only; stay within 30-min SLA |
| Q6 | Fallback auto-generated or manual? | Manually captured during releases |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| Unit | aws-federation.ts functions | Jest/Vitest | 90% line coverage |
| Integration | Federation flow end-to-end | Playwright | All happy paths |
| Acceptance | Story ACs | Playwright + manual | 100% ACs |
| Visual Regression | Screenshot comparison | pixelmatch | All screenshots |
| Smoke | Pre-production validation | Manual | Critical paths |

### Test Automation

**New Test Files:**
- `tests/unit/aws-federation.test.ts` - Unit tests for library
- `tests/e2e/console-screenshots/council-chatbot.spec.ts` - E2E per scenario
- `tests/visual-regression/console-screenshots.spec.ts` - Regression suite

**CI/CD Integration:**
- Unit tests: Run on every commit
- Integration tests: Run on PR merge to main
- Visual regression: Run after screenshot capture workflow
- Smoke tests: Run nightly against reference stack

### Test Data

| Type | Source | Refresh Frequency |
|------|--------|-------------------|
| Federation credentials | GitHub Secrets | 90-day rotation |
| Reference stack | S0.5 deployment | Per template release |
| Sample data | src/_data/*.yaml | Per template release |
| Baseline screenshots | S3 baselines/ | On approval |

---

## CloudFormation Resource Summary

### Resources Created

| Stack | Resource Type | Count |
|-------|---------------|-------|
| screenshot-automation-iam | IAM::User, IAM::Policy, IAM::AccessKey | 3 |
| screenshot-automation-infrastructure | S3::Bucket, SNS::Topic, Logs::LogGroup | 3 |
| screenshot-automation-monitoring | CloudWatch::Dashboard, CloudWatch::Alarm | 4 |
| ndx-reference | CloudFormation::Stack (nested ×6), Lambda::Function | 8 |
| **Total** | | **18** |

### Estimated Monthly Cost

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | 650 GB/year | ~$15/month |
| CloudWatch Logs | 26 GB/year | ~$12/month |
| CloudWatch Metrics | 5 metrics | ~$2/month |
| Lambda | 730 invocations/month | ~$1/month |
| SNS | 52 notifications/month | <$1/month |
| **Total** | | **~$31/month** |

---

_Generated by BMAD epic-tech-context workflow_
_Sprint 0 contexted: 2025-11-29_
