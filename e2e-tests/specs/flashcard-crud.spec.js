const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');

test.describe('Basic Application Tests', () => {
  let electronApp;
  let window;
  let homePage;

  test.beforeEach(async () => {
    // Launch the Electron app
    ({ electronApp, window } = await launchApp());

    // Initialize page objects
    homePage = new HomePage(window);
  });

  test.afterEach(async () => {
    // Close the Electron app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should display database statistics', async () => {
    // Get database statistics
    const stats = await homePage.getDatabaseStats();

    // Verify statistics are displayed
    expect(stats.flashcardCount).toBeDefined();
    expect(stats.sessionsCount).toBeDefined();
    expect(stats.activeSessionsCount).toBeDefined();
    expect(stats.completedSessionsCount).toBeDefined();
  });

  test('should navigate to practice setup screen', async () => {
    // Navigate to practice setup
    await homePage.navigateToPractice();

    // Wait for a second for transition
    await window.waitForTimeout(1000);

    // Verify screen switched (by checking title)
    const title = await window.$eval('#setup-screen h2', el => el.textContent);
    expect(title).toContain('Practice Session Setup');
  });

  test('should navigate to import screen', async () => {
    // Navigate to import screen
    await homePage.navigateToImport();

    // Wait for a second for transition
    await window.waitForTimeout(1000);

    // Verify screen switched (by checking title)
    const title = await window.$eval('#import-screen h2', el => el.textContent);
    expect(title).toContain('Import Data');
  });
});