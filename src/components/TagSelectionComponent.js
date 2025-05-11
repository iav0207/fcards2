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
      onToggleAccordion: () => {}, // Default empty callback
      flashcards: null,
      sourceLanguage: 'en',
      ...options
    };
    
    this.selectedTags = [];
    this.includeUntagged = true;
    
    // References to DOM elements
    this.elements = {};
    
    // Create or find elements
    this._findElements();
    
    // Attach event listeners
    this._attachEventListeners();
  }
  
  /**
   * Find the tag selection elements in the DOM
   * @private
   */
  _findElements() {
    // Check if container already has the necessary elements
    const existingHeader = this.container.querySelector('.tag-selection-header');
    
    if (existingHeader) {
      // Find existing elements
      this.elements = {
        header: existingHeader,
        content: this.container.querySelector('.tag-selection-content'),
        summary: this.container.querySelector('.tag-selection-summary'),
        toggle: this.container.querySelector('.tag-selection-toggle'),
        status: this.container.querySelector('.tag-selection-status'),
        tagCloud: this.container.querySelector('.tag-cloud'),
        untaggedBtn: this.container.querySelector('#include-untagged'),
        selectAllBtn: this.container.querySelector('.tag-action-btn#select-all-tags'),
        deselectAllBtn: this.container.querySelector('.tag-action-btn#deselect-all-tags')
      };
    } else {
      // Create new elements
      const tagSelectionHTML = `
        <div class="tag-selection-container">
          <button
            class="tag-selection-header"
            aria-expanded="false"
            aria-controls="tag-selection-content"
            aria-haspopup="true">
            <span>Select Tags</span>
            <span class="tag-selection-summary" aria-live="polite">All tags selected</span>
            <span class="tag-selection-toggle" aria-hidden="true">▼</span>
          </button>
          <div
            class="tag-selection-content"
            role="region"
            aria-labelledby="tag-selection-header">

            <!-- Selection status announced to screen readers but visually hidden -->
            <div class="sr-only" aria-live="polite" class="tag-selection-status"></div>

            <!-- Tag Cloud -->
            <div class="tag-cloud" role="group" aria-label="Available tags">
              <div class="tag-loading">Loading tags...</div>
            </div>

            <!-- Untagged option as a button -->
            <button
              type="button"
              id="include-untagged"
              class="tag-toggle selected"
              aria-pressed="true"
              aria-describedby="untagged-desc">
              <span>Untagged cards</span>
              <span class="tag-count">(0)</span>
              <span id="untagged-desc" class="sr-only">Toggle selection of cards without tags</span>
            </button>

            <!-- Actions -->
            <div class="tag-selection-actions">
              <button
                type="button"
                class="tag-action-btn"
                id="select-all-tags"
                aria-controls="tag-cloud include-untagged">
                Select All
              </button>
              <button
                type="button"
                class="tag-action-btn"
                id="deselect-all-tags"
                aria-controls="tag-cloud include-untagged">
                Deselect All
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Set container HTML
      this.container.innerHTML = tagSelectionHTML;
      
      // Store references to the new elements
      this.elements = {
        header: this.container.querySelector('.tag-selection-header'),
        content: this.container.querySelector('.tag-selection-content'),
        summary: this.container.querySelector('.tag-selection-summary'),
        toggle: this.container.querySelector('.tag-selection-toggle'),
        status: this.container.querySelector('.tag-selection-status'),
        tagCloud: this.container.querySelector('.tag-cloud'),
        untaggedBtn: this.container.querySelector('#include-untagged'),
        selectAllBtn: this.container.querySelector('#select-all-tags'),
        deselectAllBtn: this.container.querySelector('#deselect-all-tags')
      };
    }
  }
  
  /**
   * Attach event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    // Toggle accordion open/closed
    if (this.elements.header && !this.elements.header._hasTagListener) {
      this.elements.header.addEventListener('click', () => {
        this._toggleAccordion();
      });
      this.elements.header._hasTagListener = true;
    }
    
    // Toggle untagged cards
    if (this.elements.untaggedBtn && !this.elements.untaggedBtn._hasTagListener) {
      this.elements.untaggedBtn.addEventListener('click', () => {
        this._toggleUntagged();
      });
      this.elements.untaggedBtn._hasTagListener = true;
    }
    
    // Select all tags
    if (this.elements.selectAllBtn && !this.elements.selectAllBtn._hasTagListener) {
      this.elements.selectAllBtn.addEventListener('click', () => {
        this._selectAll(true);
      });
      this.elements.selectAllBtn._hasTagListener = true;
    }
    
    // Deselect all tags
    if (this.elements.deselectAllBtn && !this.elements.deselectAllBtn._hasTagListener) {
      this.elements.deselectAllBtn.addEventListener('click', () => {
        this._selectAll(false);
      });
      this.elements.deselectAllBtn._hasTagListener = true;
    }
  }
  
  /**
   * Toggle the accordion open/closed
   * @private
   */
  _toggleAccordion() {
    const content = this.elements.content;
    const toggle = this.elements.toggle;
    const header = this.elements.header;
    
    if (!content || !header) return;
    
    const isExpanded = content.classList.contains('open');
    const newState = !isExpanded;
    
    // Toggle expanded state
    content.classList.toggle('open', newState);
    
    // Update ARIA attributes and visual indicator
    header.setAttribute('aria-expanded', newState);
    if (toggle) {
      toggle.textContent = newState ? '▲' : '▼';
    }
    
    // Call the callback if provided
    if (this.options.onToggleAccordion) {
      this.options.onToggleAccordion(newState);
    }
  }
  
  /**
   * Toggle inclusion of untagged cards
   * @private
   */
  _toggleUntagged() {
    if (!this.elements.untaggedBtn) return;
    
    this.includeUntagged = !this.includeUntagged;
    this.elements.untaggedBtn.classList.toggle('selected', this.includeUntagged);
    this.elements.untaggedBtn.setAttribute('aria-pressed', this.includeUntagged.toString());
    
    // Update summary
    this._updateSummary();
    
    // Call the onChange callback
    this._notifyChange();
  }
  
  /**
   * Select or deselect all tags
   * @param {boolean} selected - Whether to select or deselect all tags
   * @private
   */
  _selectAll(selected) {
    if (!this.elements.tagCloud) return;
    
    // Update tag buttons
    const tagButtons = this.elements.tagCloud.querySelectorAll('.tag-toggle');
    tagButtons.forEach(button => {
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected.toString());
    });
    
    // Update untagged button
    if (this.elements.untaggedBtn) {
      this.includeUntagged = selected;
      this.elements.untaggedBtn.classList.toggle('selected', selected);
      this.elements.untaggedBtn.setAttribute('aria-pressed', selected.toString());
    }
    
    // Update selectedTags array
    if (selected) {
      this.selectedTags = Array.from(tagButtons).map(button => button.dataset.tag);
    } else {
      this.selectedTags = [];
    }
    
    // Update summary
    this._updateSummary();
    
    // Call the onChange callback
    this._notifyChange();
  }
  
  /**
   * Toggle selection of a specific tag
   * @param {HTMLElement} button - The tag button to toggle
   * @private
   */
  _toggleTag(button) {
    if (!button) return;
    
    const tag = button.dataset.tag;
    const isSelected = button.classList.contains('selected');
    const newState = !isSelected;
    
    // Update button state
    button.classList.toggle('selected', newState);
    button.setAttribute('aria-pressed', newState.toString());
    
    // Update selectedTags array
    if (newState) {
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    }
    
    // Update summary
    this._updateSummary();
    
    // Call the onChange callback
    this._notifyChange();
  }
  
  /**
   * Update the summary text
   * @private
   */
  _updateSummary() {
    if (!this.elements.summary) return;
    
    const tagButtons = this.elements.tagCloud ? this.elements.tagCloud.querySelectorAll('.tag-toggle') : [];
    const totalCount = tagButtons.length + 1; // +1 for untagged
    
    const selectedTagButtons = this.elements.tagCloud ? 
      this.elements.tagCloud.querySelectorAll('.tag-toggle.selected') : [];
    const selectedCount = selectedTagButtons.length + (this.includeUntagged ? 1 : 0);
    
    let summaryText = '';
    if (selectedCount === 0) {
      summaryText = 'No tags selected';
    } else if (selectedCount === totalCount) {
      summaryText = `All ${totalCount} tags selected`;
    } else {
      summaryText = `${selectedCount} of ${totalCount} tags selected`;
    }
    
    this.elements.summary.textContent = summaryText;
    
    // Update screen reader status if available
    if (this.elements.status) {
      this.elements.status.textContent = summaryText;
    }
  }
  
  /**
   * Notify about selection changes
   * @private
   */
  _notifyChange() {
    if (this.options.onChange) {
      this.options.onChange({
        selectedTags: this.selectedTags,
        includeUntagged: this.includeUntagged
      });
    }
  }
  
  /**
   * Load tags from the database for the specified source language
   * @param {string} sourceLanguage - The source language to filter tags by
   * @returns {Promise<Object>} The loaded tags data
   */
  async loadTags(sourceLanguage) {
    if (!this.elements.tagCloud) return;
    
    // Show loading indicator
    this.elements.tagCloud.innerHTML = '<div class="tag-loading">Loading tags...</div>';
    
    try {
      // Use provided flashcards service or window.flashcards as fallback
      const flashcardsService = this.options.flashcards || window.flashcards;
      
      if (!flashcardsService) {
        throw new Error('Flashcards service not available');
      }
      
      // Fetch the tags
      const tagsData = await flashcardsService.getAvailableTags(sourceLanguage);
      
      // Check if we have any tags to display
      if (tagsData.tags.length === 0 && tagsData.untaggedCount === 0) {
        // No tags and no cards, hide the container
        this.container.style.display = 'none';
        return tagsData;
      }
      
      // Show the container
      this.container.style.display = 'block';
      
      // Update untagged count
      if (this.elements.untaggedBtn) {
        const countElement = this.elements.untaggedBtn.querySelector('.tag-count');
        if (countElement) {
          countElement.textContent = `(${tagsData.untaggedCount})`;
        }
      }
      
      // Build the tag buttons
      let tagsHTML = '';
      if (tagsData.tags.length === 0) {
        tagsHTML = '<div class="no-tags-message" role="status">No tags available</div>';
      } else {
        tagsData.tags.forEach((tagData) => {
          tagsHTML += `
            <button
              type="button"
              id="tag-${tagData.tag.replace(/\s+/g, '-')}"
              class="tag-toggle selected"
              data-tag="${tagData.tag}"
              aria-pressed="true"
              aria-describedby="tag-desc-${tagData.tag.replace(/\s+/g, '-')}">
              <span>${tagData.tag}</span>
              <span class="tag-count">(${tagData.count})</span>
              <span id="tag-desc-${tagData.tag.replace(/\s+/g, '-')}" class="sr-only">Toggle selection of tag ${tagData.tag} with ${tagData.count} cards</span>
            </button>
          `;
        });
      }
      
      // Update the tag cloud
      this.elements.tagCloud.innerHTML = tagsHTML;
      
      // Add event listeners to the tag buttons
      const tagButtons = this.elements.tagCloud.querySelectorAll('.tag-toggle');
      tagButtons.forEach(button => {
        if (!button._hasTagListener) {
          button.addEventListener('click', () => {
            this._toggleTag(button);
          });
          button._hasTagListener = true;
        }
      });
      
      // Update the selected tags array with all tags initially
      this.selectedTags = Array.from(tagButtons).map(button => button.dataset.tag);
      
      // Update summary
      this._updateSummary();
      
      // Close the accordion initially
      if (this.elements.content) {
        this.elements.content.classList.remove('open');
      }
      if (this.elements.toggle) {
        this.elements.toggle.textContent = '▼';
      }
      if (this.elements.header) {
        this.elements.header.setAttribute('aria-expanded', 'false');
      }
      
      return tagsData;
    } catch (error) {
      console.error('Error loading tags:', error);
      this.elements.tagCloud.innerHTML = '<div class="tag-error">Error loading tags</div>';
      
      // Hide the container if there's an error
      this.container.style.display = 'none';
      
      throw error;
    }
  }
  
  /**
   * Get the current selection state
   * @returns {Object} Object containing selectedTags array and includeUntagged boolean
   */
  getSelection() {
    return {
      selectedTags: this.selectedTags,
      includeUntagged: this.includeUntagged
    };
  }
  
  /**
   * Set the selection state
   * @param {string[]} tags - Array of tags to select
   * @param {boolean} includeUntagged - Whether to include untagged cards
   */
  setSelection(tags = [], includeUntagged = true) {
    this.selectedTags = Array.isArray(tags) ? [...tags] : [];
    this.includeUntagged = !!includeUntagged;
    
    // Update UI to match the selection
    if (this.elements.tagCloud) {
      const tagButtons = this.elements.tagCloud.querySelectorAll('.tag-toggle');
      tagButtons.forEach(button => {
        const tag = button.dataset.tag;
        const isSelected = this.selectedTags.includes(tag);
        button.classList.toggle('selected', isSelected);
        button.setAttribute('aria-pressed', isSelected.toString());
      });
    }
    
    if (this.elements.untaggedBtn) {
      this.elements.untaggedBtn.classList.toggle('selected', this.includeUntagged);
      this.elements.untaggedBtn.setAttribute('aria-pressed', this.includeUntagged.toString());
    }
    
    // Update summary
    this._updateSummary();
  }
  
  /**
   * Show or hide the component
   * @param {boolean} visible - Whether to show or hide the component
   */
  setVisible(visible) {
    this.container.style.display = visible ? 'block' : 'none';
  }
  
  /**
   * Check if the component is currently visible
   * @returns {boolean} Whether the component is visible
   */
  isVisible() {
    return this.container.style.display !== 'none';
  }
  
  /**
   * Clear all selections
   */
  clear() {
    this.selectedTags = [];
    this.includeUntagged = true;
    
    // Update UI
    if (this.elements.tagCloud) {
      const tagButtons = this.elements.tagCloud.querySelectorAll('.tag-toggle');
      tagButtons.forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      });
    }
    
    if (this.elements.untaggedBtn) {
      this.elements.untaggedBtn.classList.add('selected');
      this.elements.untaggedBtn.setAttribute('aria-pressed', 'true');
    }
    
    // Update summary
    this._updateSummary();
  }
}

// Export the component for use in UI modules
module.exports = TagSelectionComponent;