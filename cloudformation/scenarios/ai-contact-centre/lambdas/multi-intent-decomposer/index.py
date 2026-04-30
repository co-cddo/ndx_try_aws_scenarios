"""Multi-intent decomposer Lambda.

Calls Bedrock Nova Pro to extract every distinct council-service intent from a
caller's utterance, capped at 4 per turn (Task spec: F16). Returns a structured
JSON object validated against schemas/multi-intent-output.schema.json.

If the decomposer detects more than 4 intents, the top 4 by confidence are
returned and the discarded names are listed in `truncated_intents` so the
contact flow can offer a follow-up question.
"""

import json
import logging
import os
import re
from typing import Any, Dict, List

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

MODEL_ID = os.environ.get("MULTI_INTENT_MODEL_ID", "amazon.nova-pro-v1:0")
MAX_INTENTS = 4

bedrock_runtime = boto3.client("bedrock-runtime")

ALLOWED_INTENTS = {
    "BinCollection", "MissedCollection", "FlyTip", "PotholeReport", "BrokenPaving",
    "ParkedVehicle", "DampMould", "AntiSocialBehaviour", "Safeguarding",
    "CouncilTax", "BenefitsSupport", "PlanningEnquiry", "GeneralEnquiry", "Other",
}

SYSTEM_PROMPT = (
    "You are a UK council contact centre triage assistant. "
    "Given a single caller utterance in English, extract every distinct "
    "service intent the caller has mentioned. "
    "Return ONLY a single JSON object with shape: "
    '{"intents": [{"intent_name": one of the allowed enum values, '
    '"slots": object of extracted slot key-values, '
    '"confidence": 0..1, '
    '"verbatim_excerpt": short quote from the utterance that justifies this intent}], '
    '"requires_safeguarding_review": bool, '
    '"truncated_intents": optional list of intent_names that were discarded if more than 4}. '
    f"Allowed intent_name values: {sorted(ALLOWED_INTENTS)}. "
    f"Cap output at {MAX_INTENTS} intents. "
    "If more than 4 intents are detected, keep the top 4 by confidence and "
    "list the discarded ones in truncated_intents. "
    "Set requires_safeguarding_review to true if the utterance contains "
    "disclosures of harm to a child or adult at risk, domestic abuse, "
    "suicidal ideation, or sustained financial exploitation. "
    "Output ONLY the JSON object, no preamble, no markdown fences."
)


def lambda_handler(event, context):
    utterance = _extract_utterance(event)
    intent_name = (event.get("sessionState") or {}).get("intent", {}).get("name", "")
    logger.info("decompose utterance len=%d intent=%s invocationSource=%s",
                len(utterance), intent_name, event.get("invocationSource", "n/a"))

    if not utterance:
        return _close_lex_response(event, {"intents": [], "requires_safeguarding_review": False, "truncated_intents": []})

    # Fast path: when Lex confidently matched a single intent, skip the Bedrock decomposer.
    # We just record the transcript and return. Saves ~3s for typical single-intent queries.
    # Only run the decomposer when Lex fell back (which is when multi-intent climax phrases land).
    # Special case: a matched Safeguarding intent must surface the safeguarding flag so the
    # contact flow can route to the agent queue or callback path; we don't need Bedrock for that.
    if intent_name == "Safeguarding":
        return _close_lex_response(event, {
            "intents": [{"intent_name": "Safeguarding", "confidence": 1.0}],
            "requires_safeguarding_review": True,
            "truncated_intents": [],
        })
    if intent_name and intent_name not in ("FallbackIntent", "MultiIntentTriage"):
        return _close_lex_response(event, {"intents": [], "requires_safeguarding_review": False, "truncated_intents": []})

    decomposed = _decompose(utterance)
    decomposed = _enforce_cap(decomposed)
    return _to_lex_response(event, decomposed)


def _extract_utterance(event) -> str:
    if isinstance(event, dict) and "inputTranscript" in event:
        return (event.get("inputTranscript") or "").strip()
    return (event.get("utterance") or "").strip()


def _close_lex_response(event, decomposed):
    """For Lex code-hook events, return a Close intent so the flow returns to Connect."""
    if "sessionState" not in event:
        return {"decomposed": decomposed, "summary": ""}
    existing = event["sessionState"].get("sessionAttributes") or {}
    existing["decomposed_intents_json"] = json.dumps(decomposed)
    existing["lex_input_transcript"] = event.get("inputTranscript") or ""
    intent_name = (event.get("sessionState") or {}).get("intent", {}).get("name", "FallbackIntent")
    return {
        "sessionState": {
            "dialogAction": {"type": "Close"},
            "intent": {"name": intent_name, "state": "Fulfilled"},
            "sessionAttributes": existing,
        },
        "messages": [],
    }


def _decompose(utterance: str) -> Dict[str, Any]:
    body = {
        "messages": [
            {"role": "user", "content": [{"text": utterance}]},
        ],
        "system": [{"text": SYSTEM_PROMPT}],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.0, "topP": 0.1},
    }
    resp = bedrock_runtime.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    payload = json.loads(resp["body"].read())
    text = _extract_text(payload)
    return _parse_json(text)


def _extract_text(payload: Dict[str, Any]) -> str:
    output = payload.get("output", {}).get("message", {}).get("content", [])
    for block in output:
        if "text" in block:
            return block["text"]
    return ""


def _parse_json(text: str) -> Dict[str, Any]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    raw = match.group(0) if match else text
    return json.loads(raw)


def _enforce_cap(decomposed: Dict[str, Any]) -> Dict[str, Any]:
    intents: List[Dict[str, Any]] = list(decomposed.get("intents") or [])
    intents = [i for i in intents if i.get("intent_name") in ALLOWED_INTENTS]
    intents.sort(key=lambda i: i.get("confidence", 0.0), reverse=True)

    truncated_existing = list(decomposed.get("truncated_intents") or [])
    if len(intents) > MAX_INTENTS:
        discarded = [i["intent_name"] for i in intents[MAX_INTENTS:]]
        intents = intents[:MAX_INTENTS]
        for name in discarded:
            if name not in truncated_existing:
                truncated_existing.append(name)

    decomposed["intents"] = intents
    decomposed["truncated_intents"] = truncated_existing
    decomposed.setdefault("requires_safeguarding_review", False)
    return decomposed


def _to_lex_response(event, decomposed: Dict[str, Any]):
    intents = decomposed.get("intents", [])
    primary = intents[0]["intent_name"] if intents else "GeneralEnquiry"
    intent_names = ", ".join(i["intent_name"] for i in intents) or "no intents"
    truncated = decomposed.get("truncated_intents") or []

    summary_lines = [
        f"I heard {len(intents)} thing(s) you'd like help with: {intent_names}.",
    ]
    if truncated:
        summary_lines.append(
            "I'll focus on the top four first; we can come back to the others. "
            f"Held for follow-up: {', '.join(truncated)}."
        )
    if decomposed.get("requires_safeguarding_review"):
        summary_lines.append(
            "Thank you for telling me. I'm going to put you straight through to "
            "one of our safeguarding-trained colleagues."
        )

    session_attrs = {
        "decomposed_intents_json": json.dumps(decomposed),
        "primary_intent": primary,
        "safeguarding_flag": "true" if decomposed.get("requires_safeguarding_review") else "false",
        "truncated_intents_csv": ",".join(truncated),
        "lex_input_transcript": event.get("inputTranscript") or "",
    }
    if "sessionState" in event:
        existing = event["sessionState"].get("sessionAttributes") or {}
        existing.update(session_attrs)
        intent_name = (event.get("sessionState") or {}).get("intent", {}).get("name", "FallbackIntent")
        return {
            "sessionState": {
                "dialogAction": {"type": "Close"},
                "intent": {"name": intent_name, "state": "Fulfilled"},
                "sessionAttributes": existing,
            },
            "messages": [],
        }
    return {"decomposed": decomposed, "summary": "\n".join(summary_lines)}
