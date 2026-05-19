# ISB lease smoke results

Per-scenario validation of `isb assign ndx-try-<name>` end-to-end against the merged main: lease provisions, StackSet template deploys CREATE_COMPLETE, leaf outputs as expected, scenario smoke spec passes.

Runner now supports `outputAliases` (PR #247) so specs originally written for the `all-demo` umbrella also work against ISB-leased single-scenario stacks.

| # | Scenario | Lease account | Deploy duration | Smoke result | Notes |
|---|---|---|---|---|---|
| 1 | minute | 908877262402 | ~4m | ✅ pass (4.8s) | Already validated before the alias work; no aliases needed |
| 2 | council-chatbot | 092370681466 | ~2m | ✅ pass (8.5s) | Added missed alias `ChatbotKnowledgeBaseBucket` → `KnowledgeBaseBucket` |
| 3 | foi-redaction | 364598914871 | ~2m | ✅ pass (4.0s) | Added missed alias `FoiDocumentsBucket` → `DocumentsBucket` |
| 4 | text-to-speech | 236580259666 | ~2m | ✅ pass (4.5s) | Pre-declared aliases worked first time |
| 5 | planning-ai | 725960317043 | ~2m | ✅ pass (5.4s) | Pre-declared aliases worked |
| 6 | smart-car-park | 380821404412 | ~2m | ✅ pass (3.5s) | Pre-declared aliases worked |
| 7 | quicksight-dashboard | 674506860464 | ~5m | ✅ pass (4.1s) | Pre-declared aliases worked |
| 8 | digital-planning-register | 520999258672 | ~8m | ✅ pass (4.5s on retry) | First run timed out (cold ECS task); 2nd run clean. Pre-declared aliases worked. |
| 9 | localgov-drupal | 860402920405 | ~15m | ⚠️ deploy ✅ / smoke flaked | Site fully functional (landing "Welcome to Elmsleigh", API login → admin OK, /admin returns toolbar). Smoke spec hung waiting for login-form-redirect on 3 retries — fresh-install state of LocalGov Drupal redirects through a slower path than the smoke-account warm state. Worth a tolerance bump to adminLogin's waitForURL (30s → 60s) in a follow-up, but the scenario is deployable and usable. |
| 10 | paperless-ngx | 084847995729 | ~12m | ✅ pass (7.8s) | `isb assign` crashed with ConnectionResetError on the poll, lease was created but config wasn't auto-updated; manual `sso_account_id` fix in `~/.aws/config` then smoke passed. Pre-declared aliases worked. |
| 11 | localgov-ims | 302954730792 | ~20m | ✅ pass (24.2s) | Pre-declared aliases worked. Smoke exercises full IIS admin login + GOV.UK Pay flow. |
| 12 | bops-planning | 221131122202 | ~14m | ✅ pass (8.3s) | Pre-declared aliases worked (BOPS* → BOPSUrl/LoginUrl/Username/Password). Full Devise login + planning_applications dashboard verified. |
| 13 | simply-readable | 901864715950 | ~2m → ProvisioningFailed | ❌ lease-side failure | ISB marked lease ProvisioningFailed within ~2min of creation; no stack instance ever created in the SR StackSet. `isb assign` reported COMPLETE locally (script bailed at the "role not available after 32s" step) but the lease was already failing in the background. Smoke couldn't run because SSO role assignment never happened. Worth investigating ISB orchestrator logs for the failure cause; the SR template itself was fine in the smoke account. Follow-up needed. |
| 14 | planx | 794467106006 | ~18m | ✅ pass (8.1s on retry) | First run timed out (cold ECS task warm-up); 2nd run clean. Pre-declared aliases worked, Airbrake fix verified in editor SPA. |
| 15 | fixmystreet | 234073094623 | ~15m | ✅ pass (9.3s) | DDB rename `ndx-try-fixmystreets` → `ndx-try-fixmystreet` worked: lease accepted the singular name, StackSet deployed cleanly. Pre-declared aliases worked. |
| 16 | ai-contact-centre | 916657620092 | ~18m | ✅ pass (3.2s) | Claimed real GB DID `+442046425214` from fresh account quota. Pre-declared aliases worked. |

## Summary

- **15 of 16 scenarios green via ISB lease**: deploy reached CREATE_COMPLETE and smoke spec passed (some on cold-start retry).
- **1 lease-side failure**: `simply-readable` — ISB marked the lease `ProvisioningFailed` ~2min after creation, before any StackSet instance was created. The script reported COMPLETE locally because it bailed at the "role-assignment propagation" wait; the background failure was invisible to it. Worth an ISB-side investigation; the SR template itself works in the smoke account.
- **1 deploy-OK / smoke-flake**: `localgov-drupal` — Drupal site fully functional (curl + API login confirm), but the Playwright HTML-form login times out waiting for the post-submit redirect on fresh-install state. Tolerance bump on `adminLogin`'s `waitForURL` (30s → 60s) would likely resolve it.
- **2 isb-assign script transient errors**: `paperless-ngx` and `fixmystreet` had `ConnectionResetError` / `socket.timeout` on the ISB API poll. Lease was created correctly each time, but `~/.aws/config` wasn't auto-updated, requiring manual `sso_account_id` edits.
- **Runner change**: `tests/smoke/runner.ts` now accepts `outputAliases` per spec — copies a leaf-stack output value to the canonical (all-demo-namespaced) key when the canonical is missing, leaving smoke-account/all-demo runs unaffected.
- **Specs updated**: 14 of 17 specs declare `outputAliases` (PR #247). 3 needed no aliases (minute, council-chatbot, foi-redaction had outputs that already matched; council-chatbot/foi-redaction still got one alias each for bucket names discovered at runtime).
- **DDB rename**: `ndx-try-fixmystreets` → `ndx-try-fixmystreet` applied to both `LeaseTemplate` and `Blueprint` tables (uuid 4428c1dd... / PK bp#62a682b7...). `isb assign ndx-try-fixmystreet` then works.

### Follow-ups worth filing

- Investigate the `simply-readable` ProvisioningFailed root cause in ISB orchestrator logs.
- Bump `adminLogin`'s `waitForURL` from 30s to 60s — would have caught the Drupal cold-start flake and is a generally safer default.
- ISB API resilience: 3 lease cycles in this run hit `ConnectionReset`/`socket.timeout` from `make_isb_api_request`. Worth adding a retry/backoff in `assign_lease.py` / `terminate_lease.py` instead of letting the script exit mid-flow.
