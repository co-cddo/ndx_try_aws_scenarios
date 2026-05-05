"""Landline callback parser + dialer Lambda.

Invoked by the contact flow after the customer has given a landline number
(via Lex's transcript) when their original caller ID was a UK mobile and
outbound to mobile is currently quota-blocked.

Steps:
  1. Read the spoken transcript from Lex's session attributes (passed via
     the contact flow's $.Lex.SessionAttributes.lex_input_transcript).
  2. Convert words like "oh two oh seven two one one..." to digits.
  3. Format as E.164 (+44...).
  4. Invoke the existing OutboundCallbackFunction with that number.
  5. Return a confirmation message the flow plays before disconnecting.
"""

import json
import logging
import os
import re

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

OUTBOUND_FN_NAME = os.environ["OUTBOUND_FN_NAME"]

lambda_client = boto3.client("lambda")

_WORD_DIGIT = {
    "oh": "0", "zero": "0", "one": "1", "two": "2", "three": "3",
    "four": "4", "for": "4", "five": "5", "six": "6", "seven": "7",
    "eight": "8", "nine": "9", "double": None, "triple": None, "o": "0",
}


def lambda_handler(event, context):
    is_contact_flow = isinstance(event, dict) and "Details" in event
    transcript = ""
    if is_contact_flow:
        params = event.get("Details", {}).get("Parameters", {}) or {}
        transcript = (params.get("user_utterance") or "").strip()
    else:
        transcript = (event.get("transcript") or "").strip()

    logger.info("Landline parse: transcript=%r", transcript)
    e164 = _parse_uk_landline(transcript)
    logger.info("Parsed E.164: %r", e164)

    if not e164:
        return _resp(is_contact_flow, success=False,
                     message="Sorry, I didn't catch a valid landline. Please call us back when you have one.")

    # Trigger outbound to the parsed landline.
    try:
        resp = lambda_client.invoke(
            FunctionName=OUTBOUND_FN_NAME,
            InvocationType="RequestResponse",
            Payload=json.dumps({"customer_phone": e164}).encode("utf-8"),
        )
        out = json.loads(resp["Payload"].read() or b"{}")
        if out.get("success"):
            return _resp(is_contact_flow, success=True,
                         message=f"Thanks. We'll call you back on that number shortly.")
        return _resp(is_contact_flow, success=False,
                     message=f"Sorry, we couldn't dial that number. Reason: {out.get('error','unknown')}")
    except ClientError as exc:
        logger.exception("Outbound invoke failed: %s", exc)
        return _resp(is_contact_flow, success=False,
                     message="Sorry, the callback couldn't be placed.")


def _parse_uk_landline(text: str) -> str:
    if not text:
        return ""
    lower = text.lower().replace(",", " ").replace(".", " ").replace("-", " ")
    # Tokenise word-or-digit groups
    tokens = re.findall(r"\b[a-z]+\b|\d+", lower)
    # Expand "double X" / "triple X" pairs
    expanded = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t in ("double", "triple") and i + 1 < len(tokens):
            n = 2 if t == "double" else 3
            expanded.extend([tokens[i + 1]] * n)
            i += 2
            continue
        expanded.append(t)
        i += 1
    digits = ""
    for t in expanded:
        if t.isdigit():
            digits += t
        elif t in _WORD_DIGIT and _WORD_DIGIT[t] is not None:
            digits += _WORD_DIGIT[t]
    digits = re.sub(r"\D", "", digits)

    if not digits or len(digits) < 9:
        return ""

    # Normalise to E.164 +44.
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("44"):
        out = "+" + digits
    elif digits.startswith("0"):
        out = "+44" + digits[1:]
    else:
        out = "+44" + digits

    # Cap to a reasonable UK length; UK E.164 is +44 + 10 digits.
    if len(out) < 12:
        return ""
    return out[:14]  # +44 followed by up to 10 digits


def _resp(is_contact_flow: bool, *, success: bool, message: str):
    if is_contact_flow:
        return {
            "callback_initiated": "true" if success else "false",
            "answer": message,
            "prompt": message,
            "should_disconnect": "true",
        }
    return {"success": success, "message": message}
