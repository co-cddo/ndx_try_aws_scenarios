"""Customer profile + case-history builder (heavyweight).

Async-invoked from ProfileBuilderTriggerFunction when no profile exists for
the inbound caller's phone. Uses Bedrock Nova Pro to generate a synthetic
rich background AND 3-5 past Connect Cases, so by the time the call
transfers the agent's CCP shows both the customer profile widget AND a
populated cases history.

This is a *demo* generator. Profiles and case histories are entirely
synthetic (no real PII).
"""

import json
import logging
import os
import re
import uuid

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DOMAIN_NAME = os.environ["CUSTOMER_PROFILES_DOMAIN"]
MODEL_ID = os.environ.get("PROFILE_MODEL_ID", "amazon.nova-pro-v1:0")
CASES_DOMAIN_ID = os.environ.get("CASES_DOMAIN_ID", "")
CASES_TEMPLATE_ID = os.environ.get("CASES_TEMPLATE_ID", "")
REGION = os.environ.get("AWS_REGION", "us-east-1")

bedrock = boto3.client("bedrock-runtime")
profiles = boto3.client("customer-profiles")
cases_client = boto3.client("connectcases")
sts = boto3.client("sts")


SYSTEM_PROMPT = (
    "You generate synthetic UK council-resident profiles + past case history "
    "for an AI Contact Centre demo. Output ONLY a JSON object:\n\n"
    "{\n"
    '  "first_name": str,\n'
    '  "last_name": str,\n'
    '  "address": str (full UK street address with realistic Aldershire postcode AL1-AL8),\n'
    '  "postcode": str,\n'
    '  "household": str (1-2 sentences),\n'
    '  "preferences": str (1 sentence),\n'
    '  "vulnerability_flags": [str, ...] (0-3),\n'
    '  "background_summary": str (3-4 sentences, useful for an agent picking up the phone),\n'
    '  "past_cases": [\n'
    "    {\n"
    '      "title": str (under 50 chars),\n'
    '      "intent": one of [BinCollection, MissedCollection, FlyTip, PotholeReport, BrokenPaving, '
    "ParkedVehicle, DampMould, AntiSocialBehaviour, Safeguarding, CouncilTax, BenefitsSupport, PlanningEnquiry],\n"
    '      "status": one of ["Open", "Closed"],\n'
    '      "severity": one of ["low", "medium", "high"],\n'
    '      "summary": str (1-2 sentences describing the issue and what the council did),\n'
    '      "opened_days_ago": int 1-180\n'
    "    },\n"
    "    ... (3 to 5 entries — mostly closed with 1-2 still open if it makes sense)\n"
    "  ]\n"
    "}\n\n"
    "Make the profile feel real but obviously fictional — typical UK names, "
    "Aldershire address, plausible council interactions. Use UK English spelling. "
    "Keep all string fields under 200 characters."
)


def lambda_handler(event, context):
    customer_phone = (event.get("customer_phone") or "").strip()
    contact_id = event.get("contact_id", "")
    logger.info("Building profile for %s contact=%s", customer_phone, contact_id)

    if not customer_phone:
        return {"status": "no_phone"}

    profile = _generate_profile(customer_phone)
    if not profile:
        return {"status": "generation_failed"}

    profile_id = _upsert_profile(customer_phone, profile)
    logger.info("Upserted profile %s", profile_id)

    cases_created = []
    if profile_id and CASES_DOMAIN_ID:
        cases_created = _create_cases(customer_phone, profile_id, profile.get("past_cases") or [])
        logger.info("Created %d cases for %s", len(cases_created), profile_id)

    return {"status": "built", "profile_id": profile_id, "cases_count": len(cases_created)}


def _generate_profile(phone: str) -> dict:
    body = {
        "messages": [{"role": "user", "content": [
            {"text": f"Generate a profile + 3-5 past cases for caller {phone}."}
        ]}],
        "system": [{"text": SYSTEM_PROMPT}],
        "inferenceConfig": {"maxTokens": 1500, "temperature": 0.7, "topP": 0.9},
    }
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(resp["body"].read())
        text = ""
        for block in payload.get("output", {}).get("message", {}).get("content", []):
            if "text" in block:
                text = block["text"]
                break
        match = re.search(r"\{.*\}", text, re.DOTALL)
        return json.loads(match.group(0)) if match else json.loads(text)
    except Exception as exc:
        logger.exception("Bedrock generation failed: %s", exc)
        return {}


def _upsert_profile(phone: str, profile: dict) -> str:
    """True upsert keyed on phone. Three-pass:

    1. Search by phone. If 1+ profiles exist, pick the most-enriched one
       (has FirstName, else most-attributes), enrich-if-needed, MERGE any
       extras into it, return.
    2. If none, create one — but Connect's CTR auto-association can race us
       and create a parallel stub. So immediately after create, re-search
       and if duplicates landed, merge them into ours.

    Customer Profiles has no atomic create-if-not-exists, so the post-create
    re-search is the only way to converge to one profile per phone. The merge
    operation collapses extras into the canonical profile (preserving keys).
    """
    raw_attrs = {
        "household": profile.get("household", ""),
        "background_summary": profile.get("background_summary", ""),
        "preferences": profile.get("preferences", ""),
        "vulnerability_flags": ", ".join(profile.get("vulnerability_flags") or []),
        "demo_synthetic": "true",
    }
    attrs = {k: (v or "").strip()[:255] for k, v in raw_attrs.items()}
    attrs = {k: v for k, v in attrs.items() if v}

    address = {
        "Address1": profile.get("address", "")[:200],
        "PostalCode": profile.get("postcode", "")[:10],
        "Country": "United Kingdom",
    }
    fname = profile.get("first_name", "")[:100]
    lname = profile.get("last_name", "")[:100]

    try:
        canonical = _pick_canonical(phone)
        if canonical:
            pid = canonical["ProfileId"]
            if not (canonical.get("FirstName") or "").strip():
                logger.info("Enriching empty profile %s for %s", pid, phone)
                profiles.update_profile(
                    DomainName=DOMAIN_NAME, ProfileId=pid,
                    FirstName=fname, LastName=lname, Address=address,
                    PhoneNumber=phone, Attributes=attrs,
                )
            else:
                logger.info("Profile %s already enriched; leaving as-is", pid)
            _merge_duplicates_into(pid, phone)
            return pid

        resp = profiles.create_profile(
            DomainName=DOMAIN_NAME,
            FirstName=fname, LastName=lname, Address=address,
            PhoneNumber=phone, Attributes=attrs,
        )
        new_pid = resp.get("ProfileId", "")
        # CTR auto-resolution may have raced us; merge any other profiles for
        # this phone into the one we just created.
        _merge_duplicates_into(new_pid, phone)
        return new_pid
    except ClientError as exc:
        logger.exception("Profile upsert failed: %s", exc)
        return ""


def _pick_canonical(phone: str):
    """Return the most-enriched existing profile for this phone, or None."""
    try:
        resp = profiles.search_profiles(
            DomainName=DOMAIN_NAME, KeyName="_phone", Values=[phone],
        )
    except ClientError:
        return None
    items = resp.get("Items", []) or []
    if not items:
        return None
    # Prefer profile with FirstName populated; else most attributes; else first.
    items.sort(
        key=lambda p: (
            1 if (p.get("FirstName") or "").strip() else 0,
            len(p.get("Attributes") or {}),
        ),
        reverse=True,
    )
    return items[0]


def _merge_duplicates_into(canonical_pid: str, phone: str):
    """Merge every other profile that matches this phone into the canonical one."""
    if not canonical_pid:
        return
    try:
        resp = profiles.search_profiles(
            DomainName=DOMAIN_NAME, KeyName="_phone", Values=[phone],
        )
    except ClientError as exc:
        logger.warning("dedup search failed: %s", exc)
        return
    items = resp.get("Items", []) or []
    extras = [p["ProfileId"] for p in items
              if p.get("ProfileId") and p["ProfileId"] != canonical_pid]
    if not extras:
        return
    logger.info("Merging %d duplicate profile(s) into %s for %s",
                len(extras), canonical_pid, phone)
    try:
        profiles.merge_profiles(
            DomainName=DOMAIN_NAME,
            MainProfileId=canonical_pid,
            ProfileIdsToBeMerged=extras[:19],  # API caps at 20 incl main
        )
    except ClientError as exc:
        logger.warning("merge_profiles failed (will retry next contact): %s", exc)


_field_cache = {}


def _field_id(name: str) -> str:
    if name in _field_cache:
        return _field_cache[name]
    try:
        resp = cases_client.list_fields(domainId=CASES_DOMAIN_ID)
        for f in resp.get("fields", []):
            _field_cache[f["name"]] = f["fieldId"]
    except ClientError as exc:
        logger.warning("list_fields failed: %s", exc)
    return _field_cache.get(name, name)


def _create_cases(phone: str, profile_id: str, past_cases: list) -> list:
    """Create Connect Cases linked to the synthetic customer profile."""
    if not past_cases or not CASES_TEMPLATE_ID:
        return []
    account_id = sts.get_caller_identity()["Account"]
    customer_arn = (
        f"arn:aws:profile:{REGION}:{account_id}:domains/{DOMAIN_NAME}/profiles/{profile_id}"
    )
    created = []
    intent_field = _field_id("intent_category")
    intents_field = _field_id("intents")
    sg_field = _field_id("safeguarding_flag")
    phone_field = _field_id("customer_phone_number")
    severity_field = _field_id("severity")

    for case in past_cases[:5]:
        try:
            fields = []
            title = (case.get("title") or "Past enquiry").strip()[:50]
            intent = case.get("intent", "GeneralEnquiry")[:50]
            status_val = (case.get("status") or "Closed").strip()
            summary = (case.get("summary") or "")[:500]
            severity = case.get("severity", "low").lower()[:20]

            fields.append({"id": "title", "value": {"stringValue": title}})
            fields.append({"id": "summary", "value": {"stringValue": summary}})
            fields.append({"id": "customer_id", "value": {"stringValue": customer_arn}})
            if phone_field:
                fields.append({"id": phone_field, "value": {"stringValue": phone}})
            if intent_field:
                fields.append({"id": intent_field, "value": {"stringValue": intent}})
            if intents_field:
                fields.append({"id": intents_field, "value": {"stringValue": intent}})
            if severity_field:
                fields.append({"id": severity_field, "value": {"stringValue": severity}})
            if sg_field:
                fields.append({"id": sg_field, "value": {"booleanValue": intent == "Safeguarding"}})

            client_token = uuid.uuid4().hex[:32]
            resp = cases_client.create_case(
                domainId=CASES_DOMAIN_ID,
                templateId=CASES_TEMPLATE_ID,
                fields=fields,
                clientToken=client_token,
            )
            cid = resp.get("caseId")
            created.append({"caseId": cid, "title": title, "intent": intent, "status": status_val})

            # Close case if past_case status was Closed.
            if status_val.lower() == "closed" and cid:
                try:
                    cases_client.update_case(
                        domainId=CASES_DOMAIN_ID,
                        caseId=cid,
                        fields=[{"id": "status", "value": {"stringValue": "Closed"}}],
                    )
                except ClientError:
                    pass
        except ClientError as exc:
            logger.warning("CreateCase failed for %r: %s", case.get("title"), exc)
    return created
