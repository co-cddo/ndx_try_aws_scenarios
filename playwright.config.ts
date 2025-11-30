import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NDX:Try AWS Scenarios
 * Used for screenshot capture and visual regression testing
 * Story 6.6: Screenshot Automation Pipeline
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  webServer: {
    command: 'npx http-server _site -p 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  // Screenshot specific settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1, // 10% diff threshold
    },
  },
});
