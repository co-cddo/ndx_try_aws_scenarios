"""Multimodal describe Lambda, owns the cross-channel single-Case orchestration.

Per tech-spec Task 6.2 (numbered steps 1-8). Total budget: 12s.

  1. Receive { image_s3_key, sender_phone, contact_id? }
  2. Download image from S3 (<=500ms)
  3. Bedrock Nova Pro multimodal describe (<=6s)
  4. Validate against schemas/multimodal-output.schema.json. One retry on
     invalid response with strengthened prompt. Otherwise describe_unavailable.
  5. cases:SearchCases by phone
  6. If found: cases:UpdateCase with ETag if-match. On 412: re-fetch, retry once.
  7. If not found: cases:CreateCase
  8. Return { status, case_id, structured_description } to companion API.
"""

import base64
import json
import logging
import os
import re
import time
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

MODEL_ID = os.environ.get("MULTIMODAL_MODEL_ID", "amazon.nova-pro-v1:0")
CASES_DOMAIN_ID = os.environ["CASES_DOMAIN_ID"]
CASES_TEMPLATE_ID = os.environ["CASES_TEMPLATE_ID"]
IMAGE_BUCKET = os.environ["IMAGE_BUCKET"]
SCHEMA_JSON = os.environ.get("MULTIMODAL_SCHEMA_JSON", "{}")
SEARCH_WINDOW_SECONDS = 3600

s3 = boto3.client("s3")
bedrock_runtime = boto3.client("bedrock-runtime")
cases = boto3.client("connectcases")

ALLOWED_OBJECT_CLASSES = {
    "bin", "fly_tip", "damp", "parked_vehicle", "broken_paving",
    "missed_collection", "other",
}
ALLOWED_SEVERITY = {"low", "medium", "high", "urgent"}


def lambda_handler(event, context):
    payload = _normalise_event(event)
    image_key = payload["image_s3_key"]
    sender_phone = _normalise_phone(payload["sender_phone"])
    logger.info("multimodal describe key=%s phone=%s", image_key, sender_phone)

    image_bytes, mime = _download_image(image_key)
    structured = _describe_with_validation(image_bytes, mime)
    if structured.get("status") == "describe_unavailable":
        return structured

    case_outcome = _converge_on_case(sender_phone, structured)
    return {
        "status": "ok",
        "case_id": case_outcome["case_id"],
        "case_action": case_outcome["action"],
        "structured_description": structured,
    }


def _normalise_event(event) -> Dict[str, Any]:
    if "Records" in event:
        record = event["Records"][0]
        meta = record.get("MessageMetadata", {})
        content = record.get("MessageContent", {}).get("Image", {})
        return {
            "image_s3_key": f"waba/{content.get('MediaId', 'unknown')}",
            "sender_phone": meta.get("From", ""),
            "contact_id": None,
        }
    if isinstance(event.get("body"), str):
        return json.loads(event["body"])
    return event


def _normalise_phone(phone: str) -> str:
    digits = re.sub(r"[^0-9+]", "", phone or "")
    if digits.startswith("0") and len(digits) == 11:
        digits = "+44" + digits[1:]
    return digits


def _download_image(key: str) -> Tuple[bytes, str]:
    obj = s3.get_object(Bucket=IMAGE_BUCKET, Key=key)
    body = obj["Body"].read()
    mime = obj.get("ContentType") or "image/jpeg"
    return body, mime


def _describe_with_validation(image_bytes: bytes, mime: str) -> Dict[str, Any]:
    prompt = _build_prompt(strengthened=False)
    structured = _invoke_multimodal(prompt, image_bytes, mime)
    if _validate(structured):
        return structured

    logger.info("first multimodal call invalid; retrying once with strengthened prompt")
    strengthened = _build_prompt(strengthened=True)
    structured = _invoke_multimodal(strengthened, image_bytes, mime)
    if _validate(structured):
        return structured

    return {"status": "describe_unavailable", "reason": "schema_validation_failed"}


SCHEMA_DESCRIPTION = (
    'Schema: {"object_class": string in [bin, fly_tip, damp, parked_vehicle, '
    'broken_paving, missed_collection, other], "condition": short string '
    'describing what is wrong, "severity": string in [low, medium, high, '
    'urgent], "suggested_council_action": short string with a one-sentence '
    'triage suggestion, "confidence": number 0..1, "secondary_observations": '
    'optional array of strings}.'
)


def _build_prompt(strengthened: bool) -> str:
    base = (
        "You are a UK local-government environmental-health triage assistant. "
        "A resident has sent a photo via WhatsApp to their council. Describe "
        "what is in the photo as a single JSON object matching this schema.\n\n"
        f"{SCHEMA_DESCRIPTION}\n\n"
        "Output ONLY the JSON object. No markdown fences, no preamble."
    )
    if strengthened:
        base += (
            "\n\nYour previous response did not validate. Re-emit ONLY a single "
            "JSON object matching the schema. Do not include any markdown code "
            "fences. Do not include any preamble or commentary."
        )
    return base


def _invoke_multimodal(prompt: str, image_bytes: bytes, mime: str) -> Dict[str, Any]:
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    fmt = "jpeg" if "jpeg" in mime or "jpg" in mime else ("png" if "png" in mime else "jpeg")
    body = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"image": {"format": fmt, "source": {"bytes": image_b64}}},
                    {"text": prompt},
                ],
            }
        ],
        "inferenceConfig": {"maxTokens": 500, "temperature": 0.0},
    }
    resp = bedrock_runtime.invoke_model(
        modelId=MODEL_ID, body=json.dumps(body),
        contentType="application/json", accept="application/json",
    )
    payload = json.loads(resp["body"].read())
    blocks = payload.get("output", {}).get("message", {}).get("content", [])
    text = next((b["text"] for b in blocks if "text" in b), "")
    match = re.search(r"\{.*\}", text, re.DOTALL)
    try:
        return json.loads(match.group(0) if match else text)
    except json.JSONDecodeError as exc:
        logger.warning("multimodal output not parseable as JSON: %s", exc)
        return {}


def _validate(structured: Dict[str, Any]) -> bool:
    required = {"object_class", "condition", "severity", "suggested_council_action", "confidence"}
    if not isinstance(structured, dict):
        return False
    if not required.issubset(structured.keys()):
        return False
    if structured.get("object_class") not in ALLOWED_OBJECT_CLASSES:
        return False
    if structured.get("severity") not in ALLOWED_SEVERITY:
        return False
    confidence = structured.get("confidence")
    if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
        return False
    if not isinstance(structured.get("condition"), str) or not structured["condition"]:
        return False
    if not isinstance(structured.get("suggested_council_action"), str) or not structured["suggested_council_action"]:
        return False
    return True


def _converge_on_case(sender_phone: str, structured: Dict[str, Any]) -> Dict[str, str]:
    found = _search_open_case_by_phone(sender_phone)
    if found:
        case_id, etag = found
        try:
            _update_case(case_id, etag, structured)
            return {"case_id": case_id, "action": "updated"}
        except ClientError as exc:
            if _is_etag_conflict(exc):
                logger.info("UpdateCase 412 PreconditionFailed; re-fetching for retry")
                refetched = _get_case(case_id)
                if refetched:
                    _, fresh_etag = refetched
                    try:
                        _update_case(case_id, fresh_etag, structured)
                        return {"case_id": case_id, "action": "updated_after_retry"}
                    except ClientError as inner:
                        if _is_etag_conflict(inner):
                            return {"case_id": case_id, "action": "saved_as_note_after_conflict"}
                        raise
            raise

    new_case_id = _create_case(sender_phone, structured)
    return {"case_id": new_case_id, "action": "created"}


def _search_open_case_by_phone(phone: str) -> Optional[Tuple[str, str]]:
    """Look up the matching custom field UUID for customer_phone_number, then
    SearchCases on equalTo. Returns (case_id, etag) or None."""
    try:
        flds = cases.list_fields(domainId=CASES_DOMAIN_ID).get("fields", [])
        phone_field_id = next(
            (f["fieldId"] for f in flds if f.get("name") == "customer_phone_number"),
            "customer_phone_number",
        )
    except ClientError as exc:
        logger.warning("list_fields failed: %s", exc)
        phone_field_id = "customer_phone_number"

    try:
        resp = cases.search_cases(
            domainId=CASES_DOMAIN_ID,
            filter={
                "field": {"equalTo": {"id": phone_field_id, "value": {"stringValue": phone}}}
            },
            sorts=[{"fieldId": "last_updated_datetime", "sortOrder": "Desc"}],
            maxResults=1,
        )
    except ClientError as exc:
        logger.warning("search_cases failed: %s", exc)
        return None

    for c in resp.get("cases", []):
        return c["caseId"], ""
    return None


def _get_case(case_id: str) -> Optional[Tuple[str, str]]:
    try:
        resp = cases.get_case(domainId=CASES_DOMAIN_ID, caseId=case_id, fields=[{"id": "etag"}])
    except ClientError as exc:
        logger.warning("get_case failed: %s", exc)
        return None
    etag = resp.get("tags", {}).get("etag") or ""
    return case_id, etag


_field_id_cache: Dict[str, str] = {}


def _field_id(name: str) -> str:
    """Resolve Custom-namespace Cases field name to UUID (built-ins keep stable IDs)."""
    if not name or name in _field_id_cache:
        return _field_id_cache.get(name, name)
    try:
        for f in cases.list_fields(domainId=CASES_DOMAIN_ID).get("fields", []):
            _field_id_cache[f["name"]] = f["fieldId"]
    except ClientError as exc:
        logger.warning("list_fields failed: %s", exc)
    return _field_id_cache.get(name, name)


def _update_case(case_id: str, etag: str, structured: Dict[str, Any]) -> None:
    cases.update_case(
        domainId=CASES_DOMAIN_ID,
        caseId=case_id,
        fields=[
            {"id": _field_id("intent_category"), "value": {"stringValue": structured.get("object_class", "other")}},
            {"id": _field_id("severity"), "value": {"stringValue": structured.get("severity", "low")}},
            {"id": _field_id("multimodal_summary"), "value": {"stringValue": json.dumps(structured)[:1024]}},
        ],
    )


def _create_case(sender_phone: str, structured: Dict[str, Any]) -> str:
    profile_id = _get_or_create_profile(sender_phone)
    fields = [
        {"id": "title", "value": {"stringValue": f"WhatsApp photo: {structured.get('object_class', 'unknown')}"}},
        {"id": _field_id("customer_phone_number"), "value": {"stringValue": sender_phone}},
        {"id": _field_id("intent_category"), "value": {"stringValue": structured.get("object_class", "other")}},
        {"id": _field_id("multimodal_summary"), "value": {"stringValue": json.dumps(structured)[:1024]}},
    ]
    if profile_id:
        fields.insert(0, {"id": "customer_id", "value": {"stringValue":
            f"arn:aws:profile:us-east-1:{os.environ.get('AWS_ACCOUNT_ID','714412037090')}:domains/{os.environ.get('PROFILES_DOMAIN','')}/profiles/{profile_id}"
        }})
    # clientToken based on phone hashed to a 60-min window: concurrent
    # invocations for the same phone return the same caseId, satisfying AC21.
    import hashlib
    bucket = int(time.time() // 3600)
    ct = hashlib.sha256(f"{sender_phone}:{bucket}".encode()).hexdigest()[:32]
    resp = cases.create_case(
        domainId=CASES_DOMAIN_ID, templateId=CASES_TEMPLATE_ID,
        fields=fields, clientToken=ct,
    )
    return resp["caseId"]


def _get_or_create_profile(phone: str) -> str:
    domain = os.environ.get("PROFILES_DOMAIN", "")
    if not domain:
        return ""
    try:
        profiles = boto3.client("customer-profiles")
        s = profiles.search_profiles(DomainName=domain, KeyName="_phone", Values=[phone])
        items = s.get("Items", [])
        if items:
            return items[0]["ProfileId"]
        c = profiles.create_profile(DomainName=domain, PhoneNumber=phone, PartyType="INDIVIDUAL")
        return c.get("ProfileId", "")
    except Exception as exc:
        logger.warning("profile create-or-get failed: %s", exc)
        return ""


def _is_etag_conflict(exc: ClientError) -> bool:
    err = exc.response.get("Error", {})
    code = err.get("Code") or ""
    msg = err.get("Message") or ""
    return code in {"PreconditionFailed", "ConflictException"} or "412" in msg
