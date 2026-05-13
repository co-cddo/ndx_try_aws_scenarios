import { defineConfig, devices } from '@playwright/test';

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
      testDir: './tests',
      testMatch: /.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      testDir: './tests',
      testMatch: /.*\.spec\.ts$/,
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'smoke',
      testDir: './cloudformation/scenarios',
      testMatch: /[^/]+\/smoke\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

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

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
    },
  },
});
