"""Custom resource Lambda: associates a Connect phone number with a contact flow.

Idempotent disassociation on Delete (per F15). Required because CloudFormation
does not have a native AWS::Connect::PhoneNumberContactFlowAssociation type.
"""

import json
import logging
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

connect = boto3.client("connect")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    phone_number_id = props.get("PhoneNumberId")
    instance_id = props.get("InstanceId")
    contact_flow_id = props.get("ContactFlowId")

    if not all([phone_number_id, instance_id, contact_flow_id]):
        return _send(event, context, "FAILED", {},
                     reason="PhoneNumberId, InstanceId, ContactFlowId all required")

    try:
        if request_type in ("Create", "Update"):
            connect.associate_phone_number_contact_flow(
                PhoneNumberId=phone_number_id,
                InstanceId=instance_id,
                ContactFlowId=contact_flow_id,
            )
            return _send(event, context, "SUCCESS",
                         {"PhoneNumberId": phone_number_id, "ContactFlowId": contact_flow_id})

        if request_type == "Delete":
            try:
                connect.disassociate_phone_number_contact_flow(
                    PhoneNumberId=phone_number_id,
                    InstanceId=instance_id,
                )
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in ("ResourceNotFoundException", "InvalidParameterException"):
                    logger.info("disassociate skipped (%s), idempotent delete", code)
                else:
                    raise
            return _send(event, context, "SUCCESS", {})
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "unknown")
        msg = exc.response.get("Error", {}).get("Message", "")
        return _send(event, context, "FAILED", {}, reason=f"{code}: {msg}")

    return _send(event, context, "SUCCESS", {})


def _send(event, context, status, data, reason=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or f"{event['ResourceProperties'].get('PhoneNumberId', 'na')}-flow",
        "StackId": event["StackId"], "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"], "Data": data,
    }
    payload = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(event["ResponseURL"], data=payload, method="PUT")
    req.add_header("content-type", ""); req.add_header("content-length", str(len(payload)))
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("cfn-response %s: %s", status, resp.status)
    except Exception as exc:
        logger.exception("cfn-response send failed: %s", exc)
    return body
