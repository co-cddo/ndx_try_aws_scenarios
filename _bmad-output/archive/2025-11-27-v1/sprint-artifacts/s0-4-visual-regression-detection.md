# Story S0.4: Visual Regression Detection

Status: done

## Story

As a **content maintainer** reviewing documentation screenshots,
I want **automated visual regression detection comparing screenshots against baselines**,
So that **I can identify unexpected UI changes without manual comparison of 90+ images**.

## Acceptance Criteria

| AC ID | Criterion | Source |
|-------|-----------|--------|
| AC4.1 | Compares new screenshots against baselines using pixelmatch | [tech-spec-sprint-0.md#AC4.1] |
| AC4.2 | Flags screenshots with >10% pixel difference for manual review | [tech-spec-sprint-0.md#AC4.2] |
| AC4.3 | Auto-fails tests with >15% pixel difference (NFR56) | [tech-spec-sprint-0.md#AC4.3] |
| AC4.4 | Generates visual diff report showing changed regions | [tech-spec-sprint-0.md#AC4.4] |
| AC4.5 | Creates GitHub PR for manual approval of baseline changes | [tech-spec-sprint-0.md#AC4.5] |
| AC4.6 | Tags screenshots with CloudFormation template version | [tech-spec-sprint-0.md#AC4.6] |
| AC4.7 | S3 bucket versioning retains last 10 versions | [tech-spec-sprint-0.md#AC4.7] |
| AC4.8 | Lifecycle policy transitions versions >90 days to Glacier | [tech-spec-sprint-0.md#AC4.8] |
| AC4.9 | CloudWatch metrics emitted: screenshot_success_count, screenshot_failure_count, screenshot_drift_detected | [tech-spec-sprint-0.md#AC4.9] |
| AC4.10 | CloudWatch alarms trigger when success rate <90% or drift >20% | [tech-spec-sprint-0.md#AC4.10] |

## Tasks / Subtasks

- [ ] Task 1: Create visual regression library (AC: 4.1, 4.2, 4.3)
  - [ ] 1.1: Create `src/lib/visual-regression.ts`
  - [ ] 1.2: Implement pixelmatch comparison function
  - [ ] 1.3: Implement threshold logic (10% review, 15% fail)
  - [ ] 1.4: Define RegressionResult interface
  - [ ] 1.5: Implement S3 baseline fetch function
  - [ ] 1.6: Implement batch comparison function

- [ ] Task 2: Create diff report generator (AC: 4.4)
  - [ ] 2.1: Create `src/lib/diff-report.ts`
  - [ ] 2.2: Implement diff image generation with highlighted regions
  - [ ] 2.3: Generate HTML report with side-by-side comparisons
  - [ ] 2.4: Include summary statistics (pass/review/fail counts)
  - [ ] 2.5: Upload diff images to S3 `diffs/` prefix

- [ ] Task 3: Create baseline management system (AC: 4.5, 4.6)
  - [ ] 3.1: Create `scripts/update-baselines.mjs`
  - [ ] 3.2: Tag baselines with CloudFormation template version
  - [ ] 3.3: Create PR template for baseline approvals
  - [ ] 3.4: Implement baseline versioning metadata

- [ ] Task 4: Update S3 bucket configuration (AC: 4.7, 4.8)
  - [ ] 4.1: Update `cloudformation/screenshot-automation/s3-bucket.yaml`
  - [ ] 4.2: Configure lifecycle rule for 10 versions max
  - [ ] 4.3: Configure 90-day Glacier transition
  - [ ] 4.4: Add `baselines/` and `diffs/` prefix configurations

- [ ] Task 5: Create CloudWatch monitoring resources (AC: 4.9, 4.10)
  - [ ] 5.1: Create `cloudformation/screenshot-automation/monitoring.yaml`
  - [ ] 5.2: Define custom metrics namespace AWS/NDXScreenshot
  - [ ] 5.3: Implement metric publishing function
  - [ ] 5.4: Create success rate <90% alarm
  - [ ] 5.5: Create drift >20% alarm
  - [ ] 5.6: Configure SNS notification actions

- [ ] Task 6: Create GitHub Actions workflow (AC: 4.5)
  - [ ] 6.1: Create `.github/workflows/visual-regression.yml`
  - [ ] 6.2: Trigger after screenshot-capture workflow
  - [ ] 6.3: Download new screenshots and baselines from S3
  - [ ] 6.4: Run visual regression comparison
  - [ ] 6.5: Create PR on baseline changes requiring review
  - [ ] 6.6: Post diff report as PR comment

- [ ] Task 7: Create baseline update workflow (AC: 4.5)
  - [ ] 7.1: Create `.github/workflows/baseline-update.yml`
  - [ ] 7.2: Trigger on PR approval of baseline changes
  - [ ] 7.3: Upload approved screenshots to `baselines/` prefix
  - [ ] 7.4: Update baseline manifest with version tags

- [ ] Task 8: Write unit tests
  - [ ] 8.1: Create `tests/unit/visual-regression.test.ts`
  - [ ] 8.2: Test pixelmatch comparison with known images
  - [ ] 8.3: Test threshold classification (pass/review/fail)
  - [ ] 8.4: Create `tests/unit/diff-report.test.ts`
  - [ ] 8.5: Test diff image generation
  - [ ] 8.6: Test HTML report structure

- [ ] Task 9: Write integration tests
  - [ ] 9.1: Create `tests/integration/visual-regression.test.ts`
  - [ ] 9.2: Test S3 baseline fetch and upload
  - [ ] 9.3: Test CloudWatch metric publishing
  - [ ] 9.4: Test end-to-end comparison workflow

## Dev Notes

### Technical Requirements

**FRs Covered:**
- FR112: Visual regression detection with pixelmatch
- FR113: Stack-aware screenshot capture with dynamic resource discovery

**NFRs Addressed:**
- NFR53: S3 retention policy (10 versions, 90-day Glacier)
- NFR54: CloudWatch metrics and alerting
- NFR55: Tests are single source of truth for screenshots
- NFR56: Automatic screenshot refresh on passing tests

### RegressionResult Interface (from tech-spec)

```typescript
interface RegressionResult {
  screenshot_path: string;
  baseline_path: string;
  diff_percentage: number;
  status: 'pass' | 'review' | 'fail';
  diff_image_path?: string;
}
```

### Visual Regression Thresholds

| Diff Percentage | Status | Action |
|-----------------|--------|--------|
| <10% | pass | Auto-accept; minor rendering differences |
| 10-15% | review | Create PR for manual approval |
| >15% | fail | Block; investigation required |

### CloudWatch Metrics Schema

```typescript
interface ScreenshotMetrics {
  namespace: 'AWS/NDXScreenshot';
  metrics: {
    screenshot_success_count: number;
    screenshot_failure_count: number;
    screenshot_drift_detected: number; // 0 or 1
  };
  dimensions: {
    scenario: string;
    region: string;
    threshold?: 'pass' | 'review' | 'fail';
  };
}
```

### CloudWatch Alarms

| Alarm | Condition | Notification |
|-------|-----------|--------------|
| ScreenshotSuccessRateLow | success_rate < 90% for 1 evaluation | Warning SNS |
| ScreenshotDriftHigh | drift_detected > 0.2 average | Investigation SNS |

### Dependencies

- S0.3 infrastructure (S3 bucket, SNS topic)
- pixelmatch - Pixel-level image comparison
- pngjs - PNG parsing for pixelmatch
- @aws-sdk/client-cloudwatch - CloudWatch metrics publishing
- @aws-sdk/client-s3 - Baseline storage and retrieval

### S3 Bucket Prefixes

```
ndx-screenshots-{account-id}/
├── current/           # Latest screenshots (from S0.3)
│   └── {scenario}/
├── baselines/         # Approved baseline images
│   └── {scenario}/
├── diffs/             # Generated diff images
│   └── {batch-id}/
└── manifests/         # Screenshot manifests
```

### GitHub PR Workflow

1. Visual regression workflow detects >10% diff
2. Creates branch `baseline-update/{timestamp}`
3. Creates PR with:
   - Title: "Update screenshot baselines - {scenario}"
   - Body: Diff report summary + images
   - Labels: `baseline-update`, `needs-review`
4. Manual approval merges PR
5. Baseline update workflow triggers
6. New baselines uploaded to S3

### Security Considerations

1. **S3 Access:** Visual regression workflow needs read/write to baselines/
2. **CloudWatch:** Requires `cloudwatch:PutMetricData` permission
3. **GitHub Token:** GITHUB_TOKEN for PR creation (automatically available)

### Learnings from Previous Stories

**From Story S0.3 (Status: done)**
- Use separate IAM credentials for upload operations (not federation credentials)
- Generate manifest from actual test results, not empty arrays
- Circuit breaker should throw errors, not skip tests
- All 6 scenario spec files follow consistent pattern

### References

- [Source: docs/sprint-artifacts/tech-spec-sprint-0.md#S0.4]
- [Source: docs/sprint-artifacts/tech-spec-sprint-0.md#Visual-Regression-Workflow]
- [Source: docs/epics.md#Story-S0.4]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/s0-4-visual-regression-detection.context.xml`

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101) - Main orchestration
- Claude Sonnet (via Task typescript-expert) - Initial implementation
- Claude Haiku (via Task code-review-expert) - Code review

### Debug Log References

- None

### Completion Notes List

1. **Initial Implementation**: 109 tests passing, all core files created
   - Visual regression library with pixelmatch integration
   - Diff report generator with HTML and PR body formatting
   - CloudWatch monitoring CloudFormation template
   - GitHub Actions workflows for regression and baseline updates

2. **Code Review Round 1**: APPROVED WITH FIXES - 3 HIGH issues identified
   - HIGH: GitHub Actions deprecated `::set-output` syntax
   - HIGH: CloudFormation alarm mixed metric definition
   - HIGH: Missing integration tests

3. **Fixes Applied**:
   - Updated run-visual-regression.mjs to use GITHUB_OUTPUT file approach
   - Fixed CloudFormation alarm to use Metrics array only (no duplicate MetricName)
   - Created integration test suite with 11 tests
   - Exported `classifyDiff` function for testability

4. **Final Result**: 120 tests passing, all 10 acceptance criteria met

### File List

**NEW Files (12):**
- `src/lib/visual-regression.ts` - Visual regression comparison library (365 lines)
- `src/lib/diff-report.ts` - Diff report and HTML generation (265 lines)
- `scripts/run-visual-regression.mjs` - CLI script for comparison (190 lines)
- `scripts/update-baselines.mjs` - Baseline management utility (129 lines)
- `tests/unit/visual-regression.test.ts` - Unit tests (365 lines)
- `tests/unit/diff-report.test.ts` - Unit tests (329 lines)
- `tests/integration/visual-regression.test.ts` - Integration tests (248 lines)
- `.github/workflows/visual-regression.yml` - Regression workflow (176 lines)
- `.github/workflows/baseline-update.yml` - Baseline update workflow (84 lines)
- `cloudformation/screenshot-automation/monitoring.yaml` - CloudWatch resources (193 lines)

**MODIFIED Files (3):**
- `cloudformation/screenshot-automation/s3-bucket.yaml` - Extended bucket policy for baselines/diffs prefixes
- `package.json` - Added pixelmatch, pngjs, @aws-sdk/client-cloudwatch
- `vitest.config.ts` - Added integration tests path

---

## Senior Developer Review (AI)

### Review Outcome: APPROVED

**Review Date:** 2025-11-29 (Round 2)

**Overall Score:** 9.0/10

**All Acceptance Criteria Validated:**
- AC4.1-AC4.10: ALL PASS

**Key Strengths:**
- Comprehensive pixelmatch integration with threshold classification
- Clean separation of comparison, reporting, and orchestration
- Robust GitHub Actions workflows with proper credential handling
- CloudWatch monitoring with metric math for success rate calculation

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | BMAD SM Workflow | Story drafted from tech-spec-sprint-0.md |
| 2025-11-29 | Dev Agent (typescript-expert) | Initial implementation - 109 tests passing |
| 2025-11-29 | Code Review Agent (Haiku) | Identified 3 HIGH issues |
| 2025-11-29 | Main Agent (Opus 4.5) | Fixed all issues - 120 tests passing |
| 2025-11-29 | Code Review Agent | Round 2: APPROVED |
