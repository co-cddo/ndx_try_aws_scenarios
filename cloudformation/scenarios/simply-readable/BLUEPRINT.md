# ISB Blueprint Registration: Simply Readable

Register the NDX:Try Simply Readable scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template and assets (referred to as `{BUCKET}` in region `{REGION}`)
- Amazon Bedrock models `anthropic.claude-3-haiku-20240307-v1:0` and `amazon.nova-canvas-v1:0` enabled in `us-east-1` in sandbox accounts (model agreements are auto-accepted at deploy time by the seed Lambda)
- All required services NOT blocked by SCP in sandbox accounts: Amazon Translate, Amazon Comprehend, AWS AppSync, AWS WAFv2, EventBridge Pipes

## Important: Directory Upload

Unlike simpler scenarios, Simply Readable requires **three sets of files** in the blueprints S3 bucket:

1. `template.yaml` — the CloudFormation template (570KB, references Lambda assets and website build via S3)
2. `assets/` — pre-built Lambda function zips (12 functions)
3. `website-build/` — pre-built React web application

These are uploaded by the `scripts/package-template.cjs` script during the build process.

## Step 1 — Build and Package

From the `cloudformation/scenarios/simply-readable/` directory:

```bash
# 1. Build the React website (clones upstream, patches, builds)
node scripts/build-website.cjs

# 2. Install CDK dependencies
cd cdk && npm install && cd ..
cd .upstream/infrastructure && npm install && cd ../..

# 3. Synthesize CDK template
cd cdk && npx cdk synth && cd ..

# 4. Package template (zips Lambda assets, uploads to S3, rewrites references)
node scripts/package-template.cjs
```

This uploads Lambda assets, website build, and the packaged template to S3.

## Step 2 — Upload Template to S3

If the packaging script didn't upload the template (or to re-upload):

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/simply-readable/template.yaml
```

## Step 3 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles:

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
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template creates IAM roles with explicit names matching ISB SCP patterns (`InnovationSandbox-ndx-*`)
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint name must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`

## Step 4 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-simply-readable` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-simply-readable` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1` (required for Amazon Bedrock model availability)
   - Set timeout: **35 minutes** recommended (CloudFront distribution creation is the bottleneck)
5. Review and submit

## Step 5 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-simply-readable`
4. Save the lease template

## Verification

1. Request a test lease using the lease template from Step 5
2. Wait for lease approval and blueprint deployment (allow up to 35 minutes)
3. Check the sandbox account for:
   - CloudFront distribution (website hosting)
   - Cognito User Pool and Identity Pool (authentication)
   - AppSync GraphQL API with WAF (API layer)
   - DynamoDB tables (job tracking, models, preferences)
   - Step Functions state machines (translation and readability workflows)
   - Lambda functions (12 functions for document processing)
   - S3 buckets (website, translation content, readable content, logs)
4. Access the web application via the CloudFront URL from the `AppUrl` stack output
5. Log in with the admin credentials from the `AdminUsername` and `AdminPassword` stack outputs
6. Upload a test document and verify:
   - Document translation works (translate to Welsh or Polish)
   - Simply Readable works (Easy Read conversion with AI-generated images)
7. Terminate the test lease and verify ISB cleans up all resources via AWS Nuke
