/**
 * Base Page Object for all pages in the application
 * Provides common functionality for interacting with pages
 */
class BasePage {
  /**
   * @param {import('playwright').Page} page - Playwright page object
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for an element to be visible
   * @param {string} selector - CSS selector
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<ElementHandle>} - The element handle
   */
  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    return this.page.$(selector);
  }

  /**
   * Get text content of an element
   * @param {string} selector - CSS selector
   * @returns {Promise<string>} - Text content of the element
   */
  async getElementText(selector) {
    return this.page.$eval(selector, el => el.textContent.trim());
  }

  /**
   * Click on an element
   * @param {string} selector - CSS selector
   */
  async clickElement(selector) {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  /**
   * Fill a form field
   * @param {string} selector - CSS selector
   * @param {string} value - Value to fill
   */
  async fillField(selector, value) {
    await this.waitForElement(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Check if an element is visible
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>} - Whether the element is visible
   */
  async isElementVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 1000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = BasePage;