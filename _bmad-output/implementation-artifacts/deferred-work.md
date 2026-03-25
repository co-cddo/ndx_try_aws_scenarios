# Deferred Work — LocalGov IMS

## From adversarial review (2026-03-20)

1. **Pin upstream git commits in Dockerfile** — Both `localgov-ims` and `localgov-ims-integration-govukpay` repos are checked out at `main` instead of a pinned commit SHA. The Dockerfile comments note this as a TODO. Pin to specific commits for reproducible builds before production use.

2. **Walkthrough screenshots** — `scenarios.yaml` has `screenshots: { steps: [] }`. Capture screenshots via Playwright after first successful deployment (Phase 5, Task 5.2).

3. **Kestrel restart loop backoff** — The GOV.UK Pay Kestrel restart loop uses a fixed 5-second delay with no exponential backoff or max retry count. Low severity for a demo environment but could generate excessive CloudWatch logs on repeated crash.
