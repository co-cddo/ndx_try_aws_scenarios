#!/usr/bin/env python3
"""ISB lease helper for CI workflows.

Subcommands:
  acquire --template <name> --user-email <addr>
    Provision a new ISB lease, poll until Active, print account_id and
    lease_id. With GITHUB_OUTPUT set, writes acquire-style outputs there too.

  release --lease-id <id>
    Terminate a lease. Idempotent: exits 0 if the lease is already gone.

  list-orphans --owned-by <addr> [--older-than-minutes N]
    Print one lease per line as "<lease_id>\t<account_id>\t<status>\t<age_minutes>"
    for leases owned by <addr> older than N minutes. Used by the janitor.

The script assumes AWS credentials are already in the environment
(set by aws-actions/configure-aws-credentials in GHA), reads the
ISB API JWT secret from Secrets Manager, signs a request token, and
calls the ISB API directly. No SSO/interactive flows — CI only.

Vendored from innovation-sandbox-on-aws-utils @ 13fc703 (isb_common.py
+ assign_lease.py + terminate_lease.py). Refresh procedure: see README.
"""

import argparse
import base64
import hashlib
import hmac
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Optional

import boto3

ISB_API_BASE_URL = "https://1ewlxhaey6.execute-api.us-west-2.amazonaws.com/prod/"
ISB_JWT_SECRET_PATH = "/InnovationSandbox/ndx/Auth/JwtSecret"
ISB_JWT_SECRET_REGION = "us-west-2"

# Statuses that mean "this lease is doing something we should wait for".
# A status outside this set after Provisioning is a terminal failure.
ACTIVE_STATUSES = {"Active"}
PROVISIONING_STATUSES = {"Provisioning", "PendingApproval"}
# Anything else after provisioning starts is a hard fail.

PROVISIONING_TIMEOUT_SECONDS = 30 * 60
POLL_INTERVAL_SECONDS = 5


# ── JWT ─────────────────────────────────────────────────────────────────────

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def sign_jwt(payload: dict, secret: str, expires_in_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    full_payload = {**payload, "iat": now, "exp": now + expires_in_seconds}
    encoded_header = _b64url(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url(json.dumps(full_payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def fetch_jwt_secret() -> str:
    client = boto3.client("secretsmanager", region_name=ISB_JWT_SECRET_REGION)
    response = client.get_secret_value(SecretId=ISB_JWT_SECRET_PATH)
    secret = response.get("SecretString")
    if not secret:
        raise RuntimeError("ISB JWT secret is empty")
    return secret


def signed_admin_token(email: str) -> str:
    payload = {"user": {"email": email, "roles": ["Admin"]}}
    return sign_jwt(payload, fetch_jwt_secret())


# ── ISB API request with retries ────────────────────────────────────────────

def make_isb_api_request(method: str, path: str, token: str, body: Optional[dict] = None, query_params: Optional[dict] = None):
    """HTTP request to the ISB API with 4-retry exponential backoff on
    ConnectionResetError / socket.timeout / URLError / HTTP 5xx.

    Returns (status_code, decoded_body_dict).
    """
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

    last_transient: Optional[Exception] = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.status, json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (500, 502, 503, 504) and attempt < 3:
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

    raise last_transient  # type: ignore[misc]


# ── GITHUB_OUTPUT helper ────────────────────────────────────────────────────

def emit_gha_output(key: str, value: str) -> None:
    sink = os.environ.get("GITHUB_OUTPUT")
    if not sink:
        # Fall back to stdout-style for local runs.
        print(f"{key}={value}")
        return
    with open(sink, "a", encoding="utf-8") as f:
        f.write(f"{key}={value}\n")


# ── acquire ─────────────────────────────────────────────────────────────────

def resolve_lease_template(token: str, template_name: str) -> dict:
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


def acquire(template_name: str, user_email: str) -> int:
    print(f"::group::Acquire ISB lease ({template_name} for {user_email})", flush=True)
    token = signed_admin_token(user_email)
    template = resolve_lease_template(token, template_name)
    print(f"Lease template: {template['name']} ({template['uuid']})", flush=True)

    create_body = {"leaseTemplateUuid": template["uuid"], "userEmail": user_email}
    status, response = make_isb_api_request("POST", "/leases", token, body=create_body)
    if status != 201:
        print(f"::error::Failed to create lease (HTTP {status}): {json.dumps(response)}", flush=True)
        print("::endgroup::", flush=True)
        return 2

    lease = response.get("data", response)
    lease_uuid = lease.get("uuid", "unknown")
    lease_id = lease.get("leaseId") or base64.b64encode(
        json.dumps({"userEmail": user_email, "uuid": lease_uuid}, separators=(",", ":")).encode()
    ).decode()
    account_id = lease.get("awsAccountId", "")
    lease_status = lease.get("status", "unknown")
    print(f"Lease created: uuid={lease_uuid} status={lease_status} account={account_id or 'pending'}", flush=True)

    deadline = time.time() + PROVISIONING_TIMEOUT_SECONDS
    while lease_status in PROVISIONING_STATUSES:
        if time.time() > deadline:
            print(f"::error::Lease provisioning timeout after {PROVISIONING_TIMEOUT_SECONDS}s (last status: {lease_status})", flush=True)
            print("::endgroup::", flush=True)
            return 3
        time.sleep(POLL_INTERVAL_SECONDS)
        poll_status, poll_response = make_isb_api_request("GET", f"/leases/{urllib.parse.quote(lease_id, safe='+=')}", token)
        if poll_status != 200:
            print(f"  poll HTTP {poll_status}, continuing", flush=True)
            continue
        poll_lease = poll_response.get("data", poll_response)
        lease_status = poll_lease.get("status", "unknown")
        account_id = poll_lease.get("awsAccountId", "") or account_id
        print(f"  status={lease_status} account={account_id or 'pending'}", flush=True)

    if lease_status not in ACTIVE_STATUSES:
        # FAIL LOUDLY: upstream assign_lease.py only logged "Unexpected status".
        # Patch: exit non-zero with the actual status in the message so the
        # workflow goes red instead of marching on with an unusable lease.
        print(f"::error::Lease did not become Active (terminal status: {lease_status}); review ISB admin console for {lease_uuid}", flush=True)
        print("::endgroup::", flush=True)
        return 4

    if not account_id:
        print("::error::Lease is Active but awsAccountId is empty; ISB API contract violation", flush=True)
        print("::endgroup::", flush=True)
        return 5

    print(f"Lease Active. account_id={account_id} lease_id={lease_id}", flush=True)
    emit_gha_output("account_id", account_id)
    emit_gha_output("lease_id", lease_id)
    emit_gha_output("lease_uuid", lease_uuid)
    print("::endgroup::", flush=True)
    return 0


# ── release ─────────────────────────────────────────────────────────────────

def release(lease_id: str, user_email: str) -> int:
    print(f"::group::Release ISB lease ({lease_id[:20]}...)", flush=True)
    token = signed_admin_token(user_email)
    encoded_id = urllib.parse.quote(lease_id, safe="+=")
    status, body = make_isb_api_request("POST", f"/leases/{encoded_id}/terminate", token)
    if status == 200:
        print(f"Lease terminated.", flush=True)
        print("::endgroup::", flush=True)
        return 0
    if status in (404, 409):
        # 404: already gone. 409: terminal-state conflict; treat as idempotent.
        print(f"Lease already gone (HTTP {status}); idempotent success.", flush=True)
        print("::endgroup::", flush=True)
        return 0
    print(f"::warning::Failed to terminate lease (HTTP {status}): {json.dumps(body)}", flush=True)
    print("::endgroup::", flush=True)
    return 1


# ── list-orphans (for janitor) ──────────────────────────────────────────────

def list_orphans(owned_by: str, older_than_minutes: int) -> int:
    token = signed_admin_token(owned_by)
    page_identifier = None
    now = datetime.now(timezone.utc)
    found = 0
    while True:
        params = {"userEmail": owned_by}
        if page_identifier:
            params["pageIdentifier"] = page_identifier
        status, body = make_isb_api_request("GET", "/leases", token, query_params=params)
        if status != 200:
            print(f"::error::Failed to list leases (HTTP {status}): {json.dumps(body)}", flush=True)
            return 1
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
            print(
                f"{lease.get('leaseId', '')}\t{lease.get('awsAccountId', '')}\t"
                f"{lease.get('status', '')}\t{age_minutes}",
                flush=True,
            )
            found += 1
        page_identifier = data.get("nextPageIdentifier")
        if not page_identifier:
            break
    print(f"::notice::found {found} orphan lease(s) for {owned_by} older than {older_than_minutes}m", flush=True)
    return 0


# ── main ────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_acquire = sub.add_parser("acquire", help="Provision a new lease, wait until Active")
    p_acquire.add_argument("--template", required=True, help="Lease template name (e.g. empty-sandbox)")
    p_acquire.add_argument("--user-email", required=True, help="Email the lease is associated with (use a service identity for CI)")

    p_release = sub.add_parser("release", help="Terminate a lease (idempotent)")
    p_release.add_argument("--lease-id", required=True, help="Base64-encoded lease ID")
    p_release.add_argument("--user-email", required=True, help="Email the JWT will be signed as")

    p_orphans = sub.add_parser("list-orphans", help="Print orphan leases for the janitor to release")
    p_orphans.add_argument("--owned-by", required=True, help="Email used to look up leases")
    p_orphans.add_argument("--older-than-minutes", type=int, default=180, help="Only emit leases older than this (default: 180 minutes)")

    args = parser.parse_args()

    if args.cmd == "acquire":
        return acquire(args.template, args.user_email)
    if args.cmd == "release":
        return release(args.lease_id, args.user_email)
    if args.cmd == "list-orphans":
        return list_orphans(args.owned_by, args.older_than_minutes)
    parser.error(f"Unknown subcommand: {args.cmd}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
