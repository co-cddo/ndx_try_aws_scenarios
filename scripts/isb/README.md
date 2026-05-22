# scripts/isb/

CI-only helper for interacting with the Innovation Sandbox lease API.

## Why a proxy

GitHub-hosted Actions runners use Azure IPs, which the upstream ISB WAF
(`AWSManagedRulesAnonymousIpList` → `HostingProviderIPList`) blocks. This
helper does NOT call the ISB API directly. It invokes a Lambda proxy in
the hub account (`cloudformation/isb-hub/lambda/lease-proxy/`), and the
Lambda makes the actual HTTPS call from AWS IP space. The JWT secret is
held by the Lambda — never exposed to the GHA OIDC role.

## ci_lease.py

```bash
python3 scripts/isb/ci_lease.py acquire --template empty-sandbox --user-email <addr>
python3 scripts/isb/ci_lease.py release --lease-id <id> --user-email <addr>
python3 scripts/isb/ci_lease.py list-orphans --owned-by <addr> [--older-than-minutes N]
```

Requires `boto3` and an AWS identity with `lambda:InvokeFunction` on
`arn:aws:lambda:us-west-2:568672915267:function:isb-lease-proxy`. In GitHub
Actions this is the `isb-hub-github-actions-ci-lease` role; locally it's
your SSO `NDX/InnovationSandboxHub` profile.

### Outputs (`acquire`)

When `$GITHUB_OUTPUT` is set, `acquire` writes:
- `account_id` — the leased pool account ID.
- `lease_id` — the Base64-encoded ID used for subsequent API calls.
- `lease_uuid` — the lease's UUID (for human inspection in the ISB UI).

### Exit codes

- `acquire`: `0` if lease Active with a non-empty account ID; `2` if the Lambda returned `ok: false` (reason in `::error::` line).
- `release`: `0` on terminate or idempotent already-gone (404/409); `1` otherwise.
- `list-orphans`: `0` on success; `1` if the Lambda returned `ok: false`.

### Retry behaviour

Retries (up to 4× with exponential backoff on transient
`ConnectionResetError`/`socket.timeout`/`URLError`/HTTP 5xx) live in the
Lambda. Network egress from a Lambda is generally more reliable than from
a GHA runner — the proxy absorbs flakes.

## Lambda proxy (`cloudformation/isb-hub/lambda/lease-proxy/index.py`)

Python 3.12 Lambda. Reads the JWT secret on cold start (cached for warm
invocations), signs the JWT, calls the ISB API. Routes via `event["op"]`
to `acquire`/`release`/`list-orphans`. Returns `{"ok": bool, ...}` to the
caller. Re-deployed by the `isb-hub` CDK.

## Vendored from

The Lambda's lease-template resolution + poll loop + make_isb_api_request
shape was vendored from `innovation-sandbox-on-aws-utils@13fc703`
(`isb_common.py`, `assign_lease.py`, `terminate_lease.py`). Refresh
procedure when the upstream gains a relevant fix: read the new commit,
port any non-SSO logic into `index.py`, redeploy the hub CDK.

## Local dry-run

```bash
aws sso login --profile NDX/InnovationSandboxHub
AWS_PROFILE=NDX/InnovationSandboxHub python3 scripts/isb/ci_lease.py \
  acquire --template empty-sandbox --user-email "$USER@$(hostname -f)"
# Note the account_id printed.
AWS_PROFILE=NDX/InnovationSandboxHub python3 scripts/isb/ci_lease.py \
  release --lease-id <printed lease_id> --user-email "$USER@$(hostname -f)"
```
