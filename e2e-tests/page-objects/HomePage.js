const BasePage = require('./BasePage');

/**
 * Page Object for the Home screen
 */
class HomePage extends BasePage {
  /**
   * @param {import('playwright').Page} page - Playwright page object
   */
  constructor(page) {
    super(page);
    
    // Selectors for the Home page elements
    this.selectors = {
      appTitle: 'h1',
      practiceButton: '#start-practice-btn',
      importButton: '#import-data-btn',
      exportButton: '#export-data-btn',
      flashcardStats: '#flashcards-count',
      sessionsStats: '#sessions-count',
      activeSessionsStats: '#active-sessions-count',
      completedSessionsStats: '#completed-sessions-count'
    };
  }

  /**
   * Navigate to Practice setup screen
   */
  async navigateToPractice() {
    await this.clickElement(this.selectors.practiceButton);
  }

  /**
   * Navigate to Import screen
   */
  async navigateToImport() {
    await this.clickElement(this.selectors.importButton);
  }

  /**
   * Navigate to Export screen
   */
  async navigateToExport() {
    await this.clickElement(this.selectors.exportButton);
  }

  /**
   * Get the app title
   * @returns {Promise<string>} - The app title
   */
  async getAppTitle() {
    return this.getElementText(this.selectors.appTitle);
  }

  /**
   * Get database statistics
   * @returns {Promise<{flashcardCount: string, sessionsCount: string, activeSessionsCount: string, completedSessionsCount: string}>} - Database statistics
   */
  async getDatabaseStats() {
    const flashcardStats = await this.getElementText(this.selectors.flashcardStats);
    const sessionsStats = await this.getElementText(this.selectors.sessionsStats);
    const activeSessionsStats = await this.getElementText(this.selectors.activeSessionsStats);
    const completedSessionsStats = await this.getElementText(this.selectors.completedSessionsStats);
    return {
      flashcardCount: flashcardStats,
      sessionsCount: sessionsStats,
      activeSessionsCount: activeSessionsStats,
      completedSessionsCount: completedSessionsStats
    };
  }

  /**
   * Check if the home page is loaded
   * @returns {Promise<boolean>} - Whether the home page is loaded
   */
  async isLoaded() {
    return this.isElementVisible(this.selectors.appTitle);
  }
}

module.exports = HomePage;