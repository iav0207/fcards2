const { test, expect } = require('@playwright/test');
const { launchApp } = require('../helpers/electron-helpers');
const { setupPracticeEnvironment } = require('../helpers/test-data-helpers');
const { toggleTagSelection, toggleSelectDeselectAllTags,
        getTagContainerStatus, getNoTagsMessageStatus,
        ensureVisibleEmptyContainer, getUniqueTagCount } = require('../helpers/tag-helpers');
const HomePage = require('../page-objects/HomePage');
const SetupScreen = require('../page-objects/SetupScreen');

// Test with standard tag setup (multiple different tags)
test.describe('Tag Selection - Standard Scenario', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    
    // Set up with standard tag scenario
    await setupPracticeEnvironment(window, homePage, setupScreen, {
      tagScenario: 'standard',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should display tags for selected source language', async () => {
    // Tag selection container should be visible
    const tagContainer = await window.$('#tag-selection-container');
    expect(await tagContainer.isVisible()).toBeTruthy();
    
    // There should be tag buttons
    const tagButtons = await window.$$('.tag-toggle');
    expect(tagButtons.length).toBeGreaterThan(0);
    
    // Get all tag text content
    const tagTexts = await Promise.all(
      tagButtons.map(btn => btn.textContent())
    );
    const combinedText = tagTexts.join(' ');
    
    // Verify the combined text contains 'test' which we know exists in our standard scenario
    expect(combinedText).toContain('test');
  });

  test('should toggle tag selection when clicked', async () => {
    console.log('DEBUGGING: Starting tag toggle test');

    // Use direct async/await pattern which propagates failures properly
    const result = await toggleTagSelection(window);
    console.log('DEBUGGING: Tag toggle result:', result);

    // Verify the state changed (no conditionals)
    expect(result.initialState).not.toEqual(result.finalState);

    // Since tags start selected in our test data, assert they become deselected
    expect(result.initialState).toBeTruthy();
    expect(result.finalState).toBeFalsy();

    // Summary should reflect the changed selection
    expect(result.summaryText).not.toContain('All');
    expect(result.summaryText).toContain('selected');
  });

  test('should select/deselect all tags with buttons', async () => {
    console.log('DEBUGGING: Starting select/deselect all tags test');

    // Use direct async/await pattern which propagates failures properly
    const result = await toggleSelectDeselectAllTags(window);
    console.log('DEBUGGING: Select/deselect result:', result);

    // Verify we have tags to work with
    expect(result.initialCount).toBeGreaterThan(0);

    // Verify that all tags were deselected
    expect(result.allDeselected).toBeTruthy();
    expect(result.afterDeselect).toEqual(result.initialCount);

    // Verify that all tags were selected again
    expect(result.allSelected).toBeTruthy();
    expect(result.afterSelect).toEqual(result.initialCount);
  });
});

// Test with no tags - app should hide tag container
test.describe('Tag Selection - No Tags (Hidden Container)', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    
    // Set up with no tags scenario
    await setupPracticeEnvironment(window, homePage, setupScreen, {
      tagScenario: 'none',
      sourceLanguage: 'en'
    });
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  // Test that the container is hidden when no tags exist
  test('should hide tag selection container when no tags exist', async () => {
    console.log('DEBUGGING: Starting hidden container test');

    // Use direct async/await pattern which propagates failures properly
    const containerStatus = await getTagContainerStatus(window);
    console.log('DEBUGGING: Container status:', containerStatus);

    // Container should exist but not be visible
    expect(containerStatus.exists).toBeTruthy();
    expect(containerStatus.visible).toBeFalsy();
  });
});

// Test with no tags - app shows "no tags available" message
test.describe('Tag Selection - No Tags (Empty Container)', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    
    // Set up with no tags scenario but force display
    await setupPracticeEnvironment(window, homePage, setupScreen, {
      tagScenario: 'none',
      sourceLanguage: 'en'
    });
    
    // Force the container to be visible (simulating the app's alternative behavior)
    await window.evaluate(() => {
      const container = document.getElementById('tag-selection-container');
      if (container) container.style.display = 'block';
    });
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  // Test that "no tags available" message appears when container is visible but empty
  test('should show "no tags available" message when container is visible but empty', async () => {
    console.log('DEBUGGING: Starting no tags message test');

    // Use direct async/await pattern which propagates failures properly
    await ensureVisibleEmptyContainer(window);
    const messageStatus = await getNoTagsMessageStatus(window);
    console.log('DEBUGGING: No tags message status:', messageStatus);

    // Message should exist and be visible
    expect(messageStatus.exists).toBeTruthy();
    expect(messageStatus.visible).toBeTruthy();

    // Check for tag buttons - there should be none
    const tagButtons = await window.$$('.tag-toggle');
    expect(tagButtons.length).toEqual(0);
  });
});

// Test with many tags (for selection controls)
test.describe('Tag Selection - Many Tags', () => {
  let electronApp;
  let window;
  let homePage;
  let setupScreen;

  test.beforeEach(async () => {
    // Launch the app
    ({ electronApp, window } = await launchApp());
    
    // Initialize page objects
    homePage = new HomePage(window);
    setupScreen = new SetupScreen(window);
    
    // Set up with many tags scenario
    await setupPracticeEnvironment(window, homePage, setupScreen, {
      tagScenario: 'many',
      sourceLanguage: 'en'
    });
  });

  test.afterEach(async () => {
    // Close the app after each test
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should display many distinct tags', async () => {
    console.log('DEBUGGING: Starting many distinct tags test');

    // Use direct async/await pattern which propagates failures properly
    const tagButtons = await window.$$('.tag-toggle');

    // Tag buttons should be present
    expect(tagButtons.length).toBeGreaterThan(5);

    // Get unique tag names using the helper function
    const uniqueTagCount = await getUniqueTagCount(window);
    console.log('DEBUGGING: Unique tag count:', uniqueTagCount);

    // There should be at least 5 unique tags
    expect(uniqueTagCount).toBeGreaterThanOrEqual(5);
  });
});