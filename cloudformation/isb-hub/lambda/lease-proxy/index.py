"""ISB lease API proxy for CI workflows.

GitHub-hosted Actions runners use Azure IPs which the upstream ISB WAF
(AWSManagedRulesAnonymousIpList -> HostingProviderIPList) blocks. This
Lambda makes the API call from AWS IP space, which the WAF allows.

Invoked via the standard Lambda InvokeFunction API (sigv4 by boto3).
Caller must hold lambda:InvokeFunction on this function ARN — only the
isb-hub-github-actions-ci-lease role is granted.

Event shape (JSON in invocation Payload):

    { "op": "acquire", "template": "empty-sandbox", "user_email": "..." }
    { "op": "release", "lease_id": "...", "user_email": "..." }
    { "op": "list-orphans", "owned_by": "...", "older_than_minutes": 180 }

Response shape:

    { "ok": true,  "data": {...} }                # success
    { "ok": false, "error": "...", "status": N }  # failure with reason
"""

import base64
import hashlib
import hmac
import json
import os
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3

ISB_API_BASE_URL = "https://1ewlxhaey6.execute-api.us-west-2.amazonaws.com/prod/"
ISB_JWT_SECRET_PATH = os.environ.get(
    "ISB_JWT_SECRET_PATH", "/InnovationSandbox/ndx/Auth/JwtSecret"
)
ISB_JWT_SECRET_REGION = os.environ.get("ISB_JWT_SECRET_REGION", "us-west-2")

ACTIVE_STATUSES = {"Active"}
PROVISIONING_STATUSES = {"Provisioning", "PendingApproval"}

# Lambda max execution is 15 min. Leave ~30s buffer so we exit cleanly
# with a useful error rather than getting killed mid-poll.
PROVISIONING_TIMEOUT_SECONDS = 14 * 60 + 30
POLL_INTERVAL_SECONDS = 5

# Cache the secret across warm Lambda invocations to avoid hitting Secrets
# Manager on every call. The secret rotates monthly so a cold cache lifetime
# is fine.
_cached_secret = None


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def sign_jwt(payload: dict, secret: str, expires_in_seconds: int = 600) -> str:
    """Sign a JWT in the same shape ISB expects (HS256, user/roles claim)."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    full_payload = {**payload, "iat": now, "exp": now + expires_in_seconds}
    encoded_header = _b64url(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url(json.dumps(full_payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def fetch_jwt_secret() -> str:
    global _cached_secret
    if _cached_secret is not None:
        return _cached_secret
    client = boto3.client("secretsmanager", region_name=ISB_JWT_SECRET_REGION)
    response = client.get_secret_value(SecretId=ISB_JWT_SECRET_PATH)
    secret = response.get("SecretString")
    if not secret:
        raise RuntimeError("ISB JWT secret is empty")
    _cached_secret = secret
    return secret


def signed_admin_token(email: str) -> str:
    payload = {"user": {"email": email, "roles": ["Admin"]}}
    return sign_jwt(payload, fetch_jwt_secret())


def make_isb_api_request(method, path, token, body=None, query_params=None, idempotent=None):
    """HTTP request to the ISB API.

    Retries (4× exponential backoff) only on requests we KNOW are safe to
    repeat. GET is always idempotent. POST is only safe if the path is
    explicitly an action-style endpoint where double-firing is harmless
    (e.g. /leases/{id}/terminate). POST /leases (lease creation) is NOT
    idempotent — a retry on a 5xx after the server actually created the
    record would create a duplicate lease, which (a) eats into the
    per-user quota and (b) leaks a real pool account. Default for POST is
    fail-fast on 5xx; callers opt in via idempotent=True if appropriate.

    Network-level failures (ConnectionResetError / socket.timeout /
    URLError) are retried regardless of method — they happen BEFORE the
    server saw the request, so re-firing is safe.
    """
    if idempotent is None:
        idempotent = method.upper() in ("GET", "HEAD", "DELETE", "PUT")

    url = f"{ISB_API_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    if query_params:
        qs = "&".join(
            f"{k}={urllib.parse.quote(str(v))}"
            for k, v in query_params.items()
            if v is not None
        )
        if qs:
            url = f"{url}?{qs}"

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method=method,
    )

    last_transient = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.status, json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            if idempotent and e.code in (500, 502, 503, 504) and attempt < 3:
                last_transient = e
                time.sleep(2 ** attempt)
                continue
            try:
                err_body = json.loads(e.read().decode())
            except Exception:
                err_body = {}
            return e.code, err_body
        except (ConnectionResetError, socket.timeout, urllib.error.URLError) as e:
            if attempt < 3:
                last_transient = e
                time.sleep(2 ** attempt)
                continue
            raise

    raise last_transient


# ── Operations ──────────────────────────────────────────────────────────────


def _resolve_lease_template(token, template_name):
    matches = []
    page_identifier = None
    while True:
        params = {}
        if page_identifier:
            params["pageIdentifier"] = page_identifier
        status, body = make_isb_api_request("GET", "/leaseTemplates", token, query_params=params)
        if status != 200:
            raise RuntimeError(f"Failed to list lease templates (HTTP {status}): {body}")
        data = body.get("data", body)
        for tmpl in data.get("result", []):
            if tmpl.get("name", "").lower() == template_name.lower():
                matches.append(tmpl)
        page_identifier = data.get("nextPageIdentifier")
        if not page_identifier:
            break
    if not matches:
        raise RuntimeError(f"Lease template '{template_name}' not found")
    if len(matches) > 1:
        raise RuntimeError(f"Lease template '{template_name}' is ambiguous; {len(matches)} matches")
    return matches[0]


def op_acquire(event):
    """Provision a lease, poll until Active, return {account_id,lease_id,lease_uuid}."""
    template_name = event["template"]
    user_email = event["user_email"]

    token = signed_admin_token(user_email)
    template = _resolve_lease_template(token, template_name)

    create_body = {"leaseTemplateUuid": template["uuid"], "userEmail": user_email}
    # idempotent=False is the default for POST, set explicitly here as a
    # reminder: lease creation is NOT idempotent. A retry on a 5xx after
    # the server actually committed the record would create a duplicate
    # lease (eats into quota + leaks a pool account).
    status, response = make_isb_api_request(
        "POST", "/leases", token, body=create_body, idempotent=False
    )
    if status != 201:
        return {
            "ok": False,
            "status": status,
            "error": f"Failed to create lease (HTTP {status})",
            "body": response,
        }

    lease = response.get("data", response)
    lease_uuid = lease.get("uuid", "unknown")
    lease_id = lease.get("leaseId") or base64.b64encode(
        json.dumps(
            {"userEmail": user_email, "uuid": lease_uuid}, separators=(",", ":")
        ).encode()
    ).decode()
    account_id = lease.get("awsAccountId", "")
    lease_status = lease.get("status", "unknown")

    deadline = time.time() + PROVISIONING_TIMEOUT_SECONDS
    poll_log = [f"initial: status={lease_status} account={account_id or 'pending'}"]
    while lease_status in PROVISIONING_STATUSES:
        if time.time() > deadline:
            return {
                "ok": False,
                "error": f"Lease provisioning timeout after {PROVISIONING_TIMEOUT_SECONDS}s (last status: {lease_status})",
                "lease_id": lease_id,
                "lease_uuid": lease_uuid,
                "poll_log": poll_log,
            }
        time.sleep(POLL_INTERVAL_SECONDS)
        poll_status, poll_response = make_isb_api_request(
            "GET",
            f"/leases/{urllib.parse.quote(lease_id, safe='+=')}",
            token,
        )
        if poll_status != 200:
            poll_log.append(f"poll HTTP {poll_status} — continuing")
            continue
        poll_lease = poll_response.get("data", poll_response)
        lease_status = poll_lease.get("status", "unknown")
        account_id = poll_lease.get("awsAccountId", "") or account_id
        poll_log.append(f"status={lease_status} account={account_id or 'pending'}")

    if lease_status not in ACTIVE_STATUSES:
        return {
            "ok": False,
            "error": f"Lease did not become Active (terminal status: {lease_status})",
            "lease_id": lease_id,
            "lease_uuid": lease_uuid,
            "status": lease_status,
            "poll_log": poll_log,
        }

    if not account_id:
        return {
            "ok": False,
            "error": "Lease Active but awsAccountId empty (ISB API contract violation)",
            "lease_id": lease_id,
            "lease_uuid": lease_uuid,
            "poll_log": poll_log,
        }

    return {
        "ok": True,
        "data": {
            "account_id": account_id,
            "lease_id": lease_id,
            "lease_uuid": lease_uuid,
        },
    }


def op_release(event):
    """Terminate a lease. Idempotent on 404/409."""
    lease_id = event["lease_id"]
    user_email = event["user_email"]
    token = signed_admin_token(user_email)
    encoded_id = urllib.parse.quote(lease_id, safe="+=")
    # Terminate is effectively idempotent — repeated calls on an
    # already-terminated lease return 404/409, which we treat as success.
    status, body = make_isb_api_request(
        "POST", f"/leases/{encoded_id}/terminate", token, idempotent=True
    )
    if status == 200:
        return {"ok": True, "data": {"terminated": True}}
    if status in (404, 409):
        return {"ok": True, "data": {"terminated": False, "already_gone": True, "status": status}}
    return {
        "ok": False,
        "status": status,
        "error": f"Failed to terminate lease (HTTP {status})",
        "body": body,
    }


def op_list_orphans(event):
    """Find leases owned by the CI service identity older than threshold."""
    owned_by = event["owned_by"]
    older_than_minutes = int(event.get("older_than_minutes", 180))
    token = signed_admin_token(owned_by)
    page_identifier = None
    now = datetime.now(timezone.utc)
    orphans = []
    while True:
        params = {"userEmail": owned_by}
        if page_identifier:
            params["pageIdentifier"] = page_identifier
        status, body = make_isb_api_request("GET", "/leases", token, query_params=params)
        if status != 200:
            return {"ok": False, "status": status, "error": "Failed to list leases", "body": body}
        data = body.get("data", body)
        for lease in data.get("result", []):
            if lease.get("status") not in ACTIVE_STATUSES.union(PROVISIONING_STATUSES):
                continue
            start = lease.get("startDate") or lease.get("createdAt")
            if not start:
                continue
            try:
                start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
            except Exception:
                continue
            age_minutes = int((now - start_dt).total_seconds() / 60)
            if age_minutes < older_than_minutes:
                continue
            orphans.append(
                {
                    "lease_id": lease.get("leaseId", ""),
                    "account_id": lease.get("awsAccountId", ""),
                    "status": lease.get("status", ""),
                    "age_minutes": age_minutes,
                }
            )
        page_identifier = data.get("nextPageIdentifier")
        if not page_identifier:
            break
    return {"ok": True, "data": {"orphans": orphans}}


# ── Handler ─────────────────────────────────────────────────────────────────


def handler(event, _context):
    """Entry point. Routes on event['op']."""
    op = event.get("op")
    try:
        if op == "acquire":
            return op_acquire(event)
        if op == "release":
            return op_release(event)
        if op == "list-orphans":
            return op_list_orphans(event)
        return {"ok": False, "error": f"Unknown op: {op}"}
    except Exception as e:  # noqa: BLE001 — surface to caller
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}
