# Screenshot Automation Setup Guide

This document describes the environment setup required for capturing AWS console screenshots using Playwright.

## Prerequisites

1. **Node.js** - v18 or later
2. **AWS SSO Credentials** - Innovation Sandbox access
3. **Playwright** - installed via npm

## AWS Credentials Setup

The screenshot automation uses AWS SSO credentials. The credentials must be set as environment variables:

```bash
# Required environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # Required for SSO credentials
```

### Getting SSO Credentials

1. Login to AWS SSO portal
2. Select the Innovation Sandbox account (449788867583)
3. Click "Command line or programmatic access"
4. Copy the environment variables for your shell

### Verifying Credentials

```bash
aws sts get-caller-identity
```

Expected output should show the Innovation Sandbox account:
```json
{
  "UserId": "AROAWROMBOP74B2UUCBS6:user@example.com",
  "Account": "449788867583",
  "Arn": "arn:aws:sts::449788867583:assumed-role/AWSReservedSSO_ndx_IsbUsersPS_.../user@example.com"
}
```

## Playwright Setup

### Installation

```bash
# Install project dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Verify Installation

```bash
npx playwright --version
```

## CloudFormation Stacks

The following stacks must be deployed in us-west-2 before capturing screenshots:

| Stack Name | Service |
|------------|---------|
| ndx-try-council-chatbot | Council Chatbot |
| ndx-try-planning-ai | Planning AI |
| ndx-try-foi-redaction | FOI Redaction |
| ndx-try-smart-car-park | Smart Car Park |
| ndx-try-text-to-speech | Text to Speech |
| ndx-try-quicksight-dashboard | QuickSight Dashboard |

### Verify Stack Deployment

```bash
aws cloudformation describe-stacks --region us-west-2 \
  --query "Stacks[?starts_with(StackName, 'ndx-try')].{Name:StackName,Status:StackStatus}" \
  --output table
```

## Running Screenshot Tests

### Basic Test

```bash
# Run the SSO federation test
npx playwright test tests/e2e/sso-federation-test.spec.ts --project=desktop
```

### All Console Screenshot Tests

```bash
# Capture all scenario screenshots
npx playwright test tests/e2e/console-screenshots/ --project=desktop
```

### Debug Mode (Visible Browser)

For debugging, use headed mode:

```bash
npx playwright test tests/e2e/sso-federation-test.spec.ts --project=desktop --headed
```

## Screenshot Output

Screenshots are saved to:
- Test artifacts: `playwright-screenshots/`
- Production assets: `src/assets/images/screenshots/{scenario}/`

## Troubleshooting

### Timeout Errors

AWS Console federation can be slow (30-90 seconds). Ensure test timeouts are set appropriately:

```typescript
test.setTimeout(120000); // 2 minutes
```

### Federation Failures

If federation fails, check:
1. Credentials are not expired (`aws sts get-caller-identity`)
2. Session token is included (`AWS_SESSION_TOKEN` set)
3. Network connectivity to AWS signin endpoint

### Browser Not Found

If Chromium is not found:
```bash
npx playwright install chromium
```

## SSO vs IAM User Credentials

**Important**: This setup uses AWS SSO credentials directly with the signin federation endpoint. The original Sprint 0 design used `GetFederationToken` which requires IAM user long-term credentials.

The SSO-compatible approach:
1. Takes existing session credentials (from SSO/AssumeRole)
2. Sends them to `signin.aws.amazon.com/federation?Action=getSigninToken`
3. Uses the signin token to construct a login URL
4. Playwright navigates to the login URL which authenticates the session

This approach works with any type of AWS credentials that include a session token.

## Local Development Server

For validating screenshots work correctly in the portal, run the local dev server:

```bash
npm start
```

This is representative of the GitHub Pages deployment environment.

## Related Documentation

- [Sprint 0 Tech Spec](../sprint-artifacts/tech-spec-sprint-0.md)
- [Epic 17 Tech Spec](../sprint-artifacts/tech-spec-epic-17.md)
- [Architecture - Screenshot Pipeline](../architecture.md#17-screenshot-automation-pipeline)
