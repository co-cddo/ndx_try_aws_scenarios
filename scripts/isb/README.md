# scripts/isb/

CI-only helper for interacting with the Innovation Sandbox lease API.

## ci_lease.py

Single-file, no-third-party-deps Python wrapper around the ISB lease endpoints. Subcommands:

```bash
python3 scripts/isb/ci_lease.py acquire --template empty-sandbox --user-email ci-bot@<>
python3 scripts/isb/ci_lease.py release --lease-id <id> --user-email ci-bot@<>
python3 scripts/isb/ci_lease.py list-orphans --owned-by ci-bot@<> --older-than-minutes 180
```

Requires only `boto3` (already on GitHub Actions ubuntu-latest runners; `pip install --user boto3` if needed). No `pyjwt`, no `requests` — we use `hmac`/`hashlib`/`urllib` from the stdlib.

The script assumes the calling identity already has IAM credentials in the environment with permission to:
- `secretsmanager:GetSecretValue` on `/InnovationSandbox/ndx/Auth/JwtSecret` in us-west-2.

In GitHub Actions this is the `isb-hub-github-actions-ci-lease` OIDC role (see `cloudformation/isb-hub/lib/isb-hub-stack.ts`).

### Outputs (`acquire`)

When `$GITHUB_OUTPUT` is set, `acquire` writes:
- `account_id` — the leased pool account ID.
- `lease_id` — the Base64-encoded ID used for subsequent API calls (`release`, polling).
- `lease_uuid` — the lease's UUID (for human inspection in the ISB UI).

If `$GITHUB_OUTPUT` is unset, the same key=value lines go to stdout.

### Exit codes (`acquire`)

- `0` — Lease is Active with a non-empty account ID.
- `2` — Failed to create the lease (POST /leases returned non-201).
- `3` — Timed out waiting for `Provisioning` → `Active` (>30 min).
- `4` — Lease entered a terminal status that isn't `Active` (e.g. `ProvisioningFailed`, `Frozen`, `Expired`, `Terminated`, `Failed`). Upstream `assign_lease.py` silently logged this as "Unexpected status"; we exit non-zero with the actual status name so the workflow goes red.
- `5` — Lease is Active but `awsAccountId` is empty (ISB API contract violation).

### Exit codes (`release`)

- `0` — Lease terminated, or already gone (404/409 treated as idempotent success).
- `1` — Other failure (HTTP 5xx after retries, malformed response).

### Retry behaviour

`make_isb_api_request` retries up to 4 times with exponential backoff (1s, 2s, 4s) on:
- `ConnectionResetError`
- `socket.timeout`
- `urllib.error.URLError`
- HTTP 500/502/503/504

4xx responses surface immediately (no point retrying a bad-request body or auth failure).

## Vendored from

`innovation-sandbox-on-aws-utils` @ commit `13fc703` (2026-05-21 — `isb_common: retry transient errors in make_isb_api_request`). Refresh procedure when the upstream gains a relevant fix:

1. `cd ~/httpdocs/innovation-sandbox-on-aws-utils && git pull && git rev-parse HEAD`.
2. Read the relevant change(s) in `isb_common.py`, `assign_lease.py`, or `terminate_lease.py`.
3. Port into `scripts/isb/ci_lease.py`. Keep the file single-file, stdlib-only, no SSO/interactive flows.
4. Update this README's vendored-from SHA.

## Local dry-run

After `cdk deploy` of the hub stack and `aws cloudformation deploy` of the orgmgmt CIDeployRole stack have both landed and the StackSet has provisioned to at least one pool account:

```bash
# Use NDX/InnovationSandboxHub credentials to talk to Secrets Manager.
aws sso login --profile NDX/InnovationSandboxHub
AWS_PROFILE=NDX/InnovationSandboxHub python3 scripts/isb/ci_lease.py \
  acquire --template empty-sandbox --user-email "$USER@$(hostname -f)"
# Note the account_id printed.
AWS_PROFILE=NDX/InnovationSandboxHub python3 scripts/isb/ci_lease.py \
  release --lease-id <printed lease_id> --user-email "$USER@$(hostname -f)"
```
