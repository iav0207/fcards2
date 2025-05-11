/**
 * Setup Screen component
 * Handles configuration of practice sessions
 */
class SetupScreen {
  /**
   * Creates a new SetupScreen component
   * @param {HTMLElement} container - The container element for the setup screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onBack: () => {},
      onStartSession: () => {},
      ...options
    };
    
    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    
    // Instead of creating new elements, find existing ones
    this._findElements();
    this._attachEventListeners();
  }
  
  /**
   * Finds the DOM elements in the existing HTML
   * @private
   */
  _findElements() {
    // Find the setup screen element from the index.html
    const setupScreen = document.getElementById('setup-screen');
    
    if (!setupScreen) {
      console.error('Setup screen element not found in HTML');
      return;
    }
    
    // Store references to elements we'll need to access
    this.elements = {
      setupScreen,
      sourceLanguage: document.getElementById('source-language'),
      targetLanguage: document.getElementById('target-language'),
      cardCount: document.getElementById('card-count'),
      tagSelectionContainer: document.getElementById('tag-selection-container'),
      tagSelectionHeader: document.getElementById('tag-selection-header'),
      tagSelectionToggle: document.getElementById('tag-selection-toggle'),
      tagSelectionContent: document.getElementById('tag-selection-content'),
      tagSelectionSummary: document.getElementById('tag-selection-summary'),
      tagSelectionStatus: document.getElementById('tag-selection-status'),
      tagCloud: document.getElementById('tag-cloud'),
      untaggedCount: document.getElementById('untagged-count'),
      includeUntagged: document.getElementById('include-untagged'),
      selectAllTagsBtn: document.getElementById('select-all-tags'),
      deselectAllTagsBtn: document.getElementById('deselect-all-tags'),
      backToHomeBtn: document.getElementById('back-to-home-btn'),
      createSessionBtn: document.getElementById('create-session-btn')
    };
  }
  
  /**
   * Attaches event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    // Only attach our listeners if we haven't already (to prevent duplicates)
    if (this.elements.backToHomeBtn && !this.elements.backToHomeBtn._hasSetupListener) {
      this.elements.backToHomeBtn.addEventListener('click', () => {
        this.options.onBack();
      });
      this.elements.backToHomeBtn._hasSetupListener = true;
    }
    
    if (this.elements.createSessionBtn && !this.elements.createSessionBtn._hasSetupListener) {
      this.elements.createSessionBtn.addEventListener('click', () => {
        this._createSession();
      });
      this.elements.createSessionBtn._hasSetupListener = true;
    }
    
    if (this.elements.sourceLanguage && !this.elements.sourceLanguage._hasSetupListener) {
      this.elements.sourceLanguage.addEventListener('change', () => {
        this._loadTagsForSelection(this.elements.sourceLanguage.value);
      });
      this.elements.sourceLanguage._hasSetupListener = true;
    }
    
    if (this.elements.tagSelectionHeader && !this.elements.tagSelectionHeader._hasSetupListener) {
      this.elements.tagSelectionHeader.addEventListener('click', () => {
        this._toggleTagSelectionAccordion();
      });
      this.elements.tagSelectionHeader._hasSetupListener = true;
    }
    
    if (this.elements.selectAllTagsBtn && !this.elements.selectAllTagsBtn._hasSetupListener) {
      this.elements.selectAllTagsBtn.addEventListener('click', () => {
        this._selectAllTags(true);
      });
      this.elements.selectAllTagsBtn._hasSetupListener = true;
    }
    
    if (this.elements.deselectAllTagsBtn && !this.elements.deselectAllTagsBtn._hasSetupListener) {
      this.elements.deselectAllTagsBtn.addEventListener('click', () => {
        this._selectAllTags(false);
      });
      this.elements.deselectAllTagsBtn._hasSetupListener = true;
    }
  }
  
  /**
   * Loads and displays tags for selection
   * @param {string} sourceLanguage - The source language to filter tags by
   * @private
   */
  async _loadTagsForSelection(sourceLanguage) {
    if (!this.elements.tagSelectionContainer) {
      console.error('Tag selection container not found');
      return;
    }
    
    try {
      const tagSelectionContainer = this.elements.tagSelectionContainer;
      const tagCloudContainer = this.elements.tagCloud;
      const untaggedCountElement = this.elements.untaggedCount;
      const tagSummaryElement = this.elements.tagSelectionSummary;
      const tagStatusElement = this.elements.tagSelectionStatus;

      // Show loading
      tagCloudContainer.innerHTML = '<div class="tag-loading">Loading tags...</div>';

      // Fetch tags for the selected source language
      const tagsData = await this.flashcards.getAvailableTags(sourceLanguage);
      console.log('Available tags:', tagsData);

      // Check if we have any tags
      if (tagsData.tags.length === 0 && tagsData.untaggedCount === 0) {
        // No tags and no cards, hide the entire container
        tagSelectionContainer.style.display = 'none';
        return;
      }

      // Show the container
      tagSelectionContainer.style.display = 'block';

      // Update untagged count
      untaggedCountElement.textContent = `(${tagsData.untaggedCount})`;

      // Create tag buttons for each tag
      let tagsHTML = '';
      if (tagsData.tags.length === 0) {
        tagsHTML = '<div class="no-tags-message" role="status">No tags available</div>';
      } else {
        tagsData.tags.forEach((tagData) => {
          tagsHTML += `
            <button
              type="button"
              id="tag-${tagData.tag}"
              class="tag-toggle selected"
              data-tag="${tagData.tag}"
              aria-pressed="true"
              aria-describedby="tag-desc-${tagData.tag}"
              tabindex="0">
              <span>${tagData.tag}</span>
              <span class="tag-count">(${tagData.count})</span>
              <span id="tag-desc-${tagData.tag}" class="sr-only">Toggle selection of tag ${tagData.tag} with ${tagData.count} cards</span>
            </button>
          `;
        });
      }

      // Update the container
      tagCloudContainer.innerHTML = tagsHTML;

      // Update summary text
      const totalTagCount = tagsData.tags.length + (tagsData.untaggedCount > 0 ? 1 : 0);
      tagSummaryElement.textContent = `All ${totalTagCount} tags selected`;

      // Update screen reader status
      tagStatusElement.textContent = `Loaded ${tagsData.tags.length} tags. All ${totalTagCount} tags are currently selected.`;

      // Show tag selection only if there's more than one tag or if there are both tagged and untagged cards
      const hasMultipleTagOptions = tagsData.tags.length > 1 || (tagsData.tags.length === 1 && tagsData.untaggedCount > 0);

      if (!hasMultipleTagOptions) {
        // Just one tag option (or only untagged cards), hide the container
        tagSelectionContainer.style.display = 'none';
      }

      // Add event listeners to the tag buttons
      document.querySelectorAll('.tag-toggle').forEach(button => {
        if (!button._hasTagListener) {
          // Click event
          button.addEventListener('click', () => {
            this._toggleTagSelection(button);
          });
          button._hasTagListener = true;
        }
      });
    } catch (error) {
      console.error('Error loading tags:', error);
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Tag Loading Failed',
          'Failed to load available tags',
          error.message
        );
      } else {
        alert('Error loading tags: ' + error.message);
      }
    }
  }
  
  /**
   * Toggles tag selection status
   * @param {HTMLElement} button - The tag button to toggle
   * @private
   */
  _toggleTagSelection(button) {
    const isSelected = button.classList.contains('selected');
    const newState = !isSelected;
    const tagName = button.dataset.tag || (button.id === 'include-untagged' ? 'untagged cards' : button.textContent.trim());

    // Update button state
    button.classList.toggle('selected', newState);
    button.setAttribute('aria-pressed', newState.toString());

    // Update summary text in the dropdown header
    this._updateTagSelectionSummary();
  }
  
  /**
   * Updates the tag selection summary text
   * @private
   */
  _updateTagSelectionSummary() {
    if (!this.elements.tagSelectionSummary) return;
    
    const totalTagButtons = document.querySelectorAll('.tag-toggle').length;
    const selectedTagButtons = document.querySelectorAll('.tag-toggle.selected').length;
    const tagSummaryElement = this.elements.tagSelectionSummary;
    const tagStatusElement = this.elements.tagSelectionStatus;

    let summaryText = '';
    if (selectedTagButtons === 0) {
      summaryText = 'No tags selected';
    } else if (selectedTagButtons === totalTagButtons) {
      summaryText = `All ${totalTagButtons} tags selected`;
    } else {
      summaryText = `${selectedTagButtons} of ${totalTagButtons} tags selected`;
    }

    tagSummaryElement.textContent = summaryText;
    
    if (tagStatusElement) {
      tagStatusElement.textContent = summaryText;
    }
  }
  
  /**
   * Toggles the tag selection accordion open/closed
   * @private
   */
  _toggleTagSelectionAccordion() {
    if (!this.elements.tagSelectionContent) return;
    
    const content = this.elements.tagSelectionContent;
    const toggle = this.elements.tagSelectionToggle;
    const header = this.elements.tagSelectionHeader;
    const isExpanded = content.classList.contains('open');
    const newState = !isExpanded;

    // Toggle expanded state
    content.classList.toggle('open', newState);

    // Update ARIA attributes and visual indicator
    header.setAttribute('aria-expanded', newState);
    if (toggle) {
      toggle.textContent = newState ? '▲' : '▼';
    }
  }
  
  /**
   * Selects or deselects all tags
   * @param {boolean} selected - Whether to select or deselect all tags
   * @private
   */
  _selectAllTags(selected) {
    const tagButtons = document.querySelectorAll('.tag-toggle');

    tagButtons.forEach(button => {
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected.toString());
    });

    // Update summary
    this._updateTagSelectionSummary();
  }
  
  /**
   * Creates and starts a practice session
   * @private
   */
  async _createSession() {
    if (!this.elements.sourceLanguage || !this.elements.targetLanguage || !this.elements.cardCount) {
      console.error('Required form elements not found');
      return;
    }
    
    try {
      const sourceLanguage = this.elements.sourceLanguage.value;
      const targetLanguage = this.elements.targetLanguage.value;
      const maxCards = parseInt(this.elements.cardCount.value, 10);

      if (sourceLanguage === targetLanguage) {
        if (this.notificationSystem) {
          this.notificationSystem.warning(
            'Invalid Languages',
            'Source and target languages must be different!'
          );
        } else {
          alert('Source and target languages must be different!');
        }
        return;
      }

      const stats = await this.flashcards.getDatabaseStats();
      const useSampleCards = stats.flashcardsCount < 5; // Fallback to samples if not enough cards
      console.log(`Creating session with: sourceLanguage=${sourceLanguage}, targetLanguage=${targetLanguage}, useSampleCards=${useSampleCards}`);

      // If using sample cards, inform the user
      if (useSampleCards && stats.flashcardsCount === 0) {
        if (this.notificationSystem) {
          this.notificationSystem.info(
            'Using Sample Cards',
            'No flashcards found in database. Using sample cards for this session.'
          );
        } else {
          alert('No flashcards found in database. Using sample cards for this session.');
        }
      }

      // Get selected tags if the container is visible
      const tagSelectionContainer = this.elements.tagSelectionContainer;
      let selectedTags = [];
      let includeUntagged = false;

      if (tagSelectionContainer && tagSelectionContainer.style.display !== 'none') {
        // Get all selected tag buttons
        const tagButtons = document.querySelectorAll('.tag-toggle.selected');
        selectedTags = Array.from(tagButtons)
          .filter(button => button.id !== 'include-untagged')
          .map(button => button.dataset.tag);

        // Check if untagged cards should be included
        includeUntagged = this.elements.includeUntagged && 
                         this.elements.includeUntagged.classList.contains('selected');
      }

      console.log('Selected tags:', selectedTags);
      console.log('Include untagged:', includeUntagged);

      const sessionOptions = {
        sourceLanguage,
        targetLanguage,
        maxCards,
        useSampleCards: useSampleCards,
        tags: selectedTags,
        includeUntagged: includeUntagged
      };

      // Call the start session callback with the session options
      this.options.onStartSession(sessionOptions);
    } catch (error) {
      console.error('Error creating session:', error);
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Session Creation Failed',
          'Could not create practice session',
          error.message
        );
      } else {
        alert('Error creating session: ' + error.message);
      }
    }
  }
  
  /**
   * Shows the setup screen
   */
  show() {
    if (!this.elements.setupScreen) {
      console.error('Setup screen element not found');
      return;
    }
    
    this.elements.setupScreen.classList.add('active');
    
    // Load tags for the currently selected source language
    if (this.elements.sourceLanguage) {
      this._loadTagsForSelection(this.elements.sourceLanguage.value);
    }
  }
  
  /**
   * Hides the setup screen
   */
  hide() {
    if (!this.elements.setupScreen) {
      console.error('Setup screen element not found');
      return;
    }
    
    this.elements.setupScreen.classList.remove('active');
  }
  
  /**
   * Updates the setup screen with new data (if needed)
   */
  update() {
    // Could refresh tag data here if needed
    if (this.elements.sourceLanguage) {
      this._loadTagsForSelection(this.elements.sourceLanguage.value);
    }
  }
}

// Export the component for use in UI modules
module.exports = SetupScreen;