# Multimodal describe prompt template (Task 0.3 output)

**Status:** initial draft. To be hardened against `schemas/multimodal-output.schema.json` via spike test fixtures.

**Bedrock model:** `amazon.nova-pro-v1:0`

## System prompt

You are a UK local-government environmental-health triage assistant. A resident has sent a photo via WhatsApp to their council. Your job is to describe what is in the photo in a single, structured JSON object that the council case management system can ingest. You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any explanation, preamble, or commentary.

The council will use your output to triage the case. Be specific but conservative. If the image is ambiguous, lower the confidence score and note the ambiguity in `secondary_observations`.

## User prompt template

```
Schema you MUST match exactly (no additional fields, no missing fields):

{schema_json}

Photo description guidelines:
- object_class: pick the single best match from the enum
- condition: one short sentence describing what is wrong
- severity:
    low = aesthetic only
    medium = nuisance, no immediate hazard
    high = environmental hazard or active obstruction
    urgent = immediate danger to public, vulnerable persons, or property
- suggested_council_action: a one-sentence triage suggestion (e.g., "Dispatch environmental health within 48 hours" or "Refer to highways for pavement repair")
- confidence: 0.0 to 1.0, your confidence the photo unambiguously shows what you have classified
- secondary_observations: optional array of strings, only if there are notable details (e.g., "Vehicle nearby is a council waste truck", "Bin appears to belong to neighbouring property")

Now describe this photo:
```

## Validation behaviour

- Output validated against `schemas/multimodal-output.schema.json`.
- On first failure: retry exactly once with this strengthened addendum:
  > "Your previous response did not validate. Re-emit ONLY a single JSON object matching the schema. Do not include any markdown code fences."
- On second failure: Lambda returns `{ status: "describe_unavailable", reason: "schema_validation_failed" }`.

## Spike harness fixtures

The spike fixture set lives in `spikes/multimodal-fixtures/` (PENDING) and contains:

- `bin-overflow.jpg`, expected `object_class: "bin"`, `severity: "medium" | "high"`
- `fly-tip-mattress.jpg`, expected `object_class: "fly_tip"`, `severity: "high"`
- `pothole.jpg`, expected `object_class: "broken_paving"`, `severity: "medium"`
- `damp-ceiling.jpg`, expected `object_class: "damp"`, `severity: "high"`
- `parked-on-pavement.jpg`, expected `object_class: "parked_vehicle"`, `severity: "low" | "medium"`
- `ambiguous-rubbish.jpg`, designed to elicit lower confidence + secondary_observations
- `not-a-council-issue.jpg`, must not crash; either `object_class: "other"` or describe_unavailable

## Spike measurement target

- ≥6 of 7 fixtures pass schema validation on first call (no retry).
- 0 of 7 fixtures fall through to `describe_unavailable` on the second call.
- p95 round-trip ≤6 seconds (matches the budget in Task 6.2).

## Outcome

PENDING_SPIKE_RUN, populate `spikes/multimodal-results.json` with measurement results before merging to main.
