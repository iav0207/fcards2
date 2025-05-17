const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');

test.describe('Import/Export Functionality', () => {
  let electronApp;
  let window;
  let homePage;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    
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

  test('should navigate to import screen and show options', async () => {
    // Navigate to import screen
    await homePage.navigateToImport();
    await window.waitForTimeout(1000);
    
    // Check if import screen is displayed
    const importScreen = await window.$('#import-screen.active');
    expect(importScreen).toBeTruthy();
    
    // Check if import mode options are available
    const importModeSelect = await window.$('#import-mode');
    expect(importModeSelect).toBeTruthy();
    
    // Check if buttons are present
    const proceedButton = await window.$('#proceed-import-btn');
    const backButton = await window.$('#back-from-import-btn');
    
    expect(proceedButton).toBeTruthy();
    expect(backButton).toBeTruthy();
  });

  test('should return to home screen from import screen', async () => {
    // Navigate to import screen
    await homePage.navigateToImport();
    await window.waitForTimeout(1000);
    
    // Click the back button
    await window.click('#back-from-import-btn');
    await window.waitForTimeout(1000);
    
    // Verify we're back at home
    const isHomeLoaded = await homePage.isLoaded();
    expect(isHomeLoaded).toBeTruthy();
  });

  test('should handle cancelled export properly', async () => {
    // Mock the electron dialog to simulate user cancellation
    await window.evaluate(() => {
      // Mock the export function to return a cancelled result
      window.flashcards.exportDatabase = async () => ({
        success: false,
        reason: 'canceled'
      });
    });
    
    // Click the export button
    await homePage.clickElement(homePage.selectors.exportButton);
    await window.waitForTimeout(1000);
    
    // Verify we're still at home screen after cancellation
    const isHomeLoaded = await homePage.isLoaded();
    expect(isHomeLoaded).toBeTruthy();
  });

  test('should show operation result screen after export', async () => {
    // Use Promise resolution pattern with proper error handling
    return Promise.resolve()
      .then(async () => {
        console.log('DEBUGGING: Mocking export database function');
        // Mock successful export
        await window.evaluate(() => {
          // Mock the export function to return a successful result
          window.flashcards.exportDatabase = async () => ({
            success: true,
            path: '/fake/path/export.json',
            stats: {
              flashcardsCount: 5,
              sessionsCount: 2
            }
          });
        });

        console.log('DEBUGGING: Clicking export button');
        // Click the export button directly
        await window.click('#export-data-btn');
        await window.waitForTimeout(1500); // Longer wait for operation to complete

        // Return the operation result screen element
        return window.$('#operation-result-screen.active');
      })
      .then(operationResultScreen => {
        // Verify operation result screen is shown
        expect(operationResultScreen).toBeTruthy('Operation result screen not shown');

        // Check if success message is displayed
        return window.$eval('#operation-result-title', el => el.textContent);
      })
      .then(resultTitle => {
        console.log('DEBUGGING: Result title:', resultTitle);
        expect(resultTitle).toContain('Export Successful');

        // Check if the path is displayed
        return window.$('#operation-result-path-container');
      })
      .then(pathContainer => {
        return pathContainer.isVisible();
      })
      .then(isPathVisible => {
        expect(isPathVisible).toBeTruthy('Path container is not visible');
      })
      .catch(error => {
        test.fail(`Export operation result test failed: ${error.message}`);
        throw error;
      });
  });
});