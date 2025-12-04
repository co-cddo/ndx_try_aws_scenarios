# Story S0.2: Playwright Integration Library

Status: done

## Story

As a **test engineer** writing screenshot automation,
I want **a reusable library that handles AWS Console authentication via federation**,
So that **I can write Playwright tests that navigate authenticated console pages**.

## Acceptance Criteria

| AC ID | Criterion | Source |
|-------|-----------|--------|
| AC2.1 | `openAwsConsoleInPlaywright(config, destination)` function exported from `src/lib/aws-federation.ts` | [tech-spec-sprint-0.md#AC2.1] |
| AC2.2 | Function calls STS GetFederationToken with scoped policy | [tech-spec-sprint-0.md#AC2.2] |
| AC2.3 | Function exchanges credentials for SigninToken via `https://signin.aws.amazon.com/federation` | [tech-spec-sprint-0.md#AC2.3] |
| AC2.4 | Function constructs Login URL with SigninToken and destination | [tech-spec-sprint-0.md#AC2.4] |
| AC2.5 | Function opens Chromium browser and navigates to Login URL | [tech-spec-sprint-0.md#AC2.5] |
| AC2.6 | Function waits for authenticated state (logout button visible or timeout) | [tech-spec-sprint-0.md#AC2.6] |
| AC2.7 | Handles rate limits with exponential backoff (3 retries, max 10 seconds total) | [tech-spec-sprint-0.md#AC2.7] |
| AC2.8 | `closeConsoleSession()` cleans up browser context and clears credentials from memory | [tech-spec-sprint-0.md#AC2.8] |
| AC2.9 | TypeScript interfaces exported: `FederatedCredentials`, `FederationConfig`, `FederationResponse` | [tech-spec-sprint-0.md#AC2.9] |

## Tasks / Subtasks

- [x] Task 1: Create TypeScript library structure (AC: 2.1, 2.9)
  - [x] 1.1: Create `src/lib/aws-federation.ts` file
  - [x] 1.2: Define and export `FederatedCredentials` interface
  - [x] 1.3: Define and export `FederationConfig` interface
  - [x] 1.4: Define and export `FederationResponse` interface
  - [x] 1.5: Export main functions: `openAwsConsoleInPlaywright`, `closeConsoleSession`
  - [x] 1.6: Export helper functions: `buildConsoleUrl`, `getStackOutputs`

- [x] Task 2: Implement STS federation token acquisition (AC: 2.2)
  - [x] 2.1: Create internal `getFederationToken(config)` function
  - [x] 2.2: Use @aws-sdk/client-sts to call GetFederationToken
  - [x] 2.3: Apply scoped inline policy to restrict federated session
  - [x] 2.4: Set DurationSeconds to 3600 (1 hour)
  - [x] 2.5: Return FederatedCredentials object with expiration

- [x] Task 3: Implement SigninToken exchange (AC: 2.3, 2.4)
  - [x] 3.1: Create internal `getSigninToken(credentials)` function
  - [x] 3.2: POST to `https://signin.aws.amazon.com/federation?Action=getSigninToken`
  - [x] 3.3: Include SessionDuration and Session JSON in request
  - [x] 3.4: Parse and return SigninToken from response
  - [x] 3.5: Create internal `buildFederationLoginUrl(signinToken, destination)` function
  - [x] 3.6: Construct URL with SigninToken and destination parameters

- [x] Task 4: Implement Playwright browser session (AC: 2.5, 2.6)
  - [x] 4.1: Launch Chromium browser with appropriate options
  - [x] 4.2: Navigate to constructed Login URL
  - [x] 4.3: Wait for authenticated state (check for logout button or account menu)
  - [x] 4.4: Handle authentication timeout (30 second max)
  - [x] 4.5: Return browser and page objects to caller

- [x] Task 5: Implement retry logic and error handling (AC: 2.7)
  - [x] 5.1: Create `withRetry(fn, maxRetries, baseDelayMs)` helper
  - [x] 5.2: Implement exponential backoff (1s, 2s, 4s)
  - [x] 5.3: Handle rate limit errors (429, ThrottlingException)
  - [x] 5.4: Cap total retry time at 10 seconds
  - [x] 5.5: Use error codes (never log credentials)

- [x] Task 6: Implement session cleanup (AC: 2.8)
  - [x] 6.1: Implement `closeConsoleSession(response)` function
  - [x] 6.2: Close browser context and page
  - [x] 6.3: Clear credentials object from memory
  - [x] 6.4: Handle cleanup errors gracefully

- [x] Task 7: Write unit tests
  - [x] 7.1: Create `tests/unit/aws-federation.test.ts`
  - [x] 7.2: Test interface exports and types
  - [x] 7.3: Test URL construction logic
  - [x] 7.4: Test retry logic with mocked delays
  - [x] 7.5: Test error handling and error codes

- [x] Task 8: Write integration tests
  - [x] 8.1: Create `tests/e2e/federation-flow.spec.ts`
  - [x] 8.2: Test actual federation flow (requires AWS credentials)
  - [x] 8.3: Test authenticated console navigation
  - [x] 8.4: Test session cleanup

## Dev Notes

### Technical Requirements

**FRs Covered:**
- FR108: SigninToken generation via federation endpoint
- FR109: Console Login URL construction
- FR110: Playwright browser session management
- FR123: Playwright + AWS Federation integration

**NFRs Addressed:**
- NFR49: Server-side only - credentials never exposed in client code
- NFR50: 1-hour session max, no refresh capability

### API Design

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

### Interfaces

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

### Dependencies

- `@aws-sdk/client-sts` - STS GetFederationToken (already added in S0.1)
- `@aws-sdk/client-cloudformation` - Stack outputs (to be added)
- `axios` - HTTP client for SigninToken exchange (to be added)
- `@playwright/test` - Browser automation (already present)

### Security Considerations

1. **No credential logging:** Error messages use codes only
2. **Memory cleanup:** Credentials cleared after session close
3. **No credential caching:** Fresh token per session
4. **Session tokens not persisted:** Only in memory during session

### Learnings from Previous Story

**From Story S0.1 (Status: done)**

- **IAM Policy Available**: `cloudformation/screenshot-automation/iam.yaml` defines read-only federation policy
- **Tests Pattern Established**: Use Vitest for unit tests, follow structure from `tests/unit/iam-federation-policy.test.ts`
- **Dependencies Ready**: `@aws-sdk/client-sts` already added to package.json
- **NoEcho Security**: Output security patterns established - apply same rigor to credential handling

[Source: docs/sprint-artifacts/s0-1-aws-federation-service-account-setup.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-sprint-0.md#APIs-and-Interfaces]
- [Source: docs/sprint-artifacts/tech-spec-sprint-0.md#Data-Models-and-Contracts]
- [Source: docs/epics.md#Story-S0.2]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/s0-2-playwright-integration-library.context.xml`

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101) - Main orchestration
- Claude Sonnet (via Task typescript-expert) - Implementation
- Claude Sonnet (via Task code-review-expert) - Code review

### Debug Log References

- None - implementation completed without errors

### Completion Notes List

1. **Main Library Created**: `src/lib/aws-federation.ts` (517 lines)
   - 4 exported functions: `openAwsConsoleInPlaywright`, `closeConsoleSession`, `buildConsoleUrl`, `getStackOutputs`
   - 3 exported interfaces: `FederatedCredentials`, `FederationConfig`, `FederationResponse`
   - Internal functions: `getFederatedCredentials`, `getSigninToken`, `buildFederationLoginUrl`, `waitForAuthentication`, `withRetry`

2. **Comprehensive Unit Tests**: `tests/unit/aws-federation.test.ts` (51 tests)
   - Tests for all 9 acceptance criteria
   - Security-specific tests for credential handling
   - URL construction tests for 5 AWS services

3. **E2E Integration Tests**: `tests/e2e/federation-flow.spec.ts` (13 tests)
   - Real AWS federation flow testing
   - Console navigation tests
   - Session cleanup validation

4. **Dependencies Added**: axios, @aws-sdk/client-cloudformation

5. **Code Review Fixes Applied**:
   - Replaced non-null assertions with runtime validation (security hardening)
   - Modified console.error in cleanup to suppress stack traces in production (credential protection)

### File List

**NEW Files:**
- `src/lib/aws-federation.ts` (517 lines)
- `tests/unit/aws-federation.test.ts` (658 lines)
- `tests/e2e/federation-flow.spec.ts` (264 lines)

**MODIFIED Files:**
- `package.json` (added axios, @aws-sdk/client-cloudformation)

## Senior Developer Review (AI)

### Review Outcome: APPROVED

**Review Date:** 2025-11-29

**Overall Score:** 9.2/10

**Critical Issues Fixed:**
1. Replaced non-null assertions with runtime validation (lines 176-184)
2. Modified console.error in cleanup to suppress in production (lines 379-388)

**Positive Findings:**
- Excellent security posture - no credential logging, proper cleanup
- Comprehensive test coverage (75 tests total, 51 for this story)
- Clean architecture with proper separation of concerns
- Professional TypeScript practices (no `any` types, proper interfaces)
- Robust retry logic with exponential backoff

**Acceptance Criteria Validation:** All 9 ACs passing

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | BMAD SM Workflow | Story drafted from tech-spec-sprint-0.md |
| 2025-11-29 | Dev Agent (typescript-expert) | Implementation completed - all 8 tasks done |
| 2025-11-29 | Code Review Agent | Review completed - 2 HIGH priority issues found |
| 2025-11-29 | Main Agent (Opus 4.5) | Critical issues fixed, story marked done |
