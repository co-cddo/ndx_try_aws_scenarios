# NDX:Try AWS Scenarios - TypeScript Utilities Deep-Dive

**Date:** 2025-12-23
**Analysis Type:** Exhaustive Utility Analysis
**Total Utility Files:** 6 TypeScript modules + 5 build scripts
**Location:** `src/lib/`, `scripts/`

## Executive Summary

This document provides a comprehensive deep-dive analysis of all TypeScript utilities in the NDX:Try AWS Scenarios project. These utilities support AWS Console federation, visual regression testing, screenshot management, and CI/CD automation.

## Utility Inventory

### Core Utility Files (`src/lib/`)

| File | Lines | Purpose |
|------|-------|---------|
| `aws-federation.ts` | 520 | AWS Console federation with Playwright |
| `console-url-builder.ts` | 408 | AWS Console URL generation |
| `screenshot-manifest.ts` | 115 | Screenshot metadata and S3 management |
| `visual-regression.ts` | 343 | Visual diff detection with pixelmatch |
| `circuit-breaker.ts` | 36 | Simple failure rate tracking |
| `diff-report.ts` | 357 | HTML/Markdown report generation |

---

## Detailed API Documentation

### 1. AWS Federation (`aws-federation.ts`)

**Purpose:** Enable Playwright tests to authenticate with AWS Console using STS federated credentials.

**Exports:**
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
  durationSeconds?: number;  // default: 3600, max: 129600
  policy?: string;           // Optional inline IAM policy
  region?: string;           // default: us-east-1
}

async function openAwsConsoleInPlaywright(
  config: FederationConfig,
  destination?: string
): Promise<FederationResponse>

async function closeConsoleSession(
  response: FederationResponse
): Promise<void>

function buildConsoleUrl(
  arn: string,
  service: 'lambda' | 's3' | 'cloudformation' | 'dynamodb' | 'cloudwatch',
  region?: string
): string
```

**Dependencies:**
- `@aws-sdk/client-sts` - Federation token generation
- `@aws-sdk/client-cloudformation` - Stack output retrieval
- `@playwright/test` - Browser automation
- `axios` - HTTP client

**Security Features:**
- Exponential backoff retry (1s, 2s, 4s)
- Error codes only (no credential logging)
- Credential clearing on session close

---

### 2. Console URL Builder (`console-url-builder.ts`)

**Purpose:** Build AWS Console URLs from CloudFormation stack outputs.

**Exports:**
```typescript
function buildConsoleUrl(config: ConsoleUrlConfig): string

function extractResourceFromArn(
  arn: string,
  defaultRegion?: string
): { resourceId: string; region: string; service: string }

async function getStackOutputs(
  stackName: string,
  region?: string
): Promise<Record<string, string>>

async function buildScenarioUrls(
  stackName?: string,
  region?: string
): Promise<ScenarioUrls[]>
```

**URL Patterns:**
- Lambda: `https://{region}.console.aws.amazon.com/lambda/home?region={region}#/functions/{functionName}`
- S3: `https://s3.console.aws.amazon.com/s3/buckets/{bucketName}?region={region}`
- DynamoDB: `https://{region}.console.aws.amazon.com/dynamodbv2/home?region={region}#table?name={tableName}`
- QuickSight: `https://{region}.quicksight.aws.amazon.com/sn/dashboards/{dashboardId}`

---

### 3. Screenshot Manifest (`screenshot-manifest.ts`)

**Purpose:** Type definitions and utilities for screenshot capture metadata.

**Exports:**
```typescript
interface ScreenshotManifest {
  batch_id: string;
  timestamp: string;
  duration_seconds: number;
  scenarios: ScenarioCapture[];
}

function generateBatchId(): string
  // Returns: ISO timestamp + 6-char random suffix

async function uploadManifestToS3(
  manifest: ScreenshotManifest,
  bucketName: string,
  region?: string
): Promise<void>

async function uploadScreenshotToS3(
  screenshot: Buffer,
  filename: string,
  scenario: string,
  bucketName: string,
  region?: string
): Promise<void>
```

**S3 Structure:**
```
s3://bucket/
├── manifests/{batch_id}.json
├── current/{scenario}/{filename}
├── baselines/{scenario}/{filename}
└── diffs/{batch_id}/{scenario}/{filename}
```

---

### 4. Visual Regression (`visual-regression.ts`)

**Purpose:** Pixel-level image comparison using pixelmatch.

**Exports:**
```typescript
interface RegressionResult {
  screenshot_path: string;
  baseline_path: string;
  diff_percentage: number;
  status: 'pass' | 'review' | 'fail';
  diff_image_path?: string;
}

function classifyDiff(percentage: number): 'pass' | 'review' | 'fail'
  // <10% = pass, 10-15% = review, >15% = fail

function compareImages(
  currentBuffer: Buffer,
  baselineBuffer: Buffer
): { diffPercentage: number; diffImage: Buffer }

async function compareAllScreenshots(
  manifest: ScreenshotManifest,
  bucketName: string,
  region?: string
): Promise<RegressionReport>

async function publishMetrics(
  report: RegressionReport,
  region?: string
): Promise<void>
```

**Thresholds:**
- Pass: < 10% difference
- Review: 10-15% (manual approval needed)
- Fail: > 15% (auto-fail)

**Dependencies:**
- `pixelmatch@5.3.0` - Pixel-level comparison
- `pngjs@7.0.0` - PNG reading/writing
- `@aws-sdk/client-cloudwatch` - Metrics publishing

---

### 5. Circuit Breaker (`circuit-breaker.ts`)

**Purpose:** Simple failure rate tracking pattern.

**Exports:**
```typescript
class CircuitBreaker {
  constructor(threshold: number = 0.5)  // 50% failure threshold
  recordSuccess(): void
  recordFailure(): void
  isOpen(): boolean  // true if failure rate exceeds threshold
  getStats(): { total: number; failures: number; rate: number }
  reset(): void
}
```

---

### 6. Diff Report (`diff-report.ts`)

**Purpose:** Generate visual regression reports in multiple formats.

**Exports:**
```typescript
function generateDiffImage(
  currentBuffer: Buffer,
  baselineBuffer: Buffer
): Buffer

function generateHtmlReport(report: RegressionReport): string
  // Full HTML page with side-by-side comparisons

function formatPrBody(report: RegressionReport): string
  // GitHub PR markdown body

function generateTextSummary(report: RegressionReport): string
  // Plain text for console/notifications
```

---

## Build Scripts (`scripts/`)

| Script | CLI | Purpose |
|--------|-----|---------|
| `run-visual-regression.mjs` | `node scripts/run-visual-regression.mjs --bucket {bucket}` | Run visual regression tests |
| `generate-manifest.mjs` | `node scripts/generate-manifest.mjs {test-results}` | Parse Playwright output |
| `check-screenshots.js` | `node scripts/check-screenshots.js` | Validate YAML references |
| `update-baselines.mjs` | `node scripts/update-baselines.mjs --bucket {bucket}` | Update baseline images |
| `optimize-images.js` | `node scripts/optimize-images.js` | Convert/compress screenshots |

---

## Test Configuration

### Playwright Config
```typescript
testDir: './tests'
projects: [
  { name: 'desktop', viewport: { width: 1280, height: 800 } },
  { name: 'mobile', viewport: { width: 375, height: 667 } }
]
expect.toHaveScreenshot.maxDiffPixelRatio: 0.1  // 10% threshold
```

### Vitest Config
```typescript
environment: 'node'
include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']
coverage: { provider: 'v8', include: ['src/**/*.ts'] }
```

---

## Test Files

| Test | Framework | Coverage |
|------|-----------|----------|
| `screenshot-capture.spec.ts` | Playwright | Exploration page screenshots |
| `visual-regression.spec.ts` | Playwright | Page + component comparisons |
| `keyboard-navigation.spec.ts` | Playwright | Tab, arrows, focus visibility |

---

## Dependency Graph

```
aws-federation.ts
├── @aws-sdk/client-sts
├── @aws-sdk/client-cloudformation
├── @playwright/test
└── axios

console-url-builder.ts
└── @aws-sdk/client-cloudformation

screenshot-manifest.ts
├── @aws-sdk/client-s3
└── @aws-sdk/client-sns

visual-regression.ts
├── pixelmatch
├── pngjs
├── @aws-sdk/client-s3
└── @aws-sdk/client-cloudwatch

diff-report.ts
├── pixelmatch
└── pngjs

circuit-breaker.ts
└── (no dependencies)
```

---

## Usage Patterns

### Pattern 1: Screenshot Capture & Manifest
```typescript
// Playwright test captures screenshots
// generate-manifest.mjs parses Playwright JSON output
// uploadManifestToS3() publishes to S3
```

### Pattern 2: Visual Regression Detection
```typescript
// run-visual-regression.mjs downloads manifest
// compareAllScreenshots() compares current vs baselines
// publishMetrics() sends to CloudWatch
// formatPrBody() for GitHub PR if changes detected
```

### Pattern 3: Console URL Building
```typescript
const outputs = await getStackOutputs('ndx-reference');
const urls = await buildScenarioUrls('ndx-reference');
// Returns all scenario Console URLs
```

---

## Error Handling Approach

### Security-First Logging
- Never log: Credentials, access keys, session tokens
- Always log: Error codes, operation names, counts, timestamps
- Pattern: Use error codes (e.g., `FEDERATION_FAILED`)

### Retry Strategy
- Exponential backoff: 1s, 2s, 4s
- Retryable: Rate limits (429), throttling
- Non-retryable: Auth failures, validation errors

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Utility Files | 6 TypeScript |
| Total Build Scripts | 5 JavaScript/MJS |
| Test Files | 3 Playwright specs |
| External Dependencies | 8 packages |
| Lines of Code | ~2,500 |

---

_Generated using BMAD Method `document-project` deep-dive workflow on 2025-12-23_
