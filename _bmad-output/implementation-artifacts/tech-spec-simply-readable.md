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
  - 'CDK → synthesized CloudFormation referencing co-located S3 assets (Lambda zips + React build)'
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
- **ISB adaptation approach**: Create a NEW standalone CDK stack (`cloudformation/scenarios/simply-readable/cdk/`) that deploys the same AWS resources (Cognito, S3, CloudFront, Step Functions, Lambda, DynamoDB, AppSync) but without the CodePipeline wrapper. This follows the LocalGov Drupal pattern — environment-agnostic, single synthesized template. The React frontend can be pre-built and bundled as an S3 asset.
- **Execution approach**: Sequential with hard gate. Build CDK stack → deploy to sandbox → verify ALL services work end-to-end (Cognito login, document upload, translation, Simply Readable, CloudFront UI) → **STOP if anything fails and report to user** → only after verified deployment, proceed to portal content. No compromises, no papering over issues.
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

**Sequential with hard gate.** Phase 1 (infrastructure) must be fully verified before Phase 2 (portal content) begins. If any deployment or verification step fails, STOP and report to user — do not proceed or paper over issues.

### Tasks

#### Phase 1: Infrastructure — CDK Stack & Deployment

- [ ] Task 0: Pre-flight checks — SCP, Bedrock, and service compatibility
  - Action: Before any CDK work, verify the sandbox account supports all required services. Using SSO profile `NDX/SandboxUser` in us-east-1:
    1. Verify Bedrock model access: `aws bedrock list-foundation-models --by-provider Anthropic --region us-east-1` and `aws bedrock list-foundation-models --by-provider "Stability AI" --region us-east-1`. Confirm Claude 3 Sonnet and Stable Diffusion models are available.
    2. Test EventBridge Pipes permissions: attempt `aws pipes list-pipes --region us-east-1` — if access denied, EventBridge Pipes is SCP-blocked.
    3. Test AppSync permissions: `aws appsync list-graphql-apis --region us-east-1`
    4. Test WAFv2 permissions: `aws wafv2 list-web-acls --scope REGIONAL --region us-east-1`
    5. Test Comprehend permissions: `aws comprehend detect-dominant-language --text "hello" --region us-east-1`
    6. Verify Amazon Translate: `aws translate translate-text --text "hello" --source-language-code en --target-language-code cy --region us-east-1`
  - Notes: **If ANY pre-flight check fails, STOP and report to the user.** The user will adjust SCPs. Do not begin CDK work until all services are confirmed accessible. This prevents wasting a 30-minute deploy cycle on a predictable failure.

- [ ] Task 1: Clone upstream and investigate React build-time config requirements
  - Action: Clone `aws-samples/document-translation` v3.4.0. Investigate two critical questions:
    1. **React build-time config:** Read `website/src/` to determine if Amplify v6 requires `amplifyconfiguration.json` at build time or if it supports runtime injection. Search for `Amplify.configure()` calls and check if config is imported statically or loaded dynamically. If build-time config is required, test building with placeholder values (dummy region, dummy pool ID) and verify the bundle can be reconfigured at runtime via a `window.__CONFIG__` pattern or similar.
    2. **Lambda function sizes:** For each Lambda in `infrastructure/lambda/`, measure the source code size and identify dependencies. Determine which can be inlined (<4KB) vs. which need S3-hosted zips. List all Lambda functions with: name, approximate size, runtime, required IAM permissions.
  - Output: Document findings in `cloudformation/scenarios/simply-readable/UPSTREAM-ANALYSIS.md` — this file is referenced by subsequent tasks.
  - Notes: This replaces the old "analyse and document dependency graph" task with specific, verifiable deliverables.

- [ ] Task 2: Pre-build React frontend and Lambda zips
  - Action: Based on Task 1 findings:
    1. **React build:** `cd website && npm install && npm run build`. If build-time config is needed, use placeholder values. Copy built output to `cloudformation/scenarios/simply-readable/website-build/`.
    2. **Lambda zips:** For each Lambda function identified in Task 1, create a zip bundle at `cloudformation/scenarios/simply-readable/lambda/{functionName}.zip`. Include only the function code and any dependencies not available in the Lambda runtime.
    3. Verify all builds succeed.
  - Notes: These pre-built artifacts will be uploaded to the ISB blueprints S3 bucket alongside `template.yaml`. The CDK template will reference them via `S3Bucket`/`S3Key` — NOT via CDK asset hashes. This is critical for StackSet compatibility.

- [ ] Task 3: Create CDK project scaffold
  - File: `cloudformation/scenarios/simply-readable/cdk/package.json`
  - File: `cloudformation/scenarios/simply-readable/cdk/cdk.json`
  - File: `cloudformation/scenarios/simply-readable/cdk/tsconfig.json`
  - File: `cloudformation/scenarios/simply-readable/cdk/bin/app.ts`
  - Action: Create CDK project following LocalGov Drupal pattern. Entry point creates `SimplyReadableStack` with NO explicit `env` (environment-agnostic for StackSets). Dependencies: `aws-cdk-lib ^2.241.0`, `constructs ^10.5.1` (same as LocalGov Drupal). Set `cdk.json` output to `../cdk.out`. Use `aws-cdk-lib` native `CfnIdentityPool` for Cognito Identity Pool (NOT the deprecated `@aws-cdk/aws-cognito-identitypool-alpha`). Use `aws-cdk-lib/aws-appsync` for AppSync (NOT external `awscdk-appsync-utils`).
  - Notes: Stack description: "NDX:Try Simply Readable — Document Translation & Easy Read powered by Amazon Translate and Amazon Bedrock. Originally built by Swindon Borough Council."

- [ ] Task 4: Build standalone CDK stack — Authentication
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/simply-readable-stack.ts`
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/constructs/auth.ts`
  - Action: Create Cognito User Pool (password policy, advanced security ENFORCED, self-signup disabled) + Identity Pool (using `CfnIdentityPool` from `aws-cdk-lib`). Admin user password via Secrets Manager (auto-generated, NO explicit secretName — prevents rollback collisions). Identity Pool scoped IAM roles: authenticated users get `translate:TranslateText`, `translate:TranslateDocument`, `comprehend:DetectDominantLanguage`, and S3 access scoped to `private/${cognito-identity.amazonaws.com:sub}/*`. Unauthenticated gets explicit DENY ALL. ALL IAM role names must follow `InnovationSandbox-ndx-simply-readable-*` pattern for SCP compatibility.
  - Notes: Follow upstream's auth pattern from `infrastructure/lib/features/api.ts`. Expose Cognito Pool ID, Client ID, Identity Pool ID, and admin secret ARN as construct properties (not just CloudFormation Outputs) so the config injection Custom Resource can receive them directly.

- [ ] Task 5: Build standalone CDK stack — API Layer
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/constructs/api.ts`
  - Action: Create AppSync GraphQL API using `aws-cdk-lib/aws-appsync` (native CDK constructs, NOT external packages). Cognito User Pool primary auth + IAM secondary. WAF with `AWSManagedRulesCommonRuleSet`. Replicate the GraphQL schema definitions from upstream's `infrastructure/lib/features/translation/translation.ts` and `readable/readable.ts`. Expose AppSync endpoint as construct property.
  - Notes: If `aws-cdk-lib/aws-appsync` does not support code-first schema natively, define the schema as a string literal or `.graphql` file and use `SchemaFile`. This avoids the deprecated external package dependency.

- [ ] Task 6: Build standalone CDK stack — Web UI + Config Injection
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/constructs/web.ts`
  - Action: S3 bucket (block all public access) + CloudFront distribution with OAI. TLS 1.2+. 403→`/index.html` for SPA routing. Server access logging to logging bucket. **NO `BucketDeployment` — the React build and runtime config are handled by an inline Custom Resource Lambda (<4KB).** The Custom Resource:
    1. Receives construct properties as CloudFormation resource properties (Cognito Pool ID, Client ID, Identity Pool ID, AppSync endpoint, S3 content bucket name, region) — NOT by "reading CloudFormation Outputs"
    2. Copies the pre-built React app from the ISB blueprints S3 bucket (`s3://ndx-try-isb-blueprints-{account}/scenarios/simply-readable/website-build/`) to the CloudFront origin S3 bucket
    3. Generates `aws-exports.json` with the runtime config values and writes it to the origin bucket
    4. Invalidates CloudFront cache
  - Notes: The Custom Resource Lambda must be inline (ZipFile, <4KB) to avoid CDK asset dependencies. The blueprints bucket name is derived from `Fn::Sub` using `AWS::AccountId`. On stack DELETE, the Custom Resource should empty the origin bucket to allow clean stack deletion.

- [ ] Task 7: Build standalone CDK stack — Document Translation
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/constructs/translation.ts`
  - Action: S3 content bucket (identity-scoped paths, 7-day lifecycle), DynamoDB job table (PAY_PER_REQUEST, PITR, streams NEW_AND_OLD_IMAGES, GSI `byOwnerAndCreatedAt`), Step Functions workflows (Main orchestrator, Translate, Callback, Errors, Lifecycle), EventBridge integration. Lambda functions reference S3-hosted zips: `Code: { S3Bucket: Fn::Sub('ndx-try-isb-blueprints-${AWS::AccountId}'), S3Key: 'scenarios/simply-readable/lambda/{functionName}.zip' }`. Functions: unmarshallDdb, parseS3Key, decodeS3Key, regexReplace, trim, split, passLogToEventBridge.
  - Notes: Lambda functions must specify: runtime (Node.js 20.x), memory (128-512MB as appropriate), timeout (30-300s as appropriate), and IAM execution role following `InnovationSandbox-ndx-simply-readable-*` naming. Step Functions use callback pattern for async Amazon Translate jobs.

- [ ] Task 8: Build standalone CDK stack — Simply Readable
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/constructs/readable.ts`
  - Action: S3 content bucket, DynamoDB job + model tables (with streams), Step Functions (Main orchestrator, MainRename, Generate with Bedrock model dispatch via Choice state), EventBridge Pipes (DDB stream → Step Functions, filter INSERT/MODIFY where status="generate"). Lambda functions via S3-hosted zips (same pattern as Task 7): invokeBedrock, docToHtml, htmlToMd, invokeBedrockSaveToS3, appsyncMutationRequest, unmarshallDdb.
  - Notes: Support Anthropic Claude 3 via Converse API (text simplification) and Stability AI Stable Diffusion (image generation). If EventBridge Pipes was SCP-blocked in Task 0, use DynamoDB Streams with a Lambda trigger as a fallback (functionally equivalent).

- [ ] Task 9: Build standalone CDK stack — Tagging, Outputs & Tests
  - File: `cloudformation/scenarios/simply-readable/cdk/lib/simply-readable-stack.ts`
  - File: `cloudformation/scenarios/simply-readable/cdk/test/simply-readable.test.ts`
  - Action: Add resource-level tags (`Project: ndx-try-aws-scenarios`, `Scenario: simply-readable`, `AutoCleanup: true`). Add CloudFormation Outputs: `AppUrl` (CloudFront URL), `AdminUsername` (static "admin"), `AdminPasswordSecret` (Secrets Manager console URL), `CognitoUserPoolId`, `CognitoUserPoolClientId`, `AppSyncEndpoint`, `ContentBucketName`. Write CDK snapshot test and construct assertion tests (verify Cognito pool exists, AppSync API exists, CloudFront distribution exists, at least one Step Functions state machine exists, all S3 buckets block public access).
  - Notes: No resources should use explicit physical names (except IAM roles for SCP compatibility) to prevent rollback collisions.

- [ ] Task 10: CDK synth — generate template.yaml
  - File: `cloudformation/scenarios/simply-readable/template.yaml`
  - Action: Run `cd cloudformation/scenarios/simply-readable/cdk && npm install && npm test && npx cdk synth > ../template.yaml`. Verify the synthesized template:
    1. Is a single, self-contained CloudFormation template with NO asset hash references
    2. All Lambda `Code` properties reference S3 bucket/key (not local paths)
    3. No `BucketDeployment` constructs (the Custom Resource handles web deployment)
    4. Template size is within CloudFormation limits (target <500KB, hard limit 1MB for S3-hosted)
    5. All `Fn::Sub` references to the blueprints bucket resolve correctly
  - Notes: If template exceeds 500KB, consider extracting Step Functions state machine definitions into separate S3-hosted files loaded via a Custom Resource. The ISB hub uploads the full scenario directory, so co-located files are available.

- [ ] Task 11: Update ISB hub for directory uploads
  - File: `cloudformation/isb-hub/lib/isb-hub-stack.ts`
  - Action: Two changes:
    1. Add `{ name: 'simply-readable', description: 'NDX:Try Simply Readable - Document Translation & Easy Read, built by Swindon Borough Council' }` to the `SCENARIOS` array.
    2. Update the `BucketDeployment` for `simply-readable` to upload the full scenario directory (not just `template.yaml`). Change the exclude pattern from `['*', '!template.yaml']` to `['*', '!template.yaml', '!lambda/**', '!website-build/**']` for the `simply-readable` scenario specifically.
  - Notes: Both changes must be in the same commit as `template.yaml`, `lambda/`, and `website-build/` to maintain atomicity. The ISB hub `cdk synth` will fail if template.yaml doesn't exist when the SCENARIOS entry is present. Other scenarios' exclude patterns remain unchanged.

- [ ] Task 12: Deploy to sandbox
  - Action: Using SSO profile `NDX/SandboxUser`, deploy to us-east-1. First upload the Lambda zips and website build to the blueprints bucket (since the template references them), then deploy the template:
    1. `aws s3 sync cloudformation/scenarios/simply-readable/lambda/ s3://ndx-try-isb-blueprints-{ACCOUNT_ID}/scenarios/simply-readable/lambda/ --profile NDX/SandboxUser`
    2. `aws s3 sync cloudformation/scenarios/simply-readable/website-build/ s3://ndx-try-isb-blueprints-{ACCOUNT_ID}/scenarios/simply-readable/website-build/ --profile NDX/SandboxUser`
    3. `aws cloudformation deploy --template-file cloudformation/scenarios/simply-readable/template.yaml --stack-name ndx-try-simply-readable --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --region us-east-1 --profile NDX/SandboxUser`
  - Notes: Expected deployment time: 20-35 minutes (CloudFront distribution alone takes 15-25 min). **If deployment fails, STOP immediately.** Report the specific error. If stack enters ROLLBACK_COMPLETE, note that Secrets Manager secrets without explicit names auto-generate unique physical names, so redeployment won't collide. Do NOT delete the failed stack without user confirmation.

- [ ] Task 13: **HARD GATE — Verify deployment end-to-end**
  - Action: Verify ALL of the following work correctly in the deployed sandbox:
    1. CloudFront URL from `AppUrl` output loads the React web app (not a blank page, not a CloudFront error)
    2. Verify the app can authenticate — Cognito login works with admin credentials from Secrets Manager (`AdminPasswordSecret` output)
    3. Verify the app can make API calls — the dashboard loads data (tests runtime config injection worked)
    4. Upload a sample document (a council tenancy agreement or planning notice — realistic content, not "hello world")
    5. Document Translation: translate to Welsh and Polish — verify both complete and output is downloadable
    6. Simply Readable: convert a document to Easy Read format — verify simplified text and auto-generated images
    7. Verify all CloudFormation Outputs are correct and accessible
  - Notes: **If ANY step fails, STOP and report with specific failure details and any error messages/logs.** Do not proceed to Phase 2. Do not attempt workarounds. The user may need to adjust SCPs, enable Bedrock model access, fix the Custom Resource, or make other changes.

- [ ] Task 14: Create BLUEPRINT.md
  - File: `cloudformation/scenarios/simply-readable/BLUEPRINT.md`
  - Action: Create ISB blueprint registration guide following LocalGov Drupal pattern. Include:
    - Prerequisites: Bedrock model access (Claude 3 Sonnet, Stability AI Stable Diffusion) enabled in us-east-1 in sandbox accounts. EventBridge Pipes, AppSync, WAFv2, Comprehend, Translate not SCP-blocked.
    - S3 upload commands for template.yaml, lambda/, and website-build/ (unlike simpler scenarios that only upload template.yaml)
    - StackSet creation: self-managed, ISB roles, CAPABILITY_IAM + CAPABILITY_NAMED_IAM, managed execution
    - Deployment timeout: 35 minutes (CloudFront provisioning dominates)
    - Blueprint name: `ndx-try-simply-readable`
    - Verification steps matching Task 13
  - Notes: Document that this scenario requires the ISB blueprints bucket to contain Lambda zips and website build in addition to the template.

#### Phase 2: Portal Content (only after Phase 1 Task 12 passes)

- [ ] Task 15: Capture screenshots of deployed app
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

- [ ] Task 16: Add scenario entry to scenarios.yaml
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

- [ ] Task 17: Create scenario page
  - File: `src/scenarios/simply-readable.njk`
  - Action: Create minimal scenario page with 4-field frontmatter: `layout: layouts/scenario.njk`, `title: "Simply Readable"`, `description` (50-500 chars), `scenario: simply-readable`. The layout handles all rendering.
  - Notes: Follow exact pattern of `src/scenarios/localgov-drupal.njk`.

- [ ] Task 18: Add walkthrough metadata
  - File: `src/_data/walkthroughs.yaml`
  - Action: Add `simply-readable` entry under `walkthroughs` with: `totalSteps: 5`, `url: "/walkthroughs/simply-readable/"`, `title: "Simply Readable Walkthrough"`, `duration: "25 minutes"`, `hasWalkthrough: true`, `category: "accessibility"`, and 5 step definitions with titles, descriptions, and time estimates.
  - Notes: Steps: 1) Access the app (3 min), 2) Translate a document (5 min), 3) Create Easy Read version (5 min), 4) Explore features (5 min), 5) Understand the architecture (7 min). The 25-minute total excludes deployment time — ISB handles deployment automatically when a lease is approved, so the app is already running when the user starts the walkthrough. Step 1 is "here's your deployed app, let's access it" not "deploy the app."

- [ ] Task 19: Create walkthrough landing page
  - File: `src/walkthroughs/simply-readable/index.njk`
  - Action: Create walkthrough landing page following LocalGov Drupal pattern. Include: value proposition panel celebrating Swindon's innovation, "developed with public sector for public sector" messaging, key statistics (99.96% cost reduction, 75 languages), step list from walkthrough data, prerequisites section, CTA button to start.
  - Notes: Lead with the people story — mention "Experts by Experience" co-creation. Include Tier 1 source links (AWS case study, ai.gov.uk, LGA).

- [ ] Task 20: Create walkthrough steps 1-5
  - File: `src/walkthroughs/simply-readable/step-1.njk` — Access the App
  - File: `src/walkthroughs/simply-readable/step-2.njk` — Translate a Document
  - File: `src/walkthroughs/simply-readable/step-3.njk` — Create Easy Read Version (hero step)
  - File: `src/walkthroughs/simply-readable/step-4.njk` — Explore Features
  - File: `src/walkthroughs/simply-readable/step-5.njk` — Understand the Architecture
  - Action: Create each step following the LocalGov Drupal walkthrough step pattern. Frontmatter with `layout: layouts/walkthrough.njk`, `currentStep`, `totalSteps: 5`, `scenarioId: simply-readable`, `timeEstimate`. Include `{% include "components/walkthrough-step.njk" %}`. Add step-specific instructions, screenshots, troubleshooting details sections.
  - Notes: Step 3 (Easy Read) is the "wow moment" — give it the most detailed content and best screenshots. Step 5 (Architecture) should explain how Amazon Translate, Bedrock, Step Functions, and the other services work together. Include a data flow description.

- [ ] Task 21: Create walkthrough completion page
  - File: `src/walkthroughs/simply-readable/complete.njk`
  - Action: Create completion page following LocalGov Drupal pattern. Confirmation panel, 4 key takeaway cards (Document Translation, Easy Read, Open Source, Built by Local Gov), "What's next" section with explore links, cleanup instructions component, related scenarios grid.
  - Notes: Celebrate Swindon's contribution in the takeaway cards. Link to explore pages.

- [ ] Task 22: Create screenshot YAML data
  - File: `src/_data/screenshots/simply-readable.yaml`
  - Action: Create screenshot manifest with `scenario: simply-readable`, `scenarioTitle: "Simply Readable"`, `totalSteps: 5`. Define screenshots for each step with: id, filename, alt text, caption, width (1920), height (1080), and annotations where useful.
  - Notes: Screenshot filenames must match files uploaded to S3 in Task 15. Alt text must be descriptive for accessibility.

- [ ] Task 23: Create explore/understand page
  - File: `src/walkthroughs/simply-readable/explore/understand/index.njk`
  - Action: Create architecture exploration page following LocalGov Drupal pattern. Include: architecture overview (how Amazon Translate, Bedrock, Cognito, Step Functions, S3, CloudFront, AppSync, DynamoDB, Lambda work together), service cards for each AWS service used, data flow description (document upload → S3 → Step Functions → Translate/Bedrock → S3 → user download), cost breakdown, security overview.
  - Notes: Explain the event-driven architecture (DynamoDB Streams → EventBridge Pipes → Step Functions). Explain identity-scoped S3 storage pattern.

- [ ] Task 24: Create explore/extend page
  - File: `src/walkthroughs/simply-readable/explore/extend/index.njk`
  - Action: Create next-steps page with persona-specific pathways and the full list of Tier 2 source links. Include links to all 30+ official sources grouped by category (AWS Official, GOV.UK, Local Government, Industry Media).
  - Notes: This is where the celebration of Swindon's work really shines. Include key people, key statistics, adoption by other councils.

- [ ] Task 25: Create extended data YAML
  - File: `src/_data/extend/simply-readable.yaml`
  - Action: Create persona-specific next steps data. Personas: Service Manager (community links, business case resources), IT/Technical Lead (architecture review, source code, AWS partners), Content/Accessibility Officer (Easy Read guidance, translation best practices). Each persona gets 3-4 next-step actions with titles, descriptions, URLs, and external flags.
  - Notes: Include links to upstream documentation (aws-samples.github.io/document-translation/), CityTrax (commercial support option), LGA/Socitm case studies.

- [ ] Task 26: Validate and build
  - Action: Run schema validation (`npm run validate-schema` or equivalent), Eleventy build (`npm run build`), check for build errors. Verify the new scenario page renders correctly. Verify walkthrough navigation works (previous/next buttons, progress bar, step linking). Verify related scenarios cross-link bidirectionally.
  - Notes: Fix any validation or build errors before marking complete. All new pages must pass accessibility checks.

- [ ] Task 27: Clean up sandbox deployment
  - Action: After screenshots are captured and walkthrough content verified against the real app, delete the sandbox stack: `aws cloudformation delete-stack --stack-name ndx-try-simply-readable --region us-east-1 --profile NDX/SandboxUser`. Wait for DELETE_COMPLETE. Verify no orphaned resources remain (CloudFront distributions, Cognito User Pools, S3 buckets with data).
  - Notes: The Custom Resource in Task 6 should empty the CloudFront origin S3 bucket on DELETE to allow clean teardown. Content buckets may need manual emptying if they contain uploaded documents. Confirm with user before deleting.

### Acceptance Criteria

#### Phase 1: Infrastructure

- [ ] AC0: Given the sandbox account, when pre-flight checks (Task 0) are run, then all required services (Bedrock, EventBridge Pipes, AppSync, WAFv2, Comprehend, Translate) are accessible without SCP blocks.
- [ ] AC1: Given the CDK project at `cloudformation/scenarios/simply-readable/cdk/`, when `npm test` is run, then all snapshot and construct assertion tests pass.
- [ ] AC2: Given the CDK project, when `npx cdk synth` is run, then a valid CloudFormation template is produced with NO CDK asset hash references — all Lambda code references S3 bucket/key, no `BucketDeployment` constructs, template size under 500KB.
- [ ] AC3: Given the synthesized template with Lambda zips and website build uploaded to the blueprints S3 bucket, when deployed to us-east-1 via `aws cloudformation deploy`, then the stack reaches CREATE_COMPLETE within 35 minutes.
- [ ] AC4: Given the deployed stack, when accessing the CloudFront URL from the `AppUrl` output, then the React web app loads (not blank, not CloudFront error) and the login page is displayed.
- [ ] AC5: Given the deployed stack, when logging in with admin credentials from Secrets Manager, then authentication succeeds AND the dashboard loads data (proving runtime config injection worked).
- [ ] AC6: Given a logged-in user, when uploading a .docx document and selecting Welsh as the target language, then the document is translated and available for download within 2 minutes.
- [ ] AC7: Given a logged-in user, when submitting a document for Simply Readable (Easy Read) processing, then the document is simplified with auto-generated images and available for download.
- [ ] AC8: Given the ISB hub stack with the `simply-readable` SCENARIOS entry AND the template.yaml + lambda/ + website-build/ files committed atomically, when `cdk synth` is run, then the hub synthesizes successfully with the StackSet definition included.
- [ ] AC9: Given the BLUEPRINT.md, when following its instructions, then the ISB blueprint registration can be completed with correct directory uploads and StackSet creation.

#### Phase 2: Portal Content

- [ ] AC10: Given the new scenario entry in `scenarios.yaml`, when `npm run validate-schema` is run, then validation passes with no errors. No fields outside the schema definition are present.
- [ ] AC11: Given the new scenario and walkthrough pages, when `npm run build` is run, then the Eleventy build succeeds with no errors.
- [ ] AC12: Given the built site, when navigating to `/scenarios/simply-readable/`, then the scenario page renders with correct metadata, AWS service tags, deployment section, and source links.
- [ ] AC13: Given the built site, when navigating to `/walkthroughs/simply-readable/`, then the walkthrough landing page renders with value proposition, step list, and start button.
- [ ] AC14: Given the walkthrough, when clicking through steps 1-5, then each step renders with screenshots, instructions, troubleshooting sections, and correct previous/next navigation.
- [ ] AC15: Given the walkthrough, when reaching the completion page, then takeaway cards, explore links, cleanup instructions, and related scenarios render correctly.
- [ ] AC16: Given the explore/understand page, when navigating to it, then architecture overview, service cards, data flow, and cost information render correctly.
- [ ] AC17: Given the explore/extend page, when navigating to it, then persona-specific next steps, full source link list, and Swindon celebration content render correctly.
- [ ] AC18: Given screenshots captured from the deployed app, when referenced in the screenshot YAML, then all screenshots load from S3 and display with correct alt text and captions.
- [ ] AC19: Given the 3 related scenarios (council-chatbot, text-to-speech, foi-redaction), when their `relatedScenarios` arrays are checked, then each includes `simply-readable` for bidirectional cross-linking.

## Additional Context

### Dependencies

- Access to `NDX/SandboxUser` SSO profile for deployment and screenshot capture
- Amazon Bedrock model access enabled in us-east-1 (Anthropic Claude 3 via Converse API, Stability AI Stable Diffusion) — verified in Task 0
- Amazon Translate, Comprehend, AppSync, WAFv2, EventBridge Pipes available and not SCP-blocked in us-east-1 — verified in Task 0
- S3 bucket for screenshot hosting (`ndx-try-screenshots`)
- S3 bucket for ISB blueprints (`ndx-try-isb-blueprints-568672915267`) in us-east-1
- GitHub repo access for `aws-samples/document-translation` (public, MIT-0 license)
- Node.js v22+ for CDK and React builds
- May need SCP adjustments if pre-flight checks fail (user will handle)
- All CDK constructs use `aws-cdk-lib` native packages only — NO external/alpha packages

### Testing Strategy

- **Pre-flight**: All required AWS services accessible in sandbox (Task 0)
- **CDK tests**: Snapshot tests + construct assertion tests pass (`npm test`)
- **CDK synth**: Template synthesizes with no CDK asset references, under 500KB
- **Deployment**: Stack deploys to us-east-1 and reaches CREATE_COMPLETE
- **Functional verification**: All 7 verification checks in Task 13 pass (including runtime config injection)
- **Schema validation**: Scenario entry validates against `schemas/scenario.schema.json` with no unrecognised fields
- **Eleventy build**: Site builds without errors with new scenario
- **Accessibility**: Pa11y passes on all new pages
- **Screenshots**: All referenced screenshots exist and load from S3
- **Navigation**: Walkthrough step navigation works correctly (previous/next, progress bar)
- **Cross-linking**: Related scenarios bidirectionally reference simply-readable
- **Manual**: Walkthrough steps are accurate and match the real deployed app
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

**ISB Adaptation Challenge:**
The upstream project is pipeline-driven. To create a standalone StackSet-compatible template, we need to:
1. Extract/recreate the core constructs without the pipeline wrapper
2. Pre-build and bundle the React frontend as an S3 deployment asset
3. Replace SSM Parameter Store config with CloudFormation parameters
4. Use Secrets Manager dynamic references for Cognito admin password (SCP-compatible)
5. Ensure all IAM roles follow `InnovationSandbox-ndx-*` naming

### Party Mode Insights (2026-03-04)

**Session 1 — Initial Spec Review:**
- **Architecture (Winston)**: Upstream CDK already has constructs defined — we're adapting, not building from scratch. Cognito User Pools for auth means we need to think about credential bootstrapping (similar to LocalGov Drupal's Secrets Manager dynamic references pattern). Environment-agnostic CDK synthesis is proven.
- **Business (Mary)**: Lead with the people story, not the tech. The "Experts by Experience" co-creation with residents who have learning disabilities is the hero narrative. Stats back it up but don't lead with them. Curate source links: 3-4 key ones on landing page, full list in explore section.
- **UX (Sally)**: The Easy Read transformation is the "wow moment" — needs the best screenshots. Frame Step 3 as the hero step. Walkthrough emotional journey: inspired → empowered → understanding. Headline on scenario card should capture both the what and the who.

**Session 2 — Execution Strategy (Post-Investigation):**
- **Architecture (Winston)**: Upstream is pipeline-married (CodePipeline + SSM config + GitHub token). Not compatible with ISB StackSets. Need standalone CDK stack. Can reference/adapt upstream constructs from `infrastructure/lib/features/` but don't depend on their pipeline wrapper. Pre-build React frontend and bundle as S3 asset.
- **Dev (Amelia)**: Upstream constructs in `api.ts`, `web.ts`, `translation/translation.ts`, `readable/readable.ts` are reasonably well-factored. Can import or adapt rather than full rewrite. Estimate 2-3 days CDK work.
- **PM (John)**: Single spec, sequential execution with hard gate. Infrastructure proven before content begins. No placeholder deployments. Acceptance criteria must include "all AWS services verified functional in deployed sandbox."
- **User directive**: Build stack → deploy → prove it works → **stop if anything isn't right** → then build portal content. No compromises.
