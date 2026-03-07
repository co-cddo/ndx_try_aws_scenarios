# ISB Blueprint Registration: Simply Readable

Register the NDX:Try Simply Readable scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- **Bedrock model access**: The following models must be enabled in sandbox accounts (us-east-1):
  - `anthropic.claude-3-haiku-20240307-v1:0` (text simplification for Easy Read)
  - `amazon.nova-canvas-v1:0` (image generation for Easy Read)
- **SCP permissions**: The following services must NOT be blocked by SCPs in sandbox accounts:
  - Amazon Translate (`translate:*`)
  - Amazon Bedrock (`bedrock:InvokeModel`)
  - Amazon Comprehend (`comprehend:DetectDominantLanguage`)
  - AWS AppSync (`appsync:*`)
  - AWS WAFv2 (`wafv2:*`)
  - Amazon EventBridge Pipes (`pipes:*`)

## Step 1 — Upload Assets to S3

This scenario requires Lambda zips and a pre-built React website in addition to the template. Upload all three:

```bash
# Upload Lambda function zips
aws s3 sync lambda/ \
  s3://{BUCKET}/scenarios/simply-readable/lambda/

# Upload pre-built React website
aws s3 sync website-build/ \
  s3://{BUCKET}/scenarios/simply-readable/website-build/

# Upload CloudFormation template
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/simply-readable/template.yaml
```

> **Note:** Unlike simpler scenarios that only upload `template.yaml`, this scenario's template references Lambda code and website assets from `s3://{BUCKET}/scenarios/simply-readable/lambda/` and `s3://{BUCKET}/scenarios/simply-readable/website-build/`. All three uploads must complete before deployment.

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles. The StackSet must be created in the same region as your ISB deployment (e.g. `us-west-2`):

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-simply-readable \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/simply-readable/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --description "NDX:Try Simply Readable - Document Translation & Easy Read, built by Swindon Borough Council"
```

Notes:
- `CAPABILITY_NAMED_IAM` is required because the template uses explicit IAM role names (`InnovationSandbox-ndx-simply-readable-*`)
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint name must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-simply-readable` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-simply-readable` StackSet
4. Configure deployment:
   - Select target regions: **us-east-1** (required for Bedrock model availability)
   - Set timeout: **35 minutes** recommended (CloudFront distribution provisioning takes 15-25 minutes)
5. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-simply-readable`
4. Save the lease template

## Verification

1. Request a test lease using the lease template from Step 4
2. Wait for lease approval and blueprint deployment (should complete within 35 minutes)
3. Check the sandbox account for:
   - CloudFront distribution serving the React web app
   - Cognito User Pool with admin user
   - AppSync GraphQL API
   - S3 buckets for translation and readable content
   - Step Functions state machines for translation and readable workflows
   - DynamoDB tables for jobs, preferences, help, models, and print styles
   - WAFv2 WebACL attached to the AppSync API
4. Open the CloudFront URL from the `AppUrl` stack output and verify the login page loads
5. Retrieve the admin password from Secrets Manager (see `AdminPasswordSecret` output)
6. Log in with username `admin` and the retrieved password
7. Test Document Translation:
   - Upload a document and translate to Welsh or Polish
   - Verify the translation completes and output is downloadable
8. Test Simply Readable (Easy Read):
   - Upload a document and convert to Easy Read format
   - Verify simplified text and auto-generated images appear
9. Terminate the test lease and verify ISB cleans up all resources via AWS Nuke
