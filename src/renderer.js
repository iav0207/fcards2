/**
 * Renderer process entry point
 * This file provides access to our components for the renderer process
 * It's needed because we can't use require() directly in the renderer with contextIsolation
 */

// Setup global handlers
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing application...');
  
  // Initialize app
  initApp();
});

// Initialize the application
function initApp() {
  // Create the app instance
  window.app = new FlashCardsApp();
}

/**
 * Notification Component
 * Provides an interface for displaying notifications
 */
class NotificationComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      duration: 5000, // Default duration in ms
      maxNotifications: 3, // Maximum number of visible notifications
      ...options
    };
    this.notifications = [];
    this.idCounter = 0;
  }
  
  _notify(title, message, details = '', type = 'info', options = {}) {
    const id = `notification-${Date.now()}-${this.idCounter++}`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification ${type}`;
    
    // Create the HTML structure
    notification.innerHTML = `
      <div class="notification-title">
        ${title}
        <span class="notification-close" aria-label="Close notification">&times;</span>
      </div>
      <div class="notification-content">${message}</div>
      ${details ? `<div class="notification-details">${details}</div>` : ''}
      ${options.actions ? `<div class="notification-actions"></div>` : ''}
    `;
    
    // Add actions if provided
    if (options.actions && options.actions.length > 0) {
      const actionsContainer = notification.querySelector('.notification-actions');
      
      options.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'notification-btn';
        button.textContent = action.label;
        button.addEventListener('click', () => {
          if (action.callback) action.callback();
          this.close(id);
        });
        
        actionsContainer.appendChild(button);
      });
    }
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.close(id);
    });
    
    // Add to the container
    this.container.appendChild(notification);
    
    // Add to tracking array
    const notificationData = {
      id,
      element: notification,
      timer: null,
      type
    };
    
    this.notifications.push(notificationData);
    
    // Set timer for automatic closing
    const duration = options.duration || this.options.duration;
    if (duration > 0) {
      notificationData.timer = setTimeout(() => {
        this.close(id);
      }, duration);
    }
    
    // Animate in after a short delay (for proper transition)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Limit the number of notifications
    this._enforceLimit();
    
    return id;
  }
  
  close(id) {
    const index = this.notifications.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const notification = this.notifications[index];
      
      // Clear any existing timer
      if (notification.timer) {
        clearTimeout(notification.timer);
      }
      
      // Remove animation
      notification.element.classList.remove('show');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
      }, 300); // Match the CSS transition duration
      
      // Remove from tracking array
      this.notifications.splice(index, 1);
    }
  }
  
  closeAll() {
    // Create a copy of the array since we'll be modifying it
    const notifications = [...this.notifications];
    
    notifications.forEach(notification => {
      this.close(notification.id);
    });
  }
  
  _enforceLimit() {
    if (this.notifications.length > this.options.maxNotifications) {
      // Close the oldest notifications
      const toRemove = this.notifications.length - this.options.maxNotifications;
      
      for (let i = 0; i < toRemove; i++) {
        this.close(this.notifications[i].id);
      }
    }
  }
  
  info(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'info', options);
  }
  
  success(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'success', options);
  }
  
  warning(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'warning', options);
  }
  
  error(title, message, details = '', options = {}) {
    // Errors are important, so keep them visible longer by default
    const errorOptions = {
      duration: 8000, // 8 seconds
      ...options
    };
    
    return this._notify(title, message, details, 'error', errorOptions);
  }
}

/**
 * Setup Screen component
 * Handles configuration of practice sessions
 */
class SetupScreen {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onBack: () => {},
      onStartSession: () => {},
      ...options
    };
    
    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    
    // Find existing elements
    this._findElements();
    this._attachEventListeners();
  }
  
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
  
  _selectAllTags(selected) {
    const tagButtons = document.querySelectorAll('.tag-toggle');

    tagButtons.forEach(button => {
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected.toString());
    });

    // Update summary
    this._updateTagSelectionSummary();
  }
  
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
  
  hide() {
    if (!this.elements.setupScreen) {
      console.error('Setup screen element not found');
      return;
    }
    
    this.elements.setupScreen.classList.remove('active');
  }
  
  update() {
    // Could refresh tag data here if needed
    if (this.elements.sourceLanguage) {
      this._loadTagsForSelection(this.elements.sourceLanguage.value);
    }
  }
}

/**
 * Main application class
 */
class FlashCardsApp {
  constructor() {
    // Initialize state
    this.state = {
      sessionId: null,
      currentCard: null,
      lastAnswer: null,
      lastEvaluation: null
    };

    // Initialize components
    this.initComponents();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Initialize database stats
    this.loadDatabaseStats();
    
    console.log('FlashCards application initialized');
  }
  
  initComponents() {
    // Get screen elements from the DOM (defined in index.html)
    this.screens = {
      home: document.getElementById('home-screen'),
      setup: document.getElementById('setup-screen'),
      practice: document.getElementById('practice-screen'),
      feedback: document.getElementById('feedback-screen'),
      results: document.getElementById('results-screen'),
      import: document.getElementById('import-screen'),
      operationResult: document.getElementById('operation-result-screen')
    };
    
    // Check if all required screens exist
    const missingScreens = Object.entries(this.screens)
      .filter(([name, element]) => !element)
      .map(([name]) => name);
    
    if (missingScreens.length > 0) {
      console.error(`Missing screen elements: ${missingScreens.join(', ')}`);
    }
    
    // Create notification system
    const notificationContainer = document.getElementById('notification-container');
    this.notificationSystem = new NotificationComponent(notificationContainer);
    
    // Initialize setup screen with container and callbacks
    this.setupScreen = new SetupScreen(document.body, {
      onBack: () => this.showScreen('home'),
      onStartSession: (options) => this.createSession(options),
      notificationSystem: this.notificationSystem,
      flashcards: window.flashcards
    });
  }
  
  attachEventListeners() {
    // Home screen
    document.getElementById('refresh-stats').addEventListener('click', () => this.loadDatabaseStats());
    document.getElementById('create-sample-card').addEventListener('click', () => this.createSampleCard());
    document.getElementById('start-practice-btn').addEventListener('click', () => this.showScreen('setup'));
    document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
    document.getElementById('import-data-btn').addEventListener('click', () => this.showScreen('import'));
    
    // Practice screen
    document.getElementById('submit-answer-btn').addEventListener('click', () => this.submitAnswer());
    document.getElementById('cancel-session-btn').addEventListener('click', () => this.cancelSession());
    
    // Feedback screen
    document.getElementById('next-card-btn').addEventListener('click', () => this.nextCard());
    
    // Results screen
    document.getElementById('back-to-home-from-results-btn').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('start-new-session-btn').addEventListener('click', () => this.showScreen('setup'));
    
    // Import screen
    document.getElementById('back-from-import-btn').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('proceed-import-btn').addEventListener('click', () => this.proceedWithImport());
    document.getElementById('back-to-home-from-result-btn').addEventListener('click', () => this.showScreen('home'));
    
    // Listen for error events from the backend
    window.addEventListener('flashcards:error', (event) => {
      const errorData = event.detail;
      this.notificationSystem.error(
        errorData.title || 'Application Error',
        errorData.message || 'An error occurred',
        errorData.details || ''
      );
    });
  }
  
  showScreen(screenName) {
    // Hide all screens
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });
    
    // Show the requested screen
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
      
      // If showing setup screen, update it
      if (screenName === 'setup') {
        this.setupScreen.show();
      } else if (this.setupScreen && this.screens.setup) {
        this.setupScreen.hide();
      }
    } else {
      console.error(`Screen "${screenName}" not found`);
    }
  }
  
  async loadDatabaseStats() {
    try {
      console.log('Loading database stats...');
      
      // Set loading indicators
      document.getElementById('flashcards-count').textContent = 'Loading...';
      document.getElementById('sessions-count').textContent = 'Loading...';
      document.getElementById('active-sessions-count').textContent = 'Loading...';
      document.getElementById('completed-sessions-count').textContent = 'Loading...';
      
      // Debug: Check if flashcards API is available
      if (!window.flashcards) {
        console.error('Flashcards API not available through window.flashcards');
        throw new Error('Flashcards API not available');
      }
      
      // Debug: List all available API methods
      console.log('Flashcards API methods available:', Object.keys(window.flashcards).join(', '));
      
      // Debug: Check specifically for the getDatabaseStats method
      if (!window.flashcards.getDatabaseStats) {
        console.error('getDatabaseStats method not available');
        throw new Error('getDatabaseStats method not available');
      }
      
      // Attempt to call the getDatabaseStats method with timeout
      console.log('Calling getDatabaseStats...');
      
      // Create a timeout promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getDatabaseStats timed out after 5 seconds')), 5000);
      });
      
      // Race between the actual API call and the timeout
      const stats = await Promise.race([
        window.flashcards.getDatabaseStats(),
        timeout
      ]);
      
      console.log('Database stats received:', stats);
      
      // Validate stats object format
      if (!stats || typeof stats !== 'object') {
        console.error('Invalid stats received:', stats);
        throw new Error('Invalid stats format received');
      }
      
      // Safety checks for each stat
      const flashcardsCount = stats.flashcardsCount ?? 'N/A';
      const sessionsCount = stats.sessionsCount ?? 'N/A';
      const activeSessionsCount = stats.activeSessionsCount ?? 'N/A';
      const completedSessionsCount = stats.completedSessionsCount ?? 'N/A';
      
      // Update UI with stats
      document.getElementById('flashcards-count').textContent = flashcardsCount;
      document.getElementById('sessions-count').textContent = sessionsCount;
      document.getElementById('active-sessions-count').textContent = activeSessionsCount;
      document.getElementById('completed-sessions-count').textContent = completedSessionsCount;
      
      // Show notification if stats were loaded successfully
      if (this.notificationSystem) {
        this.notificationSystem.success(
          'Stats Loaded',
          'Database statistics loaded successfully',
          `Found ${flashcardsCount} flashcards and ${sessionsCount} sessions`
        );
      }
      
      console.log('Database stats UI updated successfully');
      return stats;
    } catch (error) {
      console.error('Error loading database stats:', error);
      
      // Update UI with error state
      document.getElementById('flashcards-count').textContent = 'Error';
      document.getElementById('sessions-count').textContent = 'Error';
      document.getElementById('active-sessions-count').textContent = 'Error';
      document.getElementById('completed-sessions-count').textContent = 'Error';
      
      // Show detailed error notification
      if (this.notificationSystem) {
        // Create a more detailed error message
        let detailedError = error.message;
        
        if (error.message.includes('not available')) {
          detailedError += '\nThe IPC bridge may not be set up correctly. Try restarting the application.';
        } else if (error.message.includes('timed out')) {
          detailedError += '\nThe database may be locked or unresponsive. Try restarting the application.';
        }
        
        this.notificationSystem.error(
          'Stats Loading Failed',
          'Could not load database statistics',
          detailedError
        );
      }
      
      // Manually create a sample card if the error is related to empty database
      if (error.message.includes('empty') || error.message.includes('not found')) {
        console.log('Attempting to create a sample card as a fallback...');
        this.createSampleCard().catch(e => {
          console.error('Failed to create fallback sample card:', e);
        });
      }
      
      return {
        flashcardsCount: 'Error',
        sessionsCount: 'Error',
        activeSessionsCount: 'Error',
        completedSessionsCount: 'Error',
        error: error.message
      };
    }
  }
  
  async createSampleCard() {
    try {
      const sampleCard = {
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A basic greeting',
        userTranslation: '',
        tags: ['greeting', 'basic']
      };
      
      const savedCard = await window.flashcards.saveFlashCard(sampleCard);
      console.log('Sample card created:', savedCard);
      
      // Refresh stats after creating a card
      await this.loadDatabaseStats();
      
      // Show success message
      this.notificationSystem.success(
        'Card Created',
        'Sample flashcard created successfully!',
        `ID: ${savedCard.id}`
      );
    } catch (error) {
      console.error('Error creating sample card:', error);
      this.notificationSystem.error(
        'Card Creation Failed',
        'Could not create sample flashcard',
        error.message
      );
    }
  }
  
  async createSession(options) {
    try {
      console.log('Creating session with options:', options);
      
      const sessionData = await window.flashcards.createGameSession(options);
      
      this.state.sessionId = sessionData.id;
      console.log('Created session:', sessionData);
      
      // Load the first card
      await this.loadCurrentCard();
      
      // Show practice screen
      this.showScreen('practice');
    } catch (error) {
      console.error('Error creating session:', error);
      this.notificationSystem.error(
        'Session Creation Failed',
        'Could not create practice session',
        error.message
      );
    }
  }
  
  async loadCurrentCard() {
    try {
      const cardData = await window.flashcards.getCurrentCard(this.state.sessionId);
      
      if (!cardData) {
        // Session is complete
        this.showResults();
        return;
      }
      
      this.state.currentCard = cardData;
      
      // Update UI
      document.getElementById('card-content').textContent = cardData.card.content;

      // Update progress
      const progressPercent = (cardData.sessionProgress.current / cardData.sessionProgress.total) * 100;
      document.getElementById('session-progress').style.width = `${progressPercent}%`;

      // Display card tags if available
      const tagsContainer = document.getElementById('card-tags');
      tagsContainer.innerHTML = '';

      if (cardData.card.tags && cardData.card.tags.length > 0) {
        cardData.card.tags.forEach(tag => {
          const tagElement = document.createElement('span');
          tagElement.className = 'card-tag';
          tagElement.textContent = tag;
          tagsContainer.appendChild(tagElement);
        });
      }

      // Clear the input
      document.getElementById('translation-input').value = '';

      // Focus the input field for immediate typing
      setTimeout(() => {
        document.getElementById('translation-input').focus();
      }, 100);
    } catch (error) {
      console.error('Error loading current card:', error);
      this.notificationSystem.error(
        'Card Loading Failed',
        'Could not load the current card',
        error.message
      );
    }
  }
  
  async submitAnswer() {
    try {
      const answer = document.getElementById('translation-input').value.trim();
      
      if (!answer) {
        this.notificationSystem.warning(
          'Empty Answer',
          'Please enter a translation before submitting!'
        );
        return;
      }
      
      // Disable submit button to prevent double submission
      const submitBtn = document.getElementById('submit-answer-btn');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Evaluating...';
      
      const result = await window.flashcards.submitAnswer(this.state.sessionId, answer);
      
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      this.state.lastAnswer = answer;
      this.state.lastEvaluation = result;
      
      this.showFeedback(result);
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      // Re-enable submit button
      const submitBtn = document.getElementById('submit-answer-btn');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Answer';
      
      this.notificationSystem.error(
        'Answer Submission Failed',
        'Could not submit your answer',
        error.message
      );
    }
  }
  
  showFeedback(result) {
    // Update progress in the feedback screen
    const progressPercent = (this.state.currentCard.sessionProgress.current / this.state.currentCard.sessionProgress.total) * 100;
    document.getElementById('feedback-progress').style.width = `${progressPercent}%`;
    
    // Show the original text
    document.getElementById('feedback-original').textContent = this.state.currentCard.card.content;
    
    // Show the user's answer
    document.getElementById('feedback-user-answer').textContent = this.state.lastAnswer;
    
    // Show the suggested translation
    document.getElementById('feedback-suggested').textContent = result.referenceTranslation;
    
    // Show the feedback message
    const feedbackElement = document.getElementById('feedback-result');
    feedbackElement.textContent = result.evaluation.feedback;
    
    if (result.evaluation.correct) {
      feedbackElement.classList.add('correct');
      feedbackElement.classList.remove('incorrect');
    } else {
      feedbackElement.classList.add('incorrect');
      feedbackElement.classList.remove('correct');
    }
    
    // Show the feedback screen
    this.showScreen('feedback');
  }
  
  async nextCard() {
    try {
      const result = await window.flashcards.advanceSession(this.state.sessionId);
      
      if (result.isComplete) {
        // Session is complete, show results
        this.showResults();
      } else {
        // Load the next card
        await this.loadCurrentCard();
        this.showScreen('practice');
      }
    } catch (error) {
      console.error('Error advancing session:', error);
      this.notificationSystem.error(
        'Session Advance Failed',
        'Could not advance to the next card',
        error.message
      );
    }
  }
  
  cancelSession() {
    if (!this.state.sessionId) {
      this.notificationSystem.warning(
        'No Active Session',
        'There is no active session to cancel.'
      );
      return;
    }

    // Show confirmation dialog
    if (confirm('Are you sure you want to cancel this practice session? Your progress will not be saved.')) {
      // Reset session state
      this.state.sessionId = null;
      this.state.currentCard = null;

      // Navigate back to home screen
      this.showScreen('home');

      this.notificationSystem.info(
        'Session Cancelled',
        'Practice session has been cancelled.'
      );
    }
  }

  async showResults() {
    try {
      const stats = await window.flashcards.getSessionStats(this.state.sessionId);
      
      // Update results UI
      document.getElementById('results-total').textContent = stats.stats.totalCards;
      document.getElementById('results-correct').textContent = stats.stats.correctCards;
      document.getElementById('results-accuracy').textContent = Math.round(stats.stats.accuracy) + '%';
      
      // Show the results screen
      this.showScreen('results');
      
      // Refresh database stats
      await this.loadDatabaseStats();
    } catch (error) {
      console.error('Error showing results:', error);
      this.notificationSystem.error(
        'Results Loading Failed',
        'Could not load session results',
        error.message
      );
      
      // Go back to home as fallback
      this.showScreen('home');
    }
  }
  
  async exportData() {
    try {
      const result = await window.flashcards.exportDatabase();
      
      if (!result.success) {
        if (result.reason === 'canceled') {
          // User canceled, just go back to home
          this.showScreen('home');
          return;
        }
        
        this.showOperationResult(
          'Export Failed',
          'Failed to export data: ' + (result.reason || 'Unknown error'),
          [],
          'incorrect'
        );
        return;
      }
      
      // Show success screen
      const stats = [
        { label: 'Flashcards', value: result.stats.flashcardsCount },
        { label: 'Sessions', value: result.stats.sessionsCount }
      ];
      
      // Add file path in a separate info item, not as a stat with large font
      document.getElementById('operation-result-path').textContent = result.path;
      document.getElementById('operation-result-path-container').style.display = 'block';
      
      this.showOperationResult(
        'Export Successful',
        'Your data has been successfully exported!',
        stats,
        'correct'
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showOperationResult(
        'Export Error',
        'An error occurred: ' + error.message,
        [],
        'incorrect'
      );
    }
  }
  
  async proceedWithImport() {
    try {
      const importMode = document.getElementById('import-mode').value;
      
      const result = await window.flashcards.importDatabase({ mode: importMode });
      
      if (!result.success) {
        if (result.reason === 'canceled') {
          // User canceled, just go back to home
          this.showScreen('home');
          return;
        }
        
        this.showOperationResult(
          'Import Failed',
          'Failed to import data: ' + (result.reason || 'Unknown error'),
          [],
          'incorrect'
        );
        return;
      }
      
      // Show success screen
      const stats = [
        { label: 'Flashcards Imported', value: result.stats.flashcardsImported },
        { label: 'Sessions Imported', value: result.stats.sessionsImported },
        { label: 'Settings Imported', value: result.stats.settingsImported ? 'Yes' : 'No' }
      ];
      
      if (result.importInfo) {
        stats.push({ label: 'Export Date', value: new Date(result.importInfo.exportDate).toLocaleString() });
        stats.push({ label: 'Exported From', value: `${result.importInfo.appInfo.name} v${result.importInfo.appInfo.version}` });
      }
      
      this.showOperationResult(
        'Import Successful',
        'Your data has been successfully imported!',
        stats,
        'correct'
      );
      
      // Refresh database stats
      await this.loadDatabaseStats();
    } catch (error) {
      console.error('Error importing data:', error);
      this.showOperationResult(
        'Import Error',
        'An error occurred: ' + error.message,
        [],
        'incorrect'
      );
    }
  }
  
  showOperationResult(title, message, stats, resultClass) {
    document.getElementById('operation-result-title').textContent = title;
    
    const resultContent = document.getElementById('operation-result-content');
    resultContent.textContent = message;
    resultContent.className = 'feedback';
    if (resultClass) {
      resultContent.classList.add(resultClass);
    }
    
    // Create stats items
    const statsContainer = document.getElementById('operation-result-stats');
    statsContainer.innerHTML = '';
    
    stats.forEach(stat => {
      const item = document.createElement('div');
      item.className = 'stats-item';
      
      const value = document.createElement('div');
      value.className = 'stats-value';
      value.textContent = stat.value;
      
      const label = document.createElement('div');
      label.className = 'stats-label';
      label.textContent = stat.label;
      
      item.appendChild(value);
      item.appendChild(label);
      statsContainer.appendChild(item);
    });
    
    // Hide path container by default (will be shown only for export)
    document.getElementById('operation-result-path-container').style.display = 'none';
    
    this.showScreen('operationResult');
  }
}