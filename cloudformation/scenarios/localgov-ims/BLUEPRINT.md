# ISB Blueprint Registration: LocalGov IMS

Register the NDX:Try LocalGov IMS scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- GOV.UK Pay sandbox API key (free from GOV.UK Pay)
- LocalGov IMS Docker image published and accessible

## Step 1 — Upload Template to S3

Upload the CloudFormation template to an S3 bucket accessible from the hub account:

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/localgov-ims/template.yaml
```

**Note:** Template uses Windows containers with SQL Server — ensure the template is the packaged version from `dist/` with ISB overlays applied.

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles:

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-localgov-ims \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/localgov-ims/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=GovUkPayApiKey,ParameterValue={YOUR_GOVUK_PAY_API_KEY} \
  --description "NDX:Try LocalGov IMS - Income Management System with GOV.UK Pay"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template uses explicit IAM role names matching ISB SCP patterns
- `--managed-execution Active=true` is recommended for concurrent lease handling
- `GovUkPayApiKey` parameter is required — payment processing will not work without it

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-localgov-ims` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-localgov-ims` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1`
   - Set timeout: **60 minutes** recommended (RDS SQL Server ~10 min, Windows container pull ~10-20 min, DB migrations ~2 min, seed data ~1 min)
5. Configure parameter overrides:
   - `GovUkPayApiKey`: Set to the GOV.UK Pay sandbox API key
6. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-localgov-ims`
4. Save the lease template

## Verification

1. Create a test lease using the template
2. Wait for StackSet instance creation (~35-55 minutes)
3. Verify:
   - Stack status is `CREATE_COMPLETE`
   - Admin portal loads at `AdminPortalUrl` output
   - Login with `AdminUsername` / `AdminPassword` outputs
   - Dashboard shows fund summaries with seed data
   - Payment portal loads at `PaymentPortalUrl` output
   - Test card payment completes through GOV.UK Pay sandbox
   - 200+ account holders visible in account search
4. Test stack deletion — should complete cleanly within 20 minutes

## Troubleshooting

### Windows container takes too long to start
Windows container images are large (~6GB). First deployment in an account may take 15-20 minutes for the image pull. Subsequent deployments use cached layers and are faster. Check ECS task status in the console.

### Database migrations fail
Check CloudWatch logs at the log group shown in the `CloudWatchLogsUrl` output. Common issues:
- RDS not ready: ECS task retries automatically, but check RDS instance status
- SQL Server connection timeout: verify security group allows ECS to reach RDS on port 1433

### GOV.UK Pay payments fail
- Verify `GovUkPayApiKey` parameter was provided correctly
- Ensure the API key is a sandbox (test) key, not a live key
- Check that the GOV.UK Pay service is configured for card payments

### ECS service failing health checks
- Admin portal: check IIS application pool startup in container logs
- Allow 10-15 minutes for Windows container cold start (health check grace period is set accordingly)
- Windows containers are slower to start than Linux containers — this is expected

### ISB SCP errors
All IAM roles must start with `InnovationSandbox-ndx-`. The CDK Aspect handles this automatically, but if you see "AccessDenied" errors, check the role name in the error message.
