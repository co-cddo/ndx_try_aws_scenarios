"""Contact Lens Kinesis consumer Lambda.

Per tech-spec Task 6.4 [F8-mechanism]:
  1. Read Kinesis event. If both OriginalSegment and RedactedSegment present,
     IGNORE OriginalSegment. Read only RedactedSegment.Transcript.
  2. Transform Contact Lens [NAME_1], [ADDRESS_2] format to {NAME}, {ADDRESS}
     via regex r"\\[([A-Z_]+)_\\d+\\]" -> "{$1}".
  3. Write redacted record to DynamoDB ContactLensCache (TTL 30 minutes).

Error handling: configured by event source mapping with MaximumRetryAttempts:2,
BisectBatchOnFunctionError:true, SQS DLQ. Alarm at DLQ depth >3 in 5min.
"""

import base64
import json
import logging
import os
import re
import time
from decimal import Decimal
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DDB_TABLE_NAME = os.environ["DDB_TABLE_NAME"]
TTL_SECONDS = int(os.environ.get("TTL_SECONDS", "1800"))

ddb = boto3.resource("dynamodb")
table = ddb.Table(DDB_TABLE_NAME)

PLACEHOLDER_RE = re.compile(r"\[([A-Z_]+)_\d+\]")


def lambda_handler(event, context):
    failures = []
    for record in event.get("Records", []):
        try:
            _process_kinesis_record(record)
        except Exception as exc:
            logger.exception("record processing failed: %s", exc)
            failures.append({"itemIdentifier": record.get("eventID")})

    return {"batchItemFailures": failures}


def _process_kinesis_record(record: Dict[str, Any]) -> None:
    raw = record["kinesis"]["data"]
    decoded = json.loads(base64.b64decode(raw).decode("utf-8"))
    contact_id = decoded.get("ContactId") or decoded.get("contactId")
    if not contact_id:
        logger.info("skipping event without ContactId")
        return

    segments = decoded.get("Segments") or [decoded]
    for seg in segments:
        item = _build_redacted_item(contact_id, seg)
        if item is None:
            continue
        table.put_item(Item=item)


def _build_redacted_item(contact_id: str, segment: Dict[str, Any]):
    redacted = segment.get("RedactedSegment") or segment.get("Redacted") or {}
    if not redacted:
        return None

    transcript = redacted.get("Transcript") or redacted.get("Content") or ""
    if not transcript:
        return None

    transcript = _normalise_placeholders(transcript)
    sentiment = (segment.get("Sentiment") or {}).get("Score") or segment.get("Sentiment") or "NEUTRAL"
    speaker = segment.get("ParticipantId") or segment.get("Speaker") or "CUSTOMER"
    issued_at = segment.get("BeginOffsetMillis") or segment.get("Timestamp") or int(time.time() * 1000)

    return {
        "contactId": contact_id,
        "segmentTimestamp": int(issued_at),
        "transcript": transcript,
        "sentiment": sentiment,
        "speaker": speaker,
        "ttl": int(time.time()) + TTL_SECONDS,
    }


def _normalise_placeholders(text: str) -> str:
    return PLACEHOLDER_RE.sub(lambda m: "{" + m.group(1) + "}", text)
