// Per-scenario assertion bar: what each scenario's smoke spec asserts, and
// which historical regression motivates that assertion. The smoke specs
// themselves are the source of truth; this fixture is the index a reviewer
// or new author scans to understand "why does this scenario check that".
//
// AC4.2: each scenario has exactly one row citing a historical regression.
// AC4.3: 17 rows total — one per scenario (16 deployable + the all-demo
// umbrella, which has its own assertion).
//
// Add a row whenever a new scenario lands. Update the row when a regression
// drives a new assertion into that scenario's smoke spec.

export interface AssertionBarRow {
  /** Smoke target landing assertion (HTTP status, title match, content probe). */
  readonly landingAssertion: string;
  /** Auth flow exercised by smoke, if any. */
  readonly loginAssertion: string;
  /** The bug-informed feature flow checked beyond a bare 200. */
  readonly featureFlow: string;
  /** CFN Output keys the smoke spec reads. */
  readonly outputsToCheck: readonly string[];
  /** Free-form citation: commit SHA, PR, incident, or memory entry. */
  readonly historicalRegressionCited: string;
}

export const ASSERTION_BAR: ReadonlyMap<string, AssertionBarRow> = new Map([
  ['ai-contact-centre', {
    landingAssertion: 'CompanionUrl HTTP < 500',
    loginAssertion: 'n/a (quota-preserved DUMMY DID path)',
    featureFlow: 'PstnNumber output matches +44 (or US toll-free) E.164 format',
    outputsToCheck: ['AiContactCentreCompanionUrl', 'AiContactCentrePstnNumber'],
    historicalRegressionCited: '+44 number claim from us-east-1 regressed to generic /^\\+\\d{6,}/ — see memory:aws-connect-uk-numbers and ACCEPTABLE_PSTN regex narrowing in ai-contact-centre/smoke.ts',
  }],
  ['all-demo', {
    landingAssertion: 'every Outputs key in template.yaml resolves on the live stack',
    loginAssertion: 'n/a (umbrella)',
    featureFlow: 'safe outputs are non-empty + not "{{resolve:...}}" literal; URL outputs match https://; sensitive outputs have non-zero length',
    outputsToCheck: ['discovered from template at test time'],
    historicalRegressionCited: 'BopsPlanning/Paperless secretsmanager dynamic refs leaked the unresolved {{resolve:...}} literal into CFN Outputs; smoke now asserts no Output is that placeholder',
  }],
  ['bops-planning', {
    landingAssertion: 'landing page does not contain the Rails generic "we\'re sorry, but something went wrong" or fall through to the Applicants tenant',
    loginAssertion: 'Devise admin login at /users/sign_in completes; URL navigates away from "sign_in"',
    featureFlow: 'post-login URL does NOT contain ":8080" (routing.rb single-tenant override would otherwise route Applicants on port 8080)',
    outputsToCheck: ['BopsPlanningUrl', 'BopsPlanningLoginUrl', 'BopsPlanningUsername', 'BopsPlanningPassword'],
    historicalRegressionCited: 'base64-encoded routing.rb override failed to reach the container, leaking the Applicants tenant on the back-office host (port :8080 visible in post-login URL)',
  }],
  ['council-chatbot', {
    landingAssertion: 'public Lambda Function URL POST returns < 500',
    loginAssertion: 'n/a',
    featureFlow: 'POST forces Lambda cold-start + Bedrock invocation (GET would 405 vacuously)',
    outputsToCheck: ['ChatbotURL', 'ChatbotKnowledgeBaseBucket'],
    historicalRegressionCited: 'public Lambda FURL needs both InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl:true since Oct 2025 — without both we get a 403; see memory:isb_blocks_public_lambda_urls',
  }],
  ['digital-planning-register', {
    landingAssertion: 'landing HTTP < 500; body contains "planning" or "register"',
    loginAssertion: 'n/a (public)',
    featureFlow: 'no "application error" Next.js overlay in body',
    outputsToCheck: ['DigitalPlanningRegisterUrl'],
    historicalRegressionCited: 'Next.js server crashes from missing/invalid council-config render the framework error overlay; smoke catches the overlay text',
  }],
  ['fixmystreet', {
    landingAssertion: 'landing has /FixMyStreet/i title; body does not leak ":9000" absolute URLs (ALB sidecar mis-routing)',
    loginAssertion: 'two-stage email→password flow at /auth; navigates away from "auth" after submit',
    featureFlow: '/reports renders without errors (bin/update-all-reports populated data/all-reports.json); /admin does not redirect to a 2FA setup page (STAGING_FLAGS skip_must_have_2fa holds)',
    outputsToCheck: ['FixMyStreetUrl', 'FixMyStreetAdminUsername', 'FixMyStreetAdminPassword'],
    historicalRegressionCited: 'ALB sidecar regression leaked port :9000 absolute URLs into pages; 2FA-skip flag removal silently broke admin; see memory:fixmystreet-lessons',
  }],
  ['foi-redaction', {
    landingAssertion: 'public CloudFront URL responds < 500',
    loginAssertion: 'n/a (public)',
    featureFlow: 'landing page reachable; redaction backend reachable from front-end',
    outputsToCheck: ['RedactionURL', 'FoiDocumentsBucket'],
    historicalRegressionCited: 'CloudFront → ALB origin auth header rewrite regressed once; smoke landing check catches the resulting 403',
  }],
  ['localgov-drupal', {
    landingAssertion: 'landing has a title; body does not contain "fatal error" or "accessdeniedexception"',
    loginAssertion: 'admin login at /user/login (root URL is /init-status — must strip); password output is JSON-wrapped {password,username} (must parse)',
    featureFlow: '/admin page does not contain "accessdeniedexception" or "module ... could not be enabled"',
    outputsToCheck: ['DrupalUrl', 'DrupalAdminUsername', 'DrupalAdminPassword'],
    historicalRegressionCited: 'ndx_aws_ai module bootstraps Bedrock at cache:bin construction; an AccessDeniedException at that phase tanks the whole site silently — the body probe catches it; see memory:fixmystreet-lessons cousin in localgov-drupal',
  }],
  ['localgov-ims', {
    landingAssertion: 'admin + payment portal URLs return on their respective hostnames',
    loginAssertion: 'admin credentials available; password is NOT the literal "{{resolve:...}}" token',
    featureFlow: 'AdminPassword Lambda-custom-resource returned a real string, not the unresolved Secrets Manager reference',
    outputsToCheck: ['LocalgovImsAdminPortalUrl', 'LocalgovImsPaymentPortalUrl', 'LocalgovImsAdminUsername', 'LocalgovImsAdminPassword'],
    historicalRegressionCited: 'Lambda-custom-resource that resolves the AdminPassword secret regressed once and returned the literal "{{resolve:...}}" token as the password',
  }],
  ['minute', {
    landingAssertion: 'MinuteLoginUrl ?key=... 302s to a clean URL (CF Function consumed the magic-link token); landing has /Minute/i title',
    loginAssertion: 'magic-link cookie flow (not basic-auth — basic-auth broke fetch() and was replaced in 6387441)',
    featureFlow: 'in-page fetch() to /health succeeds (basic-auth would have broken this); ALB /api/* rule does not intercept the frontend middleware passthrough',
    outputsToCheck: ['MinuteUrl', 'MinuteLoginUrl', 'MinuteAuthToken'],
    historicalRegressionCited: 'commit 6387441 replaced basic-auth with magic-link + cookie because browsers (esp. corporate-managed Chromium) suppress the basic-auth dialog and strip URL-embedded credentials',
  }],
  ['paperless-ngx', {
    landingAssertion: 'Angular login form renders (placeholder-labelled Username/Password inputs)',
    loginAssertion: 'admin login completes; selectors match `input[type="text"]` / `input[type="password"]` (Angular form omits `name` attr)',
    featureFlow: '/api/documents/?page=1 returns < 500 (S3 Files mount or Postgres regression would 500)',
    outputsToCheck: ['PaperlessNgxUrl', 'PaperlessNgxAdminUsername', 'PaperlessNgxAdminPassword'],
    historicalRegressionCited: 'S3 Files FS pending-export deadlock surfaced as 500s on /api/documents/; smoke probes the API directly to catch regression of the mount/Postgres state',
  }],
  ['planning-ai', {
    landingAssertion: 'public AnalyzerURL responds < 500',
    loginAssertion: 'n/a (public)',
    featureFlow: 'landing page reachable; analyzer accepts an upload form',
    outputsToCheck: ['AnalyzerURL', 'DocumentsBucket'],
    historicalRegressionCited: 'Bedrock model-id env propagation regressed once and surfaced as a 500 at first form submission; landing probe catches the deploy-time variant',
  }],
  ['planx', {
    landingAssertion: 'landing renders; body does not contain "permission denied for this domain" (domain allowlist regression) or "airbrake" (Airbrake on prod regression)',
    loginAssertion: 'admin login at PlanXLoginUrl; URL navigates away from auth path',
    featureFlow: 'landing reachable post-login; Hasura /v1/version responds < 500 (Caddy-elimination regression would route /hasura paths back to Caddy)',
    outputsToCheck: ['PlanXUrl', 'PlanXLoginUrl', 'PlanXDemoUsername', 'PlanXDemoPassword'],
    historicalRegressionCited: 'env-var assertion regression on prod surfaced as "permission denied for this domain"; Caddy elimination + Hasura native path regression surfaced as /v1/version 502; see memory:planx-scenario-lessons',
  }],
  ['quicksight-dashboard', {
    landingAssertion: 'DashboardUrl is reachable (HEAD) and host matches the embed domain',
    loginAssertion: 'n/a (QuickSight embed)',
    featureFlow: 'DashboardId resolves; data-source backed by the canned data bucket',
    outputsToCheck: ['DashboardUrl', 'DataBucket'],
    historicalRegressionCited: 'QuickSight setup Lambda race created the data source before the seed Lambda populated the bucket, yielding an empty dashboard',
  }],
  ['simply-readable', {
    landingAssertion: 'AppUrl renders the Simply Readable Angular shell',
    loginAssertion: 'Cognito-backed admin login',
    featureFlow: 'AppSync endpoint reachable; translation + readable content buckets exist',
    outputsToCheck: ['AppUrl', 'AdminUsername', 'AdminPassword', 'AppSyncEndpoint'],
    historicalRegressionCited: 'serverAccessLoggingBucket non-empty on teardown blocked stack delete and corrupted next deploy; see memory:simply-readable-lessons',
  }],
  ['smart-car-park', {
    landingAssertion: 'DashboardURL renders the carpark visualisation',
    loginAssertion: 'n/a (public dashboard)',
    featureFlow: 'SensorReadingsTable populated by simulator Lambda',
    outputsToCheck: ['DashboardURL', 'SensorReadingsTable'],
    historicalRegressionCited: 'simulator Lambda IAM regression caused empty SensorReadingsTable while dashboard still loaded; smoke checks output presence',
  }],
  ['text-to-speech', {
    landingAssertion: 'public ConvertURL responds < 500',
    loginAssertion: 'n/a (public)',
    featureFlow: 'audio bucket exists; Polly invocation reachable via the convert endpoint',
    outputsToCheck: ['ConvertURL', 'AudioBucket'],
    historicalRegressionCited: 'Polly voice-id misconfiguration regressed once and surfaced as a 500 at first convert request; landing probe catches the deploy-time variant',
  }],
]);
