"""RAG fulfilment Lambda for the AI Contact Centre scenario.

Two invocation paths supported:

1. **Connect contact flow** via InvokeLambdaFunction action:
   event = {"Details": {"ContactData": {...}, "Parameters": {"user_utterance": "..."}}}
   Returns plain dict; the flow accesses fields as $.External.<key>.

2. **Lex bot fulfillment hook** (legacy / direct test):
   event = {"inputTranscript": "...", "sessionState": {...}}
   Returns Lex Close-intent response.

The function trims the answer to ~700 chars (sentence boundary) so Polly
readback in voice mode stays under ~25s.
"""

import json
import logging
import os
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def _last_segment(arn_or_id: str) -> str:
    return arn_or_id.rsplit("/", 1)[-1] if "/" in arn_or_id else arn_or_id


KB_ID = _last_segment(os.environ["KB_ID"])
GUARDRAIL_ID = _last_segment(os.environ["GUARDRAIL_ID"])
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "DRAFT")
MODEL_ARN = os.environ["MODEL_ARN"]

bedrock_agent = boto3.client("bedrock-agent-runtime")


def lambda_handler(event, context):
    is_contact_flow = isinstance(event, dict) and "Details" in event
    user_input = _extract_utterance(event)
    logger.info("RAG fulfilment: contact_flow=%s utterance_len=%d",
                is_contact_flow, len(user_input))

    if not user_input:
        msg = "I did not catch that. Could you say it again?"
        return _respond(event, is_contact_flow, msg, fulfilled=False, intervened=False)

    try:
        resp = bedrock_agent.retrieve_and_generate(
            input={"text": user_input},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KB_ID,
                    "modelArn": MODEL_ARN,
                    "generationConfiguration": {
                        "guardrailConfiguration": {
                            "guardrailId": GUARDRAIL_ID,
                            "guardrailVersion": GUARDRAIL_VERSION,
                        },
                        "inferenceConfig": {
                            "textInferenceConfig": {"maxTokens": 350, "temperature": 0.2},
                        },
                    },
                },
            },
        )
    except Exception as exc:
        logger.exception("Bedrock retrieve_and_generate failed: %s", exc)
        msg = "I am having trouble looking that up just now. Let me get a colleague to call you back."
        return _respond(event, is_contact_flow, msg, fulfilled=False, intervened=True)

    answer_text = (resp.get("output") or {}).get("text") or ""
    citations = resp.get("citations") or []
    guardrail_action = resp.get("guardrailAction")

    if guardrail_action == "INTERVENED" or not answer_text:
        msg = "I cannot help with that one directly, but I will get a colleague to call you back."
        return _respond(event, is_contact_flow, msg, fulfilled=False, intervened=True)

    answer_text = _trim_for_polly(answer_text)
    logger.info("answer_len=%d cite_count=%d guardrail=%s",
                len(answer_text), len(citations), guardrail_action)
    return _respond(event, is_contact_flow, answer_text, fulfilled=True, intervened=False)


def _extract_utterance(event: Dict[str, Any]) -> str:
    if isinstance(event, dict) and "Details" in event:
        params = event.get("Details", {}).get("Parameters", {}) or {}
        if "user_utterance" in params:
            return (params["user_utterance"] or "").strip()
        attrs = event.get("Details", {}).get("ContactData", {}).get("Attributes", {}) or {}
        for k in ("user_utterance", "InputTranscript"):
            if k in attrs and attrs[k]:
                return attrs[k].strip()
    return (event.get("inputTranscript") or "").strip()


def _trim_for_polly(text: str, max_chars: int = 700) -> str:
    if len(text) <= max_chars:
        return text
    cut = text.rfind(". ", 0, max_chars)
    return text[: cut + 1] if cut > 100 else text[:max_chars]


def _respond(event, is_contact_flow: bool, message: str, *, fulfilled: bool, intervened: bool):
    if is_contact_flow:
        return {
            "answer": message,
            "fulfilled": "true" if fulfilled else "false",
            "intervened": "true" if intervened else "false",
        }
    return _close_intent(event, message, fulfilled)


def _close_intent(event, message: str, fulfilled: bool):
    intent_state = "Fulfilled" if fulfilled else "Failed"
    return {
        "sessionState": {
            "dialogAction": {"type": "Close"},
            "intent": {
                "name": event.get("sessionState", {}).get("intent", {}).get("name", "FallbackIntent"),
                "state": intent_state,
            },
        },
        "messages": [{"contentType": "PlainText", "content": message}],
    }
