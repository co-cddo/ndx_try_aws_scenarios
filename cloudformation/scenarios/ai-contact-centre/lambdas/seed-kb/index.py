"""Seed-data custom resource Lambda for Bedrock KB.

On Create:
  1. Upload documents/*.md from the Lambda package to the KB source S3 bucket.
  2. Trigger a KB DataSource ingestion job.
  3. Poll until COMPLETE / FAILED.

On Delete:
  1. Empty the KB source bucket (so the bucket can be deleted by CFN).
"""

import json
import logging
import os
import time
import urllib.request
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
bedrock_agent = boto3.client("bedrock-agent")
POLL_INTERVAL = 30
MAX_ATTEMPTS = 30  # 15 minutes
DOCUMENTS_DIR = Path(__file__).parent / "documents"


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    kb_id = props.get("KnowledgeBaseId")
    data_source_id = props.get("DataSourceId")
    bucket = props.get("KbSourceBucket")

    if request_type == "Delete":
        if bucket:
            try:
                _empty_bucket(bucket)
            except ClientError as exc:
                logger.warning("could not empty bucket: %s", exc)
        return _send(event, context, "SUCCESS", {})

    if not all([kb_id, data_source_id, bucket]):
        return _send(event, context, "FAILED", {},
                     reason="KnowledgeBaseId, DataSourceId, KbSourceBucket all required")

    try:
        uploaded = _upload_documents(bucket)
        logger.info("uploaded %d documents to s3://%s/", uploaded, bucket)

        start = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=kb_id, dataSourceId=data_source_id,
        )
        job_id = start["ingestionJob"]["ingestionJobId"]
        logger.info("started ingestion job %s", job_id)

        for attempt in range(1, MAX_ATTEMPTS + 1):
            time.sleep(POLL_INTERVAL)
            resp = bedrock_agent.get_ingestion_job(
                knowledgeBaseId=kb_id, dataSourceId=data_source_id, ingestionJobId=job_id,
            )
            status = resp["ingestionJob"]["status"]
            logger.info("attempt %d ingestion status=%s", attempt, status)
            if status == "COMPLETE":
                stats = resp["ingestionJob"].get("statistics", {})
                return _send(event, context, "SUCCESS", {
                    "JobId": job_id, "Status": status, "DocumentsUploaded": uploaded,
                    "DocumentsScanned": stats.get("numberOfDocumentsScanned", 0),
                })
            if status in ("FAILED", "STOPPED"):
                return _send(event, context, "FAILED",
                             {"JobId": job_id, "Status": status},
                             reason=str(resp["ingestionJob"].get("failureReasons", "ingestion failed")))

        # Async completion is acceptable, ingestion can outlast the Lambda.
        return _send(event, context, "SUCCESS",
                     {"JobId": job_id, "Status": "IN_PROGRESS",
                      "Note": "ingestion ongoing past 15min, returning SUCCESS"})
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "unknown")
        return _send(event, context, "FAILED", {},
                     reason=f"{code}: {exc.response.get('Error', {}).get('Message', '')}")


def _upload_documents(bucket: str) -> int:
    if not DOCUMENTS_DIR.exists():
        logger.warning("documents directory %s missing from package", DOCUMENTS_DIR)
        return 0
    count = 0
    for path in sorted(DOCUMENTS_DIR.glob("*.md")):
        with open(path, "rb") as f:
            s3.put_object(
                Bucket=bucket, Key=path.name, Body=f.read(),
                ContentType="text/markdown",
            )
        count += 1
    return count


def _empty_bucket(bucket: str) -> None:
    paginator = s3.get_paginator("list_object_versions")
    for page in paginator.paginate(Bucket=bucket):
        objects = []
        for v in page.get("Versions", []) or []:
            objects.append({"Key": v["Key"], "VersionId": v["VersionId"]})
        for d in page.get("DeleteMarkers", []) or []:
            objects.append({"Key": d["Key"], "VersionId": d["VersionId"]})
        if objects:
            s3.delete_objects(Bucket=bucket, Delete={"Objects": objects, "Quiet": True})


def _send(event, context, status, data, reason=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or "kb-seed",
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
