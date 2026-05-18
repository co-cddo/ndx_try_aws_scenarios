import type { Page } from '@playwright/test';
import type { SensitiveValue } from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';

export interface AdminLoginOptions {
  url: string;
  username: string;
  password: SensitiveValue;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  awayFrom?: string | RegExp;
  passwordFieldNames?: ReadonlyArray<string>;
  timeoutMs?: number;
}

// Submits a username/password form and waits for the URL to navigate away
// from `awayFrom` (default: anywhere containing "login"). Selectors fall
// back to commonly-used names; pass overrides for non-standard forms.
export async function adminLogin(page: Page, opts: AdminLoginOptions): Promise<void> {
  const {
    url,
    username,
    password,
    usernameSelector = 'input[name="username"], input#username',
    passwordSelector = 'input[name="password"], input#password',
    submitSelector = 'button[type="submit"], input[type="submit"]',
    awayFrom = 'login',
    passwordFieldNames,
    timeoutMs = 30_000,
  } = opts;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator(usernameSelector).first().fill(username);
  await fillPassword(
    page,
    passwordSelector,
    password.sensitiveValue(),
    passwordFieldNames ? { fieldNames: passwordFieldNames } : undefined,
  );
  await Promise.all([
    page.waitForURL(
      (u) => {
        const s = u.toString();
        return typeof awayFrom === 'string'
          ? !s.toLowerCase().includes(awayFrom)
          : !awayFrom.test(s);
      },
      { timeout: timeoutMs },
    ),
    page.locator(submitSelector).first().click(),
  ]);
}
