"""Custom resource: connect:AssociateInstanceStorageConfig for resource types
that the AWS::Connect::InstanceStorageConfig CFN type doesn't yet support
(notably REAL_TIME_CONTACT_ANALYSIS_SEGMENTS for Contact Lens streaming).
"""

import json
import logging
import time
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

connect = boto3.client("connect")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    instance_id = props.get("InstanceId")
    resource_type = props.get("ResourceType")
    storage_config = props.get("StorageConfig") or {}
    physical_id = event.get("PhysicalResourceId") or "uninitialised"

    try:
        if request_type == "Delete":
            if physical_id != "uninitialised":
                try:
                    connect.disassociate_instance_storage_config(
                        InstanceId=instance_id,
                        AssociationId=physical_id,
                        ResourceType=resource_type,
                    )
                except ClientError as exc:
                    code = exc.response.get("Error", {}).get("Code", "")
                    if code != "ResourceNotFoundException":
                        raise
            return _send(event, context, "SUCCESS", {})

        if request_type in ("Create", "Update"):
            cfg = _build_storage_config(storage_config)
            assoc_id = _associate_with_retry(instance_id, resource_type, cfg)
            return _send(event, context, "SUCCESS",
                         {"AssociationId": assoc_id},
                         physical_id=assoc_id)
    except ClientError as exc:
        return _send(event, context, "FAILED", {},
                     reason=f"{exc.response.get('Error',{}).get('Code','?')}: "
                            f"{exc.response.get('Error',{}).get('Message','')}",
                     physical_id=physical_id)
    except Exception as exc:
        return _send(event, context, "FAILED", {}, reason=str(exc), physical_id=physical_id)


def _associate_with_retry(instance_id, resource_type, cfg, attempts=8, delay=4):
    last_exc = None
    for i in range(attempts):
        try:
            resp = connect.associate_instance_storage_config(
                InstanceId=instance_id,
                ResourceType=resource_type,
                StorageConfig=cfg,
            )
            return resp["AssociationId"]
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            msg = exc.response.get("Error", {}).get("Message", "")
            if code == "ResourceNotFoundException" and "bucket" in msg.lower():
                logger.info("S3 not visible to Connect yet (try %d/%d): %s", i + 1, attempts, msg)
                last_exc = exc
                time.sleep(delay)
                continue
            raise
    raise last_exc


def _build_storage_config(props_storage_config):
    out = {"StorageType": props_storage_config.get("StorageType", "KINESIS_STREAM")}
    if "KinesisStreamConfig" in props_storage_config:
        ksc = props_storage_config["KinesisStreamConfig"]
        out["KinesisStreamConfig"] = {"StreamArn": ksc["StreamArn"]}
    elif "S3Config" in props_storage_config:
        s3c = props_storage_config["S3Config"]
        out["S3Config"] = {"BucketName": s3c["BucketName"], "BucketPrefix": s3c.get("BucketPrefix", "")}
    elif "KinesisFirehoseConfig" in props_storage_config:
        kfc = props_storage_config["KinesisFirehoseConfig"]
        out["KinesisFirehoseConfig"] = {"FirehoseArn": kfc["FirehoseArn"]}
    return out


def _send(event, context, status, data, reason=None, physical_id=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": physical_id or event.get("PhysicalResourceId") or "uninitialised",
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
