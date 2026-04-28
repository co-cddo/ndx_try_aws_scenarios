"""Lambda chat handler for Paperless-ngx archive Q&A.

Serves a single-page chat UI on GET, and answers questions on POST by calling
Bedrock RetrieveAndGenerate against the configured Knowledge Base, with the
configured Guardrail applied.
"""

import base64
import json
import os
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

    citations = []
    for citation in result.get("citations", []) or []:
        for ref in citation.get("retrievedReferences", []) or []:
            loc = ref.get("location", {})
            s3loc = loc.get("s3Location", {})
            uri = s3loc.get("uri")
            if uri:
                citations.append(uri)

    return _resp(200, {
        "answer": result.get("output", {}).get("text", ""),
        "sessionId": result.get("sessionId"),
        "citations": citations,
    })
