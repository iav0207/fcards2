/**
 * Helper functions for setting up test data in E2E tests
 */

/**
 * Create sample flashcards with specific tag configurations for testing
 * @param {import('playwright').Page} window - Playwright page object
 * @param {Object} options - Options for creating sample cards
 * @param {string} [options.tagScenario='standard'] - Predefined tag scenarios ('standard', 'none', 'single', 'many')
 * @param {string} [options.sourceLanguage='en'] - Source language for the cards
 * @param {string} [options.targetLanguage='es'] - Target language for the cards
 * @returns {Promise<void>}
 */
async function createSampleFlashcards(window, options = {}) {
  const { tagScenario = 'standard', sourceLanguage = 'en', targetLanguage = 'es' } = options;

  await window.evaluate(({ tagScenario, sourceLanguage, targetLanguage }) => {
    const cards = [];

    // Configure cards based on the tag scenario
    switch(tagScenario) {
      case 'none':
        // No tags at all
        cards.push({
          content: 'Hello',
          sourceLanguage,
          comment: 'A basic greeting',
          userTranslation: 'Hola',
          tags: []
        });
        cards.push({
          content: 'Goodbye',
          sourceLanguage,
          comment: 'A farewell',
          userTranslation: 'Adiós',
          tags: []
        });
        break;

      case 'single':
        // All cards have the same single tag
        cards.push({
          content: 'Hello',
          sourceLanguage,
          comment: 'A basic greeting',
          userTranslation: 'Hola',
          tags: ['common']
        });
        cards.push({
          content: 'Goodbye',
          sourceLanguage,
          comment: 'A farewell',
          userTranslation: 'Adiós',
          tags: ['common']
        });
        break;

      case 'many':
        // Many tags for testing selection/deselection
        cards.push({
          content: 'Hello',
          sourceLanguage,
          comment: 'A basic greeting',
          userTranslation: 'Hola',
          tags: ['greeting', 'test', 'common', 'basic', 'formal', 'informal']
        });
        cards.push({
          content: 'Goodbye',
          sourceLanguage,
          comment: 'A farewell',
          userTranslation: 'Adiós',
          tags: ['farewell', 'test', 'common', 'basic', 'formal']
        });
        cards.push({
          content: 'Good morning',
          sourceLanguage,
          comment: 'Morning greeting',
          userTranslation: 'Buenos días',
          tags: ['greeting', 'morning', 'formal', 'time']
        });
        break;

      case 'standard':
      default:
        // Standard set of tags with variety
        cards.push({
          content: 'Hello',
          sourceLanguage,
          comment: 'A basic greeting',
          userTranslation: 'Hola',
          tags: ['greeting', 'test', 'common']
        });
        cards.push({
          content: 'Goodbye',
          sourceLanguage,
          comment: 'A farewell',
          userTranslation: 'Adiós',
          tags: ['farewell', 'test']
        });
        cards.push({
          content: 'Good morning',
          sourceLanguage,
          comment: 'Morning greeting',
          userTranslation: 'Buenos días',
          tags: ['greeting', 'morning']
        });
        cards.push({
          content: 'Thank you',
          sourceLanguage,
          comment: 'Expression of gratitude',
          userTranslation: 'Gracias',
          tags: ['courtesy', 'common']
        });
    }

    // Create all cards
    return Promise.all(cards.map(card => window.flashcards.saveFlashCard(card)));
  }, { tagScenario, sourceLanguage, targetLanguage });
}

/**
 * Set up a test environment with sample cards and navigate to practice
 * @param {import('playwright').Page} window - Playwright page object
 * @param {Object} homePage - HomePage page object
 * @param {Object} setupScreen - SetupScreen page object
 * @param {Object} options - Additional options
 * @param {string} [options.tagScenario='standard'] - Which tag scenario to use ('standard', 'none', 'single', 'many')
 * @param {string} [options.sourceLanguage='en'] - Source language for the cards
 * @param {string} [options.targetLanguage='es'] - Target language for the cards
 * @param {boolean} [options.selectSourceLanguage=true] - Whether to select the source language
 * @param {boolean} [options.selectTargetLanguage=false] - Whether to select the target language
 * @returns {Promise<void>}
 */
async function setupPracticeEnvironment(window, homePage, setupScreen, options = {}) {
  // Create sample flashcards with the specified tag scenario
  await createSampleFlashcards(window, {
    tagScenario: options.tagScenario || 'standard',
    sourceLanguage: options.sourceLanguage || 'en',
    targetLanguage: options.targetLanguage || 'es'
  });

  // Navigate to practice setup screen
  await homePage.navigateToPractice();
  await window.waitForTimeout(1000);

  // Select source language
  if (options.selectSourceLanguage !== false) {
    await setupScreen.selectLanguage('source', options.sourceLanguage || 'en');
    await window.waitForTimeout(1000);
  }

  // Select target language if specified
  if (options.selectTargetLanguage) {
    await setupScreen.selectLanguage('target', options.targetLanguage || 'es');
    await window.waitForTimeout(500);
  }
}

module.exports = {
  createSampleFlashcards,
  setupPracticeEnvironment
};