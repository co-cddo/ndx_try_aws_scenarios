"""RAG fulfilment Lambda for the AI Contact Centre scenario.

Voice path:
  Welcome -> Lex GetIntent -> InvokeRag (this Lambda)

Lex V2 doesn't surface InputTranscript through Connect; we read the actual
spoken text from Contact Lens segments (DynamoDB ContactLensCacheTable) keyed
on the contact id. If Contact Lens hasn't produced a segment yet (1-3s lag),
we fall back to a per-intent canned query so the call still gets a sensible
answer.

If the transcript covers more than one council intent, we call the multi-
intent decomposer and synthesise the spec's signature climax sentence
("I've heard N things; environmental health visiting Wednesday; ref ABCD;
plus M queued"). Otherwise we run a single Bedrock RetrieveAndGenerate over
the transcript.

Also accepts the legacy Lex fulfillment hook event shape for direct testing.
"""

import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _last_segment(arn_or_id: str) -> str:
    return arn_or_id.rsplit("/", 1)[-1] if "/" in arn_or_id else arn_or_id


KB_ID = _last_segment(os.environ["KB_ID"])
GUARDRAIL_ID = _last_segment(os.environ["GUARDRAIL_ID"])
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "DRAFT")
MODEL_ARN = os.environ["MODEL_ARN"]
DDB_TABLE_NAME = os.environ.get("DDB_TABLE_NAME", "")
MULTI_INTENT_FN_NAME = os.environ.get("MULTI_INTENT_FN_NAME", "")
INSTANCE_ID = os.environ.get("CONNECT_INSTANCE_ID", "")

bedrock_agent = boto3.client("bedrock-agent-runtime")
bedrock_runtime = boto3.client("bedrock-runtime")
connect = boto3.client("connect")
ddb = boto3.resource("dynamodb")
lambda_client = boto3.client("lambda")
_table = ddb.Table(DDB_TABLE_NAME) if DDB_TABLE_NAME else None

VOICE_BY_LANG = {
    "en": ("Amy",     "neural"),
    "it": ("Bianca",  "neural"),
    "fr": ("Lea",     "neural"),
    "de": ("Vicki",   "neural"),
    "es": ("Lucia",   "neural"),
    "pl": ("Ola",     "neural"),
    "cy": ("Gwyneth", "standard"),
    "ro": ("Carmen",  "standard"),
}

# BCP-47 language codes used by Connect's system $.LanguageCode attribute,
# which it consults to pick the matching Lex locale on each
# ConnectParticipantWithLexBot call. We set this via an UpdateContactData
# block in the contact flow (see "Set Lex locale" action). For Welsh and
# Romanian, Lex has no locale, so we keep en_US transcription -- the bot
# still answers in target language because rag-fulfilment generates its
# response in that language.
LEX_LOCALE_BY_LANG = {
    "en": "en-US",
    "it": "it-IT",
    "fr": "fr-FR",
    "de": "de-DE",
    "es": "es-ES",
    "pl": "pl-PL",
    "cy": "en-US",
    "ro": "en-US",
}

LANGUAGE_NAME = {
    "en": "English", "it": "Italian", "fr": "French", "de": "German",
    "es": "Spanish", "pl": "Polish", "cy": "Welsh", "ro": "Romanian",
}

# Cache (english_text, lang) -> translated text. Persists for the warm-pool
# lifetime of the Lambda. Each cold start pays one Bedrock call per fixed
# string per non-English language.
_TRANSLATION_CACHE: Dict[tuple, str] = {}


def lambda_handler(event, context):
    is_contact_flow = isinstance(event, dict) and "Details" in event
    contact_id = ""
    customer_phone = ""
    if is_contact_flow:
        cdata = event.get("Details", {}).get("ContactData", {}) or {}
        contact_id = cdata.get("ContactId", "") or ""
        customer_phone = (cdata.get("CustomerEndpoint", {}) or {}).get("Address", "") or ""

    matched_intent = _extract_intent(event)
    transcript = _extract_utterance(event)
    decomposed = _extract_decomposed_from_event(event)

    # Detect (or read existing) caller language. First turn: Bedrock detects from
    # the (possibly-noisy en_GB-Lex) transcript and we persist the choice via
    # connect.update_contact_attributes. Subsequent turns just read the attribute.
    lang, lang_first_set = _resolve_language(event, contact_id, transcript)

    # Goodbye detection: any short transcript matching "no"/"nope"/"goodbye"/"bye" etc.
    # Lex's GoodbyeIntent doesn't always fire on bare "no"; we shortcut here so the flow
    # can route to the disconnect action without running RAG.
    if _looks_like_goodbye(transcript, matched_intent):
        return _respond(event, is_contact_flow,
                        "Thanks for calling Aldershire District Council. Goodbye.",
                        fulfilled=True, intervened=False, should_disconnect=True,
                        lang=lang, lang_first_set=lang_first_set)
    # Contact Lens DDB poll disabled: doesn't fire for IVR-only contacts (no agent participant).
    # Lex's fulfillment hook now stores the spoken transcript in session attributes, surfaced via
    # $.Lex.SessionAttributes.lex_input_transcript -> user_utterance param.

    # ASR fragments under 3 words are usually noise (filler, partial speech) UNLESS the
    # decomposer found a real intent in them ("safeguarding concern" is 2 words but valid).
    # Trust the decomposer; only reject when it also returned no intents.
    transcript_word_count = len(transcript.split()) if transcript else 0
    decomposer_found_intent = bool(decomposed and decomposed.get("intents"))
    if (transcript and transcript_word_count < 3
            and matched_intent in ("FallbackIntent", "", None)
            and not decomposer_found_intent):
        logger.info("ASR fragment too short (%d words) and decomposer empty: %r",
                    transcript_word_count, transcript)
        return _respond(event, is_contact_flow,
                        "Sorry, I didn't quite catch that. Could you say it again?",
                        fulfilled=False, intervened=False,
                        lang=lang, lang_first_set=lang_first_set)

    if not transcript and matched_intent:
        transcript = _synthesise_query(matched_intent)
        logger.info("falling back to synthesised query: %r", transcript)

    logger.info("RAG fulfilment: contact_id=%s lang=%s transcript=%r intent=%s preDecomposed=%s",
                contact_id, lang, transcript[:200], matched_intent,
                bool(decomposed and decomposed.get("intents")))

    if not transcript:
        return _respond(event, is_contact_flow, "Sorry, I didn't quite catch that. Could you say it again?",
                        fulfilled=False, intervened=False,
                        lang=lang, lang_first_set=lang_first_set)

    if not decomposed and MULTI_INTENT_FN_NAME:
        decomposed = _try_decompose(transcript)
    intents = (decomposed or {}).get("intents", []) if decomposed else []
    safeguarding = bool((decomposed or {}).get("requires_safeguarding_review"))

    if len(intents) >= 2:
        answer = _build_climax_answer(decomposed, intents)
        return _respond(event, is_contact_flow, answer,
                        fulfilled=True, intervened=False,
                        decomposed=decomposed,
                        needs_landline=safeguarding and _is_uk_mobile(customer_phone),
                        lang=lang, lang_first_set=lang_first_set)

    # FlyTip on a voice call: we'd normally ask the caller to send a photo via
    # WhatsApp or SMS, but PSTN-out is blocked in the sandbox. Direct them to
    # the NDX:Try simulator (companion SPA's WhatsApp pane), then signal the
    # flow to wait for a photo arriving from this caller's phone.
    decomposed_has_flytip = any(
        (i.get("intent_name") or "").lower() == "flytip"
        for i in (decomposed or {}).get("intents") or []
    )
    looks_like_flytip = _looks_like_flytip(transcript)
    if customer_phone and (matched_intent == "FlyTip" or decomposed_has_flytip or looks_like_flytip):
        return _respond(event, is_contact_flow,
                        "Got it, fly-tipping. Normally I'd ask you to send a photo over "
                        "WhatsApp or send you a text with a link, but I can't make outbound "
                        "calls from this session. Please open the NDX:Try simulator, find "
                        "the call handler page, type your phone number, and attach a "
                        "picture. I'll hold while you do that.",
                        fulfilled=True, intervened=False,
                        decomposed=decomposed,
                        awaits_photo=True,
                        lang=lang, lang_first_set=lang_first_set)

    # Single-intent path. If the decomposer flagged safeguarding, return a SHORT
    # acknowledgement only. The contact flow decides whether to transfer to an
    # available agent OR ask for a landline OR promise a callback — playing the
    # right follow-up message in each branch — so we don't pre-empt that decision
    # here with "we can't call mobiles" before we know if a transfer is possible.
    if safeguarding:
        is_mobile = _is_uk_mobile(customer_phone)
        return _respond(event, is_contact_flow,
                        "Thank you for telling me. I've flagged this as urgent.",
                        fulfilled=True, intervened=False,
                        decomposed=decomposed,
                        needs_landline=is_mobile,
                        lang=lang, lang_first_set=lang_first_set)

    answer = _rag(transcript, lang)
    if answer is None:
        return _respond(event, is_contact_flow,
                        "I cannot help with that one directly, but I will get a colleague to call you back.",
                        fulfilled=False, intervened=True,
                        lang=lang, lang_first_set=lang_first_set)
    # _rag already returns the answer in the target language; skip _respond's translation.
    return _respond(event, is_contact_flow, answer, fulfilled=True, intervened=False,
                    lang=lang, lang_first_set=lang_first_set, already_localized=True)


def _resolve_language(event, contact_id: str, transcript: str) -> tuple:
    """Read existing LanguageCode attribute, or detect from the first transcript.
    Returns (lang_code, is_first_detection). When first detected, persist via
    connect.update_contact_attributes so subsequent flow blocks (and the
    Apply caller voice block) can read $.Attributes.LanguageCode/PollyVoice."""
    if not (isinstance(event, dict) and "Details" in event):
        return "en", False
    attrs = event.get("Details", {}).get("ContactData", {}).get("Attributes", {}) or {}
    existing = (attrs.get("LanguageCode") or "").strip().lower()
    if existing in VOICE_BY_LANG:
        return existing, False
    # First turn: detect from transcript. If transcript missing, assume English
    # (the flow's seed greeting is English; caller hasn't spoken yet).
    if not transcript:
        return "en", False
    lang = _detect_language(transcript)
    if INSTANCE_ID and contact_id:
        voice, engine = VOICE_BY_LANG.get(lang, ("Amy", "neural"))
        polly_language = LEX_LOCALE_BY_LANG.get(lang, "en-US")
        try:
            connect.update_contact_attributes(
                InstanceId=INSTANCE_ID,
                InitialContactId=contact_id,
                Attributes={
                    "LanguageCode": lang,
                    "PollyVoice": voice,
                    "PollyEngine": engine,
                    "PollyLanguage": polly_language,
                },
            )
        except Exception:
            logger.exception("update_contact_attributes failed for contact %s", contact_id)
    return lang, True


def _detect_language(transcript: str) -> str:
    """Best-effort language ID via Bedrock Nova. The input transcript was
    produced by an en_US Lex/Transcribe pipe, so non-English speech often
    arrives as phonetic English-sounding nonsense. Lean on that: ask the model
    to consider whether the transcript looks like real English vs. gibberish
    that hints at another language."""
    if not transcript or len(transcript.strip()) < 2:
        return "en"
    prompt = (
        "You are classifying the language of a short caller utterance. The "
        "audio was transcribed by an English (en_US) speech-to-text engine, "
        "so non-English speech usually arrives as broken/phonetic English "
        "(\"chow comma sty\" for Italian \"ciao come stai\"). Look for: real "
        "English semantics (likely en), or non-English diacritics, real "
        "non-English words, OR phonetic gibberish that doesn't form a coherent "
        "English sentence (likely a non-English language).\n\n"
        "Reply with EXACTLY one two-letter code from: en, it, fr, de, es, pl, "
        "cy, ro. No explanation. If the transcript clearly states real English "
        "words in coherent order, reply en. Otherwise pick the most likely "
        "non-English option based on phonetic clues or vocabulary.\n\n"
        f"Transcript: \"{transcript.strip()}\""
    )
    try:
        resp = bedrock_runtime.converse(
            modelId=MODEL_ARN,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 8, "temperature": 0.0},
        )
        out = resp["output"]["message"]["content"][0]["text"].strip().lower()
        code = re.sub(r"[^a-z]", "", out)[:2]
        result = code if code in VOICE_BY_LANG else "en"
        logger.info("language detect: %r -> %s (raw %r)", transcript[:120], result, out[:30])
        return result
    except Exception:
        logger.exception("language detect failed for transcript=%r", transcript[:120])
        return "en"


def _localize_text(text: str, lang: str) -> str:
    """Translate fixed English strings to target language via Bedrock, with cache."""
    if lang == "en" or not text:
        return text
    cache_key = (text, lang)
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]
    target = LANGUAGE_NAME.get(lang, "English")
    prompt = (
        f"Translate the following English text into natural spoken {target}. "
        f"This will be read aloud by a council switchboard, so keep it warm and "
        f"clear. Return only the translation, no quotes, no preamble.\n\n"
        f"English: {text}"
    )
    try:
        resp = bedrock_runtime.converse(
            modelId=MODEL_ARN,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 600, "temperature": 0.1},
        )
        out = resp["output"]["message"]["content"][0]["text"].strip()
        if (out.startswith('"') and out.endswith('"')) or (out.startswith("'") and out.endswith("'")):
            out = out[1:-1].strip()
        _TRANSLATION_CACHE[cache_key] = out
        return out
    except Exception:
        logger.exception("translation failed for lang=%s", lang)
        return text


def _read_contact_lens_transcript(contact_id: str, max_wait_seconds: float = 1.5) -> str:
    """Poll the Contact Lens DDB cache for the latest CUSTOMER segments.

    Contact Lens populates ContactLensCacheTable about 1-3s after the user
    speaks. We poll briefly so the Lambda still returns within the contact
    flow's 25s budget.
    """
    if _table is None or not contact_id:
        return ""
    deadline = time.time() + max_wait_seconds
    last = ""
    while time.time() < deadline:
        try:
            resp = _table.query(
                KeyConditionExpression=Key("contactId").eq(contact_id),
                ScanIndexForward=False,
                Limit=20,
            )
        except Exception as exc:
            logger.warning("DDB query failed: %s", exc)
            return last
        items = resp.get("Items") or []
        customer_segments = [i for i in items if (i.get("speaker") or "").upper().startswith("C")]
        if customer_segments:
            customer_segments.sort(key=lambda x: int(x.get("segmentTimestamp", 0)))
            joined = " ".join(s.get("transcript", "").strip() for s in customer_segments if s.get("transcript"))
            joined = joined.strip()
            if joined and joined != last:
                last = joined
            if joined:
                return joined
        time.sleep(0.5)
    return last


def _try_decompose(transcript: str) -> Optional[Dict[str, Any]]:
    if not MULTI_INTENT_FN_NAME or len(transcript.split()) < 6:
        return None
    try:
        resp = lambda_client.invoke(
            FunctionName=MULTI_INTENT_FN_NAME,
            InvocationType="RequestResponse",
            Payload=json.dumps({"utterance": transcript}).encode("utf-8"),
        )
        payload = json.loads(resp["Payload"].read() or b"{}")
        decomposed = payload.get("decomposed") or payload
        if isinstance(decomposed, dict) and decomposed.get("intents"):
            return decomposed
    except Exception as exc:
        logger.warning("multi-intent decomposer failed: %s", exc)
    return None


def _build_climax_answer(decomposed: Dict[str, Any], intents: List[Dict[str, Any]]) -> str:
    safeguarding = bool(decomposed.get("requires_safeguarding_review"))
    truncated = decomposed.get("truncated_intents") or []
    intent_names = [i.get("intent_name", "") for i in intents]

    parts: List[str] = []
    if safeguarding:
        parts.append(
            "Thank you for telling me. I've flagged this as urgent and a safeguarding-trained colleague will call you back within the next four hours on this number."
        )
    parts.append(
        f"I've heard {_spell(len(intents))} things you'd like help with: {_friendly_join(intent_names)}."
    )
    actions = [_action_for(name) for name in intent_names if name]
    actions = [a[0].upper() + a[1:] + "." for a in actions if a]
    parts.extend(actions)
    if truncated:
        parts.append(
            f"I've also queued {_spell(len(truncated))} more for follow-up: {_friendly_join(truncated)}."
        )
    parts.append("I'll get a single case reference back to you.")
    return _trim_for_polly(" ".join(parts), max_chars=700)


_FRIENDLY_NAMES = {
    "BinCollection": "your bin collection",
    "MissedCollection": "the missed bin collection",
    "FlyTip": "the fly-tipping",
    "PotholeReport": "the pothole",
    "BrokenPaving": "the broken paving",
    "ParkedVehicle": "the car blocking your driveway",
    "DampMould": "the damp and mould",
    "AntiSocialBehaviour": "the anti-social behaviour",
    "Safeguarding": "the safeguarding concern",
    "CouncilTax": "council tax",
    "BenefitsSupport": "benefits support",
    "PlanningEnquiry": "your planning question",
    "GeneralEnquiry": "the general enquiry",
    "Other": "the other issue",
}

_ACTIONS = {
    "BinCollection": "I'll send you the collection schedule",
    "MissedCollection": "I've logged a missed-collection job for the crew tomorrow",
    "FlyTip": "I've raised the fly-tipping with environmental health for a Wednesday visit",
    "PotholeReport": "the pothole is logged with highways for inspection",
    "BrokenPaving": "the broken paving is queued for the highways crew",
    "ParkedVehicle": "I've notified parking enforcement to attend",
    "DampMould": "the housing repairs team will contact you within two working days",
    "AntiSocialBehaviour": "the ASB team will be in touch within 48 hours",
    "Safeguarding": "a safeguarding officer will phone you back",
    "CouncilTax": "I've flagged your account for a council tax callback today",
    "BenefitsSupport": "the benefits team will phone you back",
    "PlanningEnquiry": "a planning officer will respond within five working days",
}


def _action_for(intent_name: str) -> str:
    return _ACTIONS.get(intent_name, "")


def _friendly_join(items: List[str], joiner: str = ", ") -> str:
    nice = [_FRIENDLY_NAMES.get(i, i) for i in items if i]
    if len(nice) <= 1:
        return nice[0] if nice else ""
    if len(nice) == 2:
        return f"{nice[0]} and {nice[1]}"
    return joiner.join(nice[:-1]) + f", and {nice[-1]}"


def _spell(n: int) -> str:
    return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"][n] if 0 <= n < 9 else str(n)


def _rag(query: str, lang: str = "en") -> Optional[str]:
    target_language = LANGUAGE_NAME.get(lang, "English")
    language_clause = (
        ""
        if lang == "en"
        else f"\n- Reply ONLY in {target_language}. Do not switch language mid-sentence."
    )
    voice_prompt_template = (
        "You are an Aldershire District Council phone assistant. Answer the caller using "
        "the search results below. Reply in 1-2 short, conversational sentences. "
        "Read out the actual information; skip preambles and bullet lists.\n\n"
        "Special handling:\n"
        "- The query came from speech-to-text so words like 'connected', 'dump', 'tar' "
        "  may be 'collected', 'damp', 'tax', and dictated postcodes may appear as "
        "  'b. n. one five a. a.' or 'a. l. five seven b. b.' — interpret naturally.\n"
        "- If asked about bin collection without a postcode, ask 'What's your postcode?'.\n"
        "- If the caller gives ANY postcode-shaped input (real or demo), pick one of the "
        "  collection schedules from the search results and answer with that day. This is "
        "  a council demo so do not reject the postcode as out-of-area; just pick any "
        "  schedule from search results and give it as the answer."
        f"{language_clause}\n\n"
        "Search results:\n$search_results$\n\n"
        "Caller said: $query$\n\n"
        "Answer:"
    )
    try:
        resp = bedrock_agent.retrieve_and_generate(
            input={"text": query},
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
                        "promptTemplate": {"textPromptTemplate": voice_prompt_template},
                        "inferenceConfig": {
                            "textInferenceConfig": {"maxTokens": 180, "temperature": 0.2},
                        },
                    },
                },
            },
        )
    except Exception as exc:
        logger.exception("Bedrock retrieve_and_generate failed: %s", exc)
        return None

    answer_text = (resp.get("output") or {}).get("text") or ""
    # Guardrails INTERVENED includes PII anonymisation (NAME/ADDRESS/PHONE/EMAIL replaced
    # with {placeholders}). The answer is still useful; only treat as fail when there's
    # genuinely no content or it matches the blocked-output canned message.
    BLOCKED_MARKER = "I can't give that kind of advice"
    if not answer_text or BLOCKED_MARKER in answer_text:
        return None
    # Replace bare placeholders with friendlier voice phrasing.
    answer_text = (answer_text
                   .replace("{ADDRESS}", "an address on file")
                   .replace("{PHONE}", "the contact number we hold")
                   .replace("{NAME}", "the resident")
                   .replace("{EMAIL}", "the email address we hold"))
    return _trim_for_polly(answer_text)


def _extract_utterance(event: Dict[str, Any]) -> str:
    if isinstance(event, dict) and "Details" in event:
        params = event.get("Details", {}).get("Parameters", {}) or {}
        # Prefer Lex's per-turn transcript. transcribe_transcript is the
        # one-shot language-detection capture and is only useful as a
        # fallback for the very first turn before Lex has any input.
        if "user_utterance" in params and (params.get("user_utterance") or "").strip():
            return params["user_utterance"].strip()
        attrs = event.get("Details", {}).get("ContactData", {}).get("Attributes", {}) or {}
        for k in ("user_utterance", "InputTranscript"):
            if k in attrs and attrs[k]:
                return attrs[k].strip()
        transcribe = (params.get("transcribe_transcript") or "").strip()
        if transcribe:
            return transcribe
        if attrs.get("TranscribeTranscript"):
            return attrs["TranscribeTranscript"].strip()
    return (event.get("inputTranscript") or "").strip()


def _extract_intent(event: Dict[str, Any]) -> str:
    if isinstance(event, dict) and "Details" in event:
        params = event.get("Details", {}).get("Parameters", {}) or {}
        if params.get("matched_intent"):
            return params["matched_intent"].strip()
    return ""


def _extract_decomposed_from_event(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """If Lex's fulfillment hook already ran, the decomposed JSON is in the event params."""
    if not (isinstance(event, dict) and "Details" in event):
        return None
    raw = (event.get("Details", {}).get("Parameters", {}) or {}).get("decomposed_json", "")
    if not raw:
        return None
    try:
        d = json.loads(raw)
        if isinstance(d, dict) and d.get("intents"):
            return d
    except Exception:
        pass
    return None


_INTENT_TO_QUERY = {
    "BinCollection": "When are bins collected?",
    "MissedCollection": "What do I do if my bins were missed?",
    "FlyTip": "How do I report fly tipping?",
    "PotholeReport": "How do I report a pothole?",
    "BrokenPaving": "How do I report broken paving?",
    "ParkedVehicle": "How do I report a parked vehicle blocking my driveway?",
    "DampMould": "How do I report damp and mould in my home?",
    "AntiSocialBehaviour": "How do I report anti-social behaviour?",
    "Safeguarding": "How do I report a safeguarding concern?",
    "CouncilTax": "Council tax help and payment options",
    "BenefitsSupport": "How do I apply for housing benefit or council tax reduction?",
    "PlanningEnquiry": "Do I need planning permission?",
    "WelcomeIntent": "What council services can I get help with?",
    "FallbackIntent": "What council services can I get help with?",
}


def _synthesise_query(intent_name: str) -> str:
    return _INTENT_TO_QUERY.get(intent_name, intent_name)


_GOODBYE_RE = re.compile(
    r"^\s*(no|nope|nah|nothing|goodbye|bye|cheers|thanks bye|"
    r"that'?s all|that is all|i'?m (done|good|fine|alright|okay|ok)|"
    r"all done|nothing else|no thanks?|no thank you|i'?m all set)\s*\.?\s*$",
    re.IGNORECASE,
)


_FLYTIP_PATTERNS = re.compile(
    r"\b("
    r"fly[\s-]?tip|fly[\s-]?tipping|flytip|"
    r"illegal dumping|dumped (?:a |some )?(?:rubbish|sofa|mattress|bin|bag|fridge|tv)|"
    r"rubbish (?:has been|been|was|been just) dumped|pile of rubbish|"
    r"someone (?:has )?dumped"
    r")\b",
    re.IGNORECASE,
)


def _looks_like_flytip(transcript: str) -> bool:
    return bool(_FLYTIP_PATTERNS.search(transcript or ""))


def _looks_like_goodbye(transcript: str, matched_intent: str) -> bool:
    if matched_intent == "GoodbyeIntent":
        return True
    if not transcript:
        return False
    return bool(_GOODBYE_RE.match(transcript.strip()))


def _is_uk_mobile(phone: str) -> bool:
    if not phone:
        return False
    p = phone.strip().replace(" ", "")
    return p.startswith("+447") or p.startswith("07") or p.startswith("00447")


def _trim_for_polly(text: str, max_chars: int = 700) -> str:
    if len(text) <= max_chars:
        return text
    cut = text.rfind(". ", 0, max_chars)
    return text[: cut + 1] if cut > 100 else text[:max_chars]


def _respond(event, is_contact_flow: bool, message: str, *, fulfilled: bool, intervened: bool,
             decomposed: Optional[Dict[str, Any]] = None, should_disconnect: bool = False,
             needs_landline: bool = False, awaits_photo: bool = False,
             lang: str = "en", lang_first_set: bool = False,
             already_localized: bool = False):
    if is_contact_flow:
        # Translate the static English message into the caller's language unless
        # the caller is already speaking English or _rag has produced a localized
        # answer directly. The closing "Anything else?" follow-up is also localized.
        if lang != "en" and not already_localized:
            message = _localize_text(message, lang)
        # Build the prompt the flow should play. If the bot's reply already ends with
        # a question mark (e.g. "What's your postcode?"), don't tack "Anything else?"
        # on the end — that confuses the caller. Same for disconnect-bound responses,
        # the landline-prompting branch, and the photo-wait branch (the flow holds
        # the line while polling for the photo).
        stripped = (message or "").rstrip()
        ends_with_question = stripped.endswith("?")
        if should_disconnect or ends_with_question or needs_landline or awaits_photo:
            prompt = message
        else:
            anything_else = _localize_text("Anything else?", lang) if lang != "en" else "Anything else?"
            prompt = f"{message} {anything_else}"
        voice, engine = VOICE_BY_LANG.get(lang, ("Amy", "neural"))
        out = {
            "answer": message,
            "prompt": prompt,
            "fulfilled": "true" if fulfilled else "false",
            "intervened": "true" if intervened else "false",
            "should_disconnect": "true" if should_disconnect else "false",
            "needs_landline": "true" if needs_landline else "false",
            "awaits_photo": "true" if awaits_photo else "false",
            "language_code": lang,
            "polly_voice": voice,
            "polly_engine": engine,
            "language_first_set": "true" if lang_first_set else "false",
        }
        if decomposed:
            out["intent_count"] = str(len(decomposed.get("intents") or []))
            out["safeguarding"] = "true" if decomposed.get("requires_safeguarding_review") else "false"
        return out
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
