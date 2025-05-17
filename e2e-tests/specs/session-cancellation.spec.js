const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');
const SetupScreen = require('../page-objects/SetupScreen');
const PracticeScreen = require('../page-objects/PracticeScreen');

test.describe('Session Cancellation', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;
  let practiceScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    practiceScreen = new PracticeScreen(window);
    
    // Create a sample card for testing
    await window.evaluate(() => {
      window.flashcards.saveFlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A basic greeting',
        userTranslation: 'Hola',
        tags: ['test']
      });
    });
    
    // Navigate to practice setup screen
    await homePage.navigateToPractice();
    await window.waitForTimeout(1000);
    
    // Set up and start a practice session
    await setupScreen.selectLanguage('source', 'en');
    await setupScreen.selectLanguage('target', 'es');
    await setupScreen.setCardCount(5);
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(1000);
    
    // Verify we're in the practice screen
    const isPracticeLoaded = await practiceScreen.isLoaded();
    expect(isPracticeLoaded).toBeTruthy();
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should cancel session and return to home', async () => {
    // Mock the confirm dialog to return true (user confirms cancellation)
    await window.evaluate(() => {
      window.confirm = () => true;
    });
    
    // Click the cancel button
    await practiceScreen.clickElement(practiceScreen.selectors.cancelButton);
    await window.waitForTimeout(1000);
    
    // Verify we're back at the home screen
    const isHomeLoaded = await homePage.isLoaded();
    expect(isHomeLoaded).toBeTruthy();
    
    // Check for notification about cancelled session
    const notification = await window.$('.notification.info');
    expect(notification).toBeTruthy();
    
    const notificationText = await notification.textContent();
    expect(notificationText).toContain('Session Cancelled');
  });

  test('should stay in practice screen if cancellation is not confirmed', async () => {
    // Mock the confirm dialog to return false (user cancels the cancellation)
    await window.evaluate(() => {
      window.confirm = () => false;
    });
    
    // Click the cancel button
    await practiceScreen.clickElement(practiceScreen.selectors.cancelButton);
    await window.waitForTimeout(1000);
    
    // Verify we're still in the practice screen
    const isPracticeLoaded = await practiceScreen.isLoaded();
    expect(isPracticeLoaded).toBeTruthy();
  });
});