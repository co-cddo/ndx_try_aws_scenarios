"""Custom resource: pin S3 bucket CORS to a specific CloudFront domain
post-create. Solves the CompanionApi -> Cdn -> CompanionApiFunctionUrl
circular dependency by deferring the bucket-CORS write to a Lambda that
runs after both Cdn and the buckets exist.
"""

import json
import logging
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    bucket = props.get("Bucket")
    cdn_domain = props.get("CdnDomain")

    if request_type == "Delete":
        return _send(event, context, "SUCCESS", {})
    if not (bucket and cdn_domain):
        return _send(event, context, "FAILED", {}, reason="Bucket and CdnDomain required")

    cors = {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT"],
                "AllowedOrigins": [f"https://{cdn_domain}"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000,
            }
        ]
    }
    try:
        s3.put_bucket_cors(Bucket=bucket, CORSConfiguration=cors)
        return _send(event, context, "SUCCESS",
                     {"Bucket": bucket, "CdnDomain": cdn_domain})
    except ClientError as exc:
        return _send(event, context, "FAILED", {},
                     reason=f"{exc.response.get('Error',{}).get('Code','?')}: {exc.response.get('Error',{}).get('Message','')}")


def _send(event, context, status, data, reason=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or "cors-pinner",
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
