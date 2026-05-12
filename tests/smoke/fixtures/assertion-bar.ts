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
  // (filled in by Phase 4 PRs — see tech-spec for the priority order)
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
