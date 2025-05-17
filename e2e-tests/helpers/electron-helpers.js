const { _electron: electron } = require('@playwright/test');
const path = require('path');

/**
 * Launch the Electron application for testing
 * @returns {Promise<{electronApp, window}>} - The Electron app and its first window
 */
async function launchApp() {
  // Find the main.js file in the project root
  const mainJsPath = path.join(process.cwd(), 'main.js');
  
  // Launch Electron app
  const electronApp = await electron.launch({
    args: [mainJsPath],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });
  
  // Get the first window
  const window = await electronApp.firstWindow();
  
  // Configure error handling
  window.on('pageerror', error => {
    console.error('Page error:', error);
  });
  
  window.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  return { electronApp, window };
}

/**
 * Wait for an element to be visible
 * @param {Page} page - Playwright page
 * @param {string} selector - CSS selector
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<ElementHandle>} - The element handle
 */
async function waitForElement(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  return page.$(selector);
}

/**
 * Get text content of an element
 * @param {Page} page - Playwright page
 * @param {string} selector - CSS selector
 * @returns {Promise<string>} - Text content of the element
 */
async function getElementText(page, selector) {
  return page.$eval(selector, el => el.textContent);
}

module.exports = {
  launchApp,
  waitForElement,
  getElementText
};