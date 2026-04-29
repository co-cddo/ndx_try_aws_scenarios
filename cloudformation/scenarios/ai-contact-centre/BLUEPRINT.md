# AI Contact Centre, BLUEPRINT.md

> Implementation blueprint for the NDX:Try AI Contact Centre scenario. Reading this end-to-end takes about 10 minutes; deploying takes 30-60 minutes.

## What this deploys

A self-serve, single-lease scenario deploying via NDX/SandboxAdmin into us-east-1. On lease assignment, fully provisions:

- Amazon Connect instance with Contact Lens redaction enabled at the instance attribute level
- Claimed UK +44 800 toll-free phone number (claim-never-release; pool account closure handles cleanup)
- Lex v2 bot in en_GB locale with `AutoBuildBotLocales: true`
- Bedrock Knowledge Base (S3 Vectors + `amazon.titan-embed-text-v2:0`) with Guardrails
- Bedrock Nova Pro for generation, multimodal photo describe, and multi-intent decomposition
- `AWS::ConnectCases::Domain` + Field + Layout + Template
- `AWS::CustomerProfiles::Domain` wired to Connect via the Phase 0.6 spike-validated mechanism
- Two contact flows (main, disconnect)
- Eight Lambda functions (RAG fulfilment, multimodal describe, multi-intent decomposer, companion API, Contact Lens consumer, share-PDF builder, deploy-time verification, plus seed-KB and two custom resource Lambdas)
- Kinesis Data Stream for Contact Lens, SQS DLQ, DynamoDB cache (post-redaction PII only)
- Three-pane companion SPA on S3 + CloudFront with OAC + AWS WAF
- Lambda Function URL with `AuthType: AWS_IAM` for the companion API

## Prerequisites

### 1. Bedrock model access (one-click in Bedrock console)

Both models below must be enabled in the lease account before stack deploy. The deploy-time verification Lambda asserts both are accessible and surfaces a remediation hint if not.

- `amazon.titan-embed-text-v2:0` (KB embeddings)
- `amazon.nova-pro-v1:0` (generation, multimodal, multi-intent)

Verify before deploy:

```bash
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-pro-v1:0 \
  --body '{"messages":[{"role":"user","content":[{"text":"hi"}]}],"inferenceConfig":{"maxTokens":1}}' \
  --cli-binary-format raw-in-base64-out \
  --content-type application/json \
  /tmp/test.json --profile NDX/SandboxAdmin --region us-east-1
```

If you see `AccessDeniedException`, open the Bedrock console (us-east-1) → Model access → Modify model access, enable both models, wait two minutes, retry.

### 2. Service quota check

Connect instances per account: default 2, limit-enforced when re-creating. If a previous Connect instance has been deleted in the last 30 days, AWS may refuse a new one. The pool-account closure step (below) is how we work around this.

### 3. Stage KB documents (pre-deploy `aws s3 sync`)

The KB ingestion Lambda assumes documents are already in the KB source bucket. Run this BEFORE creating the stack (or at least, before `SeedKbInvocation` runs):

```bash
# Determine the destination bucket name (it depends on AccountId)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text \
  --profile NDX/SandboxAdmin)
BUCKET="ndx-try-aicc-kb-${ACCOUNT_ID}-us-east-1"

# Stage the KB documents
aws s3 sync ./documents/ "s3://${BUCKET}/" \
  --exclude "*" --include "*.md" \
  --profile NDX/SandboxAdmin --region us-east-1
```

The seed Lambda will start the ingestion job once the KB and DataSource are CREATE_COMPLETE.

## Deploy

This template is >51KB. Use `--s3-bucket` to upload via the templates bucket:

```bash
sam package \
  --template-file template.yaml \
  --s3-bucket ndx-try-templates-us-east-1 \
  --s3-prefix scenarios/ai-contact-centre \
  --output-template-file packaged.yaml \
  --profile NDX/SandboxAdmin --region us-east-1

aws cloudformation create-stack \
  --stack-name ndx-try-ai-contact-centre-${USER} \
  --template-body file://packaged.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --disable-rollback \
  --profile NDX/SandboxAdmin --region us-east-1
```

`--disable-rollback` lets you SSM in and fix forward on CREATE_FAILED via `update-stack --disable-rollback` rather than tear down. (Use `--disable-rollback` not `--on-failure DO_NOTHING`: the latter blocks subsequent update-stack calls.)

## Itemized cost expectations

For a 24-hour light-use demo (one PSTN call + a few WhatsApp simulator submissions):

| Service | Unit | Light-use cost |
| ------- | ---- | -------------- |
| Connect inbound voice | $0.018/min | <£1 |
| Connect Cases | $0.0025-$0.005/case | <£0.50 |
| Bedrock Nova Pro generation | ~$0.0008 / 1K input tokens | £1-£3 |
| Bedrock Nova Pro multimodal | ~$0.003-$0.005 per image | £0.50-£2 |
| Polly Neural | $16/M characters | <£0.50 |
| Kinesis Data Streams | $0.015/shard-hour | £0.36/day |
| CloudFront | $0.085/GB (first 10TB) | <£0.50 |
| Lambda | trivial at this scale | <£0.50 |
| **Total expected** | | **£5-£20** |

Worst-case (continuous use, many photos): £30-£60.

## Pre-delete safety checklist

1. Ensure no active Connect contacts:

   ```bash
   aws connect get-current-metric-data \
     --instance-id <INSTANCE_ID> \
     --filters Channels=VOICE \
     --groupings ROUTING_PROFILE \
     --current-metrics Name=CONTACTS_IN_QUEUE,Unit=COUNT \
     --profile NDX/SandboxAdmin --region us-east-1
   ```

2. Delete the stack:

   ```bash
   aws cloudformation delete-stack \
     --stack-name ndx-try-ai-contact-centre-${USER} \
     --profile NDX/SandboxAdmin --region us-east-1
   ```

3. Wait for `DELETE_COMPLETE`.

4. **`isb close-account` (NOT just `isb terminate`)**, the phone number is retained on stack-delete and only released on pool-account closure. Without this step, the pool account's 30-day Connect cap is consumed and the next lease user on this account will fail to deploy.

   ```bash
   isb close-account <ACCOUNT_ID>
   ```

5. Note: any share-PDF presigned URLs you generated remain valid for up to 24 hours. Do not share them publicly.

## Phase 0 spike outputs

Several decisions in this template depend on spike outcomes that have not yet been measured. Until each spike is run, the relevant template path uses a placeholder and may need adjustment:

| Spike | Output | Drives |
| ----- | ------ | ------ |
| 0.0 | `schemas/multimodal-output.schema.json`, `schemas/multi-intent-output.schema.json` | done |
| 0.1 | `spikes/pstn-claim-results.json` | TargetArn binding for `AWS::Connect::PhoneNumber` |
| 0.2 | `spikes/cases-domain-results.json` | ConnectCases SCP fitness |
| 0.3 | `spikes/multimodal-prompt-template.md` + `spikes/multimodal-results.json` | multimodal prompt hardening |
| 0.4 | `spikes/contact-lens-latency.json` | AC8a/b numerics |
| 0.5 | `spikes/bedrock-model-access.md` | this BLUEPRINT prereq + AC18 |
| 0.6 | `spikes/customer-profiles-wiring.md` | Phase 7.1 wiring resource type |

Run the spikes before this scenario goes onto the public NDX:Try portal.

## CI strategy

- **Per-PR fast layer (≤15 min, against long-lived integration stack):** Tasks 13.1, 13.2, 13.3, 13.4 (chat-multi-intent), 13.6, 13.7, 13.9, 13.10, 13.12, 13.13, 13.14, 13.15.
- **Full-deploy layer (nightly + `main` merge + `[full-deploy]` PR label):** 13.5, 13.11.
- **Manual layer:** 13.8 PSTN manual smoke (one recorded call per release attached to PR).

WAF rate-limit assertion is configuration-readback, not load-driven, keeps the per-PR budget honest.

Spike file staleness check at CI start (Task 13.1) warns if any spike `measurement_date` is >90 days old.

## Halt points (bring forward to scenario sign-off)

These were left as TODOs by the initial implementation pass and must be resolved before going live:

- [x] **Audio MP3:** `audio/distress-script-en_GB.mp3` synthesised with Polly Neural Amy on 2026-04-28 as the documented interim fallback. Replace with human voice recording if/when a safeguarding lead has signed off (see `audio/SCRIPT-ETHICAL-REVIEW.md`).
- [x] **Phase 0.5 (Bedrock model access):** verified for both `amazon.nova-pro-v1:0` and `amazon.titan-embed-text-v2:0` against sandbox 714412037090 on 2026-04-28.
- [ ] **Phase 0 spikes 0.1-0.4, 0.6:** still PENDING. Phase 0.6 (Customer Profiles wiring) is the most important; runs next. 0.1 (PSTN) and 0.2 (Cases) get exercised by the live deploy. 0.3 (multimodal output) and 0.4 (Contact Lens latency) need a deployed stack.
- [ ] **Customer Profiles wiring:** Phase 7.1 currently uses `AWS::CustomerProfiles::Integration` with `Uri: ConnectInstance.Arn` and `ObjectTypeName: CTR`. If Phase 0.6 spike finds a different mechanism, update template.yaml accordingly.
- [ ] **Phone number flow association:** Phase 9.4's custom resource calls `connect:AssociatePhoneNumberContactFlow`. Verify this works under the current SandboxAdmin role; the integration stack tests will catch regressions.
- [ ] **reportlab Lambda layer:** template uses Klayers public layer ARN `arn:aws:lambda:${AWS::Region}:770693421928:layer:Klayers-p312-reportlab:1`. Verify the layer exists in us-east-1 with the named version. If not, run `scripts/build-reportlab-layer.sh` (Task 6.7a).

## See also

- `_bmad-output/implementation-artifacts/tech-spec-ai-contact-centre.md`, the full tech-spec this implementation follows.
- `spikes/`, Phase 0 spike inputs and outputs.
- `tests/`, per-PR and full-deploy test suite.
- Walkthrough Step 6 (`/walkthroughs/ai-contact-centre/step-6/`), also documents the cleanup process for end users.
