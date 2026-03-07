# Upstream Analysis: aws-samples/document-translation

**Analysed:** 2026-03-05
**Version:** v3.4.0 (commit 0cd1b4a)
**Repo:** https://github.com/aws-samples/document-translation

## React Build-Time Configuration

The React app uses **static imports** for configuration:

```typescript
// website/src/util/amplifyConfigure.tsx
const cfnOutputs = require("../cfnOutputs.json");
```

This is bundled at build time by Webpack — the JSON content is embedded in the JavaScript bundle. The app **cannot** be built once and reconfigured at runtime without modification.

### Required Config Values (cfnOutputs.json)

- `awsUserPoolsId` — Cognito User Pool ID
- `awsUserPoolsWebClientId` — Cognito App Client ID
- `awsCognitoIdentityPoolId` — Cognito Identity Pool ID
- `awsCognitoOauthDomain` — Cognito OAuth domain (if used)
- `awsRegion` — AWS region
- `awsCognitoOauthRedirectSignIn` — OAuth redirect (sign in)
- `awsCognitoOauthRedirectSignOut` — OAuth redirect (sign out)
- `awsAppsyncGraphqlEndpoint` — AppSync API URL
- `awsUserFilesS3Bucket` — S3 content bucket name

### Additional Build-Time Files

- `features.json` — Feature flags: `{ "translation": true, "readable": true }`
- GraphQL schema + codegen output (generated from AppSync)

### ISB Adaptation: Runtime Config Loading

To support ISB StackSet deployment (where config values aren't known at build time), we must patch `amplifyConfigure.tsx` to fetch config at runtime:

1. Replace `require("../cfnOutputs.json")` with `fetch('/cfnOutputs.json')`
2. Make `amplifyConfigure()` async
3. Update `App.tsx` to await config loading before rendering
4. The Custom Resource writes `cfnOutputs.json` to the S3 origin bucket at deploy time

### Amplify Version

AWS Amplify v6.x (`aws-amplify@^6.6.2`)

## Lambda Functions (12 total)

### Can Be Inlined (<4KB, no npm dependencies)

| Function | Size | Purpose |
|----------|------|---------|
| utilSplit | 219B | String splitting |
| utilTrim | 224B | String trimming |
| decodeS3Key | 285B | S3 key URL decoding |
| parseTerminologies | 384B | Extract terminology names |
| utilRegexReplace | 918B | Regex replacement |

### Require S3-Hosted Zips (npm dependencies)

| Function | Size | Dependencies | Purpose |
|----------|------|-------------|---------|
| invokeBedrock | 1.6KB | @aws-sdk/client-bedrock-runtime | Bedrock text model invoker |
| invokeBedrockSaveToS3 | 3KB | @aws-sdk/client-bedrock-runtime, @aws-sdk/client-s3 | Bedrock image gen → S3 |
| appsyncMutationRequest | 2.5KB | @aws-crypto/sha256-js, @aws-sdk/credential-provider-node, @aws-sdk/protocol-http, @aws-sdk/signature-v4 | AppSync SigV4 mutation |
| docToHtml | 1KB | mammoth, @aws-sdk/client-s3 | DOCX → HTML conversion |
| htmlToMd | 323B | turndown | HTML → Markdown conversion |
| unmarshallDdb | 260B | @aws-sdk/util-dynamodb | DynamoDB unmarshalling |
| passLogToEventBridge | 1.2KB | (none visible) | EventBridge event forwarding |

All Lambdas use Node.js 22.x runtime, ARM64 architecture.

## Bedrock Models

### Text Simplification

- **Used:** `anthropic.claude-3-haiku-20240307-v1:0` (or Claude Haiku 4.5 variant)
- **API:** Converse API
- **Status:** Available in sandbox ✅

### Image Generation

- **Used:** `stability.stable-diffusion-xl-v1` and `stability.sd3-5-large-v1:0`
- **Status:** ❌ NOT available in sandbox account
- **Substitution needed:** Use `amazon.nova-canvas-v1:0` or `amazon.titan-image-generator-v2:0`
- **Impact:** The `invokeBedrockSaveToS3` Lambda and Step Functions generate workflow need adapted request/response formats

### Model Dispatch Pattern

The readable feature uses a Choice state in Step Functions to dispatch to model-specific handlers based on model ID prefix:
- `stability.stable-diffusion-*` → SDXL handler
- `stability.sd3-*` → SD3 handler
- `anthropic.claude-3-*` → Claude handler (text)
- `*.converse` → Converse API handler (text)

For the ISB adaptation, we need to add handlers for:
- `amazon.nova-canvas-*` or `amazon.titan-image-*` for image generation

## CDK Architecture

### Upstream Structure

```
infrastructure/lib/features/
├── api.ts          — AppSync + Cognito + WAF
├── web.ts          — S3 + CloudFront
├── translation/    — Translate feature
│   ├── translation.ts
│   ├── main.ts
│   └── translate.ts
└── readable/       — Easy Read feature
    ├── readable.ts
    ├── workflow.ts
    ├── generate.ts
    ├── parseDoc.ts
    └── vendor/     — Model-specific implementations
```

### Key Patterns

- Identity-scoped S3 storage: `private/{cognito_sub}/*`
- Step Functions callback pattern for async Translate jobs
- EventBridge Pipes: DDB stream → Step Functions (filter INSERT/MODIFY where status="generate")
- Feature flags: translation and readable independently toggleable
- All Lambdas wrapped in custom `dt_lambda` CDK component
