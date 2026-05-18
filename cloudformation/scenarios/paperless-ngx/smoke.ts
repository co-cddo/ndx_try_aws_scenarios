import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'paperless-ngx',
  outputs: ['PaperlessNgxUrl', 'PaperlessNgxAdminUsername', 'PaperlessNgxAdminPassword'],
  outputAliases: {
    PaperlessNgxUrl: 'PaperlessUrl',
    PaperlessNgxAdminUsername: 'AdminUsername',
    PaperlessNgxAdminPassword: 'AdminPassword',
  },
  test: async ({ page, get, getSecret }) => {
    const landing = get('PaperlessNgxUrl');
    const root = landing.replace(/\/$/, '');

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    // Paperless-NGX (Angular) form labels inputs by placeholder; name= may not be set.
    await page.waitForSelector('input[type="text"], input[name="username"], input#username', { timeout: 30_000 });

    await adminLogin(page, {
      url: page.url(),
      username: get('PaperlessNgxAdminUsername'),
      password: getSecret('PaperlessNgxAdminPassword'),
      usernameSelector: 'input[type="text"], input[name="username"], input#username',
      passwordSelector: 'input[type="password"], input[name="password"], input#password',
    });

    // /api/documents/ 500 = S3 Files mount or Postgres regressed. Parse the
    // response: a healthy seeded instance has > 30 documents, each with OCR
    // content. Empty count = post-consume hook didn't run; empty content
    // on a non-empty list = OCR pipeline regressed silently.
    await page.goto(`${root}/documents`, { waitUntil: 'domcontentloaded' });
    type ListResponse = {
      count: number;
      results: Array<{ id: number; title: string; content: string; notes: Array<{ note: string }> }>;
    };
    const listResp = await page.evaluate(async () => {
      try {
        const r = await fetch(window.location.origin + '/api/documents/?page=1', {
          credentials: 'same-origin',
        });
        return { status: r.status, body: r.status === 200 ? await r.json() : null };
      } catch (e) {
        return { status: -1, body: null, error: String(e) };
      }
    }) as { status: number; body: ListResponse | null };

    expect(listResp.status).toBeGreaterThan(0);
    expect(listResp.status, '/api/documents/ returned 5xx — S3 Files mount or Postgres regression').toBeLessThan(500);
    expect(listResp.body, '/api/documents/ returned non-200 — auth or API regression').not.toBeNull();
    const list = listResp.body as ListResponse;
    expect(list.count, 'paperless has zero documents — seed regression or post-consume failure').toBeGreaterThan(0);

    const first = list.results[0];
    expect(first, '/api/documents/ returned empty results array despite count > 0').toBeDefined();
    expect(first.content.length, `first document "${first.title}" has no OCR content — OCR pipeline regression`).toBeGreaterThan(50);
    // AI summary note is written by the post-consume Bedrock hook. Missing
    // note on every seeded doc = Bedrock/Lambda hook regression (silent —
    // documents would still appear, just without AI enrichment).
    const hasAiNote = list.results.some((d) => d.notes.some((n) => /AI summary/i.test(n.note)));
    expect(hasAiNote, 'no seeded document has an "AI summary" note — Bedrock post-consume hook regression').toBe(true);
  },
});
