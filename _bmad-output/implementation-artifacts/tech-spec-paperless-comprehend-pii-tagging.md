---
title: 'Comprehend PII Tagging in Paperless post-consume Hook'
slug: 'paperless-comprehend-pii-tagging'
created: '2026-05-13'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['AWS Comprehend', 'Python 3.12', 'boto3', 'AWS CDK (TypeScript)', 'Paperless-ngx', 'AWS IAM']
files_to_modify:
  - 'cloudformation/scenarios/paperless-ngx/cdk/scripts/post-consume.py'
  - 'cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts'
code_patterns:
  - 'env-var-driven config at module top (os.environ.get with defaults)'
  - 'ensure_named(http, kind, name) idempotent tag/type/correspondent lookup-or-create'
  - 'single-PATCH metadata union via dict[str, Any] payload'
  - 'failure isolation: every external call wrapped in try/except, log.warning, return 0'
  - 'taskRole.addToPolicy() additive IAM statements in compute.ts'
  - 'post-consume.py inline-bundled at synth via renderInitScript heredoc — content change drives task-def hash change drives ECS rollout'
  - 'env vars passed to paperless container in environment: block of FargateTaskDefinition.addContainer()'
test_patterns:
  - 'Jest + aws-cdk-lib/assertions Template.fromStack synth-only assertions (test/paperless-ngx-stack.test.ts)'
  - 'no unit tests for post-consume.py — Python side is ship-and-verify-live'
---

# Tech-Spec: Comprehend PII Tagging in Paperless post-consume Hook

**Created:** 2026-05-13

## Overview

### Problem Statement

The Paperless-ngx scenario already auto-classifies every consumed document with Bedrock Nova Pro (title, type, correspondent, summary, taxonomy tags). It does not surface whether a document contains PII or what kind, so a demo audience can't see "this minute paper has a home address in it" at a glance, and there is no machine-readable signal an operator could use to gate further processing.

**Purpose (confirmed by user during step-4 review).** This feature exists primarily for the **NDX:Try / council pitch demo**: showing AI-assisted privacy governance to a non-technical audience. That framing shapes two specific decisions:
- ADR-005 (counts-only note, no raw PII spans) is exactly right for this audience — the *visibility* of PII detection is the demo point, not the raw evidence.
- Redaction-on-KB-write stays in §Notes as future-work, not next-PR — the demo doesn't need it.

If this purpose changes (e.g. a real production deploy), revisit ADR-005 (might want partially-redacted samples for audit) and the redaction-future-work note (probably moves to next-PR).

Note on terminology: the user described this as "a workflow (i think thats the right processing step?)". Paperless-ngx has two distinct concepts — UI **Workflows** (assignment rules) and the **post-consume script** hook (`PAPERLESS_POST_CONSUME_SCRIPT`). The existing AI tagging lives in the post-consume hook, and that is also the natural seam for AWS Comprehend PII detection. This spec extends the post-consume hook, not a Paperless Workflow. **Explicitly confirmed by the user during step-2 review.**

### Solution

Extend `scripts/post-consume.py` to call AWS Comprehend `DetectPiiEntities` on the OCR'd content. For each high-confidence PII entity type detected (excluding noise), add a `pii-<type>` tag to the document, plus a top-level `pii` umbrella tag. Tags union with the existing Bedrock-derived taxonomy tags. Add a single document note summarising the entity types and span counts, and emit a structured CloudWatch log line for observability. Grant the Fargate task role `comprehend:DetectPiiEntities`.

### Scope

**In Scope:**
- Add `comprehend:DetectPiiEntities` IAM permission to the existing Fargate task role in `compute.ts`.
- Add a `detect_pii(content)` function in `post-consume.py` that chunks OCR text into ≤4500-byte UTF-8 windows and aggregates results across chunks.
- Filter detected entities to `Score ≥ 0.80`; drop entity types in `{DATE_TIME, AGE}`.
- Build the tag list: always-on `pii` umbrella tag when any qualifying entity is found, plus `pii-<lower-kebab-type>` for each distinct surviving type (e.g. `pii-email`, `pii-bank-account-number`).
- Union those tag IDs with the Bedrock-derived taxonomy tag IDs into the existing `PATCH /documents/{id}/` call. Do not replace existing tags.
- Append a single document note listing the detected entity types and per-type span counts (counts only; no raw PII values surfaced).
- Emit one structured `[post-consume-pii]` log line per **PII-positive** document summarising detection (entity-type counts, total spans, chunks processed) for CloudWatch observability. PII-negative documents emit no line (absence of the `pii` tag is the operator signal).
- Failure isolation: a Comprehend failure must not block Bedrock enrichment or KB upload — wrap the call in try/except like the existing `call_bedrock` pattern.

**Out of Scope:**
- Redaction of the document body or the OCR text written to the Bedrock KB.
- Surfacing raw PII span values in the document note (privacy: counts only).
- Tagging non-English documents (Comprehend `DetectPiiEntities` is English-only without re-invocation; we assume `en`).
- Adding a Paperless UI Workflow record — tagging stays inside the post-consume hook.
- A CloudWatch custom metric / EMF emission. The single structured log line is sufficient for the agreed observability scope.
- Re-running PII detection on documents ingested before this change (no backfill).

## Context for Development

### Codebase Patterns

- **Tag creation idempotency**: `ensure_named(http, "tags", name)` in `post-consume.py:92` does the GET-then-POST lookup-or-create on Paperless's `/api/tags/` endpoint and returns the tag id. Reuse this verbatim — no new helper needed.
- **Single-PATCH update**: All metadata changes (title, document_type, correspondent, tags) are unioned into a single `payload: dict[str, Any]` and applied via one `patch_document(http, payload)` call at `post-consume.py:241`. New PII tag IDs must merge into the same `payload["tags"]` list before the PATCH, not in a second PATCH. **Important invariant verified during investigation:** the existing code writes `payload["tags"] = tag_ids` (assignment, not union) at `post-consume.py:226` — and only if Bedrock returned tag names. If Bedrock returned zero tags, the key is **absent** from `payload`. The defensive union pattern `payload["tags"] = list(set(payload.get("tags", [])) | set(pii_tag_ids))` is required (already captured in Task 4).
- **Notes are a sub-resource**: Document notes use `POST /api/documents/{id}/notes/` with `{"note": "..."}` (see `post-consume.py:213-220`). They are append-only — there is no need to read existing notes first.
- **Failure isolation pattern**: Every external call is wrapped in `try/except Exception as e: log.warning(...)` so a single subsystem failure (Bedrock, KB, S3) never breaks the rest of the hook. `# noqa: BLE001` suppresses the bare-except lint. Comprehend integration must follow this exact pattern.
- **IAM policy aggregation**: Task-role permissions are added via `taskRole.addToPolicy(new iam.PolicyStatement({...}))` blocks in `compute.ts:73-103`. New permissions go as additional `addToPolicy` calls beside the existing Bedrock / S3 / S3Files statements. The `region` constant for the `aws:RequestedRegion` condition is already bound at `compute.ts:70` — reuse it.
- **Env-var block location confirmed**: The Paperless container `environment:` block is at `compute.ts:198-226`. New env vars (`PAPERLESS_COMPREHEND_REGION`, `PAPERLESS_PII_MIN_SCORE`, `PAPERLESS_PII_DROP_TYPES`) go after `PAPERLESS_BEDROCK_MODEL_ID` on line 219, before `PAPERLESS_ARCHIVE_BUCKET` — adjacent to the other Bedrock-family vars.
- **Synth-time bundling drives ECS rollout**: `post-consume.py` is read at synth via `fs.readFileSync` (`compute.ts:146`) and inlined into the init script via heredoc (`renderInitScript` at `compute.ts:302-329`). Any content change → init script string change → task definition hash change → ECS service rolls a new revision automatically. No `--force-new-deployment` needed. **F11 caveat from adversarial review:** Task 1 (IAM addition) alone does **not** roll the service — CFN updates the TaskRole policy in place without recycling tasks. The rollout is driven by Tasks 2 (env-var additions to the task def) and/or 3 (post-consume.py inline content change). A partial PR that ships Task 1 only would deploy clean but the running task would lack the new IAM grant until something else forced a rollout. Always ship Tasks 1+2+3 together.
- **IsbRoleNamingAspect**: All IAM roles in this stack are auto-prefixed `InnovationSandbox-ndx-*` to satisfy the ISB SCP. No new role is created here (we extend the existing TaskRole), so the aspect requires no change.
- **Env-var-driven configuration**: Tunables (region, model id, bucket names) are read from `os.environ.get(...)` at module top of `post-consume.py:32-43`. New tunables (Comprehend region, confidence threshold, dropped types) follow the same pattern and get passed into the container via `environment:` in `compute.ts`.

### Files to Reference

*Line numbers throughout this spec are correct as of authoring (2026-05-13). If the file has been edited since, treat the symbol names (function names, env-var names, class names) as the source of truth — line numbers drift, identifiers don't.*

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/paperless-ngx/cdk/scripts/post-consume.py` | Hook script invoked by Paperless after each ingest. PII detection logic lands here. |
| `cloudformation/scenarios/paperless-ngx/cdk/scripts/post-consume.py:32-43` | Existing module-top env-var block — add `COMPREHEND_REGION`, `PII_MIN_SCORE`, `PII_DROP_TYPES` reads here. |
| `cloudformation/scenarios/paperless-ngx/cdk/scripts/post-consume.py:92-108` | `ensure_named()` helper — reuse verbatim for resolving the new PII tag names to ids. |
| `cloudformation/scenarios/paperless-ngx/cdk/scripts/post-consume.py:200-241` | `main()` body where Bedrock enrichment runs and `payload` is built — Comprehend call slots in after Bedrock (post-line-204), tag union before the PATCH (pre-line-241). |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts` | Fargate task definition, task role, and container env. Add `comprehend:DetectPiiEntities` IAM permission and new env vars here. |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts:65-103` | TaskRole construction and existing `addToPolicy` statements — new Comprehend statement goes after the S3Files block at line 103. `region` constant for the IAM condition is already bound at line 70. |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts:198-226` | Paperless container `environment:` block — new env vars go after `PAPERLESS_BEDROCK_MODEL_ID` at line 219. |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts:144-149,302-329` | Where post-consume.py is read at synth (`fs.readFileSync`) and embedded in the init script via `renderInitScript`. No structural change — synth-time bundling means any `post-consume.py` content change auto-rolls the ECS service via task-def hash change. |
| `cloudformation/scenarios/paperless-ngx/cdk/test/paperless-ngx-stack.test.ts` | Jest synth-only tests using `Template.fromStack`. **Add one synth assertion here** for AC1: `template.hasResourceProperties('AWS::IAM::Policy', Match.objectLike({ PolicyDocument: { Statement: Match.arrayWith([Match.objectLike({ Action: 'comprehend:DetectPiiEntities' })]) } }))`. |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/paperless-ngx-stack.ts` | Top-level stack. No edits expected. |
| `cloudformation/scenarios/paperless-ngx/BLUEPRINT.md` | Blueprint registration doc. Update the "AI features" list and IAM bullet if needed. |

### Architecture Decisions

The five decisions below have real alternatives a future maintainer might consider reversing. Each captures Context / Options / Decision / Rationale / Consequences so the trade-off survives the next review.

#### ADR-001: Integration seam — extend the post-consume hook

**Context.** Paperless-ngx offers three places to bolt enrichment onto: (1) the `PAPERLESS_POST_CONSUME_SCRIPT` hook invoked once per ingest; (2) Paperless **Workflows** (the v2.3+ UI feature for conditional assignment rules); (3) an external Lambda triggered by S3 PutObject on the archive bucket. The existing Bedrock AI tagging lives in (1).

**Options.**
- **A. Post-consume hook** (existing seam). One process, shared boto3 session, single PATCH, in-band failure isolation.
- **B. Paperless Workflow.** UI-configurable, but no native call-out to AWS Comprehend; would require an HTTP webhook to a separate Lambda. Two-system handoff.
- **C. External S3-event Lambda.** Cleanest separation; cold-start latency, separate IAM role, separate logs, hits Paperless API as an external client.

**Decision.** **A**.

**Rationale.** All wiring exists. Same task role gets one extra IAM statement. Same log group, same observability shape. New behaviour ships as a `post-consume.py` diff plus a five-line IAM addition. No new infra, no new failure surface.

**Consequences.** Comprehend latency is now in the per-document ingest critical path (typically <1 s for a chunked 10-page doc). Bedrock failure already taught us the isolation pattern, so adding a second sibling call follows precedent.

#### ADR-002: Comprehend API — `DetectPiiEntities` (sync, chunked)

**Context.** Three Comprehend PII APIs exist. The OCR text per document ranges from ~1 KB (one-page letter) to ~60 KB (multi-page minutes).

**Options.**
- **A. `DetectPiiEntities` (sync).** 5 KB per-call text limit. Chunked locally. Latency: hundreds of milliseconds per chunk. Returns entity Type + Score + offsets.
- **B. `ContainsPiiEntities` then `DetectPiiEntities`.** Cheaper pre-filter for the no-PII path. Doubles call count for the with-PII path. Marginal saving on a council corpus where most docs contain at least a name.
- **C. `StartPiiEntitiesDetectionJob` (async, S3-in/S3-out).** Designed for batch over thousands of docs. Minutes of latency. Wrong granularity for per-ingest tagging.

**Decision.** **A**.

**Rationale.** Latency profile matches the existing hook (Bedrock Nova Pro is the slow step at ~2-5 s per doc; Comprehend adds <1 s). Cost difference between A and B is negligible at sandbox volumes ($0.005/doc baseline). Simpler code path, fewer failure modes.

**Consequences.** Caller is responsible for UTF-8-safe chunking under 5000 bytes (spec uses 4500-byte windows for multi-byte headroom, splitting on whitespace where possible). Chunk-boundary entities can be double-counted if an entity straddles two chunks — accepted as low-frequency noise; partial mitigation by chunking at whitespace.

#### ADR-003: Tag format — `pii` umbrella + `pii-<lower-kebab-type>` per entity

**Context.** Comprehend returns entity types as uppercase enums (`NAME`, `EMAIL`, `BANK_ACCOUNT_NUMBER`). Paperless tag names are arbitrary strings.

**Options.**
- **A. `pii` + `pii-<lower-kebab-type>`.** E.g. `pii`, `pii-email`, `pii-bank-account-number`.
- **B. `pii` + `PII: <TYPE>`.** Mirrors Comprehend's casing; `PII: EMAIL`. More readable, mixed case, requires URL escaping in the Paperless API tag filter UI.
- **C. Two top-level tags per type.** `PII` + `EMAIL`. Risks collision: `EMAIL` already plausibly means "category = email correspondence" in a parish archive.

**Decision.** **A**.

**Rationale.** Hierarchy by prefix gives instant filterability (`/api/tags/?name__startswith=pii-` lists every PII type). Lower-kebab matches the existing taxonomy tag style (`minutes`, `correspondence`). No collision risk with the Bedrock-derived taxonomy.

**Consequences.** Mapping from Comprehend enum to tag is one line: `f"pii-{t.lower().replace('_', '-')}"`. Reversible — `t.upper().replace('-', '_')` recovers the enum.

#### ADR-004: Filtering — `Score >= 0.80` and drop `{DATE_TIME, AGE}`

**Context.** Comprehend `DetectPiiEntities` returns entities with `Score` (0–1 confidence). Without filtering, every council minute paper tags as `pii-date-time` (meeting dates) and many as `pii-age` (member ages mentioned in genealogy or planning records).

**Options.**
- **A. Score ≥ 0.80, drop `DATE_TIME` + `AGE`.** Strong signal types only.
- **B. Score ≥ 0.50, all types.** Maximum recall; tag noise dominates.
- **C. Score ≥ 0.90, drop `DATE_TIME` + `AGE` + `URL`.** Stricter, fewer false positives, but loses borderline-but-real NAME and PHONE detections in OCR-noisy scans.

**Decision.** **A**.

**Rationale.** Council OCR quality varies; 0.80 is the empirical sweet spot in AWS examples for English-text Office docs. `DATE_TIME` and `AGE` are ubiquitous and not actionable as "PII to be careful about".

**Consequences.** Configurable via `PAPERLESS_PII_MIN_SCORE` and `PAPERLESS_PII_DROP_TYPES` env vars without redeploy — operators can tune in place. If false-negative rate becomes a complaint, threshold drops first; if false-positive noise becomes one, drop-list grows.

#### ADR-005: Note format — post-filter type + span count, no raw values

**Context.** Comprehend returns entity Type, Score, BeginOffset, EndOffset. The OCR text is in hand. We could write the actual values (`Comprehend PII: NAME (Jo Smith), EMAIL (jo@example.com)`) into the document note.

**Options.**
- **A. Type + count only.** `Comprehend PII: NAME (3 spans), EMAIL (1 span)`.
- **B. Type + redacted samples.** `Comprehend PII: NAME (J.S., M.D.), EMAIL (j***@e***.com)`.
- **C. Type + raw values.** Demo-friendliest. Reproduces PII in a metadata field.

**Decision.** **A**.

**Rationale.** The note is **broadly readable** in Paperless — every authenticated user sees it. Writing raw or even partially-redacted PII into a "PII detection" note creates a second copy of the data, indexed and searchable, defeating the privacy intent of the feature.

**Consequences.** Auditors lose the ability to verify *which spans* triggered the tag from the note alone. They'd need to view the document body. Acceptable: any reviewer with note-read access also has body-read access.

### Other Technical Decisions

The following are choices without meaningful alternatives — captured here so the implementer doesn't have to re-derive them.

- **Structured log line format.** `[post-consume-pii] doc_id=<n> chunks=<n> total_spans=<n> types={"NAME":3,"EMAIL":1}` to `/ndx-paperless-ngx/production`, `paperless` stream prefix. Counts are **post-filter** (matching the tags actually applied). Emitted **only when at least one entity survives the filter**; absence-of-PII docs emit no line (the absence of a `pii` tag is the operator signal). Comprehend failures still log via the outer `try/except` warning, separate stream content.
- **Region.** Reuse `BEDROCK_REGION` (us-east-1) via a new `PAPERLESS_COMPREHEND_REGION` env var defaulting to it. Comprehend is available there; no cross-region call.
- **No new IAM role.** The existing `TaskRole` gets one additional policy statement. `comprehend:DetectPiiEntities` has `resources: ['*']` — Comprehend does not support resource-level constraints for this action.

## Implementation Plan

### Tasks

*Effort distribution is uneven: **Task 3 is roughly half the total implementation work** (parsing + chunking + per-chunk call). Tasks 1, 2, 5, 6 are minutes each. Plan accordingly.*

- [x] **Task 1 — Extend `TaskRole` IAM in `compute.ts`.** After the existing S3Files policy block (~line 103), add (pinned to the deploy region so a copied role can't drift to call Comprehend from elsewhere):

   **F4 note on region-pin asymmetry:** the existing Bedrock policy at `compute.ts:73-80` has no `aws:RequestedRegion` Condition, but it doesn't need one — its `resources:` list constrains the region inside the foundation-model ARN: `arn:aws:bedrock:${region}::foundation-model/${props.bedrockModelId}`. A copied role can't call Bedrock cross-region because the resource ARN is region-bound. Comprehend's `DetectPiiEntities` does not support resource-level constraints (`resources: ['*']` is required), so the **Condition is the structural equivalent** for that action. The two policies are functionally equivalent in their region-bound posture even though they reach it by different syntactic means; no follow-up retrofit needed.
   ```ts
   taskRole.addToPolicy(new iam.PolicyStatement({
     actions: ['comprehend:DetectPiiEntities'],
     resources: ['*'],
     conditions: {
       StringEquals: { 'aws:RequestedRegion': region },
     },
   }));
   ```
- [x] **Task 2 — Add Comprehend env vars to container** in `compute.ts` `environment:` (alongside `PAPERLESS_BEDROCK_REGION`, ~line 217):
   - `PAPERLESS_COMPREHEND_REGION` → same value as `BEDROCK_REGION`
   - `PAPERLESS_PII_MIN_SCORE` → `"0.80"`
   - `PAPERLESS_PII_DROP_TYPES` → `"DATE_TIME,AGE"`
- [x] **Task 3 — Add `detect_pii(content: str) -> dict[str, list[dict]]` function** to `post-consume.py`:
   - Read `PAPERLESS_COMPREHEND_REGION`, `PAPERLESS_PII_MIN_SCORE`, `PAPERLESS_PII_DROP_TYPES` at module top alongside existing env-var block.
   - **Parsing rules (explicit, no ambiguity):**
     - `PII_MIN_SCORE`: `try: float(os.environ.get("PAPERLESS_PII_MIN_SCORE", "0.80")) except (TypeError, ValueError): 0.80` — on parse failure log `log.warning("Invalid PAPERLESS_PII_MIN_SCORE=%r, falling back to 0.80", raw)` and use the default.
     - `PII_DROP_TYPES`: split raw string on `,`, strip whitespace on each token, `upper()` each, drop empty tokens, build a `frozenset`. Comprehend entity Types are uppercase enums (`DATE_TIME`, `AGE`, `NAME`, …) — uppercasing the drop list normalises against accidental lowercase input.
   - **Client construction (direct, not lazy-global).** F14 from adversarial review: since `post-consume.sh` execs a fresh `python3` per document, any module-global cache is reconstructed every invocation — the lazy pattern adds complexity without saving anything. Construct directly inside `detect_pii`:
     ```python
     comprehend = boto3.client("comprehend", region_name=COMPREHEND_REGION)
     ```
     **Note on timeouts:** the existing hook does not pin custom `botocore.config.Config` timeouts on its Bedrock or Paperless API calls — match that convention here. The outer `try/except Exception` in Task 4 catches any escape (timeout, throttling, region misconfiguration).
   - **Chunking** `content` into ≤4500-byte UTF-8 windows. Algorithm with explicit pointer (F3 from adversarial review):
     ```
     pos = 0
     while pos < len(content_bytes):
         end = min(pos + 4500, len(content_bytes))
         if end < len(content_bytes):
             # Look for whitespace in the final 500 bytes of this window.
             ws_pos = max(content_bytes.rfind(b' ', end - 500, end),
                          content_bytes.rfind(b'\n', end - 500, end),
                          content_bytes.rfind(b'\t', end - 500, end))
             if ws_pos > pos:
                 end = ws_pos  # cut at the whitespace byte
             # else: no whitespace found in tail 500 bytes — keep end at pos+4500 (hard cut).
         # UTF-8 safety: back end off to the previous byte while we're mid-codepoint.
         while end < len(content_bytes) and end > pos and (content_bytes[end] & 0xC0) == 0x80:
             end -= 1
         chunks.append(content_bytes[pos:end])
         pos = end  # next chunk starts at the cut point — no whitespace re-processing, no skip
         # Skip a single leading whitespace byte on the next chunk if cut landed exactly on one.
         if pos < len(content_bytes) and content_bytes[pos:pos+1] in (b' ', b'\n', b'\t'):
             pos += 1
     ```
     Comprehend offsets are computed per-chunk and are **not preserved** across chunk joins; we only consume Type/Score, so offset preservation isn't needed.
   - For each chunk: decode bytes back to str (`chunk.decode("utf-8", errors="replace")`), call `comprehend.detect_pii_entities(Text=chunk_str, LanguageCode="en")`, collect entities with `Score >= MIN_SCORE` and `Type not in DROP_TYPES`.
   - Return `{"<TYPE>": [entity_dict, ...], ...}` keyed by entity Type, aggregated across chunks. Counts in this dict are **post-filter** (above threshold, not in drop list) — the log line in Task 4 reports these same counts.
   - **On unrecognised `DROP_TYPES` tokens** (F15 from adversarial review): tokens that don't match any Comprehend entity Type are harmless — the `Type not in DROP_TYPES` filter simply won't match them. There is no separate try/except for parse failures because there is no parse-failure mode: any string splits into tokens. A user who pastes `"DATE_TIME;AGE"` produces a single-token set `{"DATE_TIME;AGE"}` that never matches anything, so the user sees `pii-date-time` and `pii-age` tags appearing in the UI — which is the natural feedback signal that their override didn't parse the way they expected.
- [x] **Task 4 — Wire `detect_pii` into `main()`** between Bedrock enrichment (line ~204) and the existing tag-union block (~222). Explicit ordering of side effects (F8 from adversarial review):

   ```python
   try:
       result = detect_pii(content)
   except Exception as e:  # noqa: BLE001
       log.warning("Comprehend PII detection failed: %s", e)
       result = {}

   if result:
       # Step 1: resolve PII tag names → ids.
       pii_tag_names = ["pii"] + sorted({f"pii-{t.lower().replace('_', '-')}" for t in result})
       pii_tag_ids = [tid for tid in (ensure_named(http, "tags", n) for n in pii_tag_names) if tid is not None]

       # Step 2: defensive union into payload (Bedrock may not have set `payload["tags"]`).
       # Works whether Bedrock returned zero tags (key absent), some tags (key set as list), or
       # the same tag ID is produced by both paths (set dedupes).
       existing_tag_ids = set(payload.get("tags", []))
       payload["tags"] = list(existing_tag_ids | set(pii_tag_ids))

       # Step 3: structured log (PII-positive only) — see F1 note below on rendered prefix.
       total_spans = sum(len(v) for v in result.values())
       type_counts = {t: len(v) for t, v in sorted(result.items())}
       log.info("[post-consume-pii] doc_id=%s chunks=%d total_spans=%d types=%s",
                DOCUMENT_ID, _chunks_count, total_spans, type_counts)

       # Step 4: post a single note. Wrapped in its own try/except so a notes failure does NOT
       # block the tag PATCH that follows. Matches the existing line-213 try/except: pass pattern.
       try:
           http.post(
               f"{API_URL}/documents/{DOCUMENT_ID}/notes/",
               json={"note": "Comprehend PII: " + ", ".join(
                   f"{t} ({len(v)} spans)" for t, v in sorted(result.items()))},
               timeout=10,
           )
       except Exception:  # noqa: BLE001
           pass
   ```
   The `_chunks_count` value is the chunk count from `detect_pii` — return it as a second value from the function or stash it on a module-level closure; spec doesn't dictate the mechanism, just that the value appears in the log line.

   **F1 note on rendered log prefix:** `logging.basicConfig` at `post-consume.py:29` formats every record as `[post-consume] %(message)s`. The log line above therefore renders in CloudWatch as **`[post-consume] [post-consume-pii] doc_id=...`** — both prefixes present. Filter pattern `'post-consume-pii'` still matches; AC8 has been updated to reflect this actual wire shape. If a single clean prefix is preferred, create a separate logger (`pii_log = logging.getLogger("paperless.pii"); pii_log.setLevel(logging.INFO)`) with its own handler — but the doubled prefix is the simplest path and matches existing conventions.
- [x] **Task 5 — Add a synth-level Jest assertion** in `test/paperless-ngx-stack.test.ts` for AC1.

   **F2 note from adversarial review:** CDK can emit `Action` as a string OR an array depending on policy merging; the matcher must accept both. Use a custom Match that handles both shapes:
   ```ts
   import { Match } from 'aws-cdk-lib/assertions';

   const actionMatches = (a: any) =>
     a === 'comprehend:DetectPiiEntities' ||
     (Array.isArray(a) && a.includes('comprehend:DetectPiiEntities'));

   test('grants comprehend:DetectPiiEntities on the task role, region-pinned', () => {
     const stmts = template.findResources('AWS::IAM::Policy');
     const matched = Object.values(stmts).flatMap((r: any) =>
       (r.Properties.PolicyDocument.Statement ?? []).filter((s: any) =>
         actionMatches(s.Action) &&
         s.Condition?.StringEquals?.['aws:RequestedRegion'] !== undefined
       )
     );
     expect(matched).toHaveLength(1);
   });
   ```
   This is more verbose than a pure `Match.objectLike` matcher but is robust to CDK's string-vs-array Action serialisation across versions.
- [x] **Task 6 — Validate the synth output.** `cd cdk && npx cdk synth >/dev/null && npm test` should both pass. The new IAM statement should appear in the TaskRole policy in the synthesized JSON and the new Jest test should be green.

### Acceptance Criteria

- [ ] **AC1 — IAM grant exists, region-pinned.**
  Given the synthesized `PaperlessNgxStack.template.json`,
  When grepped for `comprehend:DetectPiiEntities`,
  Then exactly one occurrence appears under the TaskRole's inline policy AND the same statement has a `Condition: { StringEquals: { 'aws:RequestedRegion': ... } }`. Verified automatically by the new Jest test in `paperless-ngx-stack.test.ts`.

- [ ] **AC2 — Document with PII gets tagged.**
  Given the stack is deployed and a fresh PDF containing US-format PII (per F13 from adversarial review — Comprehend is trained primarily on US patterns; use a US sample to avoid demo flakiness): an email address (e.g. `jo@example.com`), a US phone number (e.g. `+1 555 010 1234`), a SSN-shaped string (e.g. `123-45-6789`), and a US street address (e.g. `123 Main Street, Springfield IL`) is uploaded to `/consume/`,
  When the post-consume hook completes,
  Then the document in the Paperless UI shows the `pii` umbrella tag plus one `pii-<lower-kebab-type>` tag for **each entity Type that Comprehend actually returned above threshold** (do not hardcode the exact tag names — Comprehend may return `EMAIL`/`PHONE`/`PHONE_NUMBER`/`SSN`/`ADDRESS` depending on input; the AC's truth condition is the mapping from returned types to applied tags, not specific names), AND a note exists beginning with `Comprehend PII:` listing the same types with span counts, AND existing Bedrock-derived taxonomy tags are also present.

  *Optional UK-flavour test PDF for the demo:* `Jo Smith, 07700 900123, jo@example.com, 1 Acacia Avenue, London`. Comprehend's UK address/phone detection is empirically less reliable; if the AC fails on the UK PDF but passes on the US PDF, the implementation is correct — Comprehend's training data is the constraint, not your code. Note observed UK detection rate in the PR description.

- [ ] **AC3 — Clean document gets no PII tags.**
  Given a fresh PDF containing only parish meeting agenda boilerplate with no PII,
  When the post-consume hook completes,
  Then the document has no `pii` or `pii-*` tags, AND no `Comprehend PII:` note is created.

- [ ] **AC4 — Noise types filtered.**
  Given a document where the only entity types Comprehend returns above threshold are members of `PAPERLESS_PII_DROP_TYPES` (default `DATE_TIME`, `AGE`),
  When the hook runs,
  Then no `pii` tag and no PII note are applied (the umbrella tag is gated on at least one surviving — i.e. post-filter — entity), AND no `[post-consume-pii]` log line is emitted.

- [ ] **AC5 — Confidence threshold honoured.**
  Given a document where Comprehend returns a `NAME` entity with `Score=0.65`,
  When the hook runs,
  Then no `pii-name` tag is applied for that span. (If no other PII detected, no `pii` umbrella either.)

- [ ] **AC6 — Tag union preserved.**
  Given a document that triggers both Bedrock taxonomy tags (e.g. `minutes`) and Comprehend PII tags (e.g. `pii-name`),
  When the hook runs,
  Then the final document tag list contains both sets — Bedrock tags are not lost.

- [ ] **AC7 — Comprehend failure is non-fatal.**
  Given Comprehend is unreachable (simulate via `AWS_ENDPOINT_URL_COMPREHEND=http://127.0.0.1:1` so boto3 fails fast on connection refused, per F9 from adversarial review — avoids the ~20 s DNS-and-retry latency that a bogus region name would introduce),
  When a document is consumed,
  Then Bedrock-derived title/tags/type still get applied, AND a `[post-consume]` warning is logged containing "Comprehend PII detection failed", AND the post-consume script exits 0, AND total hook latency is within ~2 s of baseline (no retry storm).

- [ ] **AC8 — Single structured log line per PII-positive doc.**
  Given a document with **at least one surviving PII entity** consumed,
  When viewing `/ndx-paperless-ngx/production` `paperless` stream in CloudWatch,
  Then exactly one line matching the filter pattern `'post-consume-pii'` is present for that `DOCUMENT_ID`. The line's rendered wire shape is `[post-consume] [post-consume-pii] doc_id=<n> chunks=<n> total_spans=<n> types={"NAME":3,"EMAIL":1}` — both prefixes are present because the root logger's `basicConfig` format prepends `[post-consume]` (per F1 from adversarial review). All four fields `doc_id`, `chunks`, `total_spans`, `types` must appear. No raw PII values appear in the log line. (PII-negative docs intentionally emit no such line — covered by AC4.)

- [ ] **AC9 — Large document chunking works.**
  Given a document whose OCR content **exceeds 10 KB UTF-8 bytes** (clearly larger than the 4500-byte chunk window plus headroom, per F6 from adversarial review — avoids conflating the chunk-size constant 4500 with the Comprehend API limit 5000),
  When the hook runs,
  Then no `TextSizeLimitExceeded` exception escapes from boto3, AND the `chunks=` field in the log line is ≥ 3 (10 KB ÷ 4500 = 2.2, so at least 3 chunks expected), AND all chunks were processed (verified by checking `total_spans` reflects PII detected throughout the document, not only the first chunk).

- [ ] **AC10 — Bedrock-empty tag-union is safe.**
  Given Bedrock returns an empty tag list (or fails before populating `payload["tags"]`),
  When PII is detected (e.g. an `EMAIL` entity),
  Then the final PATCH succeeds with `payload["tags"]` containing **only** the PII tag IDs — no `KeyError`, no `TypeError`, no Bedrock tag IDs.

- [ ] **AC11 — Env-var parse failure is non-fatal.**
  Given `PAPERLESS_PII_MIN_SCORE` is deployed as the literal string `"abort"`,
  When a document is consumed,
  Then the script logs `Invalid PAPERLESS_PII_MIN_SCORE=...` at warning level, falls back to threshold `0.80`, AND tagging proceeds normally (no traceback, exit 0).

- [ ] **AC12 — Lowercase `DROP_TYPES` override is honoured.** (F10 from adversarial review — exercises the `.upper()` normaliser code path that the default `"DATE_TIME,AGE"` doesn't.)
  Given `PAPERLESS_PII_DROP_TYPES="date_time, age"` (lowercase, with whitespace),
  When a document containing only `DATE_TIME` and `AGE` entities is consumed,
  Then no `pii` or `pii-date-time` / `pii-age` tags are applied (the normaliser must uppercase the tokens and the filter must drop them), AND no `[post-consume-pii]` log line is emitted. (If this AC fails but AC4 passes, the normaliser is broken.)

- [ ] **AC13 — Peer review.**
  Given all code ACs above pass,
  When the PR is opened,
  Then a CODEOWNER other than the implementer signs off, having specifically eyeballed (a) ADR-005's "counts-only, no raw spans" decision in the note POST, and (b) the tag-union invariant in Task 4 (`payload["tags"] = list(set(payload.get("tags", [])) | set(pii_tag_ids))`).

## Additional Context

### Dependencies

- `boto3` (already imported at `post-consume.py:26`) — no new pip install needed; Comprehend is in the same boto3 distribution as Bedrock.
- AWS Comprehend service availability in deploy region (us-east-1: yes).
- No SCP changes — `comprehend:*` actions are not on the ISB deny list and the existing TaskRole name (`InnovationSandbox-ndx-*` via the aspect) satisfies the SCP allow pattern. **F12 from adversarial review:** verify before merge by inspecting the SCP source-of-truth in the `innovation-sandbox-on-aws` repo (the `Deny` statements in the workload-isolation SCP) and running `cdk diff` against the synth output to confirm no IAM SCP violations are flagged. If `comprehend:DetectPiiEntities` ever lands on the deny list, this spec's deploy will fail with `AccessDenied` at runtime, not at synth.

### Testing Strategy

- **Synth check (cheap, local):** `cd cloudformation/scenarios/paperless-ngx/cdk && npx cdk synth | grep DetectPiiEntities` — must return one match. Satisfies AC1.
- **End-to-end (against whichever ISB sandbox is currently leased):** F5 from adversarial review — sandbox accounts are ephemeral; treat the account ID and staging bucket as runtime values to be discovered, not hardcoded.
  1. Discover the live account: `ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile NDX/SandboxAdmin-<id>)`. Discover or create a staging bucket: `BUCKET=ndx-try-deploy-${ACCOUNT}-us-east-1` (create with `aws s3 mb s3://${BUCKET}` if it doesn't already exist).
  2. Re-synth and `aws s3 cp` the new template to `s3://${BUCKET}/paperless-ngx/template.json`.
  3. `aws cloudformation update-stack --stack-name PaperlessNgxStack --template-url https://${BUCKET}.s3.us-east-1.amazonaws.com/paperless-ngx/template.json --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND`.
  4. **Wait for ECS rollout:** `aws cloudformation wait stack-update-complete --stack-name PaperlessNgxStack`, then poll `aws ecs describe-services --cluster <cluster> --services <service> --query 'services[0].deployments[0].rolloutState' --output text` until it returns `COMPLETED`. Skipping this step means the next test exercises the **old** task revision, which has no Comprehend wiring — a common false-negative trap. Because `post-consume.py` is bundled inline at synth time, any content change produces a new task-definition hash → ECS rolls automatically; no manual `update-service --force-new-deployment` is needed.
  4. Generate two test PDFs locally: one with `Jo Smith, 07700 900123, jo@example.com, 1 Acacia Avenue, London`; one with just `Parish Agenda — Item 1 — Apologies received.`.
  5. Upload via the Paperless UI consume page; wait ≤60 s for post-consume to run.
  6. Verify ACs 2 & 3 in the UI; for AC3 the clean PDF should have **no** `[post-consume-pii]` log line (absence is the signal).
  7. Tail logs: `aws logs tail /ndx-paperless-ngx/production --follow --filter-pattern 'post-consume-pii'` — confirm AC8 line shape on the PII-positive PDF.
- **Failure-mode test (AC7):** temporarily set `PAPERLESS_COMPREHEND_REGION=eu-fake-1` via a task-definition override, re-consume a document, confirm Bedrock tags still applied. Revert after.
- **No Python unit tests** for `post-consume.py` — the existing project ships no Pytest coverage there. Keep the bar consistent; rely on live AC walkthrough for runtime behaviour.
- **One CDK synth test added** for the IAM grant (Task 5, AC1) — matches the existing project pattern in `test/paperless-ngx-stack.test.ts` (Jest + `Template.fromStack`, synth-only).
- **No `project-context.md` exists** in the repo — confirmed during step-2 investigation. No additional repo-wide conventions to honour beyond what is captured in §Codebase Patterns above.

### Notes

- Comprehend `DetectPiiEntities` cost: ~$0.0001 per unit (100 chars), so a 5 KB document is ~$0.005. Negligible compared to the existing Bedrock Nova Pro spend in the cost guideline.
- The note field surfaces span **counts** intentionally — surfacing raw spans (e.g. the actual email address) would defeat the privacy purpose of flagging.
- If a future iteration wants redaction (replace PII with `[REDACTED]` in the KB-uploaded text), the cleanest insertion point is `write_kb_text` at line 150 — apply Comprehend offsets before write. Out of scope here.
- The user originally framed this as "deploy a workflow" — call this out in any user-facing changelog so it's clear we extended the post-consume hook, not the Paperless UI Workflows feature.
- **Language limitation:** Comprehend `DetectPiiEntities` only supports `LanguageCode="en"` (unlike other Comprehend APIs which accept several). Non-English documents are out of scope; behaviour is undefined — Comprehend may return zero entities or an error. If the corpus becomes multilingual in future, the fix is to call `DetectDominantLanguage` first and short-circuit to no-op on non-`en`.
