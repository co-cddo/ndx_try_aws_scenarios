# Bedrock model access enablement (Task 0.5 output)

**Status:** VERIFIED.
**Measurement_date:** 2026-04-28
**Account:** 714412037090 (NDX:Try sandbox lease)

## Models verified accessible

| Model ID | Purpose | Used by | Verification |
| -------- | ------- | ------- | ------------ |
| `amazon.titan-embed-text-v2:0` | KB embeddings | Phase 3 (KB ingestion + retrieval) | InvokeModel: HTTP 200, 1024-dim embedding returned |
| `amazon.nova-pro-v1:0` | Generation, multimodal describe, multi-intent decomposition | Phase 6 (RAG fulfilment, multimodal, decomposer) | InvokeModel: HTTP 200, returned `OK.` for prompt `reply with the word ok` |

## Verification commands run

```bash
# Nova Pro
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-pro-v1:0 \
  --body '{"messages":[{"role":"user","content":[{"text":"reply with the word ok"}]}],"inferenceConfig":{"maxTokens":5}}' \
  --cli-binary-format raw-in-base64-out \
  --content-type application/json --accept application/json \
  /tmp/nova-test.json --profile NDX/SandboxAdmin --region us-east-1
# -> {"output":{"message":{"content":[{"text":"OK..."}]}},"usage":{"inputTokens":5,"outputTokens":5}}

# Titan embed
aws bedrock-runtime invoke-model \
  --model-id amazon.titan-embed-text-v2:0 \
  --body '{"inputText":"hello world","dimensions":1024,"normalize":true}' \
  --cli-binary-format raw-in-base64-out \
  --content-type application/json --accept application/json \
  /tmp/titan-test.json --profile NDX/SandboxAdmin --region us-east-1
# -> 200 OK, embedding written to /tmp/titan-test.json
```

## Implication for AC18

Task 6.8 deploy-time verification Lambda's `_check_bedrock_invoke` and `_check_kb_retrieve` will pass against this account without further intervention.

## Notes for BLUEPRINT.md

The lease account 714412037090 has Bedrock access pre-enabled (presumably from prior NDX:Try scenarios with Bedrock requirements: council-chatbot, paperless-ngx, simply-readable, minute, foi-redaction). Fresh ISB pool accounts may require the one-click in the Bedrock console; the BLUEPRINT.md prerequisite stands.

## Outcome

VERIFIED, no remediation required for the current sandbox account.
