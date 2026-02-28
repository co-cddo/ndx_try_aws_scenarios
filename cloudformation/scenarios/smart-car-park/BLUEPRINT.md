# ISB Blueprint Registration: Smart Car Park

Register the NDX:Try Smart Car Park scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)

## Step 1 — Upload Template to S3

Upload the CloudFormation template to an S3 bucket accessible from the hub account:

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/smart-car-park/template.yaml
```

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles. The StackSet must be created in the same region as your ISB deployment (e.g. `us-west-2`):

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-smart-car-park \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/smart-car-park/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --description "NDX:Try Smart Car Park - Real-time parking availability with DynamoDB"
```

Notes:
- `CAPABILITY_NAMED_IAM` is required because the template uses explicit IAM role names
- `CAPABILITY_AUTO_EXPAND` is required because the template uses the SAM transform (`AWS::Serverless-2016-10-31`)
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint name must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-smart-car-park` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-smart-car-park` StackSet
4. Configure deployment:
   - Select target regions (template works in any region with DynamoDB and Lambda)
   - Set timeout: **15 minutes** recommended for this template (deploys in 8-12 minutes)
5. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-smart-car-park`
4. Save the lease template

## Verification

1. Request a test lease using the lease template from Step 4
2. Wait for lease approval and blueprint deployment (should complete within 12 minutes)
3. Check the sandbox account for:
   - Lambda function `ndx-try-parking-simulator-{region}`
   - DynamoDB table `ndx-try-parking-data-{region}`
   - S3 bucket `ndx-try-parking-data-{account-id}-{region}`
   - IAM role `ndx-try-smart-parking-role-{region}`
4. Open the Lambda Function URL and verify the parking dashboard loads with simulated data
5. Terminate the test lease and verify ISB cleans up all resources via AWS Nuke
