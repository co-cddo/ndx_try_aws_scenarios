# ISB Blueprint Registration: BOPS Planning System

Register the NDX:Try BOPS Planning scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- Ordnance Survey Vector Tiles API key (free tier from OS Data Hub)
- BOPS and BOPS-Applicants Docker images published to ghcr.io

## Step 1 — Upload Template to S3

Upload the CloudFormation template to an S3 bucket accessible from the hub account:

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/bops-planning/template.yaml
```

**Note:** Template is ~104KB (JSON) — must use S3 URL, not inline template body.

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles:

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-bops-planning \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/bops-planning/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=OSVectorTilesApiKey,ParameterValue={YOUR_OS_API_KEY} \
  --description "NDX:Try BOPS Planning System - Digital planning for UK councils"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template uses explicit IAM role names matching ISB SCP patterns
- `--managed-execution Active=true` is recommended for concurrent lease handling
- `OSVectorTilesApiKey` parameter is required — maps will not render without it

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-bops-planning` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-bops-planning` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1`
   - Set timeout: **40 minutes** recommended (Aurora ~10 min, Redis ~8 min, CloudFront ~10 min, seed task ~10 min — partially parallel)
5. Configure parameter overrides:
   - `OSVectorTilesApiKey`: Set to the OS Vector Tiles API key
6. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-bops-planning`
4. Save the lease template

## Verification

1. Create a test lease using the template
2. Wait for StackSet instance creation (~25-35 minutes)
3. Verify:
   - Stack status is `CREATE_COMPLETE`
   - BOPS login page loads at `BOPSLoginUrl` output
   - Login with `BOPSUsername` / retrieve password from `BOPSPassword` Secrets Manager link
   - Dashboard shows 80 planning applications
   - OS Maps tiles render on application detail pages
   - Applicants portal loads at `ApplicantsPortalUrl` output
4. Test stack deletion — should complete cleanly within 15 minutes

## Troubleshooting

### Seed task fails
Check CloudWatch logs at `/ndx-bops/production` → `bops-seed` stream prefix. Common issues:
- Database not ready: seed task retries automatically, but check Aurora cluster status
- Ruby/Rails errors: check the seed script output for AASM transition failures

### ECS services failing health checks
- BOPS web: `/healthcheck` on port 3000 — check container logs for Rails boot errors
- BOPS-Applicants: `/healthcheck` on port 80 — check API connectivity to BOPS
- Allow 10 minutes for initial startup (health check grace period)

### Maps not rendering
- Verify `OSVectorTilesApiKey` parameter was provided correctly
- Check browser console for 401 errors from OS Maps API

### ISB SCP errors
All IAM roles must start with `InnovationSandbox-ndx-`. The CDK Aspect handles this automatically, but if you see "AccessDenied" errors, check the role name in the error message.
