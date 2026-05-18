import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'minute',
  outputs: ['MinuteUrl', 'MinuteLoginUrl', 'MinuteAuthToken'],
  test: async ({ browser, get, getSecret }) => {
    const minuteUrl = get('MinuteUrl');
    // MinuteLoginUrl carries the magic-link token in its query string; sensitive.
    const loginUrl = getSecret('MinuteLoginUrl');

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      const resp = await page.goto(loginUrl.sensitiveValue(), { waitUntil: 'domcontentloaded' });
      expect(resp?.status() ?? 0).toBeLessThan(400);
      // CF Function should consume the token and 302 to a clean URL.
      expect(page.url()).not.toContain('key=');
      await expect(page).toHaveTitle(/Minute/i);

      // Magic-link cookie path replaced basic-auth (which broke fetch()) on commit 6387441.
      const selfFetchStatus = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/health', { credentials: 'same-origin' });
          return r.status;
        } catch {
          return -1;
        }
      });
      expect(selfFetchStatus).not.toBe(-1);

      // ALB /api/* rule must not intercept; frontend middleware passes through.
      const apiResp = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/api/proxy/healthcheck', { credentials: 'same-origin' });
          return r.status;
        } catch {
          return -1;
        }
      });
      expect(apiResp).toBeGreaterThan(0);
      expect(apiResp).toBeLessThan(500);

      // Landing page shows the AI transcription service copy + a "New meeting"
      // entry point. A regression of the SPA build pipeline (or the proxy
      // misroute we already test above) shows up here as the wrong content.
      await expect(page.locator('body')).toContainText(/AI transcription and drafting service/i);
      await expect(page.locator('a:has-text("New meeting"), a[href$="/new"]').first()).toBeVisible();

      // Templates page lists the seeded Document + Form template types. The
      // SPA loads these from its API server; a 5xx on /api/templates would
      // leave the page blank.
      await page.goto(`${minuteUrl}/templates`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toContainText(/Document/i);
      await expect(page.locator('body')).toContainText(/Form/i);
      const templateLinks = await page.locator('a[href^="/templates/"]').count();
      expect(templateLinks, 'templates page rendered no template entries — backend API regression').toBeGreaterThanOrEqual(2);
    } finally {
      await context.close();
    }

    expect(minuteUrl).toMatch(/^https:\/\//);
  },
});
