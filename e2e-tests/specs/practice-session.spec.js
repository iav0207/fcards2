const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');
const SetupScreen = require('../page-objects/SetupScreen');
const PracticeScreen = require('../page-objects/PracticeScreen');

test.describe('Simple Setup Screen Tests', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;
  let practiceScreen;

  test.beforeEach(async () => {
    // Launch the Electron app
    ({ electronApp, window } = await launchApp());

    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    practiceScreen = new PracticeScreen(window);

    // Navigate to the practice setup screen
    await homePage.navigateToPractice();

    // Wait a bit for transition
    await window.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    // Close the Electron app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('setup screen has language selection options', async () => {
    // Check if source language selector is present
    const hasSourceLanguage = await setupScreen.isElementVisible(setupScreen.selectors.sourceLanguage);
    expect(hasSourceLanguage).toBeTruthy();

    // Check if target language selector is present
    const hasTargetLanguage = await setupScreen.isElementVisible(setupScreen.selectors.targetLanguage);
    expect(hasTargetLanguage).toBeTruthy();

    // Check if card count selector is present
    const hasCardCount = await setupScreen.isElementVisible(setupScreen.selectors.cardCount);
    expect(hasCardCount).toBeTruthy();
  });

  test('can navigate back to home screen', async () => {
    // Navigate back to home
    await setupScreen.navigateBackToHome();

    // Wait a bit for transition
    await window.waitForTimeout(1000);

    // Verify we're back at home
    const isHomeLoaded = await homePage.isLoaded();
    expect(isHomeLoaded).toBeTruthy();
  });
});