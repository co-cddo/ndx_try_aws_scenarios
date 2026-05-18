// Fills a credential input. Currently a thin wrapper around `page.fill` —
// the historical purpose of this helper was to intercept the credential POST
// and rewrite it to "REDACTED-<hash>" in the Playwright trace, but Playwright's
// route.continue() actually modifies the request that reaches the server, which
// breaks the login. We keep the helper (and the SensitiveValue type) so that
// callers must explicitly call `.sensitiveValue()` to extract the raw secret,
// preserving the type-level guarantee that secrets aren't accidentally
// stringified into logs or assertions.

import type { Page } from '@playwright/test';

export interface FillPasswordOptions {
  readonly fieldNames?: ReadonlyArray<string>;
}

export async function fillPassword(
  page: Page,
  selector: string,
  value: string,
  _opts: FillPasswordOptions = {},
): Promise<void> {
  await page.fill(selector, value);
}
