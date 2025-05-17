const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e-tests/specs',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  reporter: process.env.HTML_REPORT ? [
    ['html'],
    ['list']
  ] : [
    ['list']
  ],
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true, // Run in headless mode by default
  },
  projects: [
    {
      name: 'electron',
      use: {
        // No browsers needed for Electron testing
      },
    }
  ],
});