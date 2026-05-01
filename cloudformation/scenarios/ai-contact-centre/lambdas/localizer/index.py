"""Localizer Lambda for the AI Contact Centre scenario.

Looks up a fixed flow string by key, translates it on demand to the caller's
language via Bedrock, and caches the translation in module memory so subsequent
calls in the same warm container are zero-latency.

Invocation shape (from Connect's InvokeLambdaFunction action):

    event = {
        "Details": {
            "Parameters": { "key": "goodbye", "language": "it" }
        }
    }

Returns {"text": "..."} for the contact flow's MessageParticipant block to
read via $.External.text.
"""
import logging
import os
import re

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

MODEL_ID = os.environ.get(
    "MODEL_ARN",
    f"arn:aws:bedrock:{os.environ.get('AWS_REGION', 'us-east-1')}::foundation-model/amazon.nova-lite-v1:0",
)

bedrock = boto3.client("bedrock-runtime")

# Source-of-truth English strings keyed by a stable identifier the contact flow
# passes in. Keep the wording in sync with the original MessageParticipant
# blocks; if the English changes, the cache will pick up new translations on
# the next cold start.
ENGLISH = {
    "photo_timeout": (
        "I haven't received a photo yet. If you send one through the simulator later, "
        "I'll attach it to a case and a colleague will follow up. Thanks for calling."
    ),
    "transferring": "Connecting you to a council officer now.",
    "ask_landline": (
        "We're temporarily unable to call mobile phones back. "
        "What's a landline number we can ring you on instead?"
    ),
    "promise_callback": (
        "A safeguarding-trained colleague will call you back on this number "
        "within the next four hours."
    ),
    "fallback_ack": (
        "Thank you. I have logged your enquiry and a council officer will be "
        "in touch within two working days."
    ),
    "goodbye": "Thanks for calling Aldershire District Council. Goodbye.",
    "disconnect_apology": "Sorry, something has gone wrong. Goodbye.",
    "callback_simulation": (
        "Hello, this is Aldershire District Council calling you back. This is a "
        "simulation of what a callback from a real human could be like. "
        "If you log into the agent workspace, you can accept these calls there. "
        "Thanks for using NDX:Try. Goodbye."
    ),
}

LANGUAGE_NAME = {
    "en": "English",
    "it": "Italian",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "pl": "Polish",
    "cy": "Welsh",
    "ro": "Romanian",
}

_CACHE: dict[tuple[str, str], str] = {}


def _normalise_lang(raw: str | None) -> str:
    if not raw:
        return "en"
    code = raw.strip().lower()
    code = re.split(r"[_\-]", code, maxsplit=1)[0]
    return code if code in LANGUAGE_NAME else "en"


def _translate(text: str, lang: str) -> str:
    """Bedrock-backed English -> target translation. Plain prose, no SSML."""
    if lang == "en":
        return text
    target = LANGUAGE_NAME[lang]
    prompt = (
        f"Translate the following English text into natural spoken {target}. "
        f"It will be read aloud by an automated council switchboard, so keep it "
        f"warm and clear. Return only the translation, no quotes, no preamble.\n\n"
        f"English: {text}"
    )
    resp = bedrock.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 400, "temperature": 0.1},
    )
    out = resp["output"]["message"]["content"][0]["text"].strip()
    # Strip wrapping quotes that some models add despite the instruction.
    if (out.startswith('"') and out.endswith('"')) or (out.startswith("'") and out.endswith("'")):
        out = out[1:-1].strip()
    return out


def localize(key: str, language: str) -> str:
    lang = _normalise_lang(language)
    if key not in ENGLISH:
        logger.warning("Unknown localizer key %r, falling back to empty.", key)
        return ""
    if lang == "en":
        return ENGLISH[key]
    cache_key = (key, lang)
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    try:
        translated = _translate(ENGLISH[key], lang)
    except Exception:
        logger.exception("Translation failed for key=%s lang=%s; using English.", key, lang)
        translated = ENGLISH[key]
    _CACHE[cache_key] = translated
    return translated


def lambda_handler(event, _context):
    params = (event.get("Details", {}) or {}).get("Parameters", {}) or {}
    key = params.get("key", "")
    language = params.get("language", "en")
    text = localize(key, language)
    logger.info("localize(key=%s, lang=%s) -> %r", key, language, text[:80])
    return {"text": text}
