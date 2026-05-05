"""Deploy companion SPA files to the SpaBucket.

On Create/Update:
  Upload companion/* from the Lambda package to the target S3 bucket.

On Delete:
  Empty the bucket so CFN can delete it.
"""

import json
import logging
import mimetypes
import os
import urllib.request
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
COMPANION_DIR = Path(__file__).parent / "companion"

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".json": "application/json",
}


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    bucket = props.get("SpaBucket")
    physical_id = event.get("PhysicalResourceId", "deploy-spa")

    if request_type == "Delete":
        if bucket:
            try:
                _empty_bucket(bucket)
            except ClientError as exc:
                logger.warning("could not empty bucket: %s", exc)
        return _send(event, context, "SUCCESS", {}, physical_id=physical_id)

    if not bucket:
        return _send(event, context, "FAILED", {},
                     reason="SpaBucket property required", physical_id=physical_id)

    try:
        uploaded = _upload_companion(bucket)
        logger.info("uploaded %d files to s3://%s/", uploaded, bucket)
        return _send(event, context, "SUCCESS",
                     {"FilesUploaded": str(uploaded)},
                     physical_id=physical_id)
    except Exception as exc:
        logger.exception("deploy-spa failed: %s", exc)
        return _send(event, context, "FAILED", {},
                     reason=str(exc)[:1024], physical_id=physical_id)


def _upload_companion(bucket):
    count = 0
    for filepath in COMPANION_DIR.rglob("*"):
        if filepath.is_dir():
            continue
        key = str(filepath.relative_to(COMPANION_DIR))
        suffix = filepath.suffix.lower()
        content_type = CONTENT_TYPES.get(suffix, "application/octet-stream")
        s3.upload_file(
            str(filepath), bucket, key,
            ExtraArgs={"ContentType": content_type},
        )
        count += 1
    return count


def _empty_bucket(bucket):
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        objects = [{"Key": o["Key"]} for o in page.get("Contents", [])]
        if objects:
            s3.delete_objects(Bucket=bucket, Delete={"Objects": objects})


def _send(event, context, status, data, reason=None, physical_id=None):
    body = json.dumps({
        "Status": status,
        "Reason": reason or f"See CloudWatch log stream: {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": physical_id or context.log_stream_name,
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
        "Data": data,
    })
    req = urllib.request.Request(
        event["ResponseURL"], data=body.encode(), method="PUT",
        headers={"Content-Type": ""},
    )
    urllib.request.urlopen(req)
    return data
