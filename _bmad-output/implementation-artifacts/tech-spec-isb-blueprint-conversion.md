---
title: 'Convert Scenario Templates to ISB Blueprints (Starting with Council Chatbot)'
slug: 'isb-blueprint-conversion'
created: '2026-02-27'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'CloudFormation (SAM transform AWS::Serverless-2016-10-31)'
  - 'AWS Innovation Sandbox (ISB) blueprints via StackSets'
  - 'CloudFormation StackSets (self-managed)'
  - 'Eleventy (11ty) static site with YAML data files'
  - 'Python 3.12 (Lambda inline code)'
files_to_modify:
  - 'cloudformation/scenarios/council-chatbot/template.yaml'
  - 'src/_data/scenarios.yaml'
code_patterns:
  - 'SAM transform with inline Python Lambda code'
  - 'Scenario data in src/_data/scenarios.yaml validated against schemas/scenario.schema.json'
  - 'CAPABILITY_AUTO_EXPAND already in schema enum for capabilities field'
  - 'All scenario templates follow identical structure: Lambda + FunctionURL + IAM Role + S3 + LogGroup'
test_patterns:
  - 'No CloudFormation template unit tests exist'
  - 'Portal tests are Playwright screenshot/visual regression only (tests/*.spec.ts)'
  - 'Schema validation runs at build time via scenarios.yaml schema'
---

# Tech-Spec: Convert Scenario Templates to ISB Blueprints (Starting with Council Chatbot)

**Created:** 2026-02-27

## Overview

### Problem Statement

The NDX:Try scenario CloudFormation templates are currently deployed manually via the portal's one-click CloudFormation launch. Innovation Sandbox (ISB) now supports blueprints — registered StackSets that auto-deploy infrastructure into sandbox accounts when leases are approved. The templates need converting to work as ISB blueprints.

### Solution

Modify the council-chatbot CloudFormation template to be ISB-blueprint-compatible (remove auto-cleanup, strip unnecessary parameters), then create the StackSet registration commands and document the ISB registration steps. Replace the existing template rather than maintaining two versions.

### Scope

**In Scope:**

- Modify `cloudformation/scenarios/council-chatbot/template.yaml` for ISB compatibility
- Remove `AutoCleanupHours` parameter and S3 lifecycle rules (ISB handles cleanup)
- Fix Bedrock IAM policy region mismatch (policy uses `${AWS::Region}`, code uses `us-east-1`)
- Fix incorrect Amazon Lex references in `src/_data/scenarios.yaml` (chatbot doesn't use Lex)
- Remove `AutoCleanupHours` parameter entry from `scenarios.yaml` deployment block
- Provide `aws cloudformation create-stack-set` command with correct ISB roles
- Document ISB web UI registration steps
- Add `CAPABILITY_AUTO_EXPAND` for SAM transform support

**Out of Scope:**

- Converting the other 6 scenarios (future work, same pattern)
- Changes to the Lambda function code itself
- ISB hub account setup or ISB installation
- Portal UI changes — portal remains a separate front door alongside ISB

## Context for Development

### ISB Blueprint Model

- A blueprint is a registered self-managed CloudFormation StackSet in the ISB hub account
- ISB deploys StackSet instances into sandbox accounts when leases are approved
- ISB handles cleanup via AWS Nuke when leases terminate — no need for auto-cleanup in templates
- SAM transforms (`AWS::Serverless-2016-10-31`) work with self-managed StackSets when `CAPABILITY_AUTO_EXPAND` is specified
- StackSets require `--administration-role-arn` pointing to ISB's IntermediateRole and `--execution-role-name` pointing to ISB's SandboxAccountRole
- `--managed-execution Active=true` is recommended for concurrent lease handling
- Blueprint names: 1-50 chars, start with letter, alphanumeric + hyphens only

### Current Template Pattern

- All 7 scenario templates follow the same structure: Lambda + Function URL + IAM Role + S3 Bucket + Log Group
- Templates use SAM transform and inline Python code
- Templates have auto-cleanup parameters and S3 lifecycle rules (ISB-redundant)
- Templates are stored in S3 (`s3://ndx-try-templates-us-east-1/scenarios/...`) and referenced by `scenarios.yaml`

### Codebase Patterns

- Scenario config lives in `src/_data/scenarios.yaml` with deployment block per scenario
- CloudFormation templates live under `cloudformation/scenarios/{scenario-name}/template.yaml`
- Portal and ISB are two separate front doors — portal stays as-is for showcase/catalogue, ISB handles deployment
- All resources use default `DeletionPolicy` (Delete) — clean for ISB StackSet teardown

### Key Findings from Party Mode Review

1. **Bedrock IAM region mismatch** (critical): `ChatbotRole` BedrockAccess policy scopes to `${AWS::Region}` (line 106) but Lambda code hardcodes `region_name='us-east-1'` (line 136). If ISB deploys to any non-us-east-1 region, the IAM policy won't cover the actual Bedrock call. Fix: hardcode IAM ARN to `us-east-1`.
2. **Incorrect Lex references** (data quality): `scenarios.yaml` lists "Amazon Lex" in `awsServices` and references "Configuring Amazon Lex bot" in `deploymentPhases` — the chatbot doesn't use Lex at all.
3. **SAM transform confirmed compatible**: Self-managed StackSets support SAM transforms with `CAPABILITY_AUTO_EXPAND`. No need to rewrite to plain CloudFormation.
4. **Repeatable pattern**: Once chatbot is done, the other 6 scenarios follow the same conversion recipe.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/council-chatbot/template.yaml` | Current chatbot CloudFormation/SAM template — primary modification target |
| `src/_data/scenarios.yaml` | Portal scenario config — lines 231-310 are the chatbot block |
| `schemas/scenario.schema.json` | Validates scenarios.yaml — already supports `CAPABILITY_AUTO_EXPAND` in capabilities enum |
| `src/_data/chatbot-sample-questions.yaml` | References Lex (line 93) — out of scope but noted |
| `src/_data/evidence-pack-sample.yaml` | References Lex (lines 183, 211) — out of scope but noted |
| `docs/deployment-endpoints.yaml` | References AutoCleanup tag — informational only |

### Technical Decisions

1. **Keep SAM transform** — confirmed compatible with self-managed StackSets via `CAPABILITY_AUTO_EXPAND`
2. **Hardcode Bedrock IAM ARN to us-east-1** — matches Lambda runtime behaviour, prevents cross-region permission failures
3. **Remove AutoCleanupHours parameter entirely** — ISB handles cleanup; parameter and all references (S3 lifecycle, Metadata group, ScenarioInfo output) removed
4. **Keep Environment and KnowledgeBaseSource parameters** — harmless defaults, StackSets pass parameters fine
5. **Keep AutoCleanup tag on resources** — harmless metadata, doesn't affect ISB behaviour
6. **Remove S3 LifecycleConfiguration** — ISB's AWS Nuke handles bucket cleanup on lease termination
7. **Portal scenarios.yaml stays mostly intact** — portal is a separate front door; only remove AutoCleanupHours param and fix Lex data quality issues
8. **Template outputs unchanged** — `ChatbotURL`, `KnowledgeBaseBucket`, `ScenarioInfo` all stay (walkthrough pages reference ChatbotURL)

## Implementation Plan

### Tasks

- [x] Task 1: Remove AutoCleanupHours parameter from template
  - File: `cloudformation/scenarios/council-chatbot/template.yaml`
  - Action: Remove the `AutoCleanupHours` parameter definition (lines 37-42)
  - Action: Remove `AutoCleanupHours` from the `Metadata.AWS::CloudFormation::Interface.ParameterGroups` Auto-Cleanup group (lines 18-20). If the group becomes empty, remove the entire group.
  - Notes: The `Environment` and `KnowledgeBaseSource` parameters stay.

- [x] Task 2: Remove S3 LifecycleConfiguration from KnowledgeBaseBucket
  - File: `cloudformation/scenarios/council-chatbot/template.yaml`
  - Action: Remove the `LifecycleConfiguration` block from `KnowledgeBaseBucket.Properties` (lines 59-63)
  - Notes: ISB handles bucket cleanup via AWS Nuke on lease termination. Encryption and PublicAccessBlock stay.

- [x] Task 3: Fix Bedrock IAM policy region to match Lambda runtime
  - File: `cloudformation/scenarios/council-chatbot/template.yaml`
  - Action: Change the BedrockAccess policy Resource ARN from:
    ```yaml
    Resource:
      - !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/amazon.nova-pro-v1:0'
    ```
    To:
    ```yaml
    Resource:
      - 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0'
    ```
  - Notes: Lambda code hardcodes `region_name='us-east-1'` for the Bedrock client. The IAM policy must grant access in the same region the code actually calls.

- [x] Task 4: Update ScenarioInfo output to remove autoCleanup reference
  - File: `cloudformation/scenarios/council-chatbot/template.yaml`
  - Action: Remove the `"autoCleanup": "${AutoCleanupHours} hours",` line from the `ScenarioInfo` output Value (line 442)
  - Notes: The output still includes scenario, environment, mode, and note fields.

- [x] Task 5: Fix incorrect Amazon Lex references in scenarios.yaml
  - File: `src/_data/scenarios.yaml`
  - Action: In the `council-chatbot` block (starting line 231):
    - Remove `"Amazon Lex"` from `awsServices` array (line 256)
    - Remove `"Configuring Amazon Lex bot (~120 seconds)"` from `deploymentPhases` array (line 304)
    - Remove the `LexBotId` entry from `outputs` array (lines 309-310)
  - Notes: The chatbot uses Lambda + Bedrock directly, not Lex. Other Lex references in walkthrough pages and sample data are out of scope.

- [x] Task 6: Remove AutoCleanupHours parameter from scenarios.yaml
  - File: `src/_data/scenarios.yaml`
  - Action: Remove the `AutoCleanupHours` parameter entry from `deployment.parameters` (lines 284-286):
    ```yaml
        - name: "AutoCleanupHours"
          value: "2"
          description: "Hours until automatic resource cleanup"
    ```
  - Notes: `Environment` and `KnowledgeBaseSource` parameters stay.

- [x] Task 7: Add CAPABILITY_AUTO_EXPAND to scenarios.yaml capabilities
  - File: `src/_data/scenarios.yaml`
  - Action: Add `"CAPABILITY_AUTO_EXPAND"` to the `deployment.capabilities` array for council-chatbot (after line 298):
    ```yaml
      capabilities:
        - "CAPABILITY_IAM"
        - "CAPABILITY_AUTO_EXPAND"
    ```
  - Notes: Required for SAM transform in StackSets. Schema already supports this value.

- [x] Task 8: Create ISB blueprint registration guide
  - File: `cloudformation/scenarios/council-chatbot/BLUEPRINT.md`
  - Action: Create a new file documenting:
    1. **Prerequisites**: ISB deployed, hub account ID, ISB namespace known
    2. **Step 1 — Upload template to S3**: Command to upload `template.yaml` to an S3 bucket accessible from the hub account
    3. **Step 2 — Create StackSet**: The `aws cloudformation create-stack-set` command:
       ```bash
       aws cloudformation create-stack-set \
         --stack-set-name ndx-try-council-chatbot \
         --template-url https://{BUCKET}.s3.{REGION}.amazonaws.com/scenarios/council-chatbot/template.yaml \
         --administration-role-arn arn:aws:iam::{HUB_ACCOUNT_ID}:role/InnovationSandbox-{NAMESPACE}-IntermediateRole \
         --execution-role-name InnovationSandbox-{NAMESPACE}-SandboxAccountRole \
         --managed-execution Active=true \
         --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
         --description "NDX:Try Council Chatbot - AI-powered resident Q&A assistant"
       ```
    4. **Step 3 — Register in ISB**: Steps to register via ISB web UI:
       - Navigate to ISB admin console > Blueprints > Register New Blueprint
       - Enter name: `ndx-try-council-chatbot` (must match pattern `^[a-zA-Z][a-zA-Z0-9-]{0,49}$`)
       - Select the `ndx-try-council-chatbot` StackSet
       - Configure deployment: select target regions, set timeout (5 min recommended for this lightweight template)
       - Review and submit
    5. **Step 4 — Associate with Lease Template**: Edit or create a lease template in ISB, select the blueprint in Step 2
    6. **Verification**: How to verify the blueprint works (request a test lease, check deployment succeeds)
  - Notes: This file lives alongside the template so future scenarios can copy the pattern. Use placeholders `{HUB_ACCOUNT_ID}`, `{NAMESPACE}`, `{BUCKET}`, `{REGION}` for environment-specific values.

### Acceptance Criteria

- [x] AC 1: Given the modified `template.yaml`, when deployed via CloudFormation in `us-east-1`, then the stack creates successfully with all resources (Lambda, S3, IAM Role, Function URL, Log Group) and the chatbot responds to queries.
- [x] AC 2: Given the modified `template.yaml`, when the `AutoCleanupHours` parameter is passed, then the deployment fails with an "unknown parameter" error (parameter has been removed).
- [x] AC 3: Given the modified `template.yaml`, when the Bedrock IAM policy is inspected, then the Resource ARN references `us-east-1` explicitly (not `${AWS::Region}`).
- [x] AC 4: Given the modified `template.yaml`, when a StackSet is created with `--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND`, then the StackSet creation succeeds without errors.
- [x] AC 5: Given the updated `scenarios.yaml`, when the Eleventy build runs, then schema validation passes with no errors.
- [x] AC 6: Given the updated `scenarios.yaml` chatbot block, when inspected, then it contains no references to Amazon Lex, LexBotId, or AutoCleanupHours.
- [x] AC 7: Given the `BLUEPRINT.md` file, when a fresh operator follows the steps, then they can create a StackSet and register it as an ISB blueprint without additional context.

## Additional Context

### Dependencies

- AWS Innovation Sandbox must be deployed in the hub account (pre-existing, not part of this spec)
- ISB IntermediateRole and SandboxAccountRole must exist (created by ISB deployment)
- S3 bucket for hosting the template must be accessible from the hub account
- Amazon Bedrock model `amazon.nova-pro-v1:0` must be enabled in `us-east-1` in sandbox accounts

### Testing Strategy

- **Manual CloudFormation deploy**: Deploy the modified template as a regular CloudFormation stack in `us-east-1` to verify it still works standalone
- **StackSet creation**: Create a StackSet from the template with `CAPABILITY_IAM CAPABILITY_AUTO_EXPAND` to verify SAM transform compatibility
- **Eleventy build**: Run `npm run build` to verify scenarios.yaml schema validation passes
- **ISB end-to-end**: Register blueprint in ISB, request a test lease, verify chatbot deploys and functions in sandbox account
- No automated tests to add (no existing CFN test infrastructure)

### Notes

## Review Notes
- Adversarial review completed
- Findings: 14 total, 0 fixed, 14 skipped
- Resolution approach: skip

- **Risk: Bedrock model availability** — `amazon.nova-pro-v1:0` may not be enabled by default in ISB sandbox accounts. ISB admins may need to enable Bedrock model access as part of account provisioning or via a separate baseline blueprint.
- **Future work**: The other 6 scenarios follow the same conversion pattern. Each needs: remove AutoCleanupHours, remove S3 lifecycle, fix any region mismatches in IAM policies, create BLUEPRINT.md. Consider scripting the conversion for bulk application.
- **Lex references elsewhere**: `chatbot-sample-questions.yaml`, `evidence-pack-sample.yaml`, and walkthrough `.njk` files still reference Amazon Lex. These are separate data quality fixes outside this spec's scope.
