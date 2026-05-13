import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'digital-planning-register',
  outputs: ['DigitalPlanningRegisterUrl'],
  test: async ({ page, get }) => {
    const resp = await page.goto(get('DigitalPlanningRegisterUrl'), { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    const body = (await page.content()).toLowerCase();
    expect(body, 'Next.js error overlay present').not.toContain('application error');
    expect(body, 'register body missing planning markers').toMatch(/planning|register/);
  },
});
