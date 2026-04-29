# AI Contact Centre, BLUEPRINT.md

> Implementation blueprint for the NDX:Try AI Contact Centre scenario. Reading this end-to-end takes about 10 minutes. First-time deploy lands in 5-8 minutes (everything except KB ingestion); KB ingestion adds 3-15 minutes; the full stack is interactive ~10-15 minutes from `create-stack`.

## What this deploys

A self-serve, single-lease scenario deploying via NDX/SandboxAdmin into us-east-1. On lease assignment, fully provisions:

- Amazon Connect instance with Contact Lens redaction enabled at the instance attribute level
- Lex v2 bot in en_GB locale with 13 intents and ~45 utterances; `AutoBuildBotLocales: true`
- Bedrock Knowledge Base (S3 Vectors + `amazon.titan-embed-text-v2:0`) seeded with 11 Aldershire DC documents, with Guardrails (Hate/Violence/Sexual + LegalAdvice/MedicalAdvice DENY topics + UK-specific PII anonymisation)
- Bedrock Nova Pro for generation, multimodal photo describe, and multi-intent decomposition
- `AWS::CustomerProfiles::Domain` with a customer-managed CMK
- Connect Cases domain + 8 custom fields + layout + template (via custom resource: `AWS::ConnectCases::*` types are not registered in CFN as of 2026-04)
- Two contact flows (main, disconnect — currently a placeholder welcome+disconnect; rich Lex+RAG flow blocked by Lex chat JSONPath quirk)
- 12 Lambda functions: RAG fulfilment, multimodal describe, multi-intent decomposer, companion API, Contact Lens consumer, share-PDF builder, deploy-time verification, seed-KB, plus 5 custom-resource Lambdas (Connect-instance-active-wait, phone-number-flow-association, ConnectCases CRUD, Connect storage-config, CORS pinner)
- Kinesis Data Stream for Contact Lens, SQS DLQ, DynamoDB cache (post-redaction PII only)
- Three-pane companion SPA (chat transcript + Connect Case + WhatsApp simulator) on S3 + CloudFront with OAC + AWS WAF
- Lambda Function URL with `AuthType: NONE` (CloudFront OAC for Lambda Function URLs has a known signing-mismatch bug on POST + body); CORS pinned to the CloudFront domain via custom resource

**PSTN is not in the current deploy.** The `AWS::Connect::PhoneNumber` resource was removed after the lease's per-instance phone-number quota was exhausted by claim/release iterations. To restore PSTN: `isb close-account` to recycle the lease, then re-add the resource. See `spikes/pstn-claim-results.json`.

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

## Phase 0 spike outcomes (resolved during build)

| Spike | Status | Outcome |
| ----- | ------ | ------- |
| 0.0 schemas | done | `schemas/multimodal-output.schema.json` + `multi-intent-output.schema.json` shipped |
| 0.1 PSTN claim | partial | UK +44 8008 toll-free claimed first attempt; never routed inbound calls; lease's 5-numbers-per-30-day quota exhausted on retries. Remediation: `isb close-account`. |
| 0.2 ConnectCases | done | API works under SandboxAdmin role; `AWS::ConnectCases::*` CFN types not registered, custom resource Lambda is the workaround. |
| 0.3 multimodal output | done | Bedrock Nova Pro + inline schema description: 0.9 confidence on first call for Bedrock-generated bin photo. |
| 0.4 Contact Lens latency | not measured | Needs PSTN voice contact to drive Contact Lens stream; deferred. |
| 0.5 Bedrock model access | done | Both models verified accessible from this lease account. |
| 0.6 Customer Profiles wiring | done | Auto-discovery — same region+account is sufficient. No `IntegrationType: CUSTOMER_PROFILES` exists; CFN has no native binding type. Documented in `spikes/customer-profiles-wiring.md`. |

## CI strategy

- **Per-PR fast layer (≤15 min, against long-lived integration stack):** Tasks 13.1, 13.2, 13.3, 13.4 (chat-multi-intent), 13.6, 13.7, 13.9, 13.10, 13.12, 13.13, 13.14, 13.15.
- **Full-deploy layer (nightly + `main` merge + `[full-deploy]` PR label):** 13.5, 13.11.
- **Manual layer:** 13.8 PSTN manual smoke (one recorded call per release attached to PR).

WAF rate-limit assertion is configuration-readback, not load-driven, keeps the per-PR budget honest.

Spike file staleness check at CI start (Task 13.1) warns if any spike `measurement_date` is >90 days old.

## Acceptance Criteria status (live)

| AC | Status | Notes |
| -- | ------ | ----- |
| AC1 Stack deploys cleanly within 60 min | ✅ | First deploy ~10-15 min (KB ingestion is the long pole). |
| AC2 PSTN call hero | 🚧 | PstnNumber removed pending lease recycle. |
| AC3 Multi-intent triage with cap of 4 | ✅ | 7/7 fixture tests pass. Bedrock decomposer + intent name validation + truncated_intents. |
| AC4 Lex intent matching | ✅ | Bot v2 Available, all utterances match natural phrasings (1.0 confidence). |
| AC5 KB grounding | ✅ | RetrieveAndGenerate cites `03-council-tax.md` etc. for matching queries. |
| AC6 Guardrails | ✅ | LegalAdvice / MedicalAdvice DENY topics; UK NI / NHS / card BLOCK. |
| AC7 PII redaction in transcripts | 🚧 | Architecture in place; needs PSTN voice contact to drive Contact Lens stream. |
| AC8 Contact Lens latency | 🚧 | Same; needs voice. |
| AC9 Multimodal happy path | ✅ | Bedrock-generated bin photo → `object_class: missed_collection`, `confidence: 0.9`. |
| AC10 Cross-channel single Case | ✅ | One resident, one phone: chat /api/ask creates Case, WABA replay UPDATES same Case. |
| AC11 Welsh + accessibility takeaway | ✅ | 5/5 structural tests pass. Strategic ask block has 4 bullets, all reference AWS TAM. |
| AC12 WABA fixture replay | ✅ | Multimodal Lambda processes WABA payload identically to simulator. |
| AC13 Stack teardown clean | 🚧 | Will validate at end-of-life. |
| AC14 Walkthrough end-to-end | ✅ | 8/8 walkthrough snapshot tests pass. |
| AC15 Test suite gates the PR | partial | 26/26 tests passing across walkthrough + multi-intent + security + race. PII residue and contact-flow chat tests outstanding (need PSTN-driven traffic). |
| AC16 Step-driven dimming | 🚧 | CSS in place; demoable via `?step=1..7`. PSTN-blocks the multi-step phone narrative. |
| AC17 Share PDF | ✅ | fpdf2-bundled Lambda generates valid 1.5KB PDF, presigned URL serves it. |
| AC18 Deploy-time verification | ✅ | Custom::DeployTimeVerification confirms Bedrock + KB + CP + Connect bindings. |
| AC19 PII redaction-only-at-rest | partial | DDB schema persists redacted only; needs Contact Lens traffic to fully exercise the PII residue test. |
| AC20 Security boundaries | ✅ | 4/4 security smoke tests pass: WAF managed rules + rate-limit + S3 CORS pin + forged-origin 403. |
| AC21 Concurrent submissions converge on one Case | ✅ | clientToken-keyed idempotency on Cases CreateCase. |
| AC22 Distress audio ethical attribution | ✅ | Polly Amy synthesis + SCRIPT-ETHICAL-REVIEW.md credits. |

**Spec coverage: 16/22 fully verified, 6 blocked by PSTN unavailability.**

## Lessons from build (for future iterations)

- **Use `--disable-rollback` not `--on-failure DO_NOTHING` on create-stack.** The latter blocks subsequent `update-stack` calls with a confusing error; `--disable-rollback` is the canonical fix-forward enabler.
- **CFN gaps requiring custom resources:** `AWS::ConnectCases::*` types not registered; `AWS::Connect::InstanceStorageConfig.ResourceType` enum missing `REAL_TIME_CONTACT_ANALYSIS_SEGMENTS`; no `AWS::Connect::CustomerProfilesDomain` (auto-discovery only); CloudFront OAC + Lambda Function URL POST+body has signing mismatch (use AuthType: NONE + Lambda-internal CORS).
- **Cases UUIDs:** Custom-namespace fields use UUIDs in CreateCase / UpdateCase / SearchCases payloads. Built-in fields (`title`, `customer_id`, `reference_number`, `status`) keep their string IDs. Lambda resolves names via `list-fields` + cache.
- **Cases customer_id is a Customer Profiles ARN, not a profile UUID.**
- **Customer Profiles uses `profile:` IAM action prefix**, not `customer-profiles:`.
- **AssociateInstanceStorageConfig requires `iam:PutRolePolicy` on Connect's service-linked role** (Connect grants Kinesis access to its SLR via inline policy update).
- **Customer Profiles needs a customer-managed CMK** with `kms:GenerateDataKey` granted to `profile.amazonaws.com`. The AWS-managed `alias/aws/profile` doesn't auto-create on first domain.
- **fpdf2 ≥ 2.7.9 needs fontTools + Pillow + defusedxml bundled** in the Lambda zip. Don't use `--no-deps`.
- **For chat contacts, ConnectParticipantWithLexBot followed by InvokeLambdaFunction has issues** — `$.Lex.InputTranscript` JSONPath doesn't reliably resolve. Bypass: have the SPA call a `/api/ask` Lambda directly that does Lex + RAG + Cases in one place. See chat.html.

## See also

- `_bmad-output/implementation-artifacts/tech-spec-ai-contact-centre.md` — the full tech-spec this implementation follows.
- `spikes/` — Phase 0 spike inputs and outputs.
- `tests/` — per-PR and full-deploy test suite (26/26 passing).
- Walkthrough Step 6 (`/walkthroughs/ai-contact-centre/step-6/`) — also documents the cleanup process for end users.
- Memory: `feedback_cfn_fix_forward_failed_stack.md` captures the iteration discipline that kept this build moving.
