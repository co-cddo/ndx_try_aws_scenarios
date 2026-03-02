---
title: 'Planning AI Bedrock Integration'
slug: 'planning-ai-bedrock-integration'
created: '2026-03-02'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Python 3.12', 'AWS SAM/CloudFormation', 'Amazon Textract', 'Amazon Bedrock (Nova Pro)', 'boto3', 'Nunjucks (11ty)', 'YAML data files', 'GOV.UK Design System']
files_to_modify: ['cloudformation/scenarios/planning-ai/template.yaml', 'src/_data/exploration/planning-ai.yaml', 'src/walkthroughs/planning-ai/step-3.njk', 'src/walkthroughs/planning-ai/step-4.njk', 'src/walkthroughs/planning-ai/explore/production.njk', 'src/walkthroughs/planning-ai/index.njk', 'cloudformation/scenarios/planning-ai/BLUEPRINT.md']
code_patterns: ['Inline Lambda in CloudFormation ZipFile', 'boto3 bedrock-runtime client (see council-chatbot pattern)', 'JSON API response from Lambda Function URL', 'Inline HTML served from Lambda GET handler', 'YAML-driven exploration data rendered by Nunjucks templates']
test_patterns: ['Manual testing via Lambda Function URL', 'Sample document flow (useSample: true)', 'Real document upload flow (documentBase64)']
---

# Tech-Spec: Planning AI Bedrock Integration

**Created:** 2026-03-02

## Overview

### Problem Statement

The planning-ai scenario's documentation and exploration pages claim the architecture uses Amazon Bedrock for AI intelligence and Amazon Comprehend for entity extraction, but the actual implementation only uses Amazon Textract for OCR plus simple regex pattern matching. The scenario is an OCR demo with dishonest documentation — it needs to deliver on its AI promise.

### Solution

Integrate Amazon Bedrock into the Lambda processing pipeline to provide genuine AI-powered document analysis. Textract handles text extraction; Bedrock provides the intelligence layer — generating committee-ready application summaries, checking completeness, and classifying application types. Drop Comprehend entirely; Bedrock handles entity extraction better in context. Update all documentation to accurately reflect the real, working architecture.

**Decision: Bedrock adds clear value.** Without it, the scenario is a fancy OCR demo any PDF reader could match. With it, councils see a working AI proof-of-concept in planning — a first-mover advantage in a market hungry for concrete demos rather than vendor slide decks.

### Scope

**In Scope:**
- Integrate Bedrock into the Lambda processing pipeline
- Priority AI features (ranked by planning officer impact):
  1. **Application summary for committee reports** — the hero feature; officers spend 20-30 mins per application writing these manually
  2. **Completeness checking** — "This application is missing X, Y, Z" saves back-and-forth with applicants
  3. **Application type classification** — intelligent routing to the right team (Householder/Full/Outline/Listed Building etc.)
- Keep existing Textract extraction as first-pass, feed output into Bedrock for enrichment
- Update CloudFormation template (IAM policies for `bedrock:InvokeModel`, model resource ARN)
- Update all documentation to accurately match the real implementation
- Update exploration YAML data, walkthrough content, production cost projections
- Remove all Comprehend references (Bedrock replaces it)

**Out of Scope:**
- Other scenarios beyond planning-ai
- Changes to the portal/frontend framework itself
- Training custom ML models
- Amazon Comprehend integration (Bedrock handles it all)
- Risk scoring / policy compliance checking (nice-to-haves for a future iteration, harder to get right without domain-specific training)

## Context for Development

### Codebase Patterns

- **Inline Lambda pattern**: Lambda code is embedded in CloudFormation `ZipFile` property (not external files). All code changes happen within `template.yaml`.
- **Lambda Function URL**: Lambda exposes a public URL (AuthType: NONE) — serves HTML on GET, JSON API on POST.
- **Bedrock client pattern** (from council-chatbot): `bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')` with `invoke_model()` call using Nova Pro's message format.
- **IAM pattern for Bedrock** (from council-chatbot): Policy with `bedrock:InvokeModel` action scoped to foundation model ARN `arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0`.
- **Exploration data**: YAML files in `src/_data/exploration/` drive the explore pages. Architecture tour steps, experiment definitions, and production cost data are all YAML-driven.
- **Walkthrough pages**: Nunjucks templates include shared components (`wow-moment.njk`, `walkthrough-step.njk`) with template variables.
- **Response format**: Lambda returns JSON with `extractedData`, `rawText`, `textractStats` — Bedrock analysis results need to be added as a new field in this response.

### Files to Modify

| File | Purpose | Change Needed |
| ---- | ------- | ------------- |
| `cloudformation/scenarios/planning-ai/template.yaml` | CloudFormation template (1248 lines) | Add Bedrock IAM policy, bedrock client init, `analyze_with_bedrock()` function, update `lambda_handler` response, update HTML UI to show AI analysis section, update banner text |
| `src/_data/exploration/planning-ai.yaml` | Exploration data | Remove Comprehend references from architecture tour, update Bedrock step description to be accurate, remove Comprehend from cost projections, add Bedrock demo cost |
| `src/walkthroughs/planning-ai/step-3.njk` | Walkthrough step 3 — wow moment | Update `wowExplanation` and `wowTechnicalDetail` to describe Textract + Bedrock (not Comprehend), reflect actual AI capabilities |
| `src/walkthroughs/planning-ai/step-4.njk` | Walkthrough step 4 — review results | Add section for AI analysis results (summary, completeness, classification) alongside extracted fields |
| `src/walkthroughs/planning-ai/explore/production.njk` | Production costs page | Template renders from YAML data — no direct changes needed (YAML fix handles it) |
| `src/walkthroughs/planning-ai/index.njk` | Walkthrough landing | Update value proposition and "wow moment" preview to mention AI analysis, not just extraction |
| `cloudformation/scenarios/planning-ai/BLUEPRINT.md` | ISB blueprint docs | Update description to mention Bedrock, update verification steps |

### Files to Reference (Read-Only)

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/council-chatbot/template.yaml` | **Pattern reference** — working Bedrock integration with Nova Pro, IAM policy, boto3 client, invoke_model call |
| `src/walkthroughs/planning-ai/explore/architecture.njk` | Architecture tour — renders from YAML data, no direct edits needed |

### Technical Decisions

1. **Model choice: Amazon Nova Pro** (`amazon.nova-pro-v1:0`) — same as council-chatbot scenario. Already proven to work in the sandbox. Good balance of capability and cost.
2. **Region: us-east-1** — Bedrock runtime client hardcoded to us-east-1 (matching council-chatbot pattern), since Nova Pro availability is guaranteed there.
3. **Drop Comprehend entirely** — Bedrock handles entity extraction, classification, and summarisation in a single call. No need for a separate Comprehend integration.
4. **Keep existing Textract + regex flow** — Textract extracts raw text, regex does first-pass field parsing. Bedrock receives the raw text and provides enriched analysis on top. Two-stage pipeline: extract → analyze.
5. **Single Bedrock call with structured prompt** — send the full extracted text to Bedrock with a prompt requesting: (a) committee-ready summary, (b) completeness assessment, (c) application type classification. Parse JSON response.
6. **Graceful degradation** — if Bedrock call fails (SCP, timeout, etc.), return Textract-only results with a message explaining AI analysis is unavailable. Same pattern as the existing Textract error handling.
7. **Sample documents also get Bedrock analysis** — unlike current flow where samples bypass Textract, both sample and uploaded documents should go through Bedrock to demonstrate real AI.

## Implementation Plan

### Tasks

- [ ] Task 1: Add Bedrock IAM policy to CloudFormation template
  - File: `cloudformation/scenarios/planning-ai/template.yaml`
  - Action: Add a `BedrockAccess` policy to the `PlanningAIRole` resource (after the existing `TextractAccess` policy at line 90). Grant `bedrock:InvokeModel` on `arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0`. Copy the exact pattern from `council-chatbot/template.yaml:82-90`.
  - Notes: Keep existing `TextractAccess` and `S3Access` policies unchanged.

- [ ] Task 2: Add Bedrock client initialisation and `analyze_with_bedrock()` function
  - File: `cloudformation/scenarios/planning-ai/template.yaml`
  - Action: In the inline Lambda Python code:
    1. Add `bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')` alongside the existing `s3` and `textract` client initialisations (after line 130).
    2. Add a `PLANNING_ANALYSIS_PROMPT` constant — a system prompt instructing the model to act as a UK planning application analyst. The prompt must request JSON output with three keys:
       - `summary`: A 2-3 sentence committee-ready summary of the application suitable for planning officer reports.
       - `completeness`: An object with `status` ("complete"/"incomplete"), `missingFields` (list of missing items), and `notes` (brief explanation).
       - `classification`: An object with `applicationType` (e.g. "Householder", "Full", "Outline", "Listed Building Consent", "Change of Use"), `confidence` (high/medium/low), and `reasoning` (1 sentence).
    3. Add `analyze_with_bedrock(raw_text)` function following the `get_bedrock_response()` pattern from council-chatbot. Call `bedrock.invoke_model()` with `modelId='amazon.nova-pro-v1:0'`, pass the extracted text as user message, system prompt as `PLANNING_ANALYSIS_PROMPT`. Parse the response body JSON. **JSON parse fallback:** if the model returns invalid JSON, wrap the raw response text as `{"summary": "<raw text>", "completeness": null, "classification": null}` so the UI can still display the summary. Wrap in try/except — on failure return `None` with error message.
    4. Include a **JSON schema example** in `PLANNING_ANALYSIS_PROMPT` to steer the model towards reliable structured output. Example: `Respond ONLY with valid JSON matching this schema: {"summary": "...", "completeness": {"status": "complete|incomplete", "missingFields": [...], "notes": "..."}, "classification": {"applicationType": "...", "confidence": "high|medium|low", "reasoning": "..."}}`.
  - Notes: Keep `max_new_tokens` to 1024 and `temperature` to 0.3 (lower than chatbot's 0.7 — we want deterministic analysis, not creative responses).

- [ ] Task 3: Update `lambda_handler` to call Bedrock and return enriched response
  - File: `cloudformation/scenarios/planning-ai/template.yaml`
  - Action: In the `lambda_handler` function:
    1. **Sample document flow** (line ~1118-1142): After `extracted_data = parse_extracted_data(sample_text)`, add `bedrock_result = analyze_with_bedrock(sample_text)`. Add `'aiAnalysis': bedrock_result` to the response JSON.
    2. **Uploaded document flow** (line ~1157-1171): After `extracted_data = parse_extracted_data(textract_result['rawText'])`, add `bedrock_result = analyze_with_bedrock(textract_result['rawText'])`. Add `'aiAnalysis': bedrock_result` to the response JSON.
    3. If `bedrock_result` is `None` (Bedrock failed), set `'aiAnalysis': {'error': 'AI analysis unavailable', 'message': 'Textract extraction succeeded but Bedrock AI analysis could not be completed. Results show extracted fields only.'}` — graceful degradation.
  - Notes: Do NOT change the existing Textract or regex flows. Bedrock is purely additive.

- [ ] Task 4: Update Lambda HTML UI to display AI analysis as hero section
  - File: `cloudformation/scenarios/planning-ai/template.yaml`
  - Action: In the `render_upload_html()` function:
    1. Update the banner text from "Powered by Amazon Textract - Document Text Extraction" to "Powered by Amazon Textract + Amazon Bedrock AI".
    2. Update the page lead text to mention AI analysis, not just text extraction.
    3. Add a new `ai-analysis` section in the results area ABOVE the existing `extracted-data` div. This section should display:
       - **Committee Summary** — the hero element, prominently styled with a green left border and large text.
       - **Application Classification** — type badge with confidence indicator.
       - **Completeness Check** — status badge (complete/incomplete) with list of missing fields if any.
    4. Update the `displayResults()` JavaScript function to populate the AI analysis section from `data.aiAnalysis`. If `data.aiAnalysis.error`, show a warning message instead.
    5. Update the loading text to "Analyzing document with Amazon Textract + Bedrock AI..."
  - Notes: Follow GOV.UK Design System patterns for the UI components. **Committee summary styling:** use a prominent `govuk-inset-text` with green left border (`border-left-color: #00703c`), `govuk-body-l` font size, positioned as the **first element** in the results area. Classification and completeness use `govuk-tag` badges. The summary is the hero — it must be above the fold and visually dominant over the extracted fields grid.

- [ ] Task 5: Update exploration YAML data
  - File: `src/_data/exploration/planning-ai.yaml`
  - Action:
    1. **Architecture tour** (visual steps, line ~91-105): Remove "Comprehend Entity Extraction" step. Update "Bedrock Intelligence" step description to: "Amazon Bedrock AI analyses the extracted text to generate a committee-ready summary, check application completeness, and classify the application type". Renumber steps so flow is: S3 Upload → Textract OCR → Bedrock AI Analysis → Results Stored (4 steps, not 5).
    2. **Production costs** (line ~193-201): Remove `comprehend` entry entirely. Update `bedrock` cost to `"$50-150/month"` for production. Remove `comprehend` from demo_costs. Add `bedrock` to demo_costs as `"Included in NDX:Try"`. Update `total` to `"$800-1650/month (500 applications)"` (Textract + Bedrock only).
  - Notes: The production.njk template renders these values dynamically — it references `section.production_costs.comprehend` and `section.demo_costs.comprehend` which will need to be removed from the template too.

- [ ] Task 6: Update production.njk to remove Comprehend cost row
  - File: `src/walkthroughs/planning-ai/explore/production.njk`
  - Action: Remove the table row for "Amazon Comprehend (Entities)" (lines 153-156). The Bedrock row remains. This aligns with the YAML data changes in Task 5.
  - Notes: The template renders `section.production_costs.comprehend` and `section.demo_costs.comprehend` — both the YAML data AND the template need to stop referencing Comprehend.
  - **Dependency: Task 6 depends on Task 5** — the YAML data changes must be done first or simultaneously, as the template will error if it references removed YAML keys.

- [ ] Task 7: Update walkthrough step-3 wow moment
  - File: `src/walkthroughs/planning-ai/step-3.njk`
  - Action:
    1. Update `wowExplanation` (line 100): Replace "Amazon Textract and Comprehend worked together" with text describing how Textract extracts the text and Bedrock AI analyses it — generating a committee summary, checking completeness, and classifying the application type. Emphasise this replaces 20-30 minutes of manual report writing.
    2. Update `wowTechnicalDetail` (line 101): Remove Comprehend references. Describe the two-stage pipeline: Textract OCR + Bedrock AI analysis via Nova Pro. Mention structured prompt engineering and JSON response parsing.
    3. **Update the processing time table** (lines 164-189): Add ~5-8 seconds to each row to reflect Bedrock analysis on top of Textract. House Extension: 15-20s, Change of Use: 18-25s, New Dwelling: 22-28s. Update the "8-20 seconds" references elsewhere on the page to "15-30 seconds".
  - Notes: Keep the wow factor language — this is the moment of impact for the user.

- [ ] Task 8: Update walkthrough step-4 to describe AI analysis results
  - File: `src/walkthroughs/planning-ai/step-4.njk`
  - Action:
    1. Add a new section before "Understanding the results" (line ~89) titled "AI Analysis Results". Describe the three AI outputs the user should see: committee summary, completeness check, and application classification.
    2. Update the "What's impressive" inset text (line ~164-170) to highlight that the AI understood context and generated a committee-ready summary — not just scanned text.
    3. Update the "Real-world integration" bullets (line ~230-251) to include: "Auto-generate committee report drafts from application documents" and "Flag incomplete applications before officer review".
    4. **Update the `expectedOutcomes` variable** (lines 26-31): Replace current outcomes with ones reflecting AI analysis. Should include: "AI-generated committee summary is displayed", "Application completeness assessment shows status", "Classification identifies application type with confidence level", "Extracted fields match original document content".
  - Notes: The AI summary should be described as the primary result, with extracted fields as supporting detail.

- [ ] Task 9: Update walkthrough landing page
  - File: `src/walkthroughs/planning-ai/index.njk`
  - Action:
    1. Update the panel title (line 22) from "8 minutes to see AI automatically extract planning data" to "8 minutes to see AI analyse planning applications and generate committee summaries".
    2. Update the panel body (line 24-25) to mention AI analysis alongside extraction.
    3. Update the "What you'll do" list (line 43-56): Step 4 should mention "Review AI-generated summary, completeness check, and classification" not just "Review extracted fields".
    4. Update the "wow moment" preview section (line 147-160): Add "Committee-ready application summary" and "Application completeness assessment" to the bullet list. Reframe from just extraction to intelligent analysis.
  - Notes: This is the first page users see — it sets expectations for the entire walkthrough.

- [ ] Task 10: Update BLUEPRINT.md
  - File: `cloudformation/scenarios/planning-ai/BLUEPRINT.md`
  - Action:
    1. Update the description in the `create-stack-set` command (line 33) to mention Bedrock AI analysis.
    2. Add a note about Bedrock model access requirement (Nova Pro must be enabled in the account).
    3. Update verification steps to include checking that Bedrock analysis returns results.
  - Notes: This is operational documentation for deploying the scenario into ISB sandbox accounts.

### Acceptance Criteria

- [ ] AC 1: Given a sample document is selected and "Analyze" is clicked, when the Lambda processes it, then the response JSON includes both `extractedData` (Textract + regex fields) AND `aiAnalysis` (Bedrock-generated summary, completeness, classification).

- [ ] AC 2: Given a user uploads a real planning application PDF, when the document is processed, then Textract extracts text AND Bedrock provides AI analysis in the response.

- [ ] AC 3: Given the Bedrock API call fails (SCP block, timeout, model error), when the Lambda processes a document, then the response still includes `extractedData` from Textract with an `aiAnalysis.error` message explaining AI analysis is unavailable — no 500 error.

- [ ] AC 4: Given the results are displayed in the browser, when the user views the results page, then the AI-generated committee summary is the most prominent element, displayed above the extracted fields grid.

- [ ] AC 5: Given the results are displayed, when the AI analysis includes a completeness check with missing fields, then the missing fields are listed clearly with a visual indicator (complete/incomplete badge).

- [ ] AC 6: Given the exploration YAML data is loaded, when the architecture tour is rendered, then there are no references to Amazon Comprehend — only Textract and Bedrock are shown.

- [ ] AC 7: Given the production costs page is rendered, when the user views cost projections, then Comprehend is not listed and Bedrock costs reflect the actual pricing (~$50-150/month for 500 applications).

- [ ] AC 8: Given the walkthrough step-3 page is loaded, when the user reads the "wow moment" section, then the explanation describes Textract + Bedrock (not Comprehend) and highlights committee summary generation.

- [ ] AC 9: Given the CloudFormation template is deployed, when the stack creates successfully, then the IAM role includes `bedrock:InvokeModel` permission for Nova Pro and the Lambda function can invoke Bedrock.

## Additional Context

### Dependencies

- **SCP update**: `bedrock:InvokeModel` must be allowed in the sandbox account's SCP. Team has control over SCPs.
- **Bedrock model access**: Nova Pro (`amazon.nova-pro-v1:0`) must be enabled in the AWS account (us-east-1). May need to request model access in Bedrock console if not already enabled.
- **Lambda timeout**: Current timeout is 60s. Bedrock calls typically take 3-8s. 60s should be sufficient but worth monitoring.
- **Lambda memory**: Current 512MB should be fine — Bedrock calls are I/O bound, not memory bound.

### Testing Strategy

**Manual testing (primary):**
1. Deploy the updated CloudFormation stack to a sandbox account.
2. Open the Lambda Function URL in a browser — verify the UI loads with updated banner text.
3. Click "Use Sample Document" → "Analyze" — verify response includes both `extractedData` and `aiAnalysis` with summary, completeness, and classification.
4. Upload a real planning application PDF — verify Textract extraction + Bedrock analysis both return.
5. Simulate Bedrock failure (temporarily remove IAM permission) — verify graceful degradation with Textract-only results + error message.

**Portal documentation testing:**
6. Run `npm run build` (or 11ty build) — verify no template errors from YAML/Nunjucks changes.
7. Check `/walkthroughs/planning-ai/` — verify landing page reflects AI analysis messaging.
8. Check `/walkthroughs/planning-ai/step-3/` — verify wow moment describes Textract + Bedrock.
9. Check `/walkthroughs/planning-ai/explore/production/` — verify no Comprehend references, costs are accurate.
10. Check `/walkthroughs/planning-ai/explore/architecture/` — verify architecture tour shows Textract + Bedrock flow (no Comprehend step).

### Notes

**High-risk items:**
- **Prompt engineering quality**: The committee summary is the hero feature. If the prompt produces generic or unhelpful summaries, the entire integration loses its value. Invest time in crafting and testing the `PLANNING_ANALYSIS_PROMPT` with realistic planning application text.
- **JSON parsing reliability**: Bedrock must return valid JSON matching the expected schema. Include explicit JSON format instructions in the prompt and handle malformed responses gracefully (fall back to raw text if JSON parsing fails).
- **SCP configuration**: The team has SCP control but the actual change needs to be made before deployment. If forgotten, the Bedrock call will fail with `AccessDeniedException` — graceful degradation handles this, but the demo won't show AI analysis.

**Known limitations:**
- Inline Lambda `ZipFile` has a practical size limit. The template is already large (~1248 lines). Adding Bedrock code + expanded HTML will push it further. If we hit limits, the Lambda code would need to be extracted to an S3-hosted zip, but this is unlikely for this scope.
- Nova Pro's response time (3-8s) adds latency on top of Textract's processing time. Total processing may be 15-30 seconds. The loading UI and walkthrough documentation should reflect this updated timing.

**Future considerations (out of scope):**
- Risk scoring / policy compliance checking could be added as additional Bedrock prompt sections.
- Streaming responses could improve perceived performance for longer documents.
- Multi-document analysis (comparing related applications) would be a significant enhancement.
- Fine-tuned prompts per council (custom field mappings, local policy references) for production deployments.

### Party Mode Insights (2026-03-02)

**Consensus: Integrate Bedrock — unanimous across all agents.**

- **PM (John):** Value proposition collapses without real AI. Regex extraction is a parlour trick. The wow moment is AI-generated committee summaries, not field extraction. Scope tightly to 2-3 jaw-dropping features.
- **Architect (Winston):** Architecture is straightforward — add `bedrock:InvokeModel` permissions, extend Lambda to call Bedrock with Textract output + prompt template. One service (Bedrock) replaces two aspirational ones (Bedrock + Comprehend). Incremental effort is modest.
- **Analyst (Mary):** First-mover advantage — councils are told to "explore AI" but find only vendor vaporware. A working demo is the only working demo. Priority: committee summaries (20-30 min time saving per application), completeness checking, application classification.
- **Dev (Amelia):** Implementation estimate: 1-2 tasks for Lambda changes, 1 for IAM, 1-2 for doc updates. Keep existing `parse_extracted_data()` regex as first-pass extraction before Bedrock enrichment.

### Party Mode Insights — Round 2 (2026-03-02)

**Focus: Implementation approach review after deep investigation.**

- **PM (John):** UI hierarchy is critical — AI summary must be the HERO of the results page, big and prominent above extracted fields. Extracted fields become supporting evidence underneath. Don't bury the jaw-dropper in a JSON blob.
- **Architect (Winston):** Two-stage pipeline (Textract → Bedrock) is clean. Sample documents must also go through Bedrock for honest end-to-end demo. Prompt engineering is the critical piece — request structured JSON (summary, completeness, classification) not free text.
- **Dev (Amelia):** Exact line references for changes: IAM policy copies from `council-chatbot/template.yaml:82-90`. Lambda handler changes at lines 1118-1142 (sample flow) and 1157 (upload flow). New `analyze_with_bedrock()` follows `get_bedrock_response()` pattern. HTML needs new analysis-section div, `displayResults()` JS updated to render `data.aiAnalysis`.
- **Analyst (Mary):** Cost story improves — dropping Comprehend means production costs go from $400-800/month (Comprehend + Bedrock) to ~$50-150/month (Bedrock only for short prompts). Simpler AND cheaper.

### Party Mode Insights — Round 3 (2026-03-02)

**Focus: Final spec review before sign-off.**

- **PM (John):** Task 4 is the heaviest lift — 5 sub-changes in one task. Clarified UI styling: committee summary must use prominent inset text with green border, `govuk-body-l`, positioned first in results area. AC 4 was too vague — now has concrete styling spec.
- **Architect (Winston):** JSON parse resilience is critical — Nova Pro doesn't guarantee valid JSON. Added explicit fallback: wrap raw text as `{"summary": "<raw>", "completeness": null, "classification": null}`. Also: include JSON schema example in the prompt. Flagged that architecture tour YAML changes should preserve or remove screenshot field values.
- **Analyst (Mary):** Processing times in step-3 documentation need updating — Bedrock adds 5-8 seconds. House Extension goes from 8-12s to 15-20s. Also caught missing `expectedOutcomes` variable update in step-4.njk.
- **Dev (Amelia):** Task 5 and Task 6 have a dependency — YAML data must change before template, or template will error referencing removed keys. Flagged as explicit dependency in spec.
