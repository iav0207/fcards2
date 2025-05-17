const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');

test.describe('Application Startup', () => {
  let electronApp;
  let window;
  let homePage;

  test.beforeEach(async () => {
    // Launch the Electron app (use headless mode)
    ({ electronApp, window } = await launchApp(true));

    // Initialize the home page object
    homePage = new HomePage(window);
  });

  test.afterEach(async () => {
    // Close the Electron app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('application launches successfully', async () => {
    // Check if the home page is loaded
    const isHomePageLoaded = await homePage.isLoaded();
    expect(isHomePageLoaded).toBeTruthy();
  });

  test('application displays the correct title', async () => {
    // Get the window title
    const title = await window.title();
    expect(title).toContain('FlashCards');
  });

  test('navigation buttons are visible', async () => {
    // Check if the practice button is visible
    const isPracticeButtonVisible = await homePage.isElementVisible(homePage.selectors.practiceButton);
    expect(isPracticeButtonVisible).toBeTruthy();

    // Check if the import button is visible
    const isImportButtonVisible = await homePage.isElementVisible(homePage.selectors.importButton);
    expect(isImportButtonVisible).toBeTruthy();

    // Check if the export button is visible
    const isExportButtonVisible = await homePage.isElementVisible(homePage.selectors.exportButton);
    expect(isExportButtonVisible).toBeTruthy();
  });
});