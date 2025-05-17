const BasePage = require('./BasePage');

/**
 * Page Object for the Results screen
 */
class ResultsScreen extends BasePage {
  /**
   * @param {import('playwright').Page} page - Playwright page object
   */
  constructor(page) {
    super(page);
    
    // Selectors for the Results screen elements
    this.selectors = {
      resultsScreen: '#results-screen',
      resultsTitle: 'h2:has-text("Session Results")',
      totalCount: '#results-total',
      correctCount: '#results-correct',
      accuracyDisplay: '#results-accuracy',
      homeButton: '#back-to-home-from-results-btn',
      newSessionButton: '#start-new-session-btn'
    };
  }

  /**
   * Check if the results screen is loaded
   * @returns {Promise<boolean>} - Whether the results screen is loaded
   */
  async isLoaded() {
    return this.isElementVisible(this.selectors.resultsScreen);
  }

  /**
   * Navigate back to home screen
   */
  async navigateBackToHome() {
    await this.clickElement(this.selectors.homeButton);
  }

  /**
   * Start another practice session
   */
  async startNewSession() {
    await this.clickElement(this.selectors.newSessionButton);
  }

  /**
   * Get the session score
   * @returns {Promise<{accuracy: string, correct: number, total: number}>} - Session score
   */
  async getSessionScore() {
    const correctCount = parseInt(await this.getElementText(this.selectors.correctCount), 10);
    const totalCount = parseInt(await this.getElementText(this.selectors.totalCount), 10);
    const accuracy = await this.getElementText(this.selectors.accuracyDisplay);

    return {
      accuracy,
      correct: correctCount,
      total: totalCount
    };
  }
}

module.exports = ResultsScreen;