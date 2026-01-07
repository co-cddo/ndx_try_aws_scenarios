# Screenshot Capture Pipeline Architecture

> **⚠️ DEPRECATED**: This document describes an architecture that was never fully implemented. The referenced modules (`src/lib/visual-regression.ts`, `src/lib/aws-federation.ts`, `src/lib/diff-report.ts`) have been deleted. Screenshots are now captured using local Playwright tests. See `tests/` for current implementation.

## Overview

The Screenshot Capture Pipeline automates the process of capturing AWS Console screenshots for all 6 reference implementation scenarios.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions Workflow                       │
│                   aws-console-screenshots.yml                         │
│                                                                       │
│  Triggers:                                                            │
│  • Manual (workflow_dispatch) - Scenario selection dropdown           │
│  • Weekly Schedule - Saturday 03:00 UTC                               │
│  • Auto - Push to main with CloudFormation changes                    │
│                                                                       │
│  Timeout: 30 minutes                                                  │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Playwright E2E Tests                             │
│                   tests/e2e/console-screenshots/                      │
│                                                                       │
│  For Each Scenario (6 total):                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. Create Federated Session (Story S0.2)                    │    │
│  │     ↓                                                         │    │
│  │  2. Get Stack Outputs (CloudFormation)                        │    │
│  │     ↓                                                         │    │
│  │  3. Build Console URLs (ARN → URL)                            │    │
│  │     ↓                                                         │    │
│  │  4. Capture Screenshots (15+ per scenario)                    │    │
│  │     ├─ Lambda Functions                                       │    │
│  │     ├─ DynamoDB Tables                                        │    │
│  │     ├─ S3 Buckets                                             │    │
│  │     ├─ CloudFormation Stacks                                  │    │
│  │     └─ CloudWatch Logs                                        │    │
│  │     ↓                                                         │    │
│  │  5. Close Session (Cleanup)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Helper: screenshot-helper.ts                                         │
│  • createAuthenticatedSession()                                       │
│  • captureScreenshot() - Full page PNG                                │
│  • withRetry() - 3 attempts, 5s delay                                 │
│  • getConsoleUrlForResource()                                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│    Circuit Breaker          │   │   Screenshot Manifest       │
│  circuit-breaker.ts         │   │  screenshot-manifest.ts     │
│                             │   │                             │
│  Threshold: 50%             │   │  Functions:                 │
│  • recordSuccess()          │   │  • generateBatchId()        │
│  • recordFailure()          │   │  • createManifest()         │
│  • isOpen()                 │   │  • uploadManifestToS3()     │
│  • getStats()               │   │  • uploadScreenshotToS3()   │
│  • reset()                  │   │  • sendNotification()       │
│                             │   │                             │
│  Prevents cascade failures  │   │  Schema:                    │
│  Opens at >50% failure rate │   │  • batch_id                 │
│  Stops further attempts     │   │  • timestamp                │
│                             │   │  • duration_seconds         │
│                             │   │  • scenarios[]              │
│                             │   │    - status                 │
│                             │   │    - screenshots[]          │
│                             │   │    - errors[]               │
└─────────────────────────────┘   └────────────┬────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Infrastructure                            │
│                  cloudformation/screenshot-automation/                │
│                                                                       │
│  ┌──────────────────────┐          ┌──────────────────────┐          │
│  │   S3 Bucket          │          │   SNS Topic          │          │
│  │                      │          │                      │          │
│  │  Name:               │          │  Name:               │          │
│  │  ndx-screenshots-    │          │  ndx-screenshot-     │          │
│  │  {AccountId}         │          │  notifications       │          │
│  │                      │          │                      │          │
│  │  Features:           │          │  Notifications:      │          │
│  │  • Versioning ON     │          │  • Success Summary   │          │
│  │  • Lifecycle Rules   │          │  • Failure Alerts    │          │
│  │    - 90 day expiry   │          │  • Batch Metadata    │          │
│  │    - 10 versions max │          │  • Error Details     │          │
│  │  • Public Block      │          │                      │          │
│  │                      │          │  Subject Format:     │          │
│  │  Structure:          │          │  "Screenshot Capture │          │
│  │  current/            │          │   [SUCCESS|FAILED]:  │          │
│  │   ├─council-chatbot/ │          │   N scenario(s)"     │          │
│  │   ├─planning-ai/     │          │                      │          │
│  │   ├─foi-redaction/   │          │                      │          │
│  │   ├─smart-car-park/  │          │                      │          │
│  │   ├─text-to-speech/  │          │                      │          │
│  │   └─quicksight/      │          │                      │          │
│  │  manifests/          │          │                      │          │
│  │   └─{batch_id}.json  │          │                      │          │
│  └──────────────────────┘          └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Trigger Event
```
GitHub Event → Workflow Dispatch / Schedule / Push
↓
Scenario Selection: all | council-chatbot | planning-ai | etc.
```

### 2. Test Execution
```
For Each Scenario:
  ↓
  Get Stack Outputs (CloudFormation API)
  ├─ ChatbotFunctionArn
  ├─ ConversationTableArn
  ├─ KnowledgeBucketName
  └─ StackArn
  ↓
  Create Federation Session (AssumeRole → GetFederationToken)
  ├─ Opens browser with temporary credentials
  └─ Returns Page object
  ↓
  For Each Screenshot Page (15-16 per scenario):
    ↓
    Build Console URL (ARN → Service-specific URL)
    ↓
    Navigate to URL
    ↓
    Wait for networkidle
    ↓
    Capture Full-Page Screenshot
    ├─ Format: PNG
    ├─ Dimensions: viewport size
    ├─ Filename: {scenario}-{page}-{timestamp}.png
    └─ Metadata: { page, filename, dimensions, size_bytes, timestamp }
    ↓
    Record Success/Failure in Circuit Breaker
    ↓
    If Circuit Open (>50% failure):
      SKIP remaining tests
  ↓
  Close Federation Session
```

### 3. Upload & Notify
```
All Screenshots → S3
  ├─ Path: current/{scenario}/{filename}.png
  ├─ Versioning: Automatic (up to 10 versions)
  └─ Content-Type: image/png

Manifest JSON → S3
  ├─ Path: manifests/{batch_id}.json
  ├─ Content: Full capture metadata
  └─ Content-Type: application/json

Summary → SNS
  ├─ Subject: Success/Failure count
  ├─ Message: JSON with scenario details
  └─ Trigger: Always (even on failure)
```

## Scenario Coverage

| Scenario | Stack Name | Screenshots | Primary Services |
|----------|------------|-------------|------------------|
| Council Chatbot | ndx-reference-council-chatbot | 16 | Lambda, DynamoDB, S3 |
| Planning AI | ndx-reference-planning-ai | 15 | Lambda, Textract, S3, DynamoDB |
| FOI Redaction | ndx-reference-foi-redaction | 15 | Lambda, Comprehend, S3, Step Functions |
| Smart Car Park | ndx-reference-smart-car-park | 15 | IoT Core, Lambda, DynamoDB, Timestream |
| Text-to-Speech | ndx-reference-text-to-speech | 15 | Lambda, Polly, S3, DynamoDB |
| QuickSight | ndx-reference-quicksight | 15 | QuickSight, Athena, Glue, S3 |
| **Total** | | **91** | |

## Retry & Failure Handling

### Retry Logic (`withRetry`)
```typescript
Attempt 1 → Wait 5s → Attempt 2 → Wait 5s → Attempt 3 → Fail
```

### Circuit Breaker Logic
```typescript
// Opens when failures > 50% of total
if (failures / total > 0.5) {
  Skip remaining tests
  Log circuit breaker open
}

// Examples:
// 1 failure / 2 total = 50% → CLOSED (continues)
// 2 failures / 3 total = 66.7% → OPEN (stops)
// 51 failures / 100 total = 51% → OPEN (stops)
```

## Manifest Schema

```json
{
  "batch_id": "2025-11-29T16:24:35.123Z-abc123",
  "timestamp": "2025-11-29T16:24:35.123Z",
  "duration_seconds": 1800,
  "scenarios": [
    {
      "scenario_name": "council-chatbot",
      "status": "success",
      "screenshots": [
        {
          "page": "lambda-function-overview",
          "filename": "council-chatbot-lambda-function-overview-2025-11-29T16-24-35.png",
          "dimensions": { "width": 1280, "height": 800 },
          "size_bytes": 125432,
          "timestamp": "2025-11-29T16:24:35.123Z",
          "cfn_template_version": "v1.2.3"
        }
      ],
      "errors": []
    },
    {
      "scenario_name": "planning-ai",
      "status": "partial",
      "screenshots": [ /* ... */ ],
      "errors": ["Failed to capture page 'textract-console': Timeout"]
    },
    {
      "scenario_name": "foi-redaction",
      "status": "failed",
      "screenshots": [],
      "errors": ["Stack not found", "Circuit breaker open"]
    }
  ]
}
```

## Environment Variables

### GitHub Secrets (Required)
```
AWS_FEDERATION_ACCESS_KEY_ID       # From S0.1 IAM user
AWS_FEDERATION_SECRET_ACCESS_KEY   # From S0.1 IAM user
SCREENSHOT_BUCKET_NAME             # From S3 CloudFormation stack
SNS_TOPIC_ARN                      # From S3 CloudFormation stack
```

### Runtime Variables
```
AWS_REGION=us-west-2              # Default region
NODE_VERSION=20                   # Node.js version
```

## Integration Points

### Story S0.1: IAM Federation User
```
IAM User: ndx-screenshot-automation
Policy: AssumeRoleFederationPolicy
Used by: createAuthenticatedSession()
```

### Story S0.2: AWS Federation Library
```
Functions Used:
├─ openAwsConsoleInPlaywright()   # Session creation
├─ closeConsoleSession()          # Cleanup
├─ buildConsoleUrl()              # URL generation
└─ getStackOutputs()              # CloudFormation data
```

## Performance Characteristics

### Timing
- Single scenario: ~2-5 minutes (15 screenshots)
- All scenarios: ~15-25 minutes (91 screenshots)
- Timeout limit: 30 minutes
- Retry delay: 5 seconds per attempt
- Max attempts: 3 per page

### Storage
- Average screenshot size: ~100-200 KB (PNG)
- Total per batch: ~10-20 MB
- S3 versioning: Up to 10 versions retained
- Lifecycle: Old versions expire after 90 days

### Resource Limits
- Concurrent scenarios: 1 (sequential execution)
- Browser instances: 1 per test
- Network connections: ~5-10 per page load
- Memory usage: ~500 MB per browser instance

## Error Scenarios

### Handled Errors
1. **Stack Not Found**: Test skips with warning
2. **Network Timeout**: Retries 3 times with 5s delay
3. **Federation Failure**: Retries at session level
4. **High Failure Rate**: Circuit breaker stops execution
5. **Screenshot Timeout**: Logs error, continues next page

### Unhandled/Critical Errors
1. **AWS Credentials Invalid**: Workflow fails immediately
2. **S3 Bucket Missing**: Upload step fails
3. **SNS Topic Missing**: Notification step fails (workflow continues)

## Monitoring & Alerts

### SNS Notifications
```
Success: "Screenshot Capture SUCCESS: 91 screenshots"
Partial: "Screenshot Capture SUCCESS: 75 screenshots"
Failure: "Screenshot Capture FAILED: 2 scenario(s)"
```

### GitHub Actions Artifacts
```
Name: screenshots
Path: playwright-report/
Retention: 30 days
Size: ~10-20 MB per run
```

## Deployment Checklist

- [ ] Deploy S3 bucket CloudFormation stack
- [ ] Configure GitHub Secrets (4 required)
- [ ] Deploy reference implementation stacks (6 scenarios)
- [ ] Test manual workflow trigger
- [ ] Verify SNS notification delivery
- [ ] Check S3 bucket versioning
- [ ] Validate manifest JSON structure
- [ ] Test circuit breaker with intentional failures
- [ ] Verify weekly scheduled execution

## Future Enhancements

1. **Screenshot Comparison**: Detect AWS Console UI changes
2. **Image Optimization**: Compress PNGs, convert to WebP
3. **CloudFront Distribution**: Public screenshot access
4. **Dashboard Visualization**: Screenshot history UI
5. **Slack/Teams Integration**: Real-time notifications
6. **Parallel Execution**: Run scenarios concurrently
7. **Selective Re-capture**: Only capture changed pages
8. **Historical Comparison**: Track console changes over time

---

**Version:** 1.0.0
**Last Updated:** 2025-11-29
**Author:** TypeScript Expert Agent
