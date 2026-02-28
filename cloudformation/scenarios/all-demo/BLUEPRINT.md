# ISB Blueprint Registration: All Demo

Register the NDX:Try All Demo scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys all 7 scenarios into sandbox accounts when leases are approved.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting templates (referred to as `{BUCKET}` in region `{REGION}`)
- All 7 child scenario templates uploaded to the same S3 bucket under `scenarios/{scenario-name}/template.yaml`
- Amazon Bedrock model `amazon.nova-pro-v1:0` enabled in `us-east-1` in sandbox accounts
- Amazon QuickSight available in the target region

## Important Notes

- **Mutual exclusivity**: The all-demo blueprint and individual scenario blueprints cannot coexist in the same sandbox account because resource names (IAM roles, S3 buckets) are hardcoded with scenario-specific prefixes.
- **Cross-account S3 access**: CloudFormation in the sandbox account must be able to fetch nested stack templates from the S3 bucket. Ensure the bucket policy grants `s3:GetObject` to sandbox accounts, or upload templates to a sandbox-accessible bucket.
- **Nested stacks deploy in parallel** (no inter-dependencies declared), so wall-clock time is dominated by the slowest child (~40 min for localgov-drupal).

## Step 1 — Upload All Templates to S3

Upload the parent template and all 7 child scenario templates:

```bash
# Upload all-demo parent template
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/all-demo/template.yaml

# Upload child scenario templates (if not already present)
for scenario in council-chatbot foi-redaction planning-ai quicksight-dashboard smart-car-park text-to-speech localgov-drupal; do
  aws s3 cp ../scenarios/${scenario}/template.yaml \
    s3://{BUCKET}/scenarios/${scenario}/template.yaml
done
```

## Step 2 — Create StackSet

Create a self-managed CloudFormation StackSet using ISB's roles. The StackSet must be created in the same region as your ISB deployment (e.g. `us-west-2`):

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-all-demo \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/all-demo/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --description "NDX:Try All Demo - Deploys all 7 scenarios as nested stacks"
```

Notes:
- `CAPABILITY_NAMED_IAM` is required because child templates use explicit IAM role names
- `CAPABILITY_AUTO_EXPAND` is required because child templates use the SAM transform (`AWS::Serverless-2016-10-31`)
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint name must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-all-demo` (must be 1-50 chars, start with letter, alphanumeric + hyphens only)
3. Select the `ndx-try-all-demo` StackSet
4. Configure deployment:
   - Select target regions (template is designed for `us-east-1` due to Bedrock model availability)
   - Set timeout: **90 minutes** recommended (localgov-drupal takes ~40 minutes)
5. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing lease template or create a new one
3. In the blueprint selection step, select `ndx-try-all-demo`
4. Save the lease template

## Verification

1. Request a test lease using the lease template from Step 4
2. Wait for lease approval and blueprint deployment (should complete within 90 minutes)
3. Check the sandbox account for 8 CloudFormation stacks (1 parent + 7 nested):
   - Parent stack: `ndx-try-all-demo`
   - Nested stacks for each scenario (council-chatbot, foi-redaction, planning-ai, quicksight-dashboard, smart-car-park, text-to-speech, localgov-drupal)
4. Verify all primary outputs are populated:
   - `ChatbotURL` — Council Chatbot web interface
   - `RedactionURL` — FOI Redaction API endpoint
   - `PlanningAnalyzerURL` — Planning AI analysis endpoint
   - `QuicksightDashboardUrl` — QuickSight Dashboard URL
   - `SmartCarParkAvailabilityAPI` — Smart Car Park availability API
   - `TextToSpeechConvertURL` — Text-to-Speech conversion endpoint
   - `DrupalUrl` — LocalGov Drupal web interface
5. Test each scenario's primary endpoint
6. Terminate the test lease and verify ISB cleans up all resources via AWS Nuke
