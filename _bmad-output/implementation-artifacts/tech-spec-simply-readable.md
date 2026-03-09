---
title: 'Simply Readable'
slug: 'simply-readable'
created: '2026-03-04'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'Eleventy (11ty) v3.x'
  - 'Nunjucks templates'
  - 'GOV.UK Frontend v6'
  - 'AWS CDK v2.241+'
  - 'Amazon Translate'
  - 'Amazon Bedrock'
  - 'Amazon Cognito'
  - 'AWS Step Functions'
  - 'AWS Lambda'
  - 'Amazon S3'
  - 'Amazon CloudFront'
  - 'Amazon DynamoDB'
  - 'AWS AppSync (GraphQL)'
  - 'AWS WAF'
  - 'Amazon Comprehend'
  - 'React (upstream app, Cloudscape UI)'
files_to_modify:
  - 'src/_data/scenarios.yaml'
  - 'src/scenarios/simply-readable.njk'
  - 'src/walkthroughs/simply-readable/index.njk'
  - 'src/walkthroughs/simply-readable/step-1.njk'
  - 'src/walkthroughs/simply-readable/step-2.njk'
  - 'src/walkthroughs/simply-readable/step-3.njk'
  - 'src/walkthroughs/simply-readable/step-4.njk'
  - 'src/walkthroughs/simply-readable/step-5.njk'
  - 'src/walkthroughs/simply-readable/complete.njk'
  - 'src/walkthroughs/simply-readable/explore/understand/index.njk'
  - 'src/walkthroughs/simply-readable/explore/extend/index.njk'
  - 'src/_data/screenshots/simply-readable.yaml'
  - 'src/_data/walkthroughs.yaml'
  - 'src/_data/extend/simply-readable.yaml'
  - 'cloudformation/scenarios/simply-readable/template.yaml'
  - 'cloudformation/scenarios/simply-readable/BLUEPRINT.md'
  - 'cloudformation/scenarios/simply-readable/cdk/bin/app.ts'
  - 'cloudformation/scenarios/simply-readable/cdk/lib/simply-readable-stack.ts'
  - 'cloudformation/scenarios/simply-readable/cdk/package.json'
  - 'cloudformation/scenarios/simply-readable/cdk/cdk.json'
  - 'cloudformation/scenarios/simply-readable/cdk/tsconfig.json'
  - 'cloudformation/isb-hub/lib/isb-hub-stack.ts'
code_patterns:
  - 'Data-driven scenarios via scenarios.yaml (schema-validated)'
  - 'Minimal scenario pages with layout inheritance (3-line frontmatter)'
  - 'Step-file walkthroughs with walkthrough-step.njk component'
  - 'Screenshot YAML data with S3-hosted images'
  - 'Minimum-change adaptation of upstream CDK → synthesized CloudFormation referencing co-located S3 assets (Lambda zips + React build)'
  - 'ISB Hub SCENARIOS array + directory upload (template.yaml + lambda/ + website-build/)'
  - 'Environment-agnostic CDK (no env) for StackSet cross-account deployment'
  - 'IAM roles named InnovationSandbox-ndx-* for SCP compatibility'
  - 'GOV.UK Design System classes (govuk-*) + NDX custom classes (ndx-*)'
  - 'Explore pages: understand (architecture), extend (next steps)'
  - 'Lambda code as S3-hosted zips (not CDK assets or inline) for StackSet compatibility'
  - 'Custom Resource (inline <4KB) for React config injection at deploy time'
test_patterns:
  - 'Schema validation via scenario.schema.json (required fields, enums, patterns)'
  - 'Playwright screenshot capture'
  - 'Pa11y accessibility testing'
  - 'Eleventy build validation'
  - 'CDK snapshot tests + construct assertion tests'
---

# Tech-Spec: Simply Readable

**Created:** 2026-03-04

## Overview

### Problem Statement

UK councils need to make documents accessible in multiple languages and Easy Read format for people with learning disabilities. Traditional translation costs ~£160/document and takes up to 19 days. Easy Read costs ~£120/page and takes weeks. Swindon Borough Council built an open-source solution using AWS that slashes these costs by 99%+, and it's now available as an AWS Sample for any council to deploy. NDX:Try should showcase this as a deployable scenario celebrating local gov innovation.

### Solution

Deploy the AWS Samples Document Translation tool (originally built by Swindon Borough Council) as an NDX:Try scenario with ID `simply-readable`. The tool provides both document translation (75 languages via Amazon Translate) and Simply Readable (Easy Read via Amazon Bedrock). A 5-step walkthrough guides users through using the tool and understanding its AWS architecture. Content celebrates Swindon's pioneering work and links to 30+ official sources and press coverage.

### Scope

**In Scope:**
- Scenario entry in `scenarios.yaml` following existing patterns
- Scenario page (`src/scenarios/simply-readable.njk`)
- 5-step walkthrough: access the app → upload & translate a document → use Simply Readable (Easy Read) → explore features → understand the AWS architecture
- CDK infrastructure: standalone stack wrapping upstream constructs, synthesized to CloudFormation template for ISB StackSet deployment
- Screenshots of the running app captured after real deployment
- Links to all official sources/press releases celebrating Swindon's involvement
- Walkthrough exploration pages covering architecture and AWS services
- ISB hub registration (add to SCENARIOS array)
- BLUEPRINT.md registration guide

**Out of Scope:**
- Evidence pack data (ROI/business case metrics)
- Custom modifications to the upstream `aws-samples/document-translation` codebase beyond ISB adaptation
- Production deployment guidance
- Quiz integration

## Context for Development

### Codebase Patterns

- **Scenario data**: All scenario config lives in `src/_data/scenarios.yaml` — one large YAML array with 8 existing scenarios. Each scenario must validate against `schemas/scenario.schema.json`. Required fields include: id, name, headline, bestFor, description, difficulty, timeEstimate, primaryPersona, awsServices, securitySummary, skillsLearned, deployment (with templateUrl, region), sourceCode (with repoUrl, cloudformationPath, description), success_metrics, security_posture, tco_projection.
- **Scenario pages**: Minimal `.njk` files with 4 frontmatter fields (`layout: layouts/scenario.njk`, `title`, `description`, `scenario`). The layout handles all rendering from YAML data.
- **Walkthroughs**: Directory per scenario under `src/walkthroughs/{id}/`. Each step file has frontmatter (`layout: layouts/walkthrough.njk`, `title`, `description`, `currentStep`, `totalSteps`, `timeEstimate`, `scenarioId`) and uses `{% include "components/walkthrough-step.njk" %}`.
- **Walkthrough metadata**: `src/_data/walkthroughs.yaml` maps scenario IDs to step titles, descriptions, times, and categories. Used for dynamic rendering in landing pages.
- **Screenshots**: YAML data at `src/_data/screenshots/{id}.yaml`. S3-hosted at `https://ndx-try-screenshots.s3.us-east-1.amazonaws.com/current/{id}/`. Includes public and admin page definitions.
- **Explore pages**: Under `src/walkthroughs/{id}/explore/` with subdirs: `understand/` (architecture, service cards, data flows), `extend/` (persona next-steps, community resources, production considerations).
- **Extended data**: `src/_data/extend/{id}.yaml` provides persona-specific next steps, resources, and production considerations for explore pages.
- **CDK deployment (LocalGov Drupal pattern)**: Standalone CDK stack with environment-agnostic config (no `env` specified). Synthesized to `template.yaml`. Uses `aws-cdk-lib ^2.241.0`, `constructs ^10.5.1`. IAM roles named `InnovationSandbox-ndx-*` for SCP compatibility.
- **ISB hub**: `cloudformation/isb-hub/lib/isb-hub-stack.ts` has a `SCENARIOS` array. Each entry triggers: S3 template upload + StackSet creation (self-managed, ISB roles). Adding a new entry is a single object addition.
- **Blueprint registration**: Each scenario has a `BLUEPRINT.md` documenting manual ISB registration steps.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/_data/scenarios.yaml` | Master scenario definitions — add new entry here (1220+ lines, 8 scenarios) |
| `schemas/scenario.schema.json` | JSON Schema validation — all required fields, enums, patterns |
| `src/scenarios/localgov-drupal.njk` | Example 3-line scenario page |
| `src/_data/walkthroughs.yaml` | Walkthrough metadata — add simply-readable entry |
| `src/walkthroughs/localgov-drupal/index.njk` | Example walkthrough landing (value prop, prerequisites, step list) |
| `src/walkthroughs/localgov-drupal/step-1.njk` | Example walkthrough step (frontmatter, component include, content sections) |
| `src/walkthroughs/localgov-drupal/complete.njk` | Example completion page (takeaway cards, next steps, cleanup) |
| `src/walkthroughs/localgov-drupal/explore/understand/index.njk` | Example architecture exploration page |
| `src/walkthroughs/localgov-drupal/explore/extend/index.njk` | Example next-steps/resources page |
| `src/_data/screenshots/localgov-drupal.yaml` | Example screenshot manifest |
| `src/_data/extend/localgov-drupal.yaml` | Example extended data for explore pages |
| `cloudformation/scenarios/localgov-drupal/cdk/bin/app.ts` | Example CDK entry point (no env, environment-agnostic) |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts` | Example standalone CDK stack |
| `cloudformation/scenarios/localgov-drupal/cdk/package.json` | CDK dependency versions |
| `cloudformation/scenarios/localgov-drupal/BLUEPRINT.md` | Example ISB blueprint registration guide |
| `cloudformation/isb-hub/lib/isb-hub-stack.ts` | ISB hub — add to SCENARIOS array |
| `src/_includes/layouts/scenario.njk` | Scenario page layout (279 lines, renders from YAML) |
| `src/_includes/layouts/walkthrough.njk` | Walkthrough step layout (progress bar, nav, prev/next) |
| `src/_includes/components/walkthrough-step.njk` | Walkthrough step component |

### Technical Decisions

- **Scenario ID**: `simply-readable` — highlights the Easy Read capability
- **Upstream repo**: `aws-samples/document-translation` v3.4.0 (Dec 2025)
- **Upstream deployment model**: Pipeline-based (CodePipeline + CodeBuild + SSM config). This is NOT directly compatible with ISB StackSets. The upstream app creates a self-mutating CodePipeline that watches a GitHub repo, requiring a GitHub OAuth token in Secrets Manager and config in SSM Parameter Store.
- **ISB adaptation approach**: Make the **bare minimum changes** to the upstream `aws-samples/document-translation` CDK to get it deploying into an ISB sandbox account. Changes should be applied as diffs/patches or lightweight augmentation on top of the upstream code — NOT a full rewrite. The goal is to wrap the existing upstream CDK into a StackSet-compatible deployment that ISB can manage. Where upstream uses CodePipeline/SSM config, strip or bypass those layers with the lightest touch possible. Pre-build the React frontend and Lambda zips, then reference them from S3 in the synthesized template. Keep the upstream construct structure intact wherever possible.
- **Execution approach**: Sequential with hard gate. Adapt upstream CDK → deploy to sandbox → verify ALL services work end-to-end (Cognito login, document upload, translation, Simply Readable, CloudFront UI) → **STOP if anything fails and ask the user** → only after verified deployment, proceed to portal content. No compromises, no papering over issues.
- **Change philosophy**: Minimal diff. Every change to the upstream code must be justified. Prefer CDK Aspects, wrapper constructs, and build-time patching over modifying upstream source files directly. Where upstream files must be modified, keep the diff as small as possible so future upstream updates can be merged easily. If something works upstream, don't rewrite it — adapt it.
- **Sandbox access**: An AWS sandbox account is already open and available. Use `--profile NDX/SandboxUser` for standard operations and `--profile NDX/SandboxAdmin` for admin-level access. No need to request or provision an account.
- **SCP handling**: The user has access to relax any SCPs that block deployment. **If you hit an SCP block or permission error, STOP and ask the user** rather than working around it or building fallback mechanisms. The user will adjust the SCP and you can retry.
- **AWS services deployed**: Cognito (User Pool + Identity Pool), AppSync (GraphQL), WAF, S3 (website + content), CloudFront, DynamoDB (job tables), Step Functions (orchestration), Lambda (12+ functions), Amazon Translate, Amazon Bedrock, Amazon Comprehend, EventBridge Pipes
- **Authentication**: Cognito User Pool with local users. Admin user created at deployment time via Secrets Manager (password) similar to LocalGov Drupal pattern. Self-signup disabled.
- **Region**: us-east-1 (required for Bedrock model availability)
- **Content tone**: People-first storytelling. Lead with Swindon's innovation and "Experts by Experience" co-creation story. Stats support, don't lead.
- **Source links strategy**: 3-4 key links on scenario landing page (AWS case study, ai.gov.uk, LGA). Full list of 30+ sources in explore/extend section.

### Official Sources to Link

#### Tier 1 — Scenario Landing Page (3-4 links)
- **AWS Case Study**: https://aws.amazon.com/solutions/case-studies/swindon-borough-council-case-study-amazon-translate/
- **CDDO AI Knowledge Hub (Tool)**: https://ai.gov.uk/knowledge-hub/tools/document-translate/
- **CDDO AI Knowledge Hub (Simply Readable)**: https://ai.gov.uk/knowledge-hub/tools/simply-readable/
- **LGA Case Study**: https://www.local.gov.uk/case-studies/swindon-borough-council-simply-readable-ai-easy-read-solution

#### Tier 2 — Explore/Extend Page (full list)

**AWS Official:**
- AWS Public Sector Blog (Bedrock/Simply Readable): https://aws.amazon.com/blogs/publicsector/swindon-borough-council-makes-vital-public-information-more-accessible-using-amazon-bedrock/
- AWS ML Blog (Amazon Translate): https://aws.amazon.com/blogs/machine-learning/improving-inclusion-and-accessibility-through-automated-document-translation-with-an-open-source-app-using-amazon-translate/
- AWS Samples docs site: https://aws-samples.github.io/document-translation/
- GitHub repo: https://github.com/aws-samples/document-translation

**GOV.UK / Central Government:**
- ai.gov.uk use case: https://ai.gov.uk/knowledge-hub/use-cases/document-translate/
- GOV.UK Debt Toolkit Case Study 9: https://www.gov.uk/government/publications/public-sector-toolkits/debt-management-communications-toolkit-v1

**Local Government & Industry:**
- Socitm (Translate): https://socitm.net/resource-hub/case-studies/translate-machine-learning-swindon-bc/
- Socitm (Simply Readable): https://socitm.net/resource-hub/case-studies/simply-readable-ai-solution-swindon-bc/
- Digital Leaders (Translate): https://digileaders.com/how-one-council-used-machine-learning-to-cut-translation-costs-by-99-6/
- Digital Leaders (Simply Readable): https://digileaders.com/swindon-borough-council-innovates-with-generative-ai-to-transform-access-to-vital-information-service-accessibility-by-an-ai-enabled-easy-read-solution/
- UKAuthority (overview): https://www.ukauthority.com/articles/swindon-grabs-tech-opportunities-to-reimagine-services/
- UKAuthority (GenAI): https://www.ukauthority.com/articles/swindon-develops-genai-for-easy-read-documents/
- Cities Today: https://cities-today.com/council-slashes-translation-costs-with-machine-learning/
- LGC Plus: https://www.lgcplus.com/idea-exchange/idea-exchange-our-ai-solution-helps-improve-independence-of-people-with-learning-disabilities-30-04-2024/
- CityTrax case study: https://www.citytrax.co.uk/news/how-swindon-council-used-translate-to-cut-translation-costs-by-996
- CityTrax product: https://www.citytrax.co.uk/solution/translate
- Swindon BC press release: https://www.swindon.gov.uk/news/article/539/council_staff_are_recognised_for_their_industry-leading_work_in_emerging_technology
- The Swindonian: https://theswindonian.co.uk/news/swindon-borough-council-uses-artificial-intelligence-to-support-individuals-with-learning-disabilities/

#### Key Statistics
- Translation cost: £160 → £0.07 per document (99.96% reduction)
- Translation time: 19 days → 14 minutes
- Annual translation spend (Paediatric Therapy): £64,000 → £27
- Easy Read cost: £120/page → ~1p/page
- 75 languages supported
- 98% community satisfaction
- Adopted by: Edinburgh, Newport, Southampton, West Berkshire, plus France
- Translation ROI: 6,300,000%
- Easy Read ROI (Adult Social Care): 749,900%

#### Key People
- Philip Murkin — Chief Digital Officer, Swindon BC
- Sarah Pena — Head of Emerging Technology, Swindon BC
- "Experts by Experience of a Learning Disability" — co-creation focus group

## Implementation Plan

### Execution Strategy

**Sequential with hard gate, minimum-change philosophy.** Phase 1 (infrastructure) must be fully verified before Phase 2 (portal content) begins. If any deployment or verification step fails, STOP and ask the user — do not proceed, paper over issues, or build elaborate workarounds. The user can relax SCPs or adjust account configuration as needed.

**Key principle:** Make the absolute bare minimum changes to the upstream application. Clone the upstream CDK, apply lightweight patches (diffs, CDK Aspects, wrapper scripts) to make it ISB-compatible, synthesize to CloudFormation, and deploy via StackSet. Do NOT rewrite constructs that already work upstream. AWS profiles `NDX/SandboxUser` and `NDX/SandboxAdmin` are already available for deployment.

### Tasks

#### Phase 1: Infrastructure — CDK Stack & Deployment

- [ ] Task 0: Pre-flight checks — SCP, Bedrock, and service compatibility
  - Action: Verify the sandbox account supports all required services. Using `--profile NDX/SandboxUser` in us-east-1:
    1. Verify Bedrock model access: `aws bedrock list-foundation-models --by-provider Anthropic --region us-east-1` and `aws bedrock list-foundation-models --by-provider "Stability AI" --region us-east-1`. Confirm Claude 3 Haiku and Stable Diffusion models are available.
    2. Test EventBridge Pipes permissions: `aws pipes list-pipes --region us-east-1`
    3. Test AppSync permissions: `aws appsync list-graphql-apis --region us-east-1`
    4. Test WAFv2 permissions: `aws wafv2 list-web-acls --scope REGIONAL --region us-east-1`
    5. Test Comprehend permissions: `aws comprehend detect-dominant-language --text "hello" --region us-east-1`
    6. Verify Amazon Translate: `aws translate translate-text --text "hello" --source-language-code en --target-language-code cy --region us-east-1`
  - Notes: **If ANY pre-flight check fails, STOP and ask the user.** The user will adjust SCPs. Do not begin CDK work until all services are confirmed accessible. Use `--profile NDX/SandboxAdmin` if `NDX/SandboxUser` lacks permissions for any check.

- [ ] Task 1: Clone upstream and assess minimum required changes
  - Action: Clone `aws-samples/document-translation` v3.4.0. Assess what the **minimum** changes are to make it deploy as a standalone StackSet-compatible template:
    1. **Identify pipeline dependencies:** Find where the upstream CDK depends on CodePipeline, CodeBuild, SSM Parameter Store, GitHub tokens. These are the layers to strip/bypass.
    2. **React build-time config:** Determine if the React app can be pre-built with placeholders and reconfigured at deploy time (runtime injection via `window.__CONFIG__` or similar).
    3. **Lambda functions:** Catalogue all Lambda functions — sizes, runtimes, dependencies. Determine which need bundling as S3-hosted zips vs. which can be inlined.
    4. **ISB compatibility gaps:** Identify what needs to change for ISB (IAM role naming `InnovationSandbox-ndx-*`, no CDK asset hashes, environment-agnostic synthesis).
  - Output: Brief notes in `cloudformation/scenarios/simply-readable/UPSTREAM-ANALYSIS.md`.
  - Notes: The goal is to understand the minimum diff — not to plan a rewrite. Reuse upstream constructs wherever possible.

- [ ] Task 2: Pre-build React frontend and Lambda zips
  - Action: Using the upstream repo:
    1. **React build:** `cd website && npm install && npm run build`. If build-time config is needed, use placeholder values and plan a lightweight runtime injection patch. Copy built output to `cloudformation/scenarios/simply-readable/website-build/`.
    2. **Lambda zips:** For each Lambda function, create a zip bundle at `cloudformation/scenarios/simply-readable/lambda/{functionName}.zip`. Use esbuild or similar for TypeScript compilation. External `@aws-sdk/*` (Lambda runtime provides it).
    3. Verify all builds succeed.
  - Notes: These pre-built artifacts will be uploaded to the ISB blueprints S3 bucket. The CDK template will reference them via `S3Bucket`/`S3Key` — NOT via CDK asset hashes. This is critical for StackSet compatibility. Create a build script (`scripts/build-lambdas.js`, `scripts/build-website.js`) to make this repeatable.

- [ ] Task 3: Adapt upstream CDK for ISB deployment
  - Action: Apply the **minimum changes** to the upstream CDK to make it ISB-compatible. Preferred approaches, in order:
    1. **CDK Aspects** (best): Use a CDK Aspect to rename all IAM roles to `InnovationSandbox-ndx-*` pattern. This requires zero changes to upstream construct files.
    2. **Wrapper entry point** (good): Create a new `bin/app.ts` that instantiates the upstream stack without the pipeline wrapper, with ISB-specific config.
    3. **Patch files** (acceptable): Where upstream source must be modified, keep changes minimal and document the diff clearly.
    4. **Rewrite** (last resort): Only rewrite a construct if patching is genuinely harder than rewriting.
  - Key ISB adaptations needed:
    - Strip CodePipeline/CodeBuild wrapper — instantiate the app stack directly
    - Replace SSM Parameter Store config with hardcoded values or CloudFormation parameters
    - Replace CDK asset references (Lambda code, website) with S3 bucket/key references to the ISB blueprints bucket
    - Add ISB role naming Aspect for SCP compatibility
    - Add Custom Resource for runtime config injection (React app needs Cognito/AppSync endpoints at deploy time)
    - Ensure no explicit `env` (environment-agnostic for StackSets)
  - Notes: **Do NOT rewrite upstream constructs that already work.** The auth, API, translation, and readable constructs are well-factored upstream — adapt them, don't rebuild them. If a construct uses an external package (e.g., `awscdk-appsync-utils`), evaluate whether it's simpler to keep the dependency or replace it — prefer keeping it if it works.

- [ ] Task 4: CDK synth and validate template
  - File: `cloudformation/scenarios/simply-readable/template.yaml`
  - Action: Run `npx cdk synth` and verify the synthesized template:
    1. Is a single, self-contained CloudFormation template with NO CDK asset hash references
    2. All Lambda `Code` properties reference S3 bucket/key (not local paths)
    3. Template size is within CloudFormation limits (target <500KB, hard limit 1MB for S3-hosted)
    4. All `Fn::Sub` references to the blueprints bucket resolve correctly
  - Notes: If there are issues, fix them with minimal changes. If template exceeds 500KB, consider extracting Step Functions state machine definitions into separate S3-hosted files.

- [ ] Task 5: Deploy to sandbox
  - Action: Using `--profile NDX/SandboxUser`, deploy to us-east-1. First upload the Lambda zips and website build to the blueprints bucket (since the template references them), then deploy the template:
    1. `aws s3 sync cloudformation/scenarios/simply-readable/lambda/ s3://ndx-try-isb-blueprints-{ACCOUNT_ID}/scenarios/simply-readable/lambda/ --profile NDX/SandboxUser`
    2. `aws s3 sync cloudformation/scenarios/simply-readable/website-build/ s3://ndx-try-isb-blueprints-{ACCOUNT_ID}/scenarios/simply-readable/website-build/ --profile NDX/SandboxUser`
    3. `aws cloudformation deploy --template-file cloudformation/scenarios/simply-readable/template.yaml --stack-name ndx-try-simply-readable --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --region us-east-1 --profile NDX/SandboxUser` (use `--s3-bucket` if template >51KB)
  - Notes: Expected deployment time: 20-35 minutes (CloudFront distribution alone takes 15-25 min). **If deployment fails, STOP and ask the user.** Report the specific error. The user can relax SCPs, adjust account config, or advise on next steps. Do NOT delete the failed stack without user confirmation. Use `--profile NDX/SandboxAdmin` if `NDX/SandboxUser` lacks permissions.

- [ ] Task 6: **HARD GATE — Verify deployment end-to-end**
  - Action: Verify ALL of the following work correctly in the deployed sandbox:
    1. CloudFront URL from `AppUrl` output loads the React web app (not a blank page, not a CloudFront error)
    2. Verify the app can authenticate — Cognito login works with admin credentials from Secrets Manager (`AdminPasswordSecret` output)
    3. Verify the app can make API calls — the dashboard loads data (tests runtime config injection worked)
    4. Upload a sample document (a council tenancy agreement or planning notice — realistic content, not "hello world")
    5. Document Translation: translate to Welsh and Polish — verify both complete and output is downloadable
    6. Simply Readable: convert a document to Easy Read format — verify simplified text and auto-generated images
    7. Verify all CloudFormation Outputs are correct and accessible
  - Notes: **If ANY step fails, STOP and ask the user** with specific failure details and any error messages/logs. Do not proceed to Phase 2. Do not attempt workarounds. The user can adjust SCPs, enable Bedrock model access, or advise on fixes.

- [ ] Task 7: Update ISB hub for directory uploads
  - File: `cloudformation/isb-hub/lib/isb-hub-stack.ts`
  - Action: Two changes:
    1. Add `{ name: 'simply-readable', description: 'NDX:Try Simply Readable - Document Translation & Easy Read, built by Swindon Borough Council' }` to the `SCENARIOS` array.
    2. Update the `BucketDeployment` for `simply-readable` to upload the full scenario directory (not just `template.yaml`). Include lambda zips and website build in the upload.
  - Notes: Both changes must be in the same commit as `template.yaml`, `lambda/`, and `website-build/` to maintain atomicity.

- [ ] Task 8: Create BLUEPRINT.md
  - File: `cloudformation/scenarios/simply-readable/BLUEPRINT.md`
  - Action: Create ISB blueprint registration guide following LocalGov Drupal pattern. Include:
    - Prerequisites: Bedrock model access (Claude 3 Haiku, Stability AI Stable Diffusion) enabled in us-east-1. Required services not SCP-blocked.
    - S3 upload commands for template.yaml, lambda/, and website-build/
    - StackSet creation: self-managed, ISB roles, CAPABILITY_IAM + CAPABILITY_NAMED_IAM, managed execution
    - Deployment timeout: 35 minutes
    - Verification steps matching Task 6
  - Notes: Document that this scenario requires the ISB blueprints bucket to contain Lambda zips and website build in addition to the template.

#### Phase 2: Portal Content (only after Phase 1 Task 6 passes)

- [ ] Task 9: Capture screenshots of deployed app
  - Action: Using the verified deployed app from Task 13, capture screenshots of:
    1. Login page (Cognito hosted UI or app login)
    2. Main dashboard / document list view
    3. Document upload interface
    4. Translation in progress / completed
    5. Translated document output (showing a real council document in Welsh/Polish)
    6. Simply Readable: Easy Read conversion in progress
    7. Simply Readable: Easy Read output with generated images (the "wow" shot)
    8. Language selector / settings
    9. CloudFormation Outputs tab showing the stack outputs
  - Action: Upload screenshots to S3: `aws s3 sync screenshots/ s3://ndx-try-screenshots/current/simply-readable/ --profile NDX/SandboxUser`
  - Action: Copy fallback images to `src/assets/images/screenshots/simply-readable/` for local dev (these are git-tracked fallbacks only; production serves from S3)
  - Notes: Use realistic sample content — a council tenancy agreement, planning notice, or similar. Screenshots should be 1920x1080. S3 is the primary source; local copies are fallbacks only (fixes F12).

- [ ] Task 10: Add scenario entry to scenarios.yaml
  - File: `src/_data/scenarios.yaml`
  - Action: Add complete scenario entry for `simply-readable` with all required fields per schema. Key values:
    - `id: "simply-readable"`, `name: "Simply Readable"`, `difficulty: "intermediate"`, `timeEstimate: "25 minutes"`
    - `primaryPersona: "service-manager"`, `secondaryPersonas: ["technical", "leadership"]`
    - `headline`: Something celebrating Swindon and the capability (e.g., "AI-powered document translation and Easy Read, built by Swindon Borough Council")
    - `awsServices`: Amazon Translate, Amazon Bedrock, Amazon Cognito, Amazon S3, Amazon CloudFront, AWS Step Functions, AWS Lambda, Amazon DynamoDB, AWS AppSync, AWS WAF, Amazon Comprehend
    - `deployment`: templateUrl pointing to ISB blueprints S3 bucket, region us-east-1, outputs from Task 8
    - `sourceCode`: repoUrl to upstream `aws-samples/document-translation`, cloudformationPath to our CDK dir
    - `success_metrics`, `security_posture`, `tco_projection`: These are OPTIONAL per schema (not required at the top level). Include them with realistic values based on Swindon's published statistics since they add value, but they are not validation blockers.
    - `relatedScenarios`: `["council-chatbot", "text-to-speech", "foi-redaction"]`
    - `featured: true`, `order: 2`
  - Notes: Validate against `schemas/scenario.schema.json` after writing. Cross-reference every field name against the schema to ensure no unrecognised fields are added (`additionalProperties: false` will reject them). Also update the 3 related scenarios (`council-chatbot`, `text-to-speech`, `foi-redaction`) to add `simply-readable` to their `relatedScenarios` arrays for bidirectional cross-linking.

- [ ] Task 11: Create scenario page
  - File: `src/scenarios/simply-readable.njk`
  - Action: Create minimal scenario page with 4-field frontmatter: `layout: layouts/scenario.njk`, `title: "Simply Readable"`, `description` (50-500 chars), `scenario: simply-readable`. The layout handles all rendering.
  - Notes: Follow exact pattern of `src/scenarios/localgov-drupal.njk`.

- [ ] Task 12: Add walkthrough metadata
  - File: `src/_data/walkthroughs.yaml`
  - Action: Add `simply-readable` entry under `walkthroughs` with: `totalSteps: 5`, `url: "/walkthroughs/simply-readable/"`, `title: "Simply Readable Walkthrough"`, `duration: "25 minutes"`, `hasWalkthrough: true`, `category: "accessibility"`, and 5 step definitions with titles, descriptions, and time estimates.
  - Notes: Steps: 1) Access the app (3 min), 2) Translate a document (5 min), 3) Create Easy Read version (5 min), 4) Explore features (5 min), 5) Understand the architecture (7 min). The 25-minute total excludes deployment time — ISB handles deployment automatically when a lease is approved, so the app is already running when the user starts the walkthrough. Step 1 is "here's your deployed app, let's access it" not "deploy the app."

- [ ] Task 13: Create walkthrough landing page
  - File: `src/walkthroughs/simply-readable/index.njk`
  - Action: Create walkthrough landing page following LocalGov Drupal pattern. Include: value proposition panel celebrating Swindon's innovation, "developed with public sector for public sector" messaging, key statistics (99.96% cost reduction, 75 languages), step list from walkthrough data, prerequisites section, CTA button to start.
  - Notes: Lead with the people story — mention "Experts by Experience" co-creation. Include Tier 1 source links (AWS case study, ai.gov.uk, LGA).

- [ ] Task 14: Create walkthrough steps 1-5
  - File: `src/walkthroughs/simply-readable/step-1.njk` — Access the App
  - File: `src/walkthroughs/simply-readable/step-2.njk` — Translate a Document
  - File: `src/walkthroughs/simply-readable/step-3.njk` — Create Easy Read Version (hero step)
  - File: `src/walkthroughs/simply-readable/step-4.njk` — Explore Features
  - File: `src/walkthroughs/simply-readable/step-5.njk` — Understand the Architecture
  - Action: Create each step following the LocalGov Drupal walkthrough step pattern. Frontmatter with `layout: layouts/walkthrough.njk`, `currentStep`, `totalSteps: 5`, `scenarioId: simply-readable`, `timeEstimate`. Include `{% include "components/walkthrough-step.njk" %}`. Add step-specific instructions, screenshots, troubleshooting details sections.
  - Notes: Step 3 (Easy Read) is the "wow moment" — give it the most detailed content and best screenshots. Step 5 (Architecture) should explain how Amazon Translate, Bedrock, Step Functions, and the other services work together. Include a data flow description.

- [ ] Task 15: Create walkthrough completion page
  - File: `src/walkthroughs/simply-readable/complete.njk`
  - Action: Create completion page following LocalGov Drupal pattern. Confirmation panel, 4 key takeaway cards (Document Translation, Easy Read, Open Source, Built by Local Gov), "What's next" section with explore links, cleanup instructions component, related scenarios grid.
  - Notes: Celebrate Swindon's contribution in the takeaway cards. Link to explore pages.

- [ ] Task 16: Create screenshot YAML data
  - File: `src/_data/screenshots/simply-readable.yaml`
  - Action: Create screenshot manifest with `scenario: simply-readable`, `scenarioTitle: "Simply Readable"`, `totalSteps: 5`. Define screenshots for each step with: id, filename, alt text, caption, width (1920), height (1080), and annotations where useful.
  - Notes: Screenshot filenames must match files uploaded to S3 in Task 15. Alt text must be descriptive for accessibility.

- [ ] Task 17: Create explore/understand page
  - File: `src/walkthroughs/simply-readable/explore/understand/index.njk`
  - Action: Create architecture exploration page following LocalGov Drupal pattern. Include: architecture overview (how Amazon Translate, Bedrock, Cognito, Step Functions, S3, CloudFront, AppSync, DynamoDB, Lambda work together), service cards for each AWS service used, data flow description (document upload → S3 → Step Functions → Translate/Bedrock → S3 → user download), cost breakdown, security overview.
  - Notes: Explain the event-driven architecture (DynamoDB Streams → EventBridge Pipes → Step Functions). Explain identity-scoped S3 storage pattern.

- [ ] Task 18: Create explore/extend page
  - File: `src/walkthroughs/simply-readable/explore/extend/index.njk`
  - Action: Create next-steps page with persona-specific pathways and the full list of Tier 2 source links. Include links to all 30+ official sources grouped by category (AWS Official, GOV.UK, Local Government, Industry Media).
  - Notes: This is where the celebration of Swindon's work really shines. Include key people, key statistics, adoption by other councils.

- [ ] Task 19: Create extended data YAML
  - File: `src/_data/extend/simply-readable.yaml`
  - Action: Create persona-specific next steps data. Personas: Service Manager (community links, business case resources), IT/Technical Lead (architecture review, source code, AWS partners), Content/Accessibility Officer (Easy Read guidance, translation best practices). Each persona gets 3-4 next-step actions with titles, descriptions, URLs, and external flags.
  - Notes: Include links to upstream documentation (aws-samples.github.io/document-translation/), CityTrax (commercial support option), LGA/Socitm case studies.

- [ ] Task 20: Validate and build
  - Action: Run schema validation (`npm run validate-schema` or equivalent), Eleventy build (`npm run build`), check for build errors. Verify the new scenario page renders correctly. Verify walkthrough navigation works (previous/next buttons, progress bar, step linking). Verify related scenarios cross-link bidirectionally.
  - Notes: Fix any validation or build errors before marking complete. All new pages must pass accessibility checks.

- [ ] Task 21: Clean up sandbox deployment
  - Action: After screenshots are captured and walkthrough content verified against the real app, delete the sandbox stack: `aws cloudformation delete-stack --stack-name ndx-try-simply-readable --region us-east-1 --profile NDX/SandboxUser`. Wait for DELETE_COMPLETE. Verify no orphaned resources remain (CloudFront distributions, Cognito User Pools, S3 buckets with data).
  - Notes: The Custom Resource should empty the CloudFront origin S3 bucket on DELETE to allow clean teardown. Content buckets may need manual emptying if they contain uploaded documents. Confirm with user before deleting.

### Acceptance Criteria

#### Phase 1: Infrastructure

- [ ] AC0: Given the sandbox account (`--profile NDX/SandboxUser`), when pre-flight checks (Task 0) are run, then all required services (Bedrock, EventBridge Pipes, AppSync, WAFv2, Comprehend, Translate) are accessible. If any fail, user adjusts SCPs.
- [ ] AC1: Given the adapted upstream CDK, when `npx cdk synth` is run, then a valid CloudFormation template is produced with NO CDK asset hash references — all Lambda code references S3 bucket/key, template size within limits.
- [ ] AC2: Given the synthesized template with Lambda zips and website build uploaded to the blueprints S3 bucket, when deployed to us-east-1 via `aws cloudformation deploy`, then the stack reaches CREATE_COMPLETE within 35 minutes.
- [ ] AC3: Given the deployed stack, when accessing the CloudFront URL from the `AppUrl` output, then the React web app loads and the login page is displayed.
- [ ] AC4: Given the deployed stack, when logging in with admin credentials, then authentication succeeds AND the dashboard loads data (proving runtime config injection worked).
- [ ] AC5: Given a logged-in user, when uploading a .docx document and selecting Welsh as the target language, then the document is translated and available for download within 2 minutes.
- [ ] AC6: Given a logged-in user, when submitting a document for Simply Readable (Easy Read) processing, then the document is simplified with auto-generated images and available for download.
- [ ] AC7: Given the ISB hub stack with the `simply-readable` SCENARIOS entry AND the template.yaml + lambda/ + website-build/ files committed atomically, when `cdk synth` is run, then the hub synthesizes successfully with the StackSet definition included.
- [ ] AC8: Given the BLUEPRINT.md, when following its instructions, then the ISB blueprint registration can be completed with correct directory uploads and StackSet creation.
- [ ] AC9: Given the upstream `aws-samples/document-translation` CDK, the total diff of changes made is minimal — CDK Aspects and wrapper entry point preferred over rewriting upstream constructs.

#### Phase 2: Portal Content

- [ ] AC10: Given the new scenario entry in `scenarios.yaml`, when `npm run validate-schema` is run, then validation passes with no errors.
- [ ] AC11: Given the new scenario and walkthrough pages, when `npm run build` is run, then the Eleventy build succeeds with no errors.
- [ ] AC12: Given the built site, when navigating to `/scenarios/simply-readable/`, then the scenario page renders correctly.
- [ ] AC13: Given the walkthrough, when clicking through steps 1-5, then each step renders with correct navigation.
- [ ] AC14: Given screenshots captured from the deployed app, when referenced in the screenshot YAML, then all screenshots load from S3.
- [ ] AC15: Given the 3 related scenarios, when their `relatedScenarios` arrays are checked, then each includes `simply-readable` for bidirectional cross-linking.

## Additional Context

### Dependencies

- **Sandbox account is OPEN and available** — `--profile NDX/SandboxUser` (standard) and `--profile NDX/SandboxAdmin` (admin) are ready to use
- **User can relax SCPs** — if any service is blocked, STOP and ask the user. Do not build workarounds.
- Amazon Bedrock model access enabled in us-east-1 (Anthropic Claude 3 Haiku, Stability AI Stable Diffusion) — verified in Task 0
- Amazon Translate, Comprehend, AppSync, WAFv2, EventBridge Pipes available and not SCP-blocked in us-east-1 — verified in Task 0
- S3 bucket for screenshot hosting (`ndx-try-screenshots`)
- S3 bucket for ISB blueprints (`ndx-try-isb-blueprints-568672915267`) in us-east-1
- GitHub repo access for `aws-samples/document-translation` (public, MIT-0 license)
- Node.js v22+ for CDK and React builds
- Upstream CDK dependencies are acceptable — do NOT replace working external packages unless they cause deployment issues

### Testing Strategy

- **Pre-flight**: All required AWS services accessible in sandbox (Task 0). If blocked, ask user to relax SCPs.
- **CDK synth**: Template synthesizes with no CDK asset references
- **Deployment**: Stack deploys to us-east-1 and reaches CREATE_COMPLETE using `--profile NDX/SandboxUser`
- **Functional verification**: All 7 verification checks in Task 6 pass (including runtime config injection)
- **Schema validation**: Scenario entry validates against `schemas/scenario.schema.json`
- **Eleventy build**: Site builds without errors with new scenario
- **Screenshots**: All referenced screenshots exist and load from S3
- **Navigation**: Walkthrough step navigation works correctly
- **Cross-linking**: Related scenarios bidirectionally reference simply-readable
- **Cleanup**: Sandbox stack deleted after screenshots captured (user confirms)

### Upstream Architecture Deep Dive

**aws-samples/document-translation v3.4.0 Architecture:**

The upstream project deploys via a self-mutating CDK Pipeline (CodePipeline + CodeBuild). The application stack (`DocTranStack`) creates:

1. **Authentication**: Cognito User Pool (password policy, advanced security ENFORCED, optional MFA, optional SAML 2.0) + Identity Pool (scoped IAM roles per identity)
2. **API**: AppSync GraphQL with code-first schema, Cognito auth, WAF protection
3. **Web UI**: React app (Cloudscape Design System) hosted on S3 via CloudFront (OAI, TLS 1.2+)
4. **Document Translation**: S3 content bucket (identity-scoped paths), DynamoDB job table, Step Functions workflows (Main → Translate/PII/Callback/Errors/Lifecycle), Lambda functions, EventBridge
5. **Simply Readable**: S3 content bucket, DynamoDB job + model tables, Step Functions (Main → Generate), Lambda functions (docToHtml, htmlToMd, invokeBedrock), EventBridge Pipes (DDB stream → Step Functions)
6. **Bedrock Models**: Anthropic Claude 3 (text simplification via Converse API), Stability AI Stable Diffusion (image generation). Dispatched by model ID in Step Functions Choice state.

**Key Design Patterns:**
- Identity-scoped S3 storage: `private/{cognito_sub}/*`
- Step Functions callback pattern for async operations
- Code-first GraphQL via `awscdk-appsync-utils`
- Feature flags: translation and readable are independently toggleable
- Config via SSM Parameter Store (wizard-driven)

**ISB Adaptation Challenge (minimum-change approach):**
The upstream project is pipeline-driven. To adapt it for ISB StackSet deployment with the **bare minimum changes**:
1. Strip the CodePipeline wrapper — instantiate the app stack directly via a new entry point
2. Pre-build and bundle the React frontend and Lambda zips as S3-hosted artifacts
3. Replace SSM Parameter Store config with hardcoded values or CloudFormation parameters
4. Add a CDK Aspect to rename all IAM roles to `InnovationSandbox-ndx-*` for SCP compatibility
5. Add a Custom Resource for runtime config injection (React app needs deploy-time endpoints)
6. Keep upstream construct code intact wherever possible — patch, don't rewrite

### Party Mode Insights (2026-03-04)

**Session 1 — Initial Spec Review:**
- **Architecture (Winston)**: Upstream CDK already has constructs defined — we're adapting, not building from scratch. Cognito User Pools for auth means we need to think about credential bootstrapping (similar to LocalGov Drupal's Secrets Manager dynamic references pattern). Environment-agnostic CDK synthesis is proven.
- **Business (Mary)**: Lead with the people story, not the tech. The "Experts by Experience" co-creation with residents who have learning disabilities is the hero narrative. Stats back it up but don't lead with them. Curate source links: 3-4 key ones on landing page, full list in explore section.
- **UX (Sally)**: The Easy Read transformation is the "wow moment" — needs the best screenshots. Frame Step 3 as the hero step. Walkthrough emotional journey: inspired → empowered → understanding. Headline on scenario card should capture both the what and the who.

**Session 2 — Execution Strategy (Post-Investigation):**
- **Architecture (Winston)**: Upstream is pipeline-married (CodePipeline + SSM config + GitHub token). Not compatible with ISB StackSets. Need to strip pipeline wrapper with minimum changes. Can reference/adapt upstream constructs from `infrastructure/lib/features/` — don't rewrite what works. CDK Aspects for ISB role naming. Pre-build React frontend and bundle as S3 asset.
- **Dev (Amelia)**: Upstream constructs in `api.ts`, `web.ts`, `translation/translation.ts`, `readable/readable.ts` are reasonably well-factored. Adapt with patches, don't rewrite. Keep the diff minimal so future upstream updates can be merged.
- **PM (John)**: Single spec, sequential execution with hard gate. Infrastructure proven before content begins. No placeholder deployments. Acceptance criteria must include "all AWS services verified functional in deployed sandbox."
- **User directive**: Minimum changes to upstream. Adapt CDK → deploy → prove it works → **stop and ask if anything isn't right** → then build portal content. User can relax SCPs. No workarounds, no rewrites unless absolutely necessary.
