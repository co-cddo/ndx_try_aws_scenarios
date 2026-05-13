// Fills a credential input and rewrites the form-encoded POST body so the
// Playwright trace records REDACTED-<hash> instead of the cleartext value.
// Only handles application/x-www-form-urlencoded bodies; JSON-encoded
// credentials need a JSON-aware fixture.

import type { Page, Route, Request } from '@playwright/test';
import { createHash } from 'crypto';

export interface FillPasswordOptions {
  readonly submitUrlContains?: string;
  readonly fieldNames?: ReadonlyArray<string>;
  readonly timeoutMs?: number;
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
