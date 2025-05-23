const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');
const SetupScreen = require('../page-objects/SetupScreen');

test.describe('Error Handling', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    
    // Verify the app is loaded
    const isHomeLoaded = await homePage.isLoaded();
    expect(isHomeLoaded).toBeTruthy();
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should show warning notification for same source and target languages', async () => {
    // Navigate to practice setup
    await homePage.navigateToPractice();
    await window.waitForTimeout(1000);
    
    // Select the same language for source and target
    await setupScreen.selectLanguage('source', 'en');
    await setupScreen.selectLanguage('target', 'en');
    
    // Try to start the session
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(1000);
    
    // Check if warning notification is displayed
    const warningNotification = await window.$('.notification.warning');
    expect(warningNotification).toBeTruthy();
    
    // Check notification content
    const notificationContent = await window.$eval('.notification.warning .notification-content', el => el.textContent.trim());
    expect(notificationContent).toContain('Source and target languages must be different');
  });

  test('should display empty warning when submitting empty translation', async () => {
    // Create a sample card
    await window.evaluate(() => {
      window.flashcards.saveFlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A basic greeting',
        userTranslation: 'Hola',
        tags: ['test']
      });
    });
    
    // Navigate to setup screen and start a practice session
    await homePage.navigateToPractice();
    await window.waitForTimeout(1000);
    
    await setupScreen.selectLanguage('source', 'en');
    await setupScreen.selectLanguage('target', 'es');
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(1000);
    
    // Try to submit empty translation
    await window.click('#submit-answer-btn');
    await window.waitForTimeout(500);
    
    // Check if warning notification is displayed
    const warningNotification = await window.$('.notification.warning');
    expect(warningNotification).toBeTruthy();
    
    // Check notification title and content
    const notificationTitle = await window.$eval('.notification.warning .notification-title', el => el.textContent.trim());
    expect(notificationTitle).toContain('Empty Answer');
  });
});