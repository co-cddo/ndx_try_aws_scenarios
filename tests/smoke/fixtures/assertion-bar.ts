/**
 * Smoke-pack assertion bar.
 *
 * One AssertionBarRow per scenario. Each row commits the *shape* of that
 * scenario's smoke run: which landing URL, what login flow (if any), which
 * feature flow to exercise, which Outputs to assert, and a citation to the
 * historical regression that informed the feature-flow choice.
 *
 * Phase 3 / T3.3 of the scenario-regression smoke-pack tech-spec.
 *
 * The map is populated row-by-row in Phase 4 (one PR per scenario). Phase 3
 * just locks in the type so Phase 4 PRs have a stable schema to fill.
 */

export type AuthMode =
  | 'admin-login' // form-based login with credentials from CFN outputs
  | 'public' // no login required (public Lambda FunctionURL or page)
  | 'sso-skip'; // SSO / external auth; smoke skips the login flow

export type QuarantineStatus =
  | { state: 'active' } // test runs
  | { state: 'quarantined'; until: string; reason: string };
//                                  ↑ ISO date YYYY-MM-DD; the quarantine-expiry
//                                    checker in smoke.yml fails the build when
//                                    `until` has passed.

export interface AssertionBarRow {
  /** Scenario name (the slug under cloudformation/scenarios/<name>). */
  readonly scenario: string;
  /** How (or whether) the smoke test logs in. */
  readonly authMode: AuthMode;
  /**
   * Output keys that must be present in the deployed stack. Smoke fails if
   * any are missing or empty. Sensitive entries must be flagged via the
   * name regex (Password / Secret / Token / Credentials / Creds / Login /
   * ApiKey / ConnectionString / PrivateKey / Passphrase) in cfn-outputs.ts.
   */
  readonly outputsToCheck: ReadonlyArray<string>;
  /** Short description of the landing assertion: status code + DOM hint. */
  readonly landingAssertion: string;
  /**
   * Short description of the login assertion (post-auth state indicator).
   * `null` if authMode !== 'admin-login'.
   */
  readonly loginAssertion: string | null;
  /**
   * Short description of the one bug-informed feature flow. Includes a
   * citation to the historical regression in memory or in the scenario's
   * lessons doc so the smoke is bug-informed, not arbitrary.
   */
  readonly featureFlow: string;
  /**
   * Citation key for the historical regression that informed featureFlow.
   * Format: free text plus optional `(memory:<file>)` or `(issue:#<n>)`.
   */
  readonly historicalRegressionCited: string;
  /**
   * Quarantine status. The default is { state: 'active' }; Phase 4 PRs set
   * { state: 'quarantined', until: 'YYYY-MM-DD', reason: '<why>' } for
   * scenarios blocked on external dependencies (e.g. SES production access).
   * The 3-scenario cap and expiry check live in smoke.yml.
   */
  readonly quarantine: QuarantineStatus;
}

/**
 * The 17 scenario rows. Phase 3 leaves the map empty; Phase 4 PRs populate
 * one row each in priority order (fixmystreet → planx → minute → ...).
 *
 * The map keys are scenario slugs. Per Phase 4 DoD, every scenario MUST
 * have an entry (either active or quarantined with a non-expired `until`).
 */
export const ASSERTION_BAR: ReadonlyMap<string, AssertionBarRow> = new Map<
  string,
  AssertionBarRow
>([
  [
    'fixmystreet',
    {
      scenario: 'fixmystreet',
      authMode: 'admin-login',
      outputsToCheck: [
        'FixMyStreetUrl',
        'FixMyStreetAdminUsername',
        'FixMyStreetAdminPassword',
      ],
      landingAssertion:
        'GET / responds with HTTP 200; page title matches /FixMyStreet/; body contains no absolute :9000 URLs (the ALB sidecar mis-routing regression).',
      loginAssertion:
        'POST /auth with admin credentials redirects to /my or /admin (not back to /auth).',
      featureFlow:
        'Post-login: /reports must render without error (catches the bin/update-all-reports regression) and /admin must reach the dashboard without a 2FA redirect (catches the must_have_2fa regression).',
      historicalRegressionCited:
        'FixMyStreet had 15+ deploy iterations spanning EFS UID, ALB sidecar targeting, BASE_URL/CloudFront, X-Forwarded-Proto / using_frontend_proxy, must_have_2fa, /reports requiring bin/update-all-reports. See memory:fixmystreet-lessons.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'planx',
    {
      scenario: 'planx',
      authMode: 'admin-login',
      outputsToCheck: [
        'PlanXUrl',
        'PlanXLoginUrl',
        'PlanXDemoUsername',
        'PlanXDemoPassword',
      ],
      landingAssertion:
        'GET / loads past the SPA boot without emitting an Airbrake error overlay (VITE_APP_ENV=production regression) or a "host not allowed" page (window.location.host domain-allowlist regression).',
      loginAssertion:
        'POST /<login-url> with demo credentials redirects out of the login page; the demo-auth patch in server.ts sets a session cookie.',
      featureFlow:
        'Post-login: editor reachable on the SPA host (catches the domain-allowlist regression), and Hasura native /v1/version responds (catches the Caddy-elimination regression where /hasura prefix-stripping was the prior workaround).',
      historicalRegressionCited:
        'PlanX had 13 issues — Caddy proxy path stripping eliminated, Hasura migrations on cli-migrations-v3, window.location.host allowlist, VITE_APP_ENV=production Airbrake crash, demo auth + body-parser order. See memory:planx-scenario-lessons.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'minute',
    {
      scenario: 'minute',
      authMode: 'admin-login',
      outputsToCheck: [
        'MinuteUrl',
        'MinuteBasicAuthUsername',
        'MinuteBasicAuthPassword',
      ],
      landingAssertion:
        'GET / with HTTP basic auth headers (NOT URL-embedded credentials) returns the Minute SPA shell. Title matches /Minute/.',
      loginAssertion:
        'HTTP basic auth supplied via Playwright httpCredentials (browser-attached); page loads without a 401.',
      featureFlow:
        'Inside the SPA, fetch() against the same origin must succeed (catches the CloudFront-embedded-basic-auth regression where fetch() refuses URL-embedded credentials). /api/proxy/healthcheck must reach the backend via frontend middleware (catches the ALB /api/* rule interception regression).',
      historicalRegressionCited:
        'Minute had 12 issues — no CDK bootstrap, postgres reserved username, ECS circuit breaker blocking CFN, basic auth breaking fetch(), ALB /api/* rule intercepting middleware proxy. See memory:minute-scenario-lessons.md.',
      quarantine: { state: 'active' },
    },
  ],
]);

/**
 * Helper used by smoke specs: look up the row for a scenario and throw a
 * descriptive error if missing. Encourages every Phase 4 PR to populate
 * its row BEFORE writing the spec file.
 */
export function requireAssertionBar(scenario: string): AssertionBarRow {
  const row = ASSERTION_BAR.get(scenario);
  if (!row) {
    throw new Error(
      `No AssertionBarRow for scenario "${scenario}"; populate tests/smoke/fixtures/assertion-bar.ts before writing the spec`,
    );
  }
  return row;
}
