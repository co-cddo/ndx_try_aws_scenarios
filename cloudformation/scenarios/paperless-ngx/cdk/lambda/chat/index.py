"""Lambda chat handler for Paperless-ngx archive Q&A.

Serves a single-page chat UI on GET, and answers questions on POST by calling
Bedrock RetrieveAndGenerate against the configured Knowledge Base, with the
configured Guardrail applied.
"""

import base64
import json
import os
import re
from typing import Any

import boto3

REGION = os.environ["AWS_REGION"]
KB_ID = os.environ["KNOWLEDGE_BASE_ID"]
MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID")
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION")
PAPERLESS_URL = os.environ.get("PAPERLESS_URL", "")

agent_runtime = boto3.client("bedrock-agent-runtime", region_name=REGION)


def _load_html() -> str:
    with open(os.path.join(os.path.dirname(__file__), "index.html"), "r") as f:
        return f.read().replace("__PAPERLESS_URL__", PAPERLESS_URL)


def _resp(status: int, body: Any, content_type: str = "application/json", headers: dict | None = None) -> dict:
    out: dict[str, Any] = {
        "statusCode": status,
        "headers": {"Content-Type": content_type, **(headers or {})},
    }
    if isinstance(body, (dict, list)):
        out["body"] = json.dumps(body)
    else:
        out["body"] = body
    return out


def _build_config() -> dict[str, Any]:
    config: dict[str, Any] = {
        "type": "KNOWLEDGE_BASE",
        "knowledgeBaseConfiguration": {
            "knowledgeBaseId": KB_ID,
            "modelArn": f"arn:aws:bedrock:{REGION}::foundation-model/{MODEL_ID}",
            "retrievalConfiguration": {
                "vectorSearchConfiguration": {"numberOfResults": 5},
            },
            "generationConfiguration": {
                "promptTemplate": {
                    "textPromptTemplate": (
                        "You are an archivist for a UK parish council answering questions "
                        "from a clerk about documents in their archive. Use only the facts "
                        "in the search results below. Cite document titles when relevant. "
                        "If the search results don't contain the answer, say so plainly. "
                        "Keep answers concise and in plain English.\n\n"
                        "Search results:\n$search_results$\n\n"
                        "Question: $query$"
                    ),
                },
            },
        },
    }
    if GUARDRAIL_ID:
        config["knowledgeBaseConfiguration"]["generationConfiguration"]["guardrailConfiguration"] = {
            "guardrailId": GUARDRAIL_ID,
            "guardrailVersion": GUARDRAIL_VERSION or "DRAFT",
        }
    return config


def handler(event: dict[str, Any], _ctx: Any) -> dict[str, Any]:
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "GET"
    )

    if method == "GET":
        return _resp(200, _load_html(), content_type="text/html; charset=utf-8")

    if method != "POST":
        return _resp(405, {"error": "method not allowed"})

    raw_body = event.get("body", "") or ""
    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8")
    try:
        payload = json.loads(raw_body) if raw_body else {}
    except json.JSONDecodeError:
        return _resp(400, {"error": "invalid JSON"})

    query = (payload.get("question") or "").strip()
    if not query:
        return _resp(400, {"error": "missing question"})

    session_id = payload.get("sessionId")

    kwargs: dict[str, Any] = {
        "input": {"text": query},
        "retrieveAndGenerateConfiguration": _build_config(),
    }
    if session_id:
        kwargs["sessionId"] = session_id

    try:
        result = agent_runtime.retrieve_and_generate(**kwargs)
    except Exception as e:  # noqa: BLE001
        return _resp(502, {"error": "bedrock call failed", "detail": str(e)})

    base = PAPERLESS_URL.rstrip("/")
    citations: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for citation in result.get("citations", []) or []:
        for ref in citation.get("retrievedReferences", []) or []:
            loc = ref.get("location", {})
            s3loc = loc.get("s3Location", {})
            uri = s3loc.get("uri") or ""
            fname = uri.rsplit("/", 1)[-1]
            if not fname.endswith(".txt"):
                continue
            doc_id = fname[:-4]
            if not doc_id.isdigit() or doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)
            chunk_text = (ref.get("content") or {}).get("text", "") or ""
            title = ""
            # Bedrock KB collapses whitespace in chunks, so the file's
            # first-line "# Title" heading + "Paperless ID: N" run together
            # on a single line. Pull everything before "Paperless ID:".
            m = re.search(r"#?\s*(.+?)\s+Paperless ID:\s*\d+", chunk_text)
            if m:
                title = m.group(1).strip()
            else:
                for line in chunk_text.splitlines():
                    stripped = line.strip()
                    if stripped.startswith("# "):
                        title = stripped[2:].strip()
                        break
            if not title:
                title = f"Document #{doc_id}"
            if len(title) > 120:
                title = title[:117].rstrip() + "..."
            href = f"{base}/documents/{doc_id}/" if base else f"/documents/{doc_id}/"
            citations.append({"id": doc_id, "title": title, "url": href, "uri": uri})

    answer_text = result.get("output", {}).get("text", "")
    # Nova Pro embeds raw citation markers like %[1]% in the generated text.
    # We render Sources separately, so strip these so they don't show up as
    # broken artefacts in the rendered answer.
    answer_text = re.sub(r"[ \t]*%\[\d+(?:,\s*\d+)*\]%[ \t]*", "", answer_text).strip()

    return _resp(200, {
        "answer": answer_text,
        "sessionId": result.get("sessionId"),
        "citations": citations,
    })
