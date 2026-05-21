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
      // Per-scenario smoke specs run by the ephemeral-lease CI workflow.
      // Each scenario's CI sets SMOKE_STACK_NAME=ndx-try-<scenario> and
      // PLAYWRIGHT_SUITE=smoke (skips the local webServer/baseURL block).
      name: 'smoke',
      testDir: './cloudformation/scenarios',
      testMatch: /[^/]+\/smoke\.ts$/,
      // 60s test budget: secure-form fillPassword burns ~10s waiting for a
      // (never-arrives) intercepted submit, multi-stage logins use multiple
      // page.goto/waitForURL cycles, and fresh stacks have cold-cache latency.
      timeout: 60_000,
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
