"""Photo-watcher Lambda: invoked from the contact flow during a FlyTip call.

Polls DynamoDB for a `photo#<phone>` record written by multimodal-describe
when a photo arrives via the WhatsApp simulator. Returns when found (with
the structured summary + case reference for read-back over the phone) or
times out near the contact-flow's invocation budget.

The acknowledgement string is translated to the caller's language (read from
the LanguageCode contact attribute set earlier by rag-fulfilment) before
being handed back for the MessageParticipant block to speak.
"""

import logging
import os
import re
import time
from typing import Dict

import boto3
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DDB_TABLE_NAME = os.environ["DDB_TABLE_NAME"]
MODEL_ARN = os.environ.get(
    "MODEL_ARN",
    f"arn:aws:bedrock:{os.environ.get('AWS_REGION', 'us-east-1')}::foundation-model/amazon.nova-lite-v1:0",
)
POLL_INTERVAL = 2.0  # seconds between DDB queries
DEADLINE_BUFFER = 4.0  # seconds, leave headroom before flow's InvocationTimeLimitSeconds expires

ddb = boto3.resource("dynamodb")
bedrock_runtime = boto3.client("bedrock-runtime")
_table = ddb.Table(DDB_TABLE_NAME)

LANGUAGE_NAME = {
    "en": "English", "it": "Italian", "fr": "French", "de": "German",
    "es": "Spanish", "pl": "Polish", "cy": "Welsh", "ro": "Romanian",
}
_TRANSLATION_CACHE: Dict[tuple, str] = {}


def lambda_handler(event, context):
    params = (event.get("Details") or {}).get("Parameters") or event
    cdata = (event.get("Details") or {}).get("ContactData") or {}
    attrs = (cdata.get("Attributes") or {})
    lang = (attrs.get("LanguageCode") or "en").strip().lower()[:2]
    if lang not in LANGUAGE_NAME:
        lang = "en"

    phone_raw = (
        params.get("customer_phone")
        or (cdata.get("CustomerEndpoint") or {}).get("Address")
        or ""
    ).strip()
    if not phone_raw:
        return _result(lang, found=False, reason="no_phone")

    phone = _normalise_phone(phone_raw)
    pk = f"photo#{phone}"
    # Only consider records written within the last 5 minutes of THIS call,
    # so a stale photo from a previous demo doesn't accidentally satisfy.
    fresh_after_ms = int((time.time() - 300) * 1000)

    deadline = time.time() + max(
        5.0, (context.get_remaining_time_in_millis() / 1000.0) - DEADLINE_BUFFER
    )
    while time.time() < deadline:
        item = _latest_photo(pk, fresh_after_ms)
        if item:
            logger.info("photo found for %s", phone)
            return _result(
                lang,
                found=True,
                case_id=str(item.get("case_id") or ""),
                case_number=str(item.get("case_number") or ""),
                object_class=str(item.get("object_class") or ""),
                condition=str(item.get("condition") or ""),
                severity=str(item.get("severity") or ""),
            )
        time.sleep(POLL_INTERVAL)

    return _result(lang, found=False, reason="timeout")


def _normalise_phone(phone: str) -> str:
    """Match multimodal-describe's normalisation so the keys line up:
    `07123456789` and `+44 7123 456789` both become `+447123456789`."""
    digits = re.sub(r"[^0-9+]", "", phone or "")
    if digits.startswith("0") and len(digits) == 11:
        digits = "+44" + digits[1:]
    return digits


def _latest_photo(pk: str, fresh_after_ms: int):
    try:
        resp = _table.query(
            KeyConditionExpression=Key("contactId").eq(pk) & Key("segmentTimestamp").gt(fresh_after_ms),
            ScanIndexForward=False,
            Limit=1,
        )
    except Exception as exc:
        logger.warning("DDB query failed: %s", exc)
        return None
    items = resp.get("Items") or []
    return items[0] if items else None


def _localize(text: str, lang: str) -> str:
    if lang == "en" or not text:
        return text
    cache_key = (text, lang)
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]
    target = LANGUAGE_NAME.get(lang, "English")
    prompt = (
        f"Translate the following English text into natural spoken {target}. "
        f"This will be read aloud by an automated council switchboard. "
        f"Preserve any numbers and case references EXACTLY as written. "
        f"Return only the translation, no quotes, no preamble.\n\n"
        f"English: {text}"
    )
    try:
        resp = bedrock_runtime.converse(
            modelId=MODEL_ARN,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 400, "temperature": 0.1},
        )
        out = resp["output"]["message"]["content"][0]["text"].strip()
        if (out.startswith('"') and out.endswith('"')) or (out.startswith("'") and out.endswith("'")):
            out = out[1:-1].strip()
        _TRANSLATION_CACHE[cache_key] = out
        return out
    except Exception:
        logger.exception("photo-watcher translation failed for lang=%s", lang)
        return text


def _result(lang: str, *, found: bool, **rest) -> dict:
    out = {"found": "true" if found else "false"}
    for k, v in rest.items():
        out[k] = v if v is not None else ""
    if found:
        # Build a friendly read-back string for the contact flow's MessageParticipant.
        ack_bits = []
        if rest.get("object_class"):
            ack_bits.append(f"a {rest['object_class'].replace('_', ' ')}")
        if rest.get("condition"):
            ack_bits.append(rest["condition"])
        ack = "Got it. I can see " + (", ".join(ack_bits) or "the photo you sent") + "."
        # Connect Cases assigns a short numeric case_number visible in the agent
        # UI; prefer that over the internal UUID prefix so what the caller writes
        # down matches what the agent sees.
        case_number = (rest.get("case_number") or "").strip()
        if case_number:
            spaced = " ".join(case_number)
            ack += f" Your case reference is {spaced}. Please write that down."
        out["acknowledgement"] = _localize(ack, lang)
    return out
