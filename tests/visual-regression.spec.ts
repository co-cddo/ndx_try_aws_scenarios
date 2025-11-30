import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Story 6.6: Council Chatbot Screenshot Automation Pipeline
 *
 * Compares current screenshots against baseline
 * Flags changes >10% as potential regressions
 */

// Exploration pages to test for visual regression
const explorationPages = [
  {
    path: '/walkthroughs/council-chatbot/explore/',
    name: 'landing'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/experiments/',
    name: 'experiments'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/architecture/',
    name: 'architecture'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/limits/',
    name: 'limits'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/production/',
    name: 'production'
  }
];

test.describe('Council Chatbot Visual Regression', () => {
  for (const pageConfig of explorationPages) {
    test(`Visual regression: ${pageConfig.name}`, async ({ page }, testInfo) => {
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');

      // Wait a bit for any animations to complete
      await page.waitForTimeout(500);

      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      // Compare against baseline screenshot
      // maxDiffPixelRatio: 0.1 means 10% threshold
      await expect(page).toHaveScreenshot(
        `${pageConfig.name}-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          fullPage: true,
          animations: 'disabled'
        }
      );
    });
  }
});

test.describe('Component Visual Regression', () => {
  test('Visual regression: activity cards', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/');
    await page.waitForLoadState('networkidle');

    const activityCard = page.locator('.ndx-activity-card').first();
    if (await activityCard.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(activityCard).toHaveScreenshot(
        `activity-card-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });

  test('Visual regression: persona toggle', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/');
    await page.waitForLoadState('networkidle');

    const personaToggle = page.locator('[data-component="persona-toggle"]');
    if (await personaToggle.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(personaToggle).toHaveScreenshot(
        `persona-toggle-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });

  test('Visual regression: safe badge', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/experiments/');
    await page.waitForLoadState('networkidle');

    const safeBadge = page.locator('.ndx-safe-badge').first();
    if (await safeBadge.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(safeBadge).toHaveScreenshot(
        `safe-badge-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });

  test('Visual regression: progress bar', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/');
    await page.waitForLoadState('networkidle');

    const progressBar = page.locator('.ndx-completion-indicator').first();
    if (await progressBar.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(progressBar).toHaveScreenshot(
        `progress-bar-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });
});

test.describe('Responsive Visual Regression', () => {
  test('Visual regression: GOV.UK header', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.govuk-header');
    if (await header.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(header).toHaveScreenshot(
        `govuk-header-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });

  test('Visual regression: navigation breadcrumbs', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/experiments/');
    await page.waitForLoadState('networkidle');

    const breadcrumbs = page.locator('.govuk-breadcrumbs');
    if (await breadcrumbs.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await expect(breadcrumbs).toHaveScreenshot(
        `breadcrumbs-${viewport}.png`,
        {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled'
        }
      );
    }
  });
});
