// Fills a credential input. Arms a route handler that rewrites the form-encoded
// POST body so the Playwright trace records REDACTED-<hash> instead of the
// cleartext value. Only handles application/x-www-form-urlencoded; JSON
// credential submits would need a JSON-aware fixture.
//
// The route handler stays armed for the rest of the page lifecycle: smoke
// specs do `fillPassword(...)` then `Promise.all([waitForURL, click])`. The
// submit POST is intercepted by the closure; we accept the small surface of
// any later form-urlencoded POST also being rewritten because no smoke spec
// makes additional credentialed POSTs after login.

import type { Page, Route, Request } from '@playwright/test';
import { createHash } from 'crypto';

export interface FillPasswordOptions {
  readonly submitUrlContains?: string;
  readonly fieldNames?: ReadonlyArray<string>;
}

const DEFAULT_FIELDS = ['password', 'pwd'] as const;

export async function fillPassword(
  page: Page,
  selector: string,
  value: string,
  opts: FillPasswordOptions = {},
): Promise<void> {
  const submitUrlContains = opts.submitUrlContains ?? '';
  const fieldNames = opts.fieldNames ?? DEFAULT_FIELDS;

  const redactedFor = (raw: string): string =>
    `REDACTED-${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;

  const routeHandler = async (route: Route, req: Request): Promise<void> => {
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
        params.set(field, redactedFor(params.get(field) ?? ''));
        touched = true;
      }
    }
    if (!touched) return route.continue();
    await route.continue({ postData: params.toString() });
  };

  await page.route('**/*', routeHandler);
  await page.fill(selector, value);
}
