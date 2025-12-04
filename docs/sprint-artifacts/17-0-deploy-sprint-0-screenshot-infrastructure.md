# Story 17.0: Deploy Sprint 0 Screenshot Infrastructure

Status: done

## Story

As a **developer**,
I want **to deploy and verify the Sprint 0 screenshot automation infrastructure**,
so that **we can capture real AWS console screenshots for walkthrough pages**.

## Acceptance Criteria

1. **AC-17.0.1:** All 6 scenario CloudFormation stacks verified as CREATE_COMPLETE or UPDATE_COMPLETE in us-west-2
2. **AC-17.0.2:** AWS credentials configured and verified working for Playwright tests
3. **AC-17.0.3:** Playwright browsers installed and configured
4. **AC-17.0.4:** Federation flow test passes (`tests/e2e/federation-flow.spec.ts` or equivalent)
5. **AC-17.0.5:** Screenshot capture test captures at least one real AWS console screenshot
6. **AC-17.0.6:** Environment setup documented for future screenshot captures (local server representative of GitHub Pages deployment)

## Tasks / Subtasks

- [x] Task 1: Verify CloudFormation Stacks (AC: 1)
  - [x] Check ndx-try-council-chatbot stack status - UPDATE_COMPLETE
  - [x] Check ndx-try-planning-ai stack status - UPDATE_COMPLETE
  - [x] Check ndx-try-foi-redaction stack status - CREATE_COMPLETE
  - [x] Check ndx-try-smart-car-park stack status - CREATE_COMPLETE
  - [x] Check ndx-try-text-to-speech stack status - CREATE_COMPLETE
  - [x] Check ndx-try-quicksight-dashboard stack status - CREATE_COMPLETE
- [x] Task 2: Configure AWS Credentials (AC: 2)
  - [x] Verify AWS_ACCESS_KEY_ID environment variable
  - [x] Verify AWS_SECRET_ACCESS_KEY environment variable
  - [x] Verify AWS_SESSION_TOKEN environment variable (required for SSO credentials)
  - [x] Test credentials with aws sts get-caller-identity
- [x] Task 3: Install Playwright (AC: 3)
  - [x] Run npx playwright install chromium (v143.0.7499.4)
  - [x] Verify browser installation
- [x] Task 4: Test Federation Flow (AC: 4)
  - [x] Review existing federation test files
  - [x] Create SSO-compatible federation test (sso-federation-test.spec.ts)
  - [x] Run federation test and verify pass
- [x] Task 5: Capture Test Screenshot (AC: 5)
  - [x] Navigate to AWS console via federation
  - [x] Capture screenshot of CloudFormation stacks page
  - [x] Verify screenshot file created (299KB PNG 1920x1080)
- [x] Task 6: Document Environment Setup (AC: 6)
  - [x] Create screenshot automation setup documentation
  - [x] Document credential requirements
  - [x] Document Playwright configuration

## Dev Notes

- Sprint 0 infrastructure code exists but was never deployed/executed
- AWS Federation library exists at `src/lib/aws-federation.ts` (520 LOC)
- Playwright tests exist at `tests/e2e/console-screenshots/*.spec.ts`
- IAM CloudFormation ready at `cloudformation/screenshot-automation/iam.yaml`
- S3 bucket CloudFormation ready at `cloudformation/screenshot-automation/s3-bucket.yaml`
- GitHub Actions workflow ready at `.github/workflows/screenshot-capture.yml`

### Project Structure Notes

- Tests in `tests/e2e/` following existing structure
- Screenshots output to `playwright-screenshots/` during capture
- Final storage in `src/assets/images/screenshots/` (Story 17.2)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-17.md#Story-17.0]
- [Source: docs/architecture.md#Section-17-21-Screenshot-Automation]
- [Source: docs/sprint-artifacts/tech-spec-sprint-0.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Federation tests initially failed with `GetFederationToken` because SSO credentials don't support that API
- Created SSO-compatible test that uses signin token federation directly

### Completion Notes List

1. All 6 CloudFormation stacks verified deployed in us-west-2 (account 449788867583)
2. AWS SSO credentials work with signin federation endpoint (unlike GetFederationToken)
3. Playwright Chromium v143.0.7499.4 installed and working
4. Created new `sso-federation-test.spec.ts` for SSO credential compatibility
5. Screenshot capture successful - 299KB PNG at 1920x1080
6. Environment documentation created at `docs/ops/screenshot-automation-setup.md`

### File List

- `tests/e2e/sso-federation-test.spec.ts` - NEW: SSO-compatible federation test
- `docs/ops/screenshot-automation-setup.md` - NEW: Environment setup documentation
- `playwright-screenshots/sso-federation-test.png` - Test output: CloudFormation console screenshot
- `playwright-screenshots/debug-after-login.png` - Test output: Debug screenshot
