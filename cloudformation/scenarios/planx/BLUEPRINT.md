# ISB Blueprint Registration: PlanX Digital Planning

Register the NDX:Try PlanX scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- PlanX Docker images published to ghcr.io (or ECR in sandbox account)

## Step 1 — Upload Template to S3

Upload the CloudFormation template to an S3 bucket accessible from the hub account:

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/planx/template.yaml
```

**Note:** Template is ~85KB (JSON) — must use S3 URL, not inline template body.

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles:

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-planx \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/planx/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --description "NDX:Try PlanX Digital Planning Platform"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template uses explicit IAM role names matching ISB SCP patterns
- `--managed-execution Active=true` is recommended for concurrent lease handling

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-planx`
3. Select the `ndx-try-planx` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1`
   - Set timeout: **35 minutes** recommended (Aurora ~10 min, CloudFront ~10 min, Hasura migrations ~5 min, ECS services ~5 min — partially parallel)
5. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-planx`
4. Save the lease template

## Verification

1. Create a test lease using the template
2. Wait for StackSet instance creation (~20-30 minutes)
3. Verify:
   - Stack status is `CREATE_COMPLETE`
   - PlanX editor loads at `PlanXUrl` output
   - Demo login works at `PlanXLoginUrl` with `DemoUsername` / `DemoPassword`
   - NDX Demo Council team visible with sample flows
   - Hasura console accessible at `HasuraConsoleUrl` with `HasuraAdminSecretOutput`
4. Test stack deletion — should complete cleanly within 15 minutes

## Troubleshooting

### Hasura migrations fail
Check CloudWatch logs at `/ndx-planx/production` → `hasura` stream. Common issues:
- Database not ready: Hasura retries automatically but check Aurora cluster status
- Migration SQL errors: Check specific migration timestamp in error logs

### ECS services failing health checks
- Hasura: `/hasura/healthz` via Caddy proxy on port 8081
- API: `GET /` on port 7002
- ShareDB: returns 426 (WebSocket upgrade) — this is expected
- Editor: `GET /` on port 80
- Allow 15 minutes for initial startup (health check grace period)

### ISB SCP errors
All IAM roles must start with `InnovationSandbox-ndx-`. The CDK Aspect handles this automatically, but if you see "AccessDenied" errors, check the role name in the error message.
