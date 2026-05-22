#!/usr/bin/env python3
"""ISB lease helper for CI workflows.

GitHub-hosted runner Azure IPs are blocked by the upstream ISB WAF
(AWSManagedRulesAnonymousIpList -> HostingProviderIPList). To work around
this without weakening the WAF, this script invokes a Lambda proxy in
the hub account (cloudformation/isb-hub/lambda/lease-proxy/) which makes
the actual ISB API call from AWS-internal IP space.

The proxy Lambda also holds the JWT secret access — the CI-lease GHA OIDC
role only has lambda:InvokeFunction on the proxy, not direct secret read.

Subcommands:
  acquire --template <name> --user-email <addr>
  release --lease-id <id>   --user-email <addr>
  list-orphans --owned-by <addr> [--older-than-minutes N]

Exit codes match the previous direct-API version. acquire writes
account_id / lease_id / lease_uuid to $GITHUB_OUTPUT for the next step.
"""

import argparse
import json
import os
import sys
from typing import Any

import boto3
from botocore.config import Config

LEASE_PROXY_FUNCTION = os.environ.get("ISB_LEASE_PROXY_FUNCTION", "isb-lease-proxy")
LEASE_PROXY_REGION = os.environ.get("ISB_LEASE_PROXY_REGION", "us-west-2")

# Sync Lambda Invoke can take up to 15 min for a long-polling acquire.
# Default boto3 read_timeout is 60s — way too short. retries=0 because
# the Lambda itself already retries the ISB API; a botocore retry on a
# 15-min request would burn another 15 min for no gain.
_LAMBDA_CFG = Config(read_timeout=900, connect_timeout=10, retries={"max_attempts": 0})


def invoke_proxy(event: dict) -> dict:
    """Invoke the lease-proxy Lambda. Returns the decoded JSON response."""
    client = boto3.client("lambda", region_name=LEASE_PROXY_REGION, config=_LAMBDA_CFG)
    resp = client.invoke(
        FunctionName=LEASE_PROXY_FUNCTION,
        InvocationType="RequestResponse",
        Payload=json.dumps(event).encode(),
    )
    payload = resp["Payload"].read().decode()
    fn_error = resp.get("FunctionError")
    try:
        body = json.loads(payload)
    except json.JSONDecodeError:
        body = {"raw": payload}
    if fn_error:
        body = {"ok": False, "error": f"Lambda {fn_error}", "lambda_response": body}
    return body


def emit_gha_output(key: str, value: str) -> None:
    sink = os.environ.get("GITHUB_OUTPUT")
    if not sink:
        print(f"{key}={value}")
        return
    with open(sink, "a", encoding="utf-8") as f:
        f.write(f"{key}={value}\n")


def _print_error(prefix: str, body: dict) -> None:
    msg = body.get("error", "(no error)")
    status = body.get("status")
    extra_parts = []
    if status is not None:
        extra_parts.append(f"status={status}")
    if "body" in body:
        extra_parts.append(f"body={json.dumps(body['body'])[:300]}")
    if "poll_log" in body:
        extra_parts.append("poll_log:")
        for entry in body["poll_log"]:
            extra_parts.append(f"  {entry}")
    extra = " ".join(extra_parts)
    print(f"::error::{prefix}: {msg} {extra}".rstrip(), flush=True)


# ── acquire ─────────────────────────────────────────────────────────────────


def acquire(template_name: str, user_email: str) -> int:
    print(f"::group::Acquire ISB lease ({template_name} for {user_email})", flush=True)
    body = invoke_proxy({"op": "acquire", "template": template_name, "user_email": user_email})
    if not body.get("ok"):
        _print_error("Acquire failed", body)
        print("::endgroup::", flush=True)
        return 2
    data = body["data"]
    account_id = data["account_id"]
    lease_id = data["lease_id"]
    lease_uuid = data["lease_uuid"]
    print(f"Lease Active. account_id={account_id} lease_id={lease_id} lease_uuid={lease_uuid}", flush=True)
    emit_gha_output("account_id", account_id)
    emit_gha_output("lease_id", lease_id)
    emit_gha_output("lease_uuid", lease_uuid)
    print("::endgroup::", flush=True)
    return 0


# ── release ─────────────────────────────────────────────────────────────────


def release(lease_id: str, user_email: str) -> int:
    print(f"::group::Release ISB lease ({lease_id[:20]}...)", flush=True)
    body = invoke_proxy({"op": "release", "lease_id": lease_id, "user_email": user_email})
    if body.get("ok"):
        data = body.get("data", {})
        if data.get("already_gone"):
            print(f"Lease already gone (status {data.get('status')}); idempotent success.", flush=True)
        else:
            print("Lease terminated.", flush=True)
        print("::endgroup::", flush=True)
        return 0
    msg = body.get("error", "(no error)")
    print(f"::warning::Release failed: {msg}", flush=True)
    print("::endgroup::", flush=True)
    return 1


# ── list-orphans ────────────────────────────────────────────────────────────


def list_orphans(owned_by: str, older_than_minutes: int) -> int:
    body = invoke_proxy(
        {
            "op": "list-orphans",
            "owned_by": owned_by,
            "older_than_minutes": older_than_minutes,
        }
    )
    if not body.get("ok"):
        _print_error("List orphans failed", body)
        return 1
    orphans = body["data"]["orphans"]
    for o in orphans:
        print(f"{o['lease_id']}\t{o['account_id']}\t{o['status']}\t{o['age_minutes']}")
    print(
        f"::notice::found {len(orphans)} orphan lease(s) for {owned_by} older than {older_than_minutes}m",
        flush=True,
    )
    return 0


# ── main ────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_acquire = sub.add_parser("acquire", help="Provision a new lease, wait until Active")
    p_acquire.add_argument("--template", required=True)
    p_acquire.add_argument("--user-email", required=True)

    p_release = sub.add_parser("release", help="Terminate a lease (idempotent)")
    p_release.add_argument("--lease-id", required=True)
    p_release.add_argument("--user-email", required=True)

    p_orphans = sub.add_parser("list-orphans", help="Print orphan leases for the janitor")
    p_orphans.add_argument("--owned-by", required=True)
    p_orphans.add_argument("--older-than-minutes", type=int, default=180)

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
