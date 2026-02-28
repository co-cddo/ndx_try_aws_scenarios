# ISB Blueprint Registration: LocalGov Drupal

Register the NDX:Try LocalGov Drupal scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- Amazon Bedrock models `amazon.nova-pro-v1:0` and `amazon.nova-canvas-v1:0` enabled in `us-east-1` in sandbox accounts

## Step 1 — Upload Template to S3

Upload the CloudFormation template to an S3 bucket accessible from the hub account:

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/localgov-drupal/template.yaml
```

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles. The StackSet must be created in the same region as your ISB deployment (e.g. `us-west-2`):

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-localgov-drupal \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/localgov-drupal/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --description "NDX:Try LocalGov Drupal - AI-enhanced CMS for UK councils"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template uses explicit IAM role names matching ISB SCP patterns
- `CAPABILITY_AUTO_EXPAND` is not required for this template (no transforms), but the ISB hub stack applies it uniformly to all scenarios
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint name must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-localgov-drupal` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-localgov-drupal` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1` (required for Amazon Bedrock model availability)
   - Set timeout: **45 minutes** recommended (Aurora provisioning + Fargate startup + Drupal installation + AI content generation)
5. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-localgov-drupal`
4. Save the lease template

## Verification

1. Request a test lease using the lease template from Step 4
2. Wait for lease approval and blueprint deployment (allow up to 45 minutes)
3. Check the sandbox account for:
   - CloudFront distribution
   - Aurora Serverless v2 cluster
   - Fargate service running in ECS
   - EFS file system
   - Secrets Manager secret for admin credentials
4. Access Drupal via the CloudFront URL from the stack outputs
5. Log in with the admin credentials from the `AdminUsername` and `AdminPassword` stack outputs
6. Verify the admin password differs from any previous deployment (each deployment generates a unique password via Secrets Manager)
7. Terminate the test lease and verify ISB cleans up all resources via AWS Nuke
