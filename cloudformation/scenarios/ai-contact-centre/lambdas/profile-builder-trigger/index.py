"""Customer profile builder trigger.

Fast Lambda invoked at the start of every inbound contact. Looks up Customer
Profiles by phone; if the caller already has a profile, returns immediately.
If not, fires the heavyweight ProfileBuilderFunction asynchronously
(InvocationType=Event) so the contact flow doesn't block while Bedrock
generates the rich background.

By the time the call reaches the agent transfer, the profile should be
populated, so Connect's CCP customer-profile widget shows context.
"""

import json
import logging
import os

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DOMAIN_NAME = os.environ["CUSTOMER_PROFILES_DOMAIN"]
HEAVY_FN = os.environ["PROFILE_BUILDER_FN"]

profiles = boto3.client("customer-profiles")
lambdac = boto3.client("lambda")


def lambda_handler(event, context):
    is_contact_flow = isinstance(event, dict) and "Details" in event
    customer_phone = ""
    contact_id = ""
    if is_contact_flow:
        cdata = event.get("Details", {}).get("ContactData", {}) or {}
        contact_id = cdata.get("ContactId", "") or ""
        customer_phone = (cdata.get("CustomerEndpoint", {}) or {}).get("Address", "") or ""
    customer_phone = customer_phone.strip()
    logger.info("Profile lookup for phone=%r contact=%s", customer_phone, contact_id)

    if not customer_phone:
        return _resp(is_contact_flow, status="no_phone")

    # Search for an existing profile by phone.
    existing_id = ""
    try:
        resp = profiles.search_profiles(
            DomainName=DOMAIN_NAME,
            KeyName="_phone",
            Values=[customer_phone],
        )
        items = resp.get("Items", []) or []
        if items:
            existing_id = items[0].get("ProfileId", "") or ""
    except ClientError as exc:
        logger.warning("SearchProfiles failed: %s", exc)

    if existing_id:
        logger.info("Existing profile %s for %s", existing_id, customer_phone)
        return _resp(is_contact_flow, status="existing", profile_id=existing_id)

    # No profile — async invoke the heavy builder so the flow doesn't wait.
    try:
        lambdac.invoke(
            FunctionName=HEAVY_FN,
            InvocationType="Event",
            Payload=json.dumps({
                "customer_phone": customer_phone,
                "contact_id": contact_id,
            }).encode("utf-8"),
        )
        logger.info("Fanned out profile build for %s", customer_phone)
        return _resp(is_contact_flow, status="building", profile_id="")
    except ClientError as exc:
        logger.exception("Async invoke failed: %s", exc)
        return _resp(is_contact_flow, status="error", profile_id="")


def _resp(is_contact_flow: bool, *, status: str, profile_id: str = ""):
    if is_contact_flow:
        return {"profile_status": status, "profile_id": profile_id}
    return {"status": status, "profile_id": profile_id}
