"""Custom resource Lambda: waits for an Amazon Connect instance to reach ACTIVE.

Per tech-spec Task 4.1a [F15-Task-4.1a-detail]:
  Polls connect:DescribeInstance(InstanceId).Status every 10 seconds, max 30
  attempts (5 minutes). On Status == ACTIVE: cfn-response SUCCESS. On timeout:
  cfn-response FAILED with a remediation hint.
"""

import json
import logging
import time
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

POLL_INTERVAL_SECONDS = 10
MAX_ATTEMPTS = 30
ACCEPTABLE_TRANSIENT_ERRORS = {"ResourceNotFoundException", "ThrottlingException"}

connect = boto3.client("connect")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    instance_id = event.get("ResourceProperties", {}).get("InstanceId")

    if request_type == "Delete":
        return _send(event, context, "SUCCESS", {})

    if not instance_id:
        return _send(event, context, "FAILED", {}, reason="InstanceId property is required")

    transient_count = 0
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            resp = connect.describe_instance(InstanceId=instance_id)
            status = resp.get("Instance", {}).get("InstanceStatus", "")
            logger.info("attempt %d: status=%s", attempt, status)
            if status == "ACTIVE":
                return _send(event, context, "SUCCESS", {"InstanceStatus": status, "Attempts": attempt})
            if status == "CREATION_FAILED":
                return _send(event, context, "FAILED", {},
                             reason=f"Connect instance creation failed: {resp.get('Instance', {}).get('StatusReason', 'unknown')}")
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in ACCEPTABLE_TRANSIENT_ERRORS:
                transient_count += 1
                if transient_count <= 3:
                    logger.info("transient error %s on attempt %d (transient_count=%d); continuing",
                                code, attempt, transient_count)
                else:
                    return _send(event, context, "FAILED", {},
                                 reason=f"Persistent {code} after {transient_count} transient attempts")
            else:
                return _send(event, context, "FAILED", {},
                             reason=f"DescribeInstance error {code}: {exc.response.get('Error', {}).get('Message', '')}")
        time.sleep(POLL_INTERVAL_SECONDS)

    return _send(event, context, "FAILED", {},
                 reason="Connect instance did not reach ACTIVE within 5 minutes; check service quotas and CloudWatch logs")


def _send(event, context, status, data, reason=None):
    body = {
        "Status": status,
        "Reason": reason or f"See CloudWatch Logs: {context.log_group_name} / {context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or event.get("ResourceProperties", {}).get("InstanceId", "unknown"),
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
        "Data": data,
    }
    payload = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(event["ResponseURL"], data=payload, method="PUT")
    req.add_header("content-type", "")
    req.add_header("content-length", str(len(payload)))
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("cfn-response %s: %s", status, resp.status)
    except Exception as exc:
        logger.exception("cfn-response send failed: %s", exc)
    return body
