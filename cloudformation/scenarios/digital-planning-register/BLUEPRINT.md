# ISB Blueprint Registration: Digital Planning Register

Register the NDX:Try Digital Planning Register scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- Digital Planning Register Docker image published to ghcr.io

## Step 1 — Build and Publish Docker Image

Build the Docker image from the upstream repository and publish to GHCR:

```bash
git clone https://github.com/tpximpact/digital-planning-register.git
cd digital-planning-register
docker build -t ghcr.io/co-cddo/ndx_try_aws_scenarios-dpr:latest .
docker push ghcr.io/co-cddo/ndx_try_aws_scenarios-dpr:latest
```

## Step 2 — Synthesise and Upload Template to S3

Synthesise the CloudFormation template from CDK and upload:

```bash
cd cdk
npm ci
npx cdk synth --no-staging > ../template.yaml
cd ..
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/digital-planning-register/template.yaml
```

## Step 3 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles:

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-digital-planning-register \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/digital-planning-register/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --description "NDX:Try Digital Planning Register - Public planning application register for UK councils"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required because the template uses explicit IAM role names matching ISB SCP patterns
- `--managed-execution Active=true` is recommended for concurrent lease handling

## Step 4 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-digital-planning-register` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-digital-planning-register` StackSet
4. Configure deployment:
   - Select target regions: `us-east-1`
   - Set timeout: **15 minutes** recommended (VPC ~30s, ALB ~2min, ECS ~3min, CloudFront ~5min)
5. Review and submit

## Step 5 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-digital-planning-register`
4. Save the lease template

## Verification

1. Create a test lease using the template
2. Wait for StackSet instance creation (~8-12 minutes)
3. Verify:
   - Stack status is `CREATE_COMPLETE`
   - Register loads at `RegisterUrl` output
   - Council selection page is accessible
   - Planning application search works
4. Test stack deletion — should complete cleanly within 10 minutes

## Troubleshooting

### ECS service failing health checks
- Check CloudWatch logs at `/ndx-dpr/production` → `dpr-web` stream prefix
- The Next.js app should respond on port 3000
- Allow 5 minutes for initial startup (health check grace period)

### CloudFront returning 502/503
- CloudFront may take 5-10 minutes to propagate
- Check ALB target group health in the EC2 console
- Verify the Fargate task is running in ECS console

### ISB SCP errors
All IAM roles must start with `InnovationSandbox-ndx-`. The CDK Aspect handles this automatically, but if you see "AccessDenied" errors, check the role name in the error message.
