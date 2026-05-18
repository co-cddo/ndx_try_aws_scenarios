import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'localgov-drupal',
  outputs: ['DrupalUrl', 'DrupalAdminUsername', 'DrupalAdminPassword'],
  test: async ({ page, get, getSecret }) => {
    const landing = get('DrupalUrl');
    // DrupalUrl ends with `/init-status`; the smoke target is the site root.
    const root = landing.replace(/\/init-status\/?$/, '').replace(/\/$/, '');

    await page.goto(root, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/.+/);
    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('fatal error');
    // ndx_aws_ai bootstraps Bedrock at cache:bin construction; AccessDenied here = regressed model access.
    expect(html).not.toContain('accessdeniedexception');

    // DrupalAdminPassword output is JSON-wrapped: `{"password":"...","username":"..."}`.
    const adminPasswordRaw = getSecret('DrupalAdminPassword').sensitiveValue();
    const adminPasswordParsed = (() => {
      try { return JSON.parse(adminPasswordRaw).password as string; } catch { return adminPasswordRaw; }
    })();

    await adminLogin(page, {
      url: `${root}/user/login`,
      username: get('DrupalAdminUsername'),
      password: {
        kind: 'sensitive',
        length: adminPasswordParsed.length,
        sensitiveValue: () => adminPasswordParsed,
      },
      usernameSelector: 'input[name="name"]',
      passwordSelector: 'input[name="pass"]',
      passwordFieldNames: ['pass', 'password'],
    });

    await page.goto(`${root}/admin`, { waitUntil: 'domcontentloaded' });
    const adminBody = (await page.content()).toLowerCase();
    expect(adminBody).not.toContain('accessdeniedexception');
    expect(adminBody).not.toMatch(/module .* could not be enabled/);

    // ndx_aws_ai is the Bedrock-backed module that powers the AI assistance
    // widget across the site. Verify it's installed AND enabled on the
    // Extend page. The previous regression silently disabled it after a
    // Bedrock IAM change; the site continued to render but AI features
    // returned empty content.
    await page.goto(`${root}/admin/modules`, { waitUntil: 'domcontentloaded' });
    const ndxAwsAi = await page.locator('input[name="modules[ndx_aws_ai][enable]"]').isChecked();
    expect(ndxAwsAi, 'ndx_aws_ai module disabled — Bedrock IAM regression candidate').toBe(true);
    // Sister modules from the same install should all be enabled too.
    const ndxCouncilGen = await page.locator('input[name="modules[ndx_council_generator][enable]"]').isChecked();
    expect(ndxCouncilGen, 'ndx_council_generator module disabled — depends on ndx_aws_ai').toBe(true);

    // Content listing: seeded demo content should populate the admin content
    // view. An empty listing here points at the demo-content install step or
    // the LocalGov content type registration.
    await page.goto(`${root}/admin/content`, { waitUntil: 'domcontentloaded' });
    const contentRows = await page.locator('table tbody tr a[href^="/node/"], table tbody tr a[href*="/edit"]').count();
    expect(contentRows, '/admin/content has no rows — demo content not installed').toBeGreaterThan(0);
  },
});
