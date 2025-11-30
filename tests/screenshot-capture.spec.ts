import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Screenshot Capture Tests
 * Story 6.6: Council Chatbot Screenshot Automation Pipeline
 *
 * Captures screenshots of exploration pages at desktop (1280x800) and mobile (375x667) viewports
 * Screenshots saved to: src/assets/images/walkthroughs/{scenario}/explore/
 */

// Exploration pages to capture for council-chatbot
const explorationPages = [
  {
    path: '/walkthroughs/council-chatbot/explore/',
    name: 'landing',
    description: 'Exploration landing page'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/experiments/',
    name: 'experiments',
    description: 'What Can I Change experiments page'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/architecture/',
    name: 'architecture',
    description: 'How Does It Work architecture tour'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/limits/',
    name: 'limits',
    description: 'Test the Limits boundary challenges'
  },
  {
    path: '/walkthroughs/council-chatbot/explore/production/',
    name: 'production',
    description: 'Take It Further production guidance'
  }
];

test.describe('Council Chatbot Exploration Screenshots', () => {
  const screenshotDir = 'src/assets/images/walkthroughs/council-chatbot/explore';

  test.beforeAll(() => {
    // Ensure screenshot directory exists
    const dir = path.resolve(screenshotDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  for (const page of explorationPages) {
    test(`Capture ${page.name} page`, async ({ page: browserPage }, testInfo) => {
      await browserPage.goto(page.path);

      // Wait for page to be fully loaded
      await browserPage.waitForLoadState('networkidle');

      // Determine viewport suffix based on project
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      // Capture screenshot
      const screenshotPath = path.join(
        screenshotDir,
        `${page.name}-${viewport}.png`
      );

      await browserPage.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled'
      });

      // Verify screenshot was created
      expect(fs.existsSync(screenshotPath)).toBe(true);

      // Verify file size under 500KB
      const stats = fs.statSync(screenshotPath);
      const fileSizeKB = stats.size / 1024;
      expect(fileSizeKB).toBeLessThan(500);

      console.log(`Captured: ${screenshotPath} (${fileSizeKB.toFixed(1)}KB)`);
    });
  }
});

// Capture specific interactive states
test.describe('Interactive State Screenshots', () => {
  const screenshotDir = 'src/assets/images/walkthroughs/council-chatbot/explore';

  test('Capture experiments with expanded card', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/experiments/');
    await page.waitForLoadState('networkidle');

    // Click first experiment to show expanded state
    const firstExperiment = page.locator('.ndx-experiment-card').first();
    if (await firstExperiment.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await page.screenshot({
        path: path.join(screenshotDir, `experiments-expanded-${viewport}.png`),
        fullPage: false, // Just viewport for interaction states
        animations: 'disabled'
      });
    }
  });

  test('Capture architecture visual tour tab', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/architecture/');
    await page.waitForLoadState('networkidle');

    const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

    // Capture visual tour tab (default)
    await page.screenshot({
      path: path.join(screenshotDir, `architecture-visual-${viewport}.png`),
      fullPage: true,
      animations: 'disabled'
    });

    // Switch to console tour tab if available
    const consoleTourTab = page.locator('[href="#console-tour"]');
    if (await consoleTourTab.isVisible()) {
      await consoleTourTab.click();
      await page.waitForTimeout(500); // Wait for tab transition

      await page.screenshot({
        path: path.join(screenshotDir, `architecture-console-${viewport}.png`),
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Capture limits with sample text', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/limits/');
    await page.waitForLoadState('networkidle');

    const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

    // Find and scroll to first challenge
    const firstChallenge = page.locator('.ndx-limit-challenge').first();
    if (await firstChallenge.isVisible()) {
      await firstChallenge.scrollIntoViewIfNeeded();

      await page.screenshot({
        path: path.join(screenshotDir, `limits-challenge-${viewport}.png`),
        fullPage: false,
        animations: 'disabled'
      });
    }
  });

  test('Capture production decision tree', async ({ page }, testInfo) => {
    await page.goto('/walkthroughs/council-chatbot/explore/production/');
    await page.waitForLoadState('networkidle');

    const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

    // Scroll to decision tree
    const decisionTree = page.locator('.ndx-decision-tree');
    if (await decisionTree.isVisible()) {
      await decisionTree.scrollIntoViewIfNeeded();

      await page.screenshot({
        path: path.join(screenshotDir, `production-decision-${viewport}.png`),
        fullPage: false,
        animations: 'disabled'
      });
    }
  });
});
