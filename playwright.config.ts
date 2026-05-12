import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NDX:Try AWS Scenarios.
 * - desktop / mobile: screenshot capture + visual regression of the portal
 *   site (run against http-server _site on localhost:8080).
 * - smoke: scenario-regression smoke pack against a deployed all-demo in the
 *   smoke-test AWS account. Resolves URLs at test-time from CFN outputs;
 *   does not consume baseURL or webServer.
 */
const isSmoke = process.env.PLAYWRIGHT_SUITE === 'smoke';

export default defineConfig({
  testDir: './tests',
  fullyParallel: !process.env.CI && !isSmoke,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: isSmoke ? undefined : (process.env.BASE_URL || 'http://localhost:8080'),
    trace: isSmoke ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      testMatch: /tests\/(?!smoke\/).*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      testMatch: /tests\/(?!smoke\/).*\.spec\.ts$/,
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'smoke',
      testMatch: /tests\/smoke\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

  // The portal-site webServer is only relevant for the desktop/mobile suites.
  // Smoke does not need it (and starting it on a CI smoke run is wasteful).
  ...(isSmoke
    ? {}
    : {
        webServer: {
          command: 'npx http-server _site -p 8080',
          url: 'http://localhost:8080',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        },
      }),

  // Screenshot specific settings (portal site only; smoke uses default expect).
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1, // 10% diff threshold
    },
  },
});
