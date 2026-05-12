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
  [
    'localgov-ims',
    {
      scenario: 'localgov-ims',
      authMode: 'admin-login',
      outputsToCheck: [
        'LocalgovImsAdminPortalUrl',
        'LocalgovImsPaymentPortalUrl',
        'LocalgovImsAdminUsername',
        'LocalgovImsAdminPassword',
      ],
      landingAssertion:
        'Both admin and payment portal CloudFront URLs resolve without leaving their hostname.',
      loginAssertion:
        'POST to admin portal login form with Email + Password redirects off the login page.',
      featureFlow:
        'AdminPassword Output must not contain the literal {{resolve:...}} token (catches the Lambda-custom-resource regression where SM dynamic refs in CFN Outputs returned the unresolved string).',
      historicalRegressionCited:
        'LocalGov IMS pivoted from Windows Fargate (broken http.sys multi-site IIS) to Windows EC2 on 2026-03-22. Issues: empty NuGet sources, Start-Process redirect deadlock, {{resolve:secretsmanager:...}} in UserData, m5.xlarge capacity exhaustion in us-east-1a, AdminPassword unresolved in Outputs. See memory:localgov-ims-deploy-status.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'localgov-drupal',
    {
      scenario: 'localgov-drupal',
      authMode: 'admin-login',
      outputsToCheck: ['DrupalUrl', 'DrupalAdminUsername', 'DrupalAdminPassword'],
      landingAssertion:
        'Landing renders without PHP fatal or Bedrock AccessDeniedException — the ndx_aws_ai module boots cleanly.',
      loginAssertion:
        '/user/login POST with name + pass redirects off the login page.',
      featureFlow:
        '/admin reachable post-login; body has no AccessDeniedException and no "module ... could not be enabled" errors. Cross-references the Bedrock legacy-model migration in NAP-548.',
      historicalRegressionCited:
        'LocalGov Drupal CDK conversion: CDK bootstrap blocked by ISB SCP; ndx_aws_ai module needs ISB-BedrockAccess inline policies; claude-3-haiku-20240307 used to be the default model and is now Legacy.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'simply-readable',
    {
      scenario: 'simply-readable',
      authMode: 'admin-login',
      outputsToCheck: [
        'SimplyReadableAppUrl',
        'SimplyReadableAdminUsername',
        'SimplyReadableAdminPassword',
      ],
      landingAssertion:
        'SPA loads without a React chunk-load error and without a "your-graphql-endpoint" placeholder.',
      loginAssertion:
        '(skipped) Cognito Hosted UI requires manual first-time password reset; smoke does not drive it. Credentials presence + redaction checked instead.',
      featureFlow:
        'AdminPassword must be >8 chars and not the {{resolve:...}} literal. SPA reload produces no 5xx network responses (catches BlueprintsBucketName parameter mis-wire where Lambda assets 404).',
      historicalRegressionCited:
        'Simply Readable template.yaml vs dist/simply-readable.template.json drift; _toCloudFormation() override adds Policies + RoleName; "function role cannot be assumed by Lambda" actually missing inline policies; nested model-table format (text.M / image.M). See memory:simply-readable-lessons.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'ai-contact-centre',
    {
      scenario: 'ai-contact-centre',
      authMode: 'admin-login',
      outputsToCheck: [
        'AiContactCentreCompanionUrl',
        'AiContactCentrePstnNumber',
      ],
      landingAssertion: 'Companion UI returns < 5xx.',
      loginAssertion: null,
      featureFlow:
        'PSTN number Output matches /^\\+\\d{6,}/. UK +44 numbers from us-east-1 are finicky; either UK or US fallback acceptable, but empty / placeholder is a regression.',
      historicalRegressionCited:
        'Amazon Connect UK number claim from us-east-1 has been finicky; clickops sometimes succeeds where API fails. See memory:aws-connect-uk-numbers.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'paperless-ngx',
    {
      scenario: 'paperless-ngx',
      authMode: 'admin-login',
      outputsToCheck: [
        'PaperlessNgxUrl',
        'PaperlessNgxAdminUsername',
        'PaperlessNgxAdminPassword',
      ],
      landingAssertion: 'Login page renders the username/password form.',
      loginAssertion:
        'POST to login with admin credentials redirects off the login page.',
      featureFlow:
        '/documents view + in-SPA fetch of /api/documents/?page=1 returns < 500. Catches the S3 Files mount regression where Documents never render because the mount is broken.',
      historicalRegressionCited:
        'S3 Files (CFN) gotchas: versioned bucket, EFS service principal, nested fsap- ARN, EventBridge perms. See memory:feedback_s3files_quirks.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'bops-planning',
    {
      scenario: 'bops-planning',
      authMode: 'admin-login',
      outputsToCheck: [
        'BopsPlanningUrl',
        'BopsPlanningLoginUrl',
        'BopsPlanningUsername',
        'BopsPlanningPassword',
      ],
      landingAssertion:
        'BOPS web responds without a Rails 500 page and does NOT match "applicants portal" (which would indicate the routing.rb override failed).',
      loginAssertion:
        'POST to /users/sign_in with user[email] + user[password] redirects off the sign_in page.',
      featureFlow:
        'Post-login URL must NOT contain :8080 (the Applicants port). Catches the regression where the base64-decoded routing.rb patch failed at boot.',
      historicalRegressionCited:
        'BOPS uses base64-encoded routing.rb override for single-tenant mode; LogGroup RETAIN intentional with smoke-pack Justification metadata (Phase 2b PR #228). Routing patch is brittle due to many edge cases.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'digital-planning-register',
    {
      scenario: 'digital-planning-register',
      authMode: 'public',
      outputsToCheck: ['DigitalPlanningRegisterUrl'],
      landingAssertion:
        'Landing returns < 5xx; body contains "planning" or "register".',
      loginAssertion: null,
      featureFlow:
        'Body must not contain a Next.js "application error" overlay. Image pinning (Phase 5 PR #231) bounds this regression to Renovate-tracked digest bumps.',
      historicalRegressionCited:
        'DPR LogGroup had RemovalPolicy.RETAIN without justification (fixed in Phase 2a); ImageUri parameter defaulted to :latest until Phase 5 pin sweep.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'foi-redaction',
    {
      scenario: 'foi-redaction',
      authMode: 'public',
      outputsToCheck: ['RedactionURL', 'FoiDocumentsBucket'],
      landingAssertion:
        'FunctionURL reachable; not 403 (which would mean InvokeFunctionUrl + InvokeFunction dual-perm regressed) and not 5xx.',
      loginAssertion: null,
      featureFlow:
        'FoiDocumentsBucket Output is non-empty (deploy-completeness — bucket failed-to-create still produces a deployable stack but empty Output).',
      historicalRegressionCited:
        'Public Lambda Function URLs need TWO permissions: InvokeFunctionUrl AND InvokeFunction + InvokedViaFunctionUrl: true (since Oct 2025). Without both you get 403 — NOT an SCP issue. See memory:feedback_isb_blocks_public_lambda_urls.md.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'planning-ai',
    {
      scenario: 'planning-ai',
      authMode: 'public',
      outputsToCheck: ['PlanningAnalyzerURL', 'PlanningDocumentsBucket'],
      landingAssertion:
        'Analyzer FunctionURL responds < 500 and not 403.',
      loginAssertion: null,
      featureFlow:
        'DocumentsBucket Output non-empty. Sample PDF + Textract-text injection by build-template.py not deeply exercised in smoke.',
      historicalRegressionCited:
        'Planning-AI uses build-template.py to inject sample PDF + Textract-extracted text into the template at deploy-time. Past bugs: PR #212 (textract + sample doc), PR #215 (PDF preview).',
      quarantine: { state: 'active' },
    },
  ],
  [
    'text-to-speech',
    {
      scenario: 'text-to-speech',
      authMode: 'public',
      outputsToCheck: ['TextToSpeechConvertURL', 'TextToSpeechAudioBucket'],
      landingAssertion: 'Convert FunctionURL responds < 500 and not 403.',
      loginAssertion: null,
      featureFlow: 'AudioBucket Output non-empty. Polly invocation not exercised by smoke.',
      historicalRegressionCited:
        'Public Lambda FunctionURL dual-perm pattern (same as foi-redaction). No scenario-specific regression history yet.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'smart-car-park',
    {
      scenario: 'smart-car-park',
      authMode: 'public',
      outputsToCheck: ['SmartCarParkDashboardURL', 'SmartCarParkSensorReadingsTable'],
      landingAssertion: 'Dashboard FunctionURL responds < 500 and not 403.',
      loginAssertion: null,
      featureFlow:
        'SensorReadingsTable Output non-empty. EventBridge-scheduled simulator + table query not exercised by smoke.',
      historicalRegressionCited:
        'No specific historical regression in memory for this scenario. Deploy-completeness check until a regression escapes.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'council-chatbot',
    {
      scenario: 'council-chatbot',
      authMode: 'public',
      outputsToCheck: ['ChatbotURL', 'ChatbotKnowledgeBaseBucket'],
      landingAssertion:
        'Chatbot FunctionURL responds < 500 (5xx most likely = the legacy claude-3-haiku regression, see NAP-548) and not 403.',
      loginAssertion: null,
      featureFlow:
        'KnowledgeBaseBucket Output non-empty. KB-grounded query not exercised; the not-5xx already proves the Lambda boots and reaches Bedrock.',
      historicalRegressionCited:
        'Bedrock Knowledge Base + S3 data source. The model the chatbot uses (claude-3-haiku-20240307) is now Legacy — see NAP-548.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'quicksight-dashboard',
    {
      scenario: 'quicksight-dashboard',
      authMode: 'sso-skip',
      outputsToCheck: ['QuicksightDashboardUrl', 'QuicksightDataBucket'],
      landingAssertion:
        'Dashboard URL responds < 500 (typically redirects to QuickSight SSO).',
      loginAssertion: null,
      featureFlow:
        '(skipped per auth-mode categorisation) — only (a) landing and (d) Outputs are asserted.',
      historicalRegressionCited:
        'QuickSight Enterprise subscription provisioning is operator-driven (NAP-551). No scenario-specific regression in memory.',
      quarantine: { state: 'active' },
    },
  ],
  [
    'all-demo',
    {
      scenario: 'all-demo',
      authMode: 'public',
      outputsToCheck: [
        'ChatbotURL',
        'RedactionURL',
        'PlanningAnalyzerURL',
        'QuicksightDashboardUrl',
        'SmartCarParkDashboardURL',
        'TextToSpeechConvertURL',
        'DrupalUrl',
        'SimplyReadableAppUrl',
        'AiContactCentreCompanionUrl',
        'LocalgovImsAdminPortalUrl',
        'LocalgovImsPaymentPortalUrl',
        'MinuteUrl',
        'FixMyStreetUrl',
        'PaperlessNgxUrl',
        'PlanXUrl',
        'BopsPlanningUrl',
        'DigitalPlanningRegisterUrl',
        'ChatbotKnowledgeBaseBucket',
        'FoiDocumentsBucket',
        'PlanningDocumentsBucket',
        'QuicksightDataBucket',
        'SmartCarParkSensorReadingsTable',
        'TextToSpeechAudioBucket',
        'AiContactCentrePstnNumber',
        'ScenarioInfo',
      ],
      landingAssertion:
        'Every Output the all-demo umbrella promises is present, non-empty, and not {{resolve:...}}. URL outputs match https?://.',
      loginAssertion: null,
      featureFlow:
        'Umbrella deploy-completeness. Per-scenario specs cover per-scenario depth; this spec catches nested-stack regressions where a child stack succeeds CREATE_COMPLETE but the umbrella GetAtt is misspelled or the child Output was renamed.',
      historicalRegressionCited:
        'T3.8 verification (PR #233 comment) — LocalgovIms nested stack failed because the umbrella passed an empty GovUkPayApiKey but the scenario template required >= 1 character. The umbrella spec catches that earlier than the deploy-time CFN failure.',
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
