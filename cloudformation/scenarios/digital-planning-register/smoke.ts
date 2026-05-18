import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'digital-planning-register',
  outputs: ['DigitalPlanningRegisterUrl'],
  test: async ({ page, get }) => {
    const landing = get('DigitalPlanningRegisterUrl');
    const root = landing.replace(/\/$/, '');

    const resp = await page.goto(landing, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    const body = (await page.content()).toLowerCase();
    expect(body, 'Next.js error overlay present').not.toContain('application error');
    expect(body, 'register body missing planning markers').toMatch(/planning|register/);

    // The council selector links to per-council subdomains/paths. The smoke
    // image seeds with at least one council (`public-council-1`). A regression
    // of the council-config wiring would leave this list empty.
    const councilLinks = await page.locator('main a[href^="/public-"]').count();
    expect(councilLinks, 'no council selector links — DprCouncilConfig regression').toBeGreaterThan(0);

    // Drill into a council. Its "Recently published applications" section is
    // populated by the planning-data API; an empty list means the data pipeline
    // is broken even if the SPA renders.
    await page.goto(`${root}/public-council-1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2', { hasText: /Recently published applications/i }))
      .toBeVisible();
    const refLinks = await page.locator('a[href*="/public-council-1/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? '')
        // Exclude support paths like /help, /search; keep application refs.
        .filter((h) => /\/public-council-1\/[A-Z0-9-]+$/i.test(h) && !/\/(help|search)$/.test(h)),
    );
    expect(refLinks.length, 'council recently-published list empty — planning data pipeline regression').toBeGreaterThan(0);
  },
});
