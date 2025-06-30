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
        content: 'Hola',
        sourceLanguage: 'es',
        comment: 'A basic greeting',
        userTranslation: 'Hello',
        tags: ['test', 'common']
      });
    });

    // Navigate to practice setup screen
    await homePage.navigateToPractice();
    await window.waitForTimeout(1000);

    // Set up a short practice session
    await setupScreen.selectLanguage('source', 'es');
    await setupScreen.selectLanguage('target', 'en');
    await setupScreen.setCardCount(1); // Just 1 card for quick test
    
    // Start the session
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(1000);

    // Verify we're in the practice screen
    const isPracticeLoaded = await practiceScreen.isLoaded();
    expect(isPracticeLoaded).toBeTruthy();

    // Get the card content
    const cardContent = await practiceScreen.getElementText(practiceScreen.selectors.cardContent);
    expect(cardContent).toBe('Hola');

    // Submit a translation
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, 'Hello');
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);

    // Use Playwright's retry mechanism to wait for the feedback screen
    // This will retry the assertion until it passes or the timeout is reached
    await expect(async () => {
      const isFeedbackLoaded = await practiceScreen.isFeedbackLoaded();
      expect(isFeedbackLoaded).toBeTruthy();
    }).toPass({ timeout: 8000 });

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

  test('should retry an incorrectly answered card at most once', async () => {
    // Create three cards
    await window.evaluate(() => {
      window.flashcards.saveFlashCard({
        id: 'retry-card-1',
        content: 'Manzana',
        sourceLanguage: 'es',
        userTranslation: 'Apple'
      });
      window.flashcards.saveFlashCard({
        id: 'retry-card-2',
        content: 'Coche',
        sourceLanguage: 'es',
        userTranslation: 'Car'
      });
      window.flashcards.saveFlashCard({
        id: 'retry-card-3',
        content: 'Plátano',
        sourceLanguage: 'es',
        userTranslation: 'Banana'
      });
    });

    // Navigate to practice setup screen
    await homePage.navigateToPractice();
    await window.waitForTimeout(500);

    // Set up a practice session with 3 cards for es -> en
    await setupScreen.selectLanguage('source', 'es');
    await setupScreen.selectLanguage('target', 'en');
    await setupScreen.setCardCount(3);
    
    // Start the session
    await setupScreen.clickElement(setupScreen.selectors.startButton);
    await window.waitForTimeout(500);

    // --- Round 1 ---
    // We use predictable card IDs to know which card is which.
    // Card 'retry-card-1' (Manzana): Answer INCORRECTLY
    await expect(practiceScreen.getCurrentCardContent()).resolves.toBe('Manzana');
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, 'Wrong Answer 1');
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await expect(practiceScreen.isFeedbackLoaded()).resolves.toBeTruthy();
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);

    // Card 'retry-card-2' (Coche): Answer INCORRECTLY
    await expect(practiceScreen.getCurrentCardContent()).resolves.toBe('Coche');
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, 'Wrong Answer 2');
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await expect(practiceScreen.isFeedbackLoaded()).resolves.toBeTruthy();
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);

    // Card 'retry-card-3' (Plátano): Answer CORRECTLY
    await expect(practiceScreen.getCurrentCardContent()).resolves.toBe('Plátano');
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, 'Banana');
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await expect(practiceScreen.isFeedbackLoaded()).resolves.toBeTruthy();
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);

    // --- Retry Round ---
    // The two incorrectly answered cards ('Manzana', 'Coche') should be presented again.
    // We will answer 'Manzana' correctly and 'Coche' incorrectly on this second attempt
    // to ensure that cards are only retried once, regardless of the second answer.
    const firstRetryContent = await practiceScreen.getCurrentCardContent();
    expect(['Manzana', 'Coche']).toContain(firstRetryContent);

    const firstRetryAnswer = {'Manzana': 'Apple', 'Coche': 'Wrong Answer 3'}[firstRetryContent];
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, firstRetryAnswer);
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await expect(practiceScreen.isFeedbackLoaded()).resolves.toBeTruthy();
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);

    // Now the second retry card should be shown
    const secondRetryContent = await practiceScreen.getCurrentCardContent();
    expect(['Manzana', 'Coche']).toContain(secondRetryContent);
    expect(secondRetryContent).not.toBe(firstRetryContent);

    const secondRetryAnswer = {'Manzana': 'Apple', 'Coche': 'Wrong Answer 3'}[secondRetryContent];
    await practiceScreen.fillField(practiceScreen.selectors.translationInput, secondRetryAnswer);
    await practiceScreen.clickElement(practiceScreen.selectors.submitButton);
    await expect(practiceScreen.isFeedbackLoaded()).resolves.toBeTruthy();
    await practiceScreen.clickElement(practiceScreen.selectors.nextButton);
    
    // --- Verify Results Screen ---
    // The session should now be over. No more retries for the card answered incorrectly a second time.
    await expect(resultsScreen.isLoaded()).resolves.toBeTruthy();
    
    const score = await resultsScreen.getSessionScore();
    expect(score.correct).toBe(1); // From 'Banana' in the first round
    expect(score.incorrect).toBe(2); // From 'Apple' and 'Car' in the first round
    expect(score.total).toBe(3);
  });
});