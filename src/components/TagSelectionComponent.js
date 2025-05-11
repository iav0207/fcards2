/**
 * Tag selection component for selecting tags in practice sessions
 */
class TagSelectionComponent {
  /**
   * Creates a new TagSelectionComponent
   * @param {HTMLElement} container - The container element for tag selection
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onChange: () => {}, // Default empty callback
      ...options
    };
    this.selectedTags = [];
    this.includeUntagged = true;
  }

  // Component methods will be implemented here
}

// Export the component for use in UI modules
module.exports = TagSelectionComponent;