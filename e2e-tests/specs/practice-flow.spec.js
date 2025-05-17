const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');
const SetupScreen = require('../page-objects/SetupScreen');
const PracticeScreen = require('../page-objects/PracticeScreen');
const ResultsScreen = require('../page-objects/ResultsScreen');

test.describe('Complete Practice Session Flow', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;
  let practiceScreen;
  let resultsScreen;

  test.beforeEach(async () => {
    // Launch the app (headless mode controlled by environment variables)
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    practiceScreen = new PracticeScreen(window);
    resultsScreen = new ResultsScreen(window);

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

  test('should complete a short practice session', async () => {
    // Create a sample card
    await window.evaluate(() => {
      // Create a sample flashcard if none exist
      window.flashcards.saveFlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A basic greeting',
        userTranslation: 'Hola',
        tags: ['test', 'common']
      });
    });

    // Navigate to practice setup screen
    await homePage.navigateToPractice();
    await window.waitForTimeout(1000);

    // Set up a short practice session
    await setupScreen.selectLanguage('source', 'en');
    await setupScreen.selectLanguage('target', 'es');
    await setupScreen.setCardCount(1); // Just 1 card for quick test
    
    // Start the session
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(1000);

    // Verify we're in the practice screen
    const isPracticeLoaded = await practiceScreen.isLoaded();
    expect(isPracticeLoaded).toBeTruthy();

    // Get the card content
    const cardContent = await practiceScreen.getElementText(practiceScreen.selectors.cardContent);
    expect(cardContent).toBeTruthy();

    // Submit a translation
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, 'Hola');
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await window.waitForTimeout(2000);
    
    // Verify we're in the feedback screen
    const isFeedbackLoaded = await practiceScreen.isFeedbackLoaded();
    expect(isFeedbackLoaded).toBeTruthy();

    // Go to next (should go to results since only 1 card)
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);
    await window.waitForTimeout(2000);

    // Verify we're in the results screen
    const isResultsLoaded = await resultsScreen.isLoaded();
    expect(isResultsLoaded).toBeTruthy();

    // Check the score
    const score = await resultsScreen.getSessionScore();
    expect(score.total).toBe(1);
    expect(score.correct).toBeGreaterThanOrEqual(0);

    // Return to home
    await resultsScreen.navigateBackToHome();
    await window.waitForTimeout(1000);

    // Verify we're back at home
    const isHomeLoadedAgain = await homePage.isLoaded();
    expect(isHomeLoadedAgain).toBeTruthy();
  });
});