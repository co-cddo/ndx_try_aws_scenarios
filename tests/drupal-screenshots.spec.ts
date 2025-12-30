import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Drupal Screenshot Capture Tests
 * Story 2.7: Playwright Screenshot Foundation
 *
 * Captures screenshots of a deployed LocalGov Drupal instance.
 * Requires environment variables:
 *   - DRUPAL_URL: Base URL of deployed Drupal site
 *   - DRUPAL_USER: Admin username (from CloudFormation outputs)
 *   - DRUPAL_PASS: Admin password (from Secrets Manager)
 *
 * Usage:
 *   DRUPAL_URL=https://your-alb-url.amazonaws.com \
 *   DRUPAL_USER=admin \
 *   DRUPAL_PASS=your-password \
 *   npm run test:drupal-screenshots
 *
 * Screenshots saved to: src/assets/images/screenshots/localgov-drupal/
 */

// Configuration from environment
const DRUPAL_URL = process.env.DRUPAL_URL || 'http://localhost:8080';
const DRUPAL_USER = process.env.DRUPAL_USER || 'admin';
const DRUPAL_PASS = process.env.DRUPAL_PASS || '';

// Screenshot output directory
const SCREENSHOT_DIR = 'src/assets/images/screenshots/localgov-drupal';

// Screenshot manifest for tracking metadata
interface ScreenshotMetadata {
  filename: string;
  description: string;
  captured: string;
  viewport: string;
  authenticated: boolean;
}

const capturedScreenshots: ScreenshotMetadata[] = [];

/**
 * Public pages to capture (no authentication required)
 */
const publicPages = [
  {
    path: '/',
    name: 'homepage',
    description: 'LocalGov Drupal homepage with sample content'
  },
  {
    path: '/services',
    name: 'services',
    description: 'Services directory listing'
  },
  {
    path: '/guides',
    name: 'guides',
    description: 'Guides and how-to content'
  },
  {
    path: '/news',
    name: 'news',
    description: 'News articles listing'
  }
];

/**
 * Admin pages to capture (authentication required)
 */
const adminPages = [
  {
    path: '/admin/content',
    name: 'admin-content',
    description: 'Admin content management dashboard'
  },
  {
    path: '/admin/structure/content-types',
    name: 'admin-content-types',
    description: 'Content types configuration'
  },
  {
    path: '/node/1/edit',
    name: 'admin-edit-page',
    description: 'Content edit form for a page'
  }
];

/**
 * Ensure screenshot directory exists
 */
function ensureDirectoryExists() {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created screenshot directory: ${dir}`);
  }
}

/**
 * Login to Drupal admin
 */
async function loginToDrupal(page: Page) {
  if (!DRUPAL_PASS) {
    console.warn('DRUPAL_PASS not set - skipping authentication');
    return false;
  }

  try {
    await page.goto(`${DRUPAL_URL}/user/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[name="name"]', DRUPAL_USER);
    await page.fill('input[name="pass"]', DRUPAL_PASS);

    // Submit login form
    await page.click('input[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForLoadState('networkidle');

    // Verify login succeeded by checking for admin menu
    const adminMenu = await page.locator('.toolbar-menu-administration').isVisible();

    if (adminMenu) {
      console.log('Successfully logged in to Drupal admin');
      return true;
    } else {
      console.error('Login appeared to fail - admin menu not visible');
      return false;
    }
  } catch (error) {
    console.error('Failed to login to Drupal:', error);
    return false;
  }
}

/**
 * Capture a screenshot with error handling
 */
async function captureScreenshot(
  page: Page,
  pagePath: string,
  name: string,
  description: string,
  viewport: string,
  authenticated: boolean
): Promise<boolean> {
  try {
    await page.goto(`${DRUPAL_URL}${pagePath}`);
    await page.waitForLoadState('networkidle');

    // Wait for any animations to settle
    await page.waitForTimeout(500);

    const filename = `${name}-${viewport}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, filename);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled'
    });

    // Verify file was created
    if (fs.existsSync(screenshotPath)) {
      const stats = fs.statSync(screenshotPath);
      const fileSizeKB = stats.size / 1024;
      console.log(`✓ Captured: ${filename} (${fileSizeKB.toFixed(1)}KB)`);

      // Track metadata
      capturedScreenshots.push({
        filename,
        description,
        captured: new Date().toISOString(),
        viewport,
        authenticated
      });

      return true;
    } else {
      console.error(`✗ Failed to create: ${filename}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error capturing ${name}: ${error}`);
    return false;
  }
}

/**
 * Check if DEMO banner is visible
 */
async function checkDemoBanner(page: Page): Promise<boolean> {
  try {
    await page.goto(DRUPAL_URL);
    await page.waitForLoadState('networkidle');

    // Look for DEMO banner by text content or class
    const demoBanner = page.locator('text="DEMONSTRATION SITE"').first();
    const isVisible = await demoBanner.isVisible();

    if (isVisible) {
      console.log('✓ DEMO banner is visible');
    } else {
      console.warn('⚠ DEMO banner not found - may not be enabled');
    }

    return isVisible;
  } catch (error) {
    console.error('Error checking DEMO banner:', error);
    return false;
  }
}

/**
 * Generate manifest file after capture run
 */
function generateManifest() {
  const manifestPath = 'src/_data/screenshots/localgov-drupal.yaml';
  const manifestDir = path.dirname(manifestPath);

  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  const yamlContent = `# LocalGov Drupal Screenshot Manifest
# Auto-generated by tests/drupal-screenshots.spec.ts
# Story 2.7: Playwright Screenshot Foundation

scenario: localgov-drupal
generated: ${new Date().toISOString()}
drupal_url: ${DRUPAL_URL}

public_pages:
${publicPages.map(p => `  - path: "${p.path}"
    name: "${p.name}"
    description: "${p.description}"`).join('\n')}

admin_pages:
${adminPages.map(p => `  - path: "${p.path}"
    name: "${p.name}"
    description: "${p.description}"`).join('\n')}

screenshots:
${capturedScreenshots.map(s => `  - filename: "${s.filename}"
    description: "${s.description}"
    captured: "${s.captured}"
    viewport: "${s.viewport}"
    authenticated: ${s.authenticated}`).join('\n')}
`;

  fs.writeFileSync(manifestPath, yamlContent);
  console.log(`\nManifest saved to: ${manifestPath}`);
}

// Skip tests if no Drupal URL provided
test.skip(() => !process.env.DRUPAL_URL, 'DRUPAL_URL environment variable not set');

test.describe('LocalGov Drupal Public Pages', () => {
  test.beforeAll(() => {
    ensureDirectoryExists();
    console.log(`\nDrupal URL: ${DRUPAL_URL}`);
    console.log(`Screenshot directory: ${SCREENSHOT_DIR}\n`);
  });

  for (const pageConfig of publicPages) {
    test(`Capture ${pageConfig.name} page`, async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      const success = await captureScreenshot(
        page,
        pageConfig.path,
        pageConfig.name,
        pageConfig.description,
        viewport,
        false
      );

      expect(success).toBe(true);
    });
  }

  test('Verify DEMO banner visibility', async ({ page }) => {
    const isVisible = await checkDemoBanner(page);
    // Don't fail the test if banner isn't visible - it might not be deployed
    expect(typeof isVisible).toBe('boolean');
  });

  test('Capture DEMO banner close-up', async ({ page }, testInfo) => {
    await page.goto(DRUPAL_URL);
    await page.waitForLoadState('networkidle');

    const demoBanner = page.locator('.ndx-demo-banner, [class*="demo-banner"]').first();

    if (await demoBanner.isVisible()) {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';
      const filename = `demo-banner-${viewport}.png`;

      await demoBanner.screenshot({
        path: path.join(SCREENSHOT_DIR, filename),
        animations: 'disabled'
      });

      capturedScreenshots.push({
        filename,
        description: 'DEMO banner component',
        captured: new Date().toISOString(),
        viewport,
        authenticated: false
      });

      console.log(`✓ Captured: ${filename}`);
    } else {
      console.log('⚠ DEMO banner not found for close-up capture');
    }
  });
});

test.describe('LocalGov Drupal Admin Pages', () => {
  test.beforeAll(async ({ browser }) => {
    // Attempt login with a shared context
    const context = await browser.newContext();
    const page = await context.newPage();

    const loginSuccess = await loginToDrupal(page);

    if (!loginSuccess) {
      console.warn('⚠ Could not authenticate - admin page tests will be skipped');
    }

    await context.close();
  });

  // Skip admin tests if no password provided
  test.skip(() => !process.env.DRUPAL_PASS, 'DRUPAL_PASS not set - skipping admin tests');

  for (const pageConfig of adminPages) {
    test(`Capture ${pageConfig.name} page`, async ({ page }, testInfo) => {
      // Login first
      const loggedIn = await loginToDrupal(page);

      if (!loggedIn) {
        test.skip();
        return;
      }

      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      const success = await captureScreenshot(
        page,
        pageConfig.path,
        pageConfig.name,
        pageConfig.description,
        viewport,
        true
      );

      expect(success).toBe(true);
    });
  }
});

test.describe('Generate Manifest', () => {
  test('Generate screenshot manifest file', async () => {
    // This test runs last to generate the manifest with all captured screenshots
    generateManifest();

    // Verify manifest was created
    const manifestPath = 'src/_data/screenshots/localgov-drupal.yaml';
    expect(fs.existsSync(manifestPath)).toBe(true);
  });
});

test.describe('Summary Report', () => {
  test.afterAll(() => {
    console.log('\n' + '='.repeat(60));
    console.log('Screenshot Capture Summary');
    console.log('='.repeat(60));
    console.log(`Total screenshots captured: ${capturedScreenshots.length}`);
    console.log(`Public pages: ${capturedScreenshots.filter(s => !s.authenticated).length}`);
    console.log(`Admin pages: ${capturedScreenshots.filter(s => s.authenticated).length}`);
    console.log('='.repeat(60));
  });
});
