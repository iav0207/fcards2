/**
 * Home Screen component
 * Displays database information, app information, and main navigation buttons
 */
class HomeScreen {
  /**
   * Creates a new HomeScreen component
   * @param {HTMLElement} container - The container element for the home screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onStartPractice: () => {},
      onExportData: () => {},
      onImportData: () => {},
      ...options
    };

    this.flashcards = options.flashcards || window.flashcards;
    this.versions = options.versions || window.versions;
    this.notificationSystem = options.notificationSystem || null;

    this.elements = {};
    this._createElements();
    this._attachEventListeners();
  }

  /**
   * Creates the DOM elements for the home screen
   * @private
   */
  _createElements() {
    this.container.innerHTML = `
      <div id="home-screen" class="screen active">
        <div class="info-container">
          <h2>Database Information</h2>
          <div id="db-stats">
            <div class="info-item">
              <span class="info-label">FlashCards:</span>
              <span class="info-value" id="flashcards-count">Loading...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Practice Sessions:</span>
              <span class="info-value" id="sessions-count">Loading...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Active Sessions:</span>
              <span class="info-value" id="active-sessions-count">Loading...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Completed Sessions:</span>
              <span class="info-value" id="completed-sessions-count">Loading...</span>
            </div>
          </div>
        </div>

        <div class="info-container">
          <h2>App Information</h2>
          <div id="version-info">
            <div class="info-item">
              <span class="info-label">Node.js Version:</span>
              <span class="info-value" id="node-version">Loading...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Chromium Version:</span>
              <span class="info-value" id="chrome-version">Loading...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Electron Version:</span>
              <span class="info-value" id="electron-version">Loading...</span>
            </div>
          </div>
        </div>

        <div class="button-container">
          <button id="start-practice-btn" class="primary-button" style="font-size: 16px; padding: 12px 24px;">Start Practice Session</button>
          <button id="refresh-stats">Refresh Stats</button>
          <button id="create-sample-card">Create Sample Card</button>
        </div>

        <!-- Database Management -->
        <div class="info-container" style="margin-top: 40px;">
          <h2>Database Management</h2>
          <p>Import or export your flashcards, sessions, and settings.</p>
          <div class="button-container">
            <button id="export-data-btn">Export Data</button>
            <button id="import-data-btn">Import Data</button>
          </div>
        </div>
      </div>
    `;

    // Store references to elements we'll need to access
    this.elements = {
      flashcardsCount: this.container.querySelector('#flashcards-count'),
      sessionsCount: this.container.querySelector('#sessions-count'),
      activeSessionsCount: this.container.querySelector('#active-sessions-count'),
      completedSessionsCount: this.container.querySelector('#completed-sessions-count'),
      nodeVersion: this.container.querySelector('#node-version'),
      chromeVersion: this.container.querySelector('#chrome-version'),
      electronVersion: this.container.querySelector('#electron-version'),
      startPracticeBtn: this.container.querySelector('#start-practice-btn'),
      refreshStatsBtn: this.container.querySelector('#refresh-stats'),
      createSampleCardBtn: this.container.querySelector('#create-sample-card'),
      exportDataBtn: this.container.querySelector('#export-data-btn'),
      importDataBtn: this.container.querySelector('#import-data-btn')
    };

    // Load initial data
    this.loadVersionInfo();
    this.loadDatabaseStats();

    // Add test notification button in dev mode
    if (process.env.NODE_ENV === 'development') {
      const testNotificationBtn = document.createElement('button');
      testNotificationBtn.textContent = 'Test Notifications';
      testNotificationBtn.style.marginTop = '20px';

      // Add to button container
      const buttonContainer = this.container.querySelector('.button-container');
      buttonContainer.appendChild(testNotificationBtn);

      this.elements.testNotificationBtn = testNotificationBtn;

      testNotificationBtn.addEventListener('click', () => this._handleTestNotifications());
    }
  }

  /**
   * Attaches event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    this.elements.startPracticeBtn.addEventListener('click', () => {
      this.options.onStartPractice();
    });

    this.elements.refreshStatsBtn.addEventListener('click', () => {
      this.loadDatabaseStats();
    });

    this.elements.createSampleCardBtn.addEventListener('click', () => {
      this.createSampleCard();
    });

    this.elements.exportDataBtn.addEventListener('click', () => {
      this.options.onExportData();
    });

    this.elements.importDataBtn.addEventListener('click', () => {
      this.options.onImportData();
    });
  }

  /**
   * Loads and displays database statistics
   */
  async loadDatabaseStats() {
    try {
      const stats = await this.flashcards.getDatabaseStats();
      this.elements.flashcardsCount.textContent = stats.flashcardsCount;
      this.elements.sessionsCount.textContent = stats.sessionsCount;
      this.elements.activeSessionsCount.textContent = stats.activeSessionsCount;
      this.elements.completedSessionsCount.textContent = stats.completedSessionsCount;
    } catch (error) {
      console.error('Error loading database stats:', error);
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Stats Loading Failed',
          'Failed to load database statistics',
          error.message
        );
      }
    }
  }

  /**
   * Loads and displays version information
   */
  loadVersionInfo() {
    this.elements.nodeVersion.textContent = this.versions.node();
    this.elements.chromeVersion.textContent = this.versions.chrome();
    this.elements.electronVersion.textContent = this.versions.electron();
  }

  /**
   * Creates a sample flashcard
   */
  async createSampleCard() {
    try {
      const sampleCard = {
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A basic greeting',
        userTranslation: '',
        tags: ['greeting', 'basic']
      };

      const savedCard = await this.flashcards.saveFlashCard(sampleCard);
      console.log('Sample card created:', savedCard);

      // Refresh stats after creating a card
      await this.loadDatabaseStats();

      // Show success notification
      if (this.notificationSystem) {
        this.notificationSystem.success('Card Created', 'Sample card created successfully!');
      }
    } catch (error) {
      console.error('Error creating sample card:', error);

      // Show error notification
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Card Creation Failed',
          'Failed to create sample card',
          error.message
        );
      }
    }
  }

  /**
   * Tests notification system functionality (dev mode only)
   * @private
   */
  _handleTestNotifications() {
    if (!this.notificationSystem) return;

    this.notificationSystem.info('Info Notification', 'This is a sample info notification.');

    setTimeout(() => {
      this.notificationSystem.success('Success Notification', 'This is a sample success notification.');
    }, 1000);

    setTimeout(() => {
      this.notificationSystem.warning('Warning Notification', 'This is a sample warning notification.');
    }, 2000);

    setTimeout(() => {
      this.notificationSystem.error(
        'Error Notification',
        'This is a sample error notification.',
        'Here are some details about the error that would help with debugging.'
      );
    }, 3000);
  }

  /**
   * Shows the home screen
   */
  show() {
    const screenElement = this.container.querySelector('#home-screen');
    screenElement.classList.add('active');
  }

  /**
   * Hides the home screen
   */
  hide() {
    const screenElement = this.container.querySelector('#home-screen');
    screenElement.classList.remove('active');
  }

  /**
   * Updates the home screen with new data
   */
  update() {
    this.loadDatabaseStats();
  }
}

// Export the component for use in UI modules
module.exports = HomeScreen;