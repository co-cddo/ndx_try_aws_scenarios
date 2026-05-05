"""Outbound callback simulation Lambda for AI Contact Centre.

Invoked by the inbound contact flow when a transfer-to-agent is requested but
no agent is available (the demo IVR has no real agents). This Lambda:

  1. Reads the customer's PSTN endpoint from the inbound contact's
     ContactData.CustomerEndpoint.Address (passed as a Lambda parameter).
  2. Calls connect:StartOutboundVoiceContact with the callback flow.
  3. Returns success so the inbound flow can play "we'll call you back" and
     disconnect.

The outbound contact flow (CallbackSimulationFlow) plays the simulation
script: "this is a simulation of what a real human callback could be like;
log into the agent workspace to accept calls there. Thanks for using
NDX:Try."
"""

import json
import logging
import os
import time

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def _last_segment(s: str) -> str:
    return s.rsplit("/", 1)[-1] if "/" in s else s


INSTANCE_ID = _last_segment(os.environ["INSTANCE_ID"])
CALLBACK_FLOW_ID = _last_segment(os.environ["CALLBACK_FLOW_ID"])
SOURCE_PHONE_NUMBER = os.environ["SOURCE_PHONE_NUMBER"]

connect = boto3.client("connect")


def lambda_handler(event, context):
    is_contact_flow = isinstance(event, dict) and "Details" in event
    customer_phone = ""
    if is_contact_flow:
        details = event.get("Details", {})
        params = details.get("Parameters", {}) or {}
        customer_phone = (params.get("customer_phone")
                          or details.get("ContactData", {}).get("CustomerEndpoint", {}).get("Address", "")
                          or "")
    else:
        customer_phone = event.get("customer_phone", "") or ""

    customer_phone = customer_phone.strip()
    logger.info("Outbound callback requested for %s", customer_phone)

    if not customer_phone or not customer_phone.startswith("+"):
        return _resp(is_contact_flow, success=False,
                     error="No valid customer phone number to call back")

    # Wait briefly so the inbound call has time to disconnect cleanly.
    time.sleep(2)

    try:
        resp = connect.start_outbound_voice_contact(
            InstanceId=INSTANCE_ID,
            ContactFlowId=CALLBACK_FLOW_ID,
            DestinationPhoneNumber=customer_phone,
            SourcePhoneNumber=SOURCE_PHONE_NUMBER,
            Attributes={"callback-source": "ndx-try-aicc-simulation"},
        )
        logger.info("StartOutboundVoiceContact ok: %s", resp.get("ContactId"))
        return _resp(is_contact_flow, success=True, outbound_contact_id=resp.get("ContactId", ""))
    except ClientError as exc:
        msg = exc.response.get("Error", {}).get("Message", "")
        code = exc.response.get("Error", {}).get("Code", "")
        logger.exception("StartOutboundVoiceContact failed: %s %s", code, msg)
        return _resp(is_contact_flow, success=False, error=f"{code}: {msg}")


def _resp(is_contact_flow: bool, *, success: bool, error: str = "", outbound_contact_id: str = ""):
    if is_contact_flow:
        return {
            "callback_initiated": "true" if success else "false",
            "outbound_contact_id": outbound_contact_id,
            "error": error,
        }
    return {"success": success, "error": error, "outbound_contact_id": outbound_contact_id}
