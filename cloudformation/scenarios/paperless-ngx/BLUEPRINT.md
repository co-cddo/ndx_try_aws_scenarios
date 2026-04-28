# ISB Blueprint Registration: Paperless-ngx

Register the NDX:Try Paperless-ngx scenario as an Innovation Sandbox (ISB) blueprint so it auto-deploys into sandbox accounts when sessions are approved.

## What this scenario does

Paperless-ngx is an open-source (GPL-3.0) document archive with OCR and full-text search. This NDX:Try scenario lifts the upstream `docker-compose.yml` shape (Django + Postgres + Redis + Apache Tika + Gotenberg) onto AWS Fargate behind CloudFront, and adds extensive Bedrock AI features:

1. **AI auto-tagging** of every consumed document via Amazon Nova Pro
2. **AI title rewriting** ("scan_20260427_001.pdf" → "Council Tax Reminder Q3 2026")
3. **AI document type classification** (Letter / Invoice / Minutes / Planning Notice / Agenda / Report)
4. **AI correspondent extraction** (sender / issuing body)
5. **AI 2-sentence summary** stored on each document's notes
6. **Chat with the archive** — separate Lambda + Function URL, vanilla JS chat UI, backed by Amazon Bedrock Knowledge Base over Amazon S3 Vectors with Bedrock Guardrails for content/topic/PII filtering

The session boots with 6 parish-flavoured sample documents pre-seeded so demos start with realistic content.

## Prerequisites

- AWS Innovation Sandbox deployed in the hub account
- Hub account ID known (referred to as `{HUB_ACCOUNT_ID}` below)
- ISB namespace known (referred to as `{NAMESPACE}` below)
- An S3 bucket accessible from the hub account for hosting the template (referred to as `{BUCKET}` in region `{REGION}`)
- Amazon Bedrock model access enabled in the sandbox account region for `amazon.nova-pro-v1:0` and `amazon.titan-embed-text-v2:0` (both are in the default ISB allow-list, no opt-in required)
- No external image registry, API key, or licence is required — the upstream `ghcr.io/paperless-ngx/paperless-ngx` image is used directly

## Step 1 — Upload Template to S3

```bash
aws s3 cp template.yaml \
  s3://{BUCKET}/scenarios/paperless-ngx/template.yaml
```

The synthesised template is ~90 KB JSON — well under the 460,800-byte CloudFormation S3 limit.

## Step 2 — Create StackSet

```bash
aws cloudformation create-stack-set \
  --stack-set-name ndx-try-paperless-ngx \
  --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/paperless-ngx/template.yaml \
  --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
  --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
  --managed-execution Active=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --description "NDX:Try Paperless-ngx - Document archive with OCR and Bedrock AI"
```

Notes:
- `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` are required — the template uses explicit IAM role names matching the ISB SCP `InnovationSandbox-ndx-*` pattern
- No StackSet parameters are required

## Step 3 — Register in ISB

1. Navigate to ISB admin console > **Blueprints** > **Register New Blueprint**
2. Enter name: `ndx-try-paperless-ngx`
3. Select the `ndx-try-paperless-ngx` StackSet
4. Configure deployment:
   - Target region: `us-east-1`
   - Timeout: **35 minutes** recommended (Aurora Serverless v2 ~6 min, ElastiCache ~6 min, Knowledge Base + S3 Vectors ~3 min, Fargate task pull + first-boot migrations + sample-doc ingestion + first-pass OCR + Bedrock enrichment ~15 min, with parallelism)
5. No parameter overrides needed
6. Review and submit

## Step 4 — Associate with Lease Template

1. In ISB admin console, navigate to **Lease Templates**
2. Edit an existing template or create a new one
3. In the blueprint selection step, select `ndx-try-paperless-ngx`
4. Save the lease template

## Verification

1. Request a test session using the template
2. Wait for StackSet instance creation (~25–30 minutes — Bedrock KB ingestion adds a few minutes on top of Aurora provisioning)
3. Verify the stack outputs:
   - `PaperlessUrl` loads the Paperless dashboard via CloudFront over HTTPS
   - Sign in as `admin` with the `AdminPassword` value
   - Sample documents are visible in the document list, each with AI-rewritten titles, AI tags, AI document types and AI correspondents
   - Open any document — the notes panel shows the AI 2-sentence summary
   - Upload a fresh PDF, watch it OCR and get auto-classified within ~30 seconds
   - Open `ChatUrl` — ask a question grounded in the documents, confirm an answer is returned with citations
   - Ask a question that should trip the guardrail (medical advice, political opinion, or PII probe) — confirm the guardrail blocks or anonymises
4. Test stack deletion — should complete cleanly within 15 minutes (EFS, Aurora, ElastiCache, Knowledge Base, S3 Vectors index and Lambda all delete in parallel)

## Cost guideline

Per 90-minute session: **~$0.50**, broken down approximately as:
- Aurora Serverless v2 (0.5 ACU min): ~$0.06/hr
- ElastiCache cache.t3.micro: ~$0.017/hr
- Fargate (2 vCPU / 4 GB, paperless + tika + gotenberg): ~$0.10/hr
- ALB: $0.025/hr
- CloudFront, EFS, CloudWatch Logs, Secrets Manager: ~$0.01/hr
- Bedrock Nova Pro classifications + KB ingestion + chat: ~$0.15
- S3 Vectors: ~$0.01

## Troubleshooting

### Bedrock features silently fail
Check CloudWatch Logs at `/ndx-paperless-ngx/production`, stream prefix `paperless`. The post-consume hook logs every Bedrock call with `[post-consume]`. Common causes:
- Bedrock model access not enabled in this region — check the Bedrock console > Model access
- Task role IAM blocked by the ISB SCP — confirm the role name starts with `InnovationSandbox-ndx-`

### Knowledge Base returns no results
KB ingestion runs asynchronously after the post-consume hook uploads OCR text to S3. Allow ~3 minutes after document consumption before chat queries find new content. Check the data source ingestion job status in the Bedrock console.

### Sample documents do not appear
The init container only seeds documents on first boot (idempotent via `/efs/consume/.seeded`). If the consume directory was pre-populated, this is skipped. Logs in stream prefix `init`.

### Tika or Gotenberg crash loops
Both run as essential sidecars. Check stream prefix `tika` or `gotenberg`. Memory pressure is the usual culprit — task is sized at 2 vCPU / 4 GB; reducing `--chromium` flags on Gotenberg or restarting the task will recover.

### ISB SCP "AccessDenied" errors
All IAM roles in this stack are auto-prefixed `InnovationSandbox-ndx-` by the CDK Aspect (`IsbRoleNamingAspect` in `lib/paperless-ngx-stack.ts`). If a role with the wrong prefix slips through synthesis, the deploy will fail before the SCP can object — fix the construct path or add to the aspect's regex.

## GPL-3.0 stance

This scenario uses the upstream `ghcr.io/paperless-ngx/paperless-ngx:latest` image without any source modifications. We do not redistribute the image. We add operational artefacts (init container, post-consume Python script, Bedrock chat Lambda) which are licensed separately under this repository's licence and do not link to or derive from Paperless-ngx source. No GPL-3.0 distribution obligations are triggered.
