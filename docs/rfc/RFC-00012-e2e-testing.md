# RFC-00012: End-to-End Testing Implementation for FlashCards Desktop

- **Status**: Draft
- **Author**: Claude
- **Created**: 2025-05-17

## Summary

This RFC proposes implementing end-to-end (E2E) testing for the FlashCards Desktop application to ensure critical user journeys function correctly across the entire application. The proposal includes migrating from the deprecated Spectron framework to Playwright, defining key test scenarios, and establishing proper testing infrastructure.

## Motivation

End-to-end testing is critical for verifying that the entire application works as expected from the user's perspective. While the application already has comprehensive unit tests, there's a gap in ensuring complete workflows function properly from UI interaction through to data persistence and back. Key motivations include:

1. **Detect integration issues early**: Identify problems that only appear when multiple components interact with each other
2. **Verify critical user journeys**: Ensure key workflows like flashcard creation, practice sessions, and import/export functionality work end-to-end
3. **Simplify regression testing**: Automate the verification of existing functionality when changes are made
4. **Improve test coverage**: Address untested areas between component boundaries and UI interaction
5. **Update testing framework**: Replace the deprecated Spectron framework with the more modern and actively maintained Playwright

## Detailed Design

The proposed E2E testing implementation consists of several parts:

### 1. Migrate from Spectron to Playwright

The current project includes Spectron v19.0.0 as a dependency, but Spectron was officially deprecated in February 2022. We should migrate to Playwright, which is actively maintained and recommended by the Electron team.

**Implementation details**:
- Add Playwright as a development dependency:
  ```bash
  npm install -D @playwright/test
  ```
- Create Playwright configuration:
  ```javascript
  // playwright.config.js
  module.exports = {
    testDir: './e2e-tests',
    timeout: 30000,
    expect: {
      timeout: 5000
    },
    fullyParallel: false,
    reporter: ['html', 'list'],
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: {
      trace: 'on-first-retry',
      video: 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    projects: [
      {
        name: 'electron',
        use: {
          // No browsers needed for Electron testing
        },
      }
    ],
  };
  ```
- Create a helper utility to facilitate Electron testing:
  ```javascript
  // e2e-tests/helpers.js
  const { _electron: electron } = require('@playwright/test');
  
  /**
   * Launch the Electron application for testing
   */
  async function launchApp() {
    const electronApp = await electron.launch({
      args: ['main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    
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
  
  module.exports = {
    launchApp
  };
  ```

### 2. Define Critical User Journeys

The following critical user journeys should be tested with E2E tests:

1. **Application Startup and Database Initialization**:
   - Verify the application starts correctly
   - Confirm the database is initialized
   - Validate home screen displays correct statistics

2. **Flashcard Management**:
   - Create a new flashcard with content and translation
   - Add tags to a flashcard
   - Edit an existing flashcard
   - Delete a flashcard

3. **Practice Session Flow**:
   - Start a new practice session
   - Answer questions with correct and incorrect translations
   - Complete a session and view results
   - Cancel a session mid-way
   - Verify practice session statistics are recorded

4. **Import/Export Functionality**:
   - Export flashcards to a file
   - Import flashcards from a file
   - Verify imported flashcards are correctly stored and accessible

5. **Tag-based Deck Selection**:
   - Filter flashcards by tags
   - Practice with a tag-filtered deck
   - Verify tag statistics

6. **Settings Management**:
   - Change application settings
   - Verify settings persistence
   - Test API key configuration

7. **Dark/Light Theme Support**:
   - Switch between themes
   - Verify UI elements update appropriately

### 3. Test Architecture and Organization

The E2E tests will be organized using the Page Object Model (POM) pattern to improve maintainability and readability:

```
/e2e-tests
  /helpers
    electron-helpers.js  # General Electron interaction helpers
  /page-objects
    HomePage.js          # Home screen interactions
    SetupScreen.js       # Setup screen interactions
    PracticeScreen.js    # Practice screen interactions
    ResultsScreen.js     # Results screen interactions
    ImportExportScreen.js # Import/Export screen interactions
  /fixtures
    test-data.js         # Test data generation utilities
  /specs
    app-launch.spec.js    # App startup tests
    flashcard-crud.spec.js # Flashcard CRUD operation tests
    practice-session.spec.js # Practice session tests
    import-export.spec.js  # Import/Export functionality tests
    tag-selection.spec.js  # Tag filtering tests
  playwright.config.js    # Playwright configuration
```

Example Page Object:

```javascript
// e2e-tests/page-objects/HomePage.js
class HomePage {
  constructor(page) {
    this.page = page;
  }

  // Navigation methods
  async navigateToSetup() {
    await this.page.click('#setup-button');
  }

  async navigateToPractice() {
    await this.page.click('#practice-button');
  }

  // Information retrieval methods
  async getDatabaseStats() {
    const cardsCount = await this.page.$eval('#cards-count', el => el.textContent);
    const tagsCount = await this.page.$eval('#tags-count', el => el.textContent);
    return { cardsCount, tagsCount };
  }
}

module.exports = HomePage;
```

Example Test:

```javascript
// e2e-tests/specs/app-launch.spec.js
const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const HomePage = require('../page-objects/HomePage');

test.describe('Application Startup', () => {
  let electronApp;
  let window;
  let homePage;

  test.beforeEach(async () => {
    ({ electronApp, window } = await launchApp());
    homePage = new HomePage(window);
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should display the correct application title', async () => {
    const title = await window.title();
    expect(title).toBe('FlashCards Desktop');
  });

  test('should initialize the database and show statistics', async () => {
    // Wait for database initialization
    await window.waitForSelector('#database-status.initialized');
    
    // Check database stats are displayed
    const stats = await homePage.getDatabaseStats();
    expect(stats.cardsCount).toBeDefined();
    expect(stats.tagsCount).toBeDefined();
  });
});
```

### 4. CI/CD Integration

E2E tests should be integrated into the CI/CD pipeline to run on pull requests and before releases:

- Add a GitHub Actions workflow for E2E tests:
  ```yaml
  # .github/workflows/e2e-tests.yml
  name: E2E Tests

  on:
    pull_request:
    push:
      branches: [main]

  jobs:
    e2e-tests:
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          os: [ubuntu-latest, windows-latest, macos-latest]
      
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: 16
            cache: 'npm'
        - name: Install dependencies
          run: npm ci
        - name: Install Playwright browsers
          run: npx playwright install --with-deps
        - name: Run E2E tests
          run: npm run test:e2e
        - uses: actions/upload-artifact@v3
          if: always()
          with:
            name: test-results-${{ matrix.os }}
            path: test-results/
            retention-days: 7
  ```

## Implementation Plan

The implementation should be broken down into stages:

1. **Setup phase** (Week 1):
   - Add Playwright as a development dependency
   - Create initial configuration and helper utilities
   - Set up a basic test structure
   - Add script to package.json: `"test:e2e": "playwright test"`

2. **Core User Journey Testing** (Week 2-3):
   - Implement app launch and initialization tests
   - Add flashcard CRUD operation tests
   - Create practice session flow tests
   - Implement import/export functionality tests

3. **Extended User Journey Testing** (Week 3-4):
   - Add tag-based selection tests
   - Implement settings management tests
   - Create theme switching tests

4. **CI Integration** (Week 4):
   - Set up GitHub Actions workflow for E2E tests
   - Ensure tests run on all supported platforms
   - Configure reports and artifacts for test failures

## Compatibility

Implementing E2E tests will not affect the runtime behavior of the application. However, the test implementation will need to handle multi-platform compatibility as FlashCards Desktop runs on macOS, Windows, and potentially Linux.

The test suite should be designed to work across all supported platforms by:

1. Using platform-agnostic element selectors
2. Handling platform-specific behaviors (like menu navigation differences)
3. Using conditional logic where necessary for platform-specific test details

## Testing Plan

Each E2E test implementation should be tested itself by:

1. Running the test against a known working version of the application
2. Verifying the test fails appropriately when the tested functionality is broken
3. Ensuring the test works across all supported platforms (Windows, macOS, Linux if applicable)

The E2E test suite should be designed to run locally for development purposes and in CI/CD environments.

## Future Considerations

1. **Test Data Management**: As the test suite grows, consider implementing a more robust test data management system, possibly with database seeding for reproducible test states
2. **Visual Regression Testing**: Add visual regression testing for UI components using Playwright's screenshot comparison capabilities
3. **Performance Metrics**: Extend the E2E tests to capture performance metrics for critical operations
4. **Accessibility Testing**: Add accessibility checks to the E2E tests to ensure the application is usable by all users

## Alternatives Considered

### Alternative 1: WebdriverIO

WebdriverIO is another popular testing framework that supports Electron testing. While it's a comprehensive solution, Playwright has better built-in support for Electron testing, a more modern API, and is recommended by the Electron team.

### Alternative 2: Jest + Puppeteer

While Jest (already used in the project) could be combined with Puppeteer for E2E testing, this approach would require more custom configuration than Playwright's built-in Electron support.

### Alternative 3: Continue Using Spectron

Continuing with Spectron is not recommended as it's deprecated and likely to have compatibility issues with newer versions of Electron. Migration to a supported framework is necessary for long-term maintainability.

## Conclusion

Implementing comprehensive E2E testing with Playwright will significantly enhance the reliability of the FlashCards Desktop application by ensuring critical user journeys work correctly. By migrating from the deprecated Spectron to the modern Playwright framework, we not only gain better testing capabilities but also align with the Electron team's recommendations for testing Electron applications.

The proposed approach balances testing coverage with maintainability through the use of the Page Object Model pattern and a clear organization of test files. The integration with CI/CD ensures tests are run consistently and that regressions are caught early in the development process.