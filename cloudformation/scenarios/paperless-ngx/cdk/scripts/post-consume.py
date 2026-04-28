"""Paperless-ngx post-consume hook.

Invoked by Paperless after every document ingest via PAPERLESS_POST_CONSUME_SCRIPT.
Uses Bedrock (Nova Pro) to:
  - rewrite the document title
  - classify into a tag set (creating tags as needed)
  - classify document type (creating types as needed)
  - extract correspondent (creating as needed)
  - generate a 2-sentence summary into the document notes

Then uploads the OCR'd content to the configured S3 docs bucket so the Bedrock
Knowledge Base ingestion job can pick it up for chat-with-archive.

All API calls hit the local Paperless instance at http://localhost:8000/api using
the admin credentials baked into the task. All Bedrock calls use the task role.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any

import boto3
import requests

logging.basicConfig(level=logging.INFO, format="[post-consume] %(message)s")
log = logging.getLogger("post-consume")

DOCUMENT_ID = os.environ.get("DOCUMENT_ID")
DOCUMENT_FILENAME = os.environ.get("DOCUMENT_FILENAME", "")
API_URL = os.environ.get("PAPERLESS_API_URL", "http://localhost:8000/api").rstrip("/")
ADMIN_USER = os.environ.get("PAPERLESS_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("PAPERLESS_ADMIN_PASSWORD", "")
BEDROCK_REGION = os.environ.get("PAPERLESS_BEDROCK_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.environ.get("PAPERLESS_BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")
ARCHIVE_BUCKET = os.environ.get("PAPERLESS_ARCHIVE_BUCKET")
KB_PREFIX = os.environ.get("PAPERLESS_KB_PREFIX", "kb/")
KB_LOCAL_DIR = os.environ.get("PAPERLESS_KB_LOCAL_DIR", "/kb")
KB_ID = os.environ.get("PAPERLESS_KNOWLEDGE_BASE_ID")
STACK_NAME = os.environ.get("PAPERLESS_STACK_NAME", "paperless-ngx")

TAG_TAXONOMY = [
    "planning",
    "minutes",
    "agenda",
    "invoice",
    "correspondence",
    "audit",
    "letter",
    "receipt",
]

DOC_TYPES = [
    "Letter",
    "Invoice",
    "Minutes",
    "Planning Notice",
    "Agenda",
    "Report",
    "Receipt",
]


def session() -> requests.Session:
    s = requests.Session()
    s.auth = (ADMIN_USER, ADMIN_PASS)
    s.headers.update({"Accept": "application/json"})
    return s


def get_document(http: requests.Session) -> dict[str, Any]:
    r = http.get(f"{API_URL}/documents/{DOCUMENT_ID}/", timeout=10)
    r.raise_for_status()
    return r.json()


def patch_document(http: requests.Session, payload: dict[str, Any]) -> None:
    r = http.patch(
        f"{API_URL}/documents/{DOCUMENT_ID}/",
        json=payload,
        timeout=10,
    )
    if r.status_code >= 400:
        log.warning("PATCH document %s failed: %s %s", DOCUMENT_ID, r.status_code, r.text[:200])
    else:
        log.info("Updated document %s with %s", DOCUMENT_ID, list(payload.keys()))


def ensure_named(http: requests.Session, kind: str, name: str) -> int | None:
    """Find or create a tag / correspondent / document_type by name. Returns id or None."""
    if not name:
        return None
    name = name.strip()
    if len(name) > 128:
        name = name[:128]
    r = http.get(f"{API_URL}/{kind}/", params={"name__iexact": name}, timeout=10)
    if r.ok:
        results = r.json().get("results", [])
        if results:
            return results[0]["id"]
    r = http.post(f"{API_URL}/{kind}/", json={"name": name}, timeout=10)
    if r.status_code in (200, 201):
        return r.json()["id"]
    log.warning("Failed to create %s '%s': %s %s", kind, name, r.status_code, r.text[:200])
    return None


def call_bedrock(content: str, original_title: str) -> dict[str, Any]:
    client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    snippet = (content or "")[:8000]
    prompt = f"""You are an archivist for a UK parish council. Given the OCR'd
content of a document, return strict JSON with these fields and nothing else:

  title:         a short, human-readable, searchable title (max 80 chars)
  document_type: one of {DOC_TYPES}
  tags:          a list of 1-4 tags drawn from {TAG_TAXONOMY}
  correspondent: the sender / issuing body, or null if not identifiable
  summary:       a 1-2 sentence plain-English summary

Original filename: {original_title}

Document text:
---
{snippet}
---

Respond with raw JSON, no markdown, no commentary."""
    body = {
        "messages": [
            {"role": "user", "content": [{"text": prompt}]},
        ],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.2},
    }
    resp = client.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=body["messages"],
        inferenceConfig=body["inferenceConfig"],
    )
    text = resp["output"]["message"]["content"][0]["text"]
    # Strip code fences if the model added them despite instructions.
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


def write_kb_text(content: str, doc: dict[str, Any]) -> None:
    """Write the OCR'd text to the /kb mount, which S3 Files auto-syncs to
    s3://archive-bucket/kb/{id}.txt (the Bedrock KB data source)."""
    try:
        os.makedirs(KB_LOCAL_DIR, exist_ok=True)
        path = os.path.join(KB_LOCAL_DIR, f"{DOCUMENT_ID}.txt")
        body = (
            f"# {doc.get('title', '')}\n\n"
            f"Paperless ID: {DOCUMENT_ID}\n"
            f"Original filename: {DOCUMENT_FILENAME}\n\n"
            f"---\n\n{content}\n"
        )
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)
        log.info("Wrote %s (%d bytes) — S3 Files will sync to s3://%s/%s%s.txt",
                 path, len(body), ARCHIVE_BUCKET, KB_PREFIX, DOCUMENT_ID)
    except Exception as e:  # noqa: BLE001
        log.warning("KB text write failed: %s", e)
        return

    # Trigger an ingestion job — S3 Files exports happen with a ~60s batching
    # window, so the job we kick now will pick up the new file when it lands.
    if KB_ID:
        try:
            agent = boto3.client("bedrock-agent", region_name=BEDROCK_REGION)
            ds_resp = agent.list_data_sources(knowledgeBaseId=KB_ID, maxResults=1)
            ds_id = ds_resp.get("dataSourceSummaries", [{}])[0].get("dataSourceId")
            if ds_id:
                agent.start_ingestion_job(knowledgeBaseId=KB_ID, dataSourceId=ds_id)
                log.info("Started Bedrock KB ingestion job for KB %s", KB_ID)
        except Exception as e:  # noqa: BLE001
            log.warning("KB ingestion trigger failed (non-fatal): %s", e)


def main() -> int:
    if not DOCUMENT_ID:
        log.error("No DOCUMENT_ID in env, nothing to do")
        return 0
    http = session()
    try:
        doc = get_document(http)
    except Exception as e:  # noqa: BLE001
        log.error("Could not fetch document %s: %s", DOCUMENT_ID, e)
        return 0

    content = doc.get("content", "") or ""
    if not content.strip():
        log.info("Document %s has empty OCR content; skipping AI enrichment", DOCUMENT_ID)
        return 0

    try:
        ai = call_bedrock(content, doc.get("title", ""))
    except Exception as e:  # noqa: BLE001
        log.error("Bedrock call failed for %s: %s", DOCUMENT_ID, e)
        return 0

    payload: dict[str, Any] = {}
    if isinstance(ai.get("title"), str) and ai["title"].strip():
        payload["title"] = ai["title"].strip()[:128]
    if isinstance(ai.get("summary"), str) and ai["summary"].strip():
        # Paperless documents have a `notes` collection; we use the simpler
        # PATCH on `archive_serial_number`-adjacent metadata via creating a note.
        # Easiest: stash summary in the title-suffix-free "notes" via the notes API.
        try:
            http.post(
                f"{API_URL}/documents/{DOCUMENT_ID}/notes/",
                json={"note": f"AI summary: {ai['summary'].strip()}"},
                timeout=10,
            )
        except Exception:  # noqa: BLE001
            pass

    tag_names = ai.get("tags") or []
    if isinstance(tag_names, list):
        tag_ids = [tid for tid in (ensure_named(http, "tags", t) for t in tag_names if isinstance(t, str)) if tid]
        if tag_ids:
            payload["tags"] = tag_ids

    dt = ai.get("document_type")
    if isinstance(dt, str) and dt.strip():
        dt_id = ensure_named(http, "document_types", dt.strip())
        if dt_id:
            payload["document_type"] = dt_id

    corr = ai.get("correspondent")
    if isinstance(corr, str) and corr.strip():
        corr_id = ensure_named(http, "correspondents", corr.strip())
        if corr_id:
            payload["correspondent"] = corr_id

    if payload:
        patch_document(http, payload)

    try:
        write_kb_text(content, {"title": payload.get("title", doc.get("title", ""))})
    except Exception as e:  # noqa: BLE001
        log.warning("KB text write failed: %s", e)

    return 0


if __name__ == "__main__":
    sys.exit(main())
