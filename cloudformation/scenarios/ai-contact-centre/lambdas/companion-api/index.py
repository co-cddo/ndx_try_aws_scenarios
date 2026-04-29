"""Companion API Lambda Function URL.

Routes:
  GET  /api/health                - liveness
  POST /api/upload-presign        - returns S3 presigned PUT URL (TTL 5 min)
  POST /api/simulator/send        - invokes multimodal-describe synchronously
  GET  /api/case/{id}             - read-only Connect Case fetch for SPA polling
  GET  /api/transcript/{contactId}- read-only ContactLensCache fetch (redacted only)
  POST /api/share-pdf             - generates a share PDF from redacted DDB content
"""

import json
import logging
import os
import time
import uuid
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

import re

UPLOAD_BUCKET = os.environ["UPLOAD_BUCKET"]
UPLOAD_PRESIGN_TTL = int(os.environ.get("UPLOAD_PRESIGN_TTL", "300"))
MULTIMODAL_LAMBDA_ARN = os.environ["MULTIMODAL_LAMBDA_ARN"]
SHARE_PDF_LAMBDA_ARN = os.environ["SHARE_PDF_LAMBDA_ARN"]
CASES_DOMAIN_ID = os.environ["CASES_DOMAIN_ID"]
DDB_TABLE_NAME = os.environ["DDB_TABLE_NAME"]
def _last_segment(arn_or_id: str) -> str:
    return arn_or_id.rsplit("/", 1)[-1] if "/" in arn_or_id else arn_or_id


CONNECT_INSTANCE_ID = _last_segment(os.environ.get("CONNECT_INSTANCE_ID", ""))
CONNECT_CONTACT_FLOW_ID = _last_segment(os.environ.get("CONNECT_CONTACT_FLOW_ID", ""))
ALLOWED_ORIGIN_PATTERN = re.compile(
    os.environ.get("ALLOWED_ORIGIN_PATTERN", r"^https:\/\/[a-z0-9]+\.cloudfront\.net$")
)

connect = boto3.client("connect")
lex = boto3.client("lexv2-runtime")
bedrock_agent = boto3.client("bedrock-agent-runtime")
lambda_client = boto3.client("lambda")
cases_client = boto3.client("connectcases")
profiles_client = boto3.client("customer-profiles")
LEX_BOT_ID = os.environ.get("LEX_BOT_ID", "")
LEX_BOT_ALIAS_ID = os.environ.get("LEX_BOT_ALIAS_ID", "")
LEX_LOCALE_ID = "en_GB"
KB_ID = _last_segment(os.environ.get("KB_ID", ""))
GUARDRAIL_ID = _last_segment(os.environ.get("GUARDRAIL_ID", ""))
GENERATION_MODEL_ARN = os.environ.get("GENERATION_MODEL_ARN", "")
MULTI_INTENT_LAMBDA_ARN = os.environ.get("MULTI_INTENT_LAMBDA_ARN", "")
CASES_TEMPLATE_ID = os.environ.get("CASES_TEMPLATE_ID", "")
PROFILES_DOMAIN = os.environ.get("PROFILES_DOMAIN", "")

s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")
cases = boto3.client("connectcases")
ddb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "/")
    origin = event.get("headers", {}).get("origin", "")
    cors = _cors_headers(origin)

    if method == "OPTIONS":
        return _resp(204, "", cors)

    try:
        if path == "/api/health":
            return _resp(200, {"status": "ok"}, cors)
        if path == "/api/upload-presign" and method == "POST":
            return _upload_presign(event, cors)
        if path == "/api/simulator/send" and method == "POST":
            return _simulator_send(event, cors)
        if path.startswith("/api/case/") and method == "GET":
            return _case_get(path.split("/", 3)[-1], cors)
        if path.startswith("/api/transcript/") and method == "GET":
            return _transcript_get(path.split("/", 3)[-1], cors)
        if path == "/api/share-pdf" and method == "POST":
            return _share_pdf(event, cors)
        if path == "/api/chat/start" and method == "POST":
            return _chat_start(event, cors)
        if path == "/api/ask" and method == "POST":
            return _ask(event, cors)
        return _resp(404, {"error": "not_found", "path": path}, cors)
    except Exception as exc:
        logger.exception("companion-api error: %s", exc)
        return _resp(500, {"error": "internal_error"}, cors)


def _cors_headers(origin: str) -> Dict[str, str]:
    allow = origin if origin and ALLOWED_ORIGIN_PATTERN.match(origin) else ""
    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, x-amz-date, authorization",
        "Access-Control-Max-Age": "300",
    }


def _resp(status: int, body, headers=None) -> Dict[str, Any]:
    if isinstance(body, (dict, list)):
        body = json.dumps(body)
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json", **(headers or {})},
        "body": body,
    }


def _upload_presign(event, cors):
    body = json.loads(event.get("body") or "{}")
    sender_phone = body.get("sender_phone", "anonymous")
    content_type = body.get("content_type", "image/jpeg")
    suffix = "jpg" if "jpeg" in content_type or "jpg" in content_type else "png"
    key = f"uploads/{int(time.time())}-{uuid.uuid4().hex[:12]}.{suffix}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": UPLOAD_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=UPLOAD_PRESIGN_TTL,
        HttpMethod="PUT",
    )
    return _resp(200, {"upload_url": url, "key": key, "expires_in": UPLOAD_PRESIGN_TTL}, cors)


def _simulator_send(event, cors):
    body = json.loads(event.get("body") or "{}")
    image_key = body.get("image_s3_key")
    sender_phone = body.get("sender_phone")
    if not image_key or not sender_phone:
        return _resp(400, {"error": "image_s3_key and sender_phone required"}, cors)
    resp = lambda_client.invoke(
        FunctionName=MULTIMODAL_LAMBDA_ARN,
        InvocationType="RequestResponse",
        Payload=json.dumps({
            "image_s3_key": image_key,
            "sender_phone": sender_phone,
        }).encode(),
    )
    payload = json.loads(resp["Payload"].read())
    return _resp(200, payload, cors)


def _case_get(case_id: str, cors):
    resp = cases.get_case(
        domainId=CASES_DOMAIN_ID,
        caseId=case_id,
        fields=[
            {"id": "title"},
            {"id": "status"},
            {"id": "reference_number"},
            {"id": _field_id("customer_phone_number")},
            {"id": _field_id("address")},
            {"id": _field_id("intent_category")},
            {"id": _field_id("intents")},
            {"id": _field_id("safeguarding_flag")},
            {"id": _field_id("multimodal_summary")},
            {"id": _field_id("attachments_summary")},
        ],
    )
    out = {"caseId": resp.get("caseId"), "fields": {}}
    # Reverse the UUID-to-name mapping so the SPA gets human-readable keys.
    inverse = {v: k for k, v in _field_id_cache.items()}
    for f in resp.get("fields", []):
        fid = f.get("id")
        name = inverse.get(fid, fid)
        v = f.get("value", {}) or {}
        out["fields"][name] = next(iter(v.values()), None)
    return _resp(200, out, cors)


def _transcript_get(contact_id: str, cors):
    table = ddb.Table(DDB_TABLE_NAME)
    resp = table.query(
        KeyConditionExpression="contactId = :c",
        ExpressionAttributeValues={":c": contact_id},
        ScanIndexForward=True,
    )
    return _resp(200, {"contactId": contact_id, "segments": resp.get("Items", [])}, cors)


def _share_pdf(event, cors):
    body = json.loads(event.get("body") or "{}")
    contact_id = body.get("contact_id")
    case_id = body.get("case_id")
    if not contact_id and not case_id:
        return _resp(400, {"error": "contact_id or case_id required"}, cors)
    resp = lambda_client.invoke(
        FunctionName=SHARE_PDF_LAMBDA_ARN,
        InvocationType="RequestResponse",
        Payload=json.dumps({"contact_id": contact_id, "case_id": case_id}).encode(),
    )
    return _resp(200, json.loads(resp["Payload"].read()), cors)


def _ask(event, cors):
    body = json.loads(event.get("body") or "{}")
    utterance = (body.get("utterance") or "").strip()
    session_id = body.get("session_id") or "anon"
    sender_phone = body.get("sender_phone") or f"+44chat-{session_id[:10]}"
    if not utterance:
        return _resp(400, {"error": "utterance required"}, cors)

    # Always run Lex (single-intent classifier).
    intent_name = "GeneralEnquiry"
    intent_confidence = 0.0
    if LEX_BOT_ID and LEX_BOT_ALIAS_ID:
        try:
            lex_resp = lex.recognize_text(
                botId=LEX_BOT_ID, botAliasId=LEX_BOT_ALIAS_ID,
                localeId=LEX_LOCALE_ID, sessionId=session_id, text=utterance,
            )
            interp = (lex_resp.get("interpretations") or [{}])[0]
            intent = interp.get("intent") or {}
            intent_name = intent.get("name") or intent_name
            intent_confidence = (interp.get("nluConfidence") or {}).get("score") or 0.0
        except Exception as exc:
            logger.warning("Lex recognize_text failed: %s", exc)

    # If utterance is long enough to plausibly contain multiple intents, decompose.
    decomposed = _decompose_if_multi(utterance)

    if decomposed and len(decomposed.get("intents", [])) >= 2:
        # Multi-intent path: RAG each, open one Case capturing all intents.
        per_intent_answers = []
        for i in decomposed["intents"][:4]:
            ans = _rag_answer(i.get("verbatim_excerpt") or utterance)
            per_intent_answers.append({
                "intent": i.get("intent_name"),
                "verbatim": i.get("verbatim_excerpt"),
                "confidence": i.get("confidence"),
                "answer": ans["text"],
                "citations": ans["citations"],
                "guardrail_intervened": ans["intervened"],
            })

        case_id = _open_case(
            sender_phone=sender_phone,
            primary_intent=per_intent_answers[0]["intent"],
            intents_csv=", ".join(a["intent"] for a in per_intent_answers),
            safeguarding=decomposed.get("requires_safeguarding_review", False),
            summary_text=utterance[:500],
        )
        return _resp(200, {
            "mode": "multi_intent",
            "case_id": case_id,
            "intents_detected": [i.get("intent_name") for i in decomposed["intents"]],
            "truncated_intents": decomposed.get("truncated_intents", []),
            "requires_safeguarding_review": decomposed.get("requires_safeguarding_review", False),
            "answers": per_intent_answers,
        }, cors)

    # Single-intent path.
    answer = _rag_answer(utterance)
    case_id = _open_case(
        sender_phone=sender_phone,
        primary_intent=intent_name,
        intents_csv=intent_name,
        safeguarding=False,
        summary_text=utterance[:500],
    )
    return _resp(200, {
        "mode": "single_intent",
        "case_id": case_id,
        "answer": answer["text"],
        "intent": intent_name,
        "intent_confidence": intent_confidence,
        "guardrail_intervened": answer["intervened"],
        "citations": answer["citations"],
    }, cors)


_field_id_cache: Dict[str, str] = {}


def _field_id(name: str) -> str:
    """Resolve a Custom-namespace Cases field name to its UUID. Built-in
    fields (customer_id, title, status) keep their stable string IDs."""
    if not name or name in _field_id_cache:
        return _field_id_cache.get(name, name)
    if not CASES_DOMAIN_ID:
        return name
    try:
        resp = cases_client.list_fields(domainId=CASES_DOMAIN_ID)
        for f in resp.get("fields", []):
            _field_id_cache[f["name"]] = f["fieldId"]
    except Exception as exc:
        logger.warning("list_fields failed: %s", exc)
    return _field_id_cache.get(name, name)


def _get_or_create_profile(sender_phone: str) -> str:
    if not PROFILES_DOMAIN:
        return ""
    try:
        s = profiles_client.search_profiles(
            DomainName=PROFILES_DOMAIN, KeyName="_phone", Values=[sender_phone],
        )
        items = s.get("Items", [])
        if items:
            return items[0]["ProfileId"]
        c = profiles_client.create_profile(
            DomainName=PROFILES_DOMAIN, PhoneNumber=sender_phone, PartyType="INDIVIDUAL",
        )
        return c.get("ProfileId", "")
    except Exception as exc:
        logger.warning("profile create-or-get failed: %s", exc)
        return ""


def _open_case(*, sender_phone: str, primary_intent: str, intents_csv: str,
               safeguarding: bool, summary_text: str) -> str:
    if not (CASES_DOMAIN_ID and CASES_TEMPLATE_ID):
        return ""
    profile_id = _get_or_create_profile(sender_phone)
    if not profile_id:
        logger.warning("no profile_id; skipping case create")
        return ""
    try:
        resp = cases_client.create_case(
            domainId=CASES_DOMAIN_ID,
            templateId=CASES_TEMPLATE_ID,
            fields=[
                {"id": "customer_id", "value": {"stringValue":
                    f"arn:aws:profile:us-east-1:{os.environ.get('AWS_ACCOUNT_ID','714412037090')}:domains/{PROFILES_DOMAIN}/profiles/{profile_id}"
                }},
                {"id": "title", "value": {"stringValue": f"Resident enquiry: {primary_intent}"}},
                {"id": _field_id("customer_phone_number"), "value": {"stringValue": sender_phone}},
                {"id": _field_id("intent_category"), "value": {"stringValue": primary_intent}},
                {"id": _field_id("intents"), "value": {"stringValue": intents_csv}},
                {"id": _field_id("safeguarding_flag"), "value": {"booleanValue": bool(safeguarding)}},
                {"id": _field_id("multimodal_summary"), "value": {"stringValue": summary_text}},
            ],
        )
        return resp.get("caseId", "")
    except Exception as exc:
        logger.warning("create_case failed: %s", exc)
        return ""


def _decompose_if_multi(utterance: str) -> Dict[str, Any]:
    # Heuristic: only invoke decomposer if utterance is long enough or has comma/and connectors.
    word_count = len(utterance.split())
    has_connector = bool(re.search(r"\b(and|also|plus|then|too)\b|,", utterance, re.IGNORECASE))
    if word_count < 12 or not has_connector or not MULTI_INTENT_LAMBDA_ARN:
        return {}
    try:
        resp = lambda_client.invoke(
            FunctionName=MULTI_INTENT_LAMBDA_ARN,
            InvocationType="RequestResponse",
            Payload=json.dumps({"utterance": utterance}).encode(),
        )
        payload = json.loads(resp["Payload"].read())
        if isinstance(payload, dict):
            if "decomposed" in payload:
                return payload["decomposed"]
            if "intents" in payload:
                return payload
    except Exception as exc:
        logger.warning("multi-intent decomposer invoke failed: %s", exc)
    return {}


def _rag_answer(utterance: str) -> Dict[str, Any]:
    if not (KB_ID and GENERATION_MODEL_ARN):
        return {"text": "RAG not configured.", "intervened": False, "citations": []}
    try:
        resp = bedrock_agent.retrieve_and_generate(
            input={"text": utterance},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KB_ID,
                    "modelArn": GENERATION_MODEL_ARN,
                    "generationConfiguration": {
                        "guardrailConfiguration": {
                            "guardrailId": GUARDRAIL_ID,
                            "guardrailVersion": "DRAFT",
                        },
                        "inferenceConfig": {
                            "textInferenceConfig": {"maxTokens": 350, "temperature": 0.2},
                        },
                    },
                },
            },
        )
    except Exception as exc:
        logger.exception("RAG failed: %s", exc)
        return {"text": "I cannot help with that one. A council officer will follow up.",
                "intervened": True, "citations": []}
    text = (resp.get("output") or {}).get("text") or ""
    intervened = resp.get("guardrailAction") == "INTERVENED"
    cites = []
    for c in resp.get("citations", []) or []:
        for r in c.get("retrievedReferences", []) or []:
            loc = (r.get("location") or {}).get("s3Location") or {}
            uri = loc.get("uri") or ""
            if uri:
                cites.append(uri.rsplit("/", 1)[-1])
    if intervened or not text:
        text = "I cannot help with that one directly. A council officer will follow up."
    return {"text": text, "intervened": intervened, "citations": cites[:3]}


def _chat_start(event, cors):
    body = json.loads(event.get("body") or "{}")
    display_name = body.get("display_name") or "resident"
    if not CONNECT_INSTANCE_ID or not CONNECT_CONTACT_FLOW_ID:
        return _resp(500, {"error": "chat not configured"}, cors)
    resp = connect.start_chat_contact(
        InstanceId=CONNECT_INSTANCE_ID,
        ContactFlowId=CONNECT_CONTACT_FLOW_ID,
        ParticipantDetails={"DisplayName": display_name[:32]},
        SupportedMessagingContentTypes=["text/plain"],
    )
    return _resp(200, {
        "ContactId": resp["ContactId"],
        "ParticipantId": resp["ParticipantId"],
        "ParticipantToken": resp["ParticipantToken"],
        "ParticipantApi": "https://participant.connect.us-east-1.amazonaws.com",
    }, cors)


def _strip_metadata(resp: Dict[str, Any]) -> Dict[str, Any]:
    out = {"caseId": resp.get("caseId"), "fields": {}}
    for f in resp.get("fields", []):
        value = f.get("value", {})
        out["fields"][f.get("id")] = next(iter(value.values()), None)
    return out
