/**
 * Helper functions for tag-related tests
 */

/**
 * Toggle a tag selection directly in the browser context
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Promise<{initialState: boolean, finalState: boolean, summaryText: string}>}
 *          Result containing initial state, final state, and summary text
 * @throws {Error} If no tag button is found
 */
async function toggleTagSelection(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // Find the tag toggle
      const tagButton = document.querySelector('.tag-toggle');
      if (!tagButton) {
        reject(new Error('No tag button found'));
        return;
      }

      // Get initial state
      const initialState = tagButton.classList.contains('selected');

      // Click the button
      tagButton.click();

      // Wait a tiny bit for any event handlers
      setTimeout(() => {
        // Get final state
        const finalState = tagButton.classList.contains('selected');
        const summary = document.querySelector('#tag-selection-summary');
        const summaryText = summary ? summary.textContent : '';

        // Return the results through Promise resolution
        resolve({
          initialState,
          finalState,
          summaryText
        });
      }, 300);
    });
  });
}

/**
 * Toggle select/deselect all tags directly in the browser context
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Promise<{initialCount: number, afterDeselect: number, afterSelect: number,
 *          allDeselected: boolean, allSelected: boolean}>}
 *          Result with tag counts and selection states
 * @throws {Error} If buttons or tag toggles are not found
 */
async function toggleSelectDeselectAllTags(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // Find the buttons
      const selectAllBtn = document.querySelector('#select-all-tags');
      const deselectAllBtn = document.querySelector('#deselect-all-tags');

      if (!selectAllBtn || !deselectAllBtn) {
        reject(new Error(`Buttons not found: selectAll=${!!selectAllBtn}, deselectAll=${!!deselectAllBtn}`));
        return;
      }

      // Get all tag toggles
      const tagToggles = document.querySelectorAll('.tag-toggle');
      const initialCount = tagToggles.length;

      if (initialCount === 0) {
        reject(new Error('No tag toggles found'));
        return;
      }

      // First deselect all tags
      deselectAllBtn.click();

      // Wait for deselection to take effect
      setTimeout(() => {
        // Check if deselection worked
        const deselectedCount = document.querySelectorAll('.tag-toggle:not(.selected)').length;
        const allDeselected = deselectedCount === initialCount;

        // Now select all
        selectAllBtn.click();

        // Wait for selection to take effect
        setTimeout(() => {
          // Check if selection worked
          const selectedCount = document.querySelectorAll('.tag-toggle.selected').length;
          const allSelected = selectedCount === initialCount;

          // Return the results through Promise resolution
          resolve({
            initialCount,
            afterDeselect: deselectedCount,
            afterSelect: selectedCount,
            allDeselected,
            allSelected
          });
        }, 300);
      }, 300);
    });
  });
}


/**
 * Get count of unique tags
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Promise<number>} - Number of unique tags
 */
async function getUniqueTagCount(page) {
  return page.evaluate(() => {
    const tags = document.querySelectorAll('.tag-toggle');
    const tagNames = new Set();
    
    tags.forEach(tag => {
      const nameElement = tag.querySelector('span:not(.tag-count)');
      if (nameElement) tagNames.add(nameElement.textContent.trim());
    });
    
    return tagNames.size;
  });
}

module.exports = {
  toggleTagSelection,
  toggleSelectDeselectAllTags,
  getUniqueTagCount
};