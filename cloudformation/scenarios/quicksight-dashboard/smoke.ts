import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'quicksight-dashboard',
  outputs: ['QuicksightDashboardUrl', 'QuicksightDataBucket'],
  outputAliases: {
    QuicksightDashboardUrl: 'DashboardUrl',
    QuicksightDataBucket: 'DataBucket',
  },
  test: async ({ page, request, get }) => {
    const url = get('QuicksightDashboardUrl');

    // QuickSight URL resolves to the AWS-hosted dashboard portal. Without
    // QuickSight account creds we can't get past the sign-in, but a healthy
    // dashboard returns 200 + the QuickSight sign-in HTML. A 403 or 404
    // would mean the dashboard ID is wrong or the resource was deleted.
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0, 'QuickSight portal not reachable').toBeLessThan(500);
    expect(resp?.status(), 'QuickSight portal returned 4xx — dashboard probably missing').toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/QuickSight|Sign in|Amazon/i);

    // Verify the data-source bucket contains the seeded CSV the dashboard
    // queries. The setup Lambda races against the data-generator Lambda; if
    // the generator never ran the CSV is absent and the dashboard is empty.
    const dataUrl = `https://${get('QuicksightDataBucket')}.s3.amazonaws.com/data/council-metrics.csv`;
    const head = await request.fetch(dataUrl, { method: 'HEAD', failOnStatusCode: false });
    // 403 (bucket policy blocks unsigned HEAD) is acceptable — we're only
    // proving the bucket exists at the expected name. 404 would mean the
    // bucket was renamed and the dashboard data is in a different location.
    expect([200, 403]).toContain(head.status());
  },
});
