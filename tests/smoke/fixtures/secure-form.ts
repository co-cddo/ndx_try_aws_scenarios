/**
 * Smoke-pack secure-form helper.
 *
 * Wraps Playwright's page.fill() for credential-entry sites so the resulting
 * Playwright trace records a redacted form body instead of the cleartext
 * password.
 *
 * Phase 3 of the scenario-regression smoke-pack tech-spec.
 *
 * Mechanism (registered BEFORE the fill happens, removed after):
 *   1. Register a page.route handler that matches the next POST to the
 *      form-submission URL.
 *   2. In the handler, parse the request body, rewrite the configured
 *      sensitive field's value to REDACTED-<hash>, and call continue() with
 *      the rewritten body. The Playwright trace records the request body
 *      AFTER our continue(), so the redacted body is what gets stored.
 *   3. Call page.fill(selector, value).
 *   4. Wait for the rewritten request to be observed, then remove the route.
 *
 * Test authors MUST use fillPassword instead of page.fill() for any input
 * whose value is a credential. A grep-based lint in smoke.yml enforces this
 * by flagging raw page.fill calls against type=password selectors.
 */

import type { Page, Route, Request } from '@playwright/test';
import { createHash } from 'crypto';

export interface FillPasswordOptions {
  /**
   * The form-submission URL we expect to capture. The route handler matches
   * the next POST to a URL whose hostname+path contains this string. Default:
   * '**' (match any POST).
   */
  readonly submitUrlContains?: string;
  /**
   * Form-encoded field name(s) to redact. Default ['password', 'pwd'].
   * Add scenario-specific names where applicable.
   */
  readonly fieldNames?: ReadonlyArray<string>;
  /**
   * Timeout (ms) for waiting on the rewritten request before giving up and
   * removing the route handler. Default 10_000.
   */
  readonly timeoutMs?: number;
}

const DEFAULT_FIELDS = ['password', 'pwd'] as const;

/**
 * Fill an input and ensure that any next POST containing the cleartext value
 * in a form-encoded body has that value redacted in the recorded trace.
 *
 * Note: this approach only redacts URL-encoded form bodies. JSON bodies are
 * NOT redacted by this helper; scenarios that POST JSON-encoded credentials
 * must use a JSON-aware redaction path (file a Phase-4-onwards follow-up
 * issue for that case and use page.fill in the interim only inside a
 * deliberately-trace-disabled fixture).
 */
export async function fillPassword(
  page: Page,
  selector: string,
  value: string,
  opts: FillPasswordOptions = {},
): Promise<void> {
  const submitUrlContains = opts.submitUrlContains ?? '';
  const fieldNames = opts.fieldNames ?? DEFAULT_FIELDS;
  const timeoutMs = opts.timeoutMs ?? 10_000;

  const redactedFor = (raw: string): string =>
    `REDACTED-${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;

  let consumed = false;

  const routeHandler = async (route: Route, req: Request): Promise<void> => {
    // Pass-through anything that isn't the credential-bearing POST.
    if (req.method() !== 'POST') return route.continue();
    if (submitUrlContains && !req.url().includes(submitUrlContains)) {
      return route.continue();
    }
    const ct = req.headers()['content-type'] ?? '';
    const body = req.postData() ?? '';
    if (!ct.includes('application/x-www-form-urlencoded') || !body) {
      return route.continue();
    }
    const params = new URLSearchParams(body);
    let touched = false;
    for (const field of fieldNames) {
      if (params.has(field)) {
        const raw = params.get(field) ?? '';
        params.set(field, redactedFor(raw));
        touched = true;
      }
    }
    if (!touched) return route.continue();
    consumed = true;
    await route.continue({ postData: params.toString() });
  };

  await page.route('**/*', routeHandler);
  try {
    await page.fill(selector, value);
    const deadline = Date.now() + timeoutMs;
    while (!consumed && Date.now() < deadline) {
      await page.waitForTimeout(50);
    }
  } finally {
    await page.unroute('**/*', routeHandler);
  }
}
