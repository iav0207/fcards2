const BasePage = require('./BasePage');

/**
 * Page Object for the Practice screen
 */
class PracticeScreen extends BasePage {
  /**
   * @param {import('playwright').Page} page - Playwright page object
   */
  constructor(page) {
    super(page);
    
    // Selectors for the Practice screen elements
    this.selectors = {
      practiceScreen: '#practice-screen',
      cardContent: '#card-content',
      cardTags: '#card-tags',
      translationInput: '#translation-input',
      submitButton: '#submit-answer-btn',
      cancelButton: '#cancel-session-btn',
      nextButton: '#next-card-btn',
      progressBar: '#session-progress',
      // Feedback screen selectors
      feedbackScreen: '#feedback-screen',
      feedbackResult: '#feedback-result',
      feedbackOriginal: '#feedback-original',
      feedbackUserAnswer: '#feedback-user-answer',
      feedbackSuggested: '#feedback-suggested'
    };
  }

  /**
   * Check if the practice screen is loaded
   * @returns {Promise<boolean>} - Whether the practice screen is loaded
   */
  async isLoaded() {
    return this.isElementVisible(this.selectors.practiceScreen);
  }

  /**
   * Check if the feedback screen is loaded
   * @returns {Promise<boolean>} - Whether the feedback screen is loaded
   */
  async isFeedbackLoaded() {
    return this.isElementVisible(this.selectors.feedbackScreen);
  }

  /**
   * Get the current card content
   * @returns {Promise<string>} - Current card content
   */
  async getCurrentCardContent() {
    return this.getElementText(this.selectors.cardContent);
  }

  /**
   * Get the current card tags
   * @returns {Promise<Array<string>>} - Current card tags
   */
  async getCurrentCardTags() {
    try {
      const tagsText = await this.getElementText(this.selectors.cardTags);
      return tagsText.split(',').map(tag => tag.trim());
    } catch (error) {
      // Tags might not be present
      return [];
    }
  }

  /**
   * Submit an answer for the current card
   * @param {string} translation - The translation to submit
   */
  async submitAnswer(translation) {
    await this.fillField(this.selectors.translationInput, translation);
    await this.clickElement(this.selectors.submitButton);
    
    // Wait for feedback
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if the answer was correct
   * @returns {Promise<boolean>} - Whether the answer was correct
   */
  async isAnswerCorrect() {
    return this.isElementVisible(this.selectors.feedbackCorrect);
  }

  /**
   * Go to the next card
   */
  async goToNextCard() {
    await this.clickElement(this.selectors.nextButton);
    
    // Wait for the next card to load
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel the current session
   * @param {boolean} [confirm=true] - Whether to confirm the cancellation
   */
  async cancelSession(confirm = true) {
    await this.clickElement(this.selectors.cancelButton);
    
    // Wait for confirmation dialog
    await this.page.waitForTimeout(500);
    
    // Confirm or cancel
    if (confirm) {
      await this.page.keyboard.press('Enter');
    } else {
      await this.page.keyboard.press('Escape');
    }
    
    // Wait for navigation
    if (confirm) {
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get the current progress percentage
   * @returns {Promise<number>} - Progress percentage (0-100)
   */
  async getProgressPercentage() {
    const progressEl = await this.page.$(this.selectors.progressBar);
    const width = await progressEl.evaluate(el => el.style.width);
    
    // Parse percentage from width (e.g., "75%" -> 75)
    return parseInt(width, 10);
  }
}

module.exports = PracticeScreen;