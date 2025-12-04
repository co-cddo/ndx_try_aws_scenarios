# AWS Console Federation Library

## Overview

This library enables Playwright tests to authenticate with the AWS Console using federated credentials from AWS STS (Security Token Service). It provides a secure, temporary session management system for automated testing of AWS Console interfaces.

## Features

- ✅ **Secure federation** - Uses STS GetFederationToken with scoped IAM policies
- ✅ **Automatic cleanup** - Credentials cleared from memory on session close
- ✅ **Retry logic** - Exponential backoff for rate limit errors
- ✅ **Error codes** - Never logs credentials, only error codes
- ✅ **TypeScript** - Full type safety with exported interfaces
- ✅ **Helper utilities** - Build console URLs and fetch stack outputs

## Installation

Dependencies are already included in the project:

```bash
npm install
```

Required packages:
- `@aws-sdk/client-sts` - AWS STS client for federation
- `@aws-sdk/client-cloudformation` - CloudFormation helper functions
- `@playwright/test` - Browser automation
- `axios` - HTTP client for federation endpoint

## Quick Start

### Basic Usage

```typescript
import {
  openAwsConsoleInPlaywright,
  closeConsoleSession,
} from '../src/lib/aws-federation.js';

// Open AWS Console with federated credentials
const session = await openAwsConsoleInPlaywright({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

// Use the authenticated page
await session.page.goto(
  'https://us-west-2.console.aws.amazon.com/lambda'
);

// Take actions in the console
const accountMenu = await session.page.$(
  '[data-testid="awsc-nav-account-menu-button"]'
);

// Clean up when done
await closeConsoleSession(session);
```

### Custom Destination

```typescript
const session = await openAwsConsoleInPlaywright(
  {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  'https://us-west-2.console.aws.amazon.com/cloudformation'
);
```

### Inline Policy Restriction

```typescript
const policy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:GetObject', 's3:ListBucket'],
      Resource: '*',
    },
  ],
});

const session = await openAwsConsoleInPlaywright({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  policy, // Further restrict session permissions
  durationSeconds: 7200, // 2 hours
});
```

## Helper Functions

### buildConsoleUrl

Build AWS Console URLs from ARNs:

```typescript
import { buildConsoleUrl } from '../src/lib/aws-federation.js';

// Lambda function
const lambdaUrl = buildConsoleUrl(
  'arn:aws:lambda:us-west-2:123456789012:function:my-function',
  'lambda'
);
// https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/my-function

// S3 bucket
const s3Url = buildConsoleUrl('arn:aws:s3:::my-bucket', 's3');
// https://us-west-2.console.aws.amazon.com/s3/buckets/my-bucket

// CloudFormation stack
const cfnUrl = buildConsoleUrl(
  'arn:aws:cloudformation:us-west-2:123456789012:stack/my-stack/abc',
  'cloudformation'
);
// https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/stackinfo?stackId=...

// DynamoDB table
const ddbUrl = buildConsoleUrl(
  'arn:aws:dynamodb:us-west-2:123456789012:table/my-table',
  'dynamodb'
);
// https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=my-table

// CloudWatch
const cwUrl = buildConsoleUrl(
  'arn:aws:cloudwatch:us-west-2:123456789012:alarm:my-alarm',
  'cloudwatch'
);
// https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2
```

### getStackOutputs

Fetch CloudFormation stack outputs as a key-value map:

```typescript
import { getStackOutputs } from '../src/lib/aws-federation.js';

const outputs = await getStackOutputs('my-stack', 'us-west-2');
const bucketName = outputs['BucketName'];
const functionArn = outputs['FunctionArn'];
```

## Configuration

### FederationConfig

```typescript
interface FederationConfig {
  accessKeyId: string;         // AWS Access Key ID (federation service account)
  secretAccessKey: string;     // AWS Secret Access Key
  durationSeconds?: number;    // Session duration (default: 3600, max: 129600)
  policy?: string;             // Optional inline IAM policy (JSON string)
  region?: string;             // AWS region (default: us-west-2)
}
```

### FederationResponse

```typescript
interface FederationResponse {
  browser: Browser;            // Playwright browser instance
  page: Page;                  // Authenticated AWS Console page
  credentials: FederatedCredentials; // Temporary credentials
}
```

### FederatedCredentials

```typescript
interface FederatedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}
```

## Security Features

### 1. No Credential Logging

Errors only contain error codes, never credentials:

```typescript
// ✅ Good - Error code only
throw new Error('FEDERATION_FAILED: Operation failed after 3 attempts');

// ❌ Bad - Would expose credentials
throw new Error(`Failed with key: ${accessKeyId}`);
```

### 2. Automatic Credential Cleanup

Credentials are cleared from memory on session close:

```typescript
await closeConsoleSession(session);
// session.credentials are now undefined
```

### 3. No Credential Persistence

Credentials are only stored in memory during the active session. No caching or disk writes.

### 4. Session Token Expiration

Temporary credentials expire automatically (default: 1 hour):

```typescript
const session = await openAwsConsoleInPlaywright({
  accessKeyId: '...',
  secretAccessKey: '...',
  durationSeconds: 3600, // 1 hour
});

console.log(session.credentials.expiration); // Date object
```

## Error Codes

The library uses error codes instead of logging sensitive information:

| Error Code | Description |
|------------|-------------|
| `FEDERATION_FAILED` | STS GetFederationToken API call failed |
| `SIGNIN_TOKEN_FAILED` | Failed to exchange credentials for signin token |
| `CONSOLE_OPEN_FAILED` | Browser launch or navigation failed |
| `AUTH_TIMEOUT` | Authentication wait timed out (30s) |
| `CLEANUP_FAILED` | Session cleanup encountered an error |

## Retry Logic

The library implements exponential backoff for rate limit errors:

- **Max retries**: 3
- **Delays**: 1s, 2s, 4s
- **Total retry time**: Max 10 seconds
- **Retryable errors**: 429, ThrottlingException, TooManyRequestsException

## Testing

### Unit Tests

```bash
npm run test:unit
```

Unit tests validate:
- Interface exports
- URL construction logic
- Retry logic structure
- Error handling
- Credential cleanup

### Integration Tests

```bash
npm run test:playwright
```

E2E tests require AWS credentials:

```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
npm run test:playwright tests/e2e/federation-flow.spec.ts
```

Integration tests validate:
- Actual AWS authentication
- Console navigation
- Session cleanup
- Error scenarios

## Troubleshooting

### Authentication Timeout

If authentication times out after 30 seconds:

1. Check AWS credentials are valid
2. Verify network connectivity to AWS
3. Check IAM permissions (requires `sts:GetFederationToken`)

### Rate Limiting

If you see `FEDERATION_FAILED` or `SIGNIN_TOKEN_FAILED`:

1. Library automatically retries with exponential backoff
2. If retries exhausted, wait before next attempt
3. Consider increasing delay between test runs

### Browser Not Closing

Ensure `closeConsoleSession` is called in test cleanup:

```typescript
test.afterEach(async () => {
  if (session) {
    await closeConsoleSession(session);
    session = null;
  }
});
```

## Architecture

### Federation Flow

```
1. Call STS GetFederationToken
   └─> Returns temporary credentials (AccessKeyId, SecretAccessKey, SessionToken)

2. Exchange credentials for signin token
   └─> POST to https://signin.aws.amazon.com/federation?Action=getSigninToken

3. Build login URL
   └─> https://signin.aws.amazon.com/federation?Action=login&SigninToken=...

4. Launch browser and navigate
   └─> Chromium navigates to login URL

5. Wait for authentication
   └─> Detect account menu button

6. Return session
   └─> Browser, Page, Credentials
```

### Security Design

1. **Least Privilege**: Base policy allows only read-only console access
2. **Further Restriction**: Optional inline policy can restrict session further
3. **Short Duration**: Default 1-hour sessions (max 36 hours)
4. **Auto Cleanup**: Credentials cleared from memory on close
5. **Error Codes Only**: Never log credentials in errors or console

## License

MIT License - See project LICENSE file

## Contributing

See project CONTRIBUTING.md for guidelines

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review error codes and troubleshooting section
3. Open new issue with error code (never paste credentials)
