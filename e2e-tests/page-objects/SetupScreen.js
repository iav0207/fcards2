const BasePage = require('./BasePage');

/**
 * Page Object for the Setup screen
 */
class SetupScreen extends BasePage {
  /**
   * @param {import('playwright').Page} page - Playwright page object
   */
  constructor(page) {
    super(page);
    
    // Selectors for the Setup screen elements
    this.selectors = {
      setupTitle: 'h2:has-text("Practice Session Setup")',
      sourceLanguage: '#source-language',
      targetLanguage: '#target-language',
      cardCount: '#card-count',
      tagSelection: '#tag-selection-header',
      tagCloud: '#tag-cloud',
      backButton: '#back-to-home-btn',
      startButton: '#create-session-btn',
      tagSelectionContent: '#tag-selection-content',
      notification: '.notification'
    };
  }

  /**
   * Check if the setup screen is loaded
   * @returns {Promise<boolean>} - Whether the setup screen is loaded
   */
  async isLoaded() {
    return this.isElementVisible(this.selectors.setupTitle);
  }

  /**
   * Navigate back to home screen
   */
  async navigateBackToHome() {
    await this.clickElement(this.selectors.backButton);
  }

  /**
   * Configure and start a practice session
   * @param {string} sourceLanguage - The source language code
   * @param {string} targetLanguage - The target language code
   * @param {number} cardCount - Number of cards for the session
   * @param {Array<string>} [selectedTags=[]] - Tags to filter by
   */
  async startSession(sourceLanguage = 'en', targetLanguage = 'de', cardCount = 10, selectedTags = []) {
    // Set source language
    await this.page.selectOption(this.selectors.sourceLanguage, sourceLanguage);

    // Set target language
    await this.page.selectOption(this.selectors.targetLanguage, targetLanguage);

    // Set card count
    await this.fillField(this.selectors.cardCount, cardCount.toString());

    // Select tags if specified
    if (selectedTags.length > 0) {
      // Open tag selection
      await this.clickElement(this.selectors.tagSelection);

      // Wait for the tag cloud to be visible
      await this.waitForElement(this.selectors.tagSelectionContent, { state: 'visible' });

      // Get all tag elements
      const tagElements = await this.page.$$('.tag-toggle');

      // Click on tags that match the selected ones
      for (const element of tagElements) {
        const tagText = await element.textContent();

        // Check if this tag should be selected
        for (const tag of selectedTags) {
          if (tagText.includes(tag)) {
            await element.click();
            break;
          }
        }
      }

      // Close the tag selection by clicking the header again
      await this.clickElement(this.selectors.tagSelection);
    }

    // Start the session
    await this.clickElement(this.selectors.startButton);
  }

  /**
   * Select a specific language
   * @param {string} type - Either 'source' or 'target'
   * @param {string} languageCode - The language code to select
   */
  async selectLanguage(type, languageCode) {
    const selector = type === 'source' ? this.selectors.sourceLanguage : this.selectors.targetLanguage;
    await this.page.selectOption(selector, languageCode);
  }

  /**
   * Set the number of cards for the session
   * @param {number} count - Number of cards
   */
  async setCardCount(count) {
    await this.fillField(this.selectors.cardCount, count.toString());
  }
}

module.exports = SetupScreen;