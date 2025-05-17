# End-to-End Tests for FlashCards Desktop

This directory contains end-to-end tests for the FlashCards Desktop application using Playwright.

## Overview

The tests are organized using the Page Object Model pattern:

- `/e2e-tests/specs` - Test specifications
- `/e2e-tests/page-objects` - Page object classes
- `/e2e-tests/helpers` - Helper utilities

## Running Tests

To run the end-to-end tests:

```bash
# Run all tests
npm run test:e2e

# Run specific test
npx playwright test app-launch.spec.js

# Run tests with UI mode
npx playwright test --ui

# Run tests with debugging
npx playwright test --debug
```

## Test Coverage

The E2E tests cover the following areas:

1. **Application Launch** - Tests basic application startup and UI
2. **Flashcard Management** - Tests CRUD operations for flashcards
3. **Practice Session Flow** - Tests the practice session workflow

## Debugging Tests

When tests fail, Playwright generates screenshots, videos, and traces to help with debugging:

- Screenshots: `test-results/*/test-*/test-failed-*.png`
- Videos: `test-results/*/test-*/video.webm`
- Traces: `test-results/*/test-*/trace.zip`

To view the traces:

```bash
npx playwright show-trace test-results/*/test-*/trace.zip
```

## CI Integration

These tests can be run in a CI environment. The configuration in `playwright.config.js` adapts to CI environments by:

- Reducing concurrency (1 worker in CI)
- Adding automatic retries for flaky tests
- Generating artifacts for failed tests

## Extending Tests

To add new tests:

1. Identify the user journey to test
2. Update or create Page Object Models for any screens involved
3. Create a new spec file in `/e2e-tests/specs`
4. Follow the existing patterns for setting up, executing, and verifying tests

## Common Issues and Solutions

- **Slow Tests**: Tests may run slower in CI environments. Adjust timeouts if needed.
- **Selector Changes**: If the UI changes, update the selectors in the Page Object Models.
- **Application State**: Tests assume a clean application state. If tests modify data, they should clean up after themselves.