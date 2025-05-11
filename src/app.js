/**
 * Main application file
 * Initializes components and manages application flow
 */

// Import screen components
const SetupScreen = require('./components/screens/SetupScreen');
const NotificationComponent = require('./components/NotificationComponent');

// Main app class
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
  
  /**
   * Initialize application components
   */
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
  
  /**
   * Attach global event listeners for the application
   */
  attachEventListeners() {
    // Home screen
    document.getElementById('refresh-stats').addEventListener('click', () => this.loadDatabaseStats());
    document.getElementById('create-sample-card').addEventListener('click', () => this.createSampleCard());
    document.getElementById('start-practice-btn').addEventListener('click', () => this.showScreen('setup'));
    document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
    document.getElementById('import-data-btn').addEventListener('click', () => this.showScreen('import'));
    
    // Practice screen
    document.getElementById('submit-answer-btn').addEventListener('click', () => this.submitAnswer());
    
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
  
  /**
   * Shows the specified screen and hides others
   * @param {string} screenName - The name of the screen to show
   */
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
  
  /**
   * Load and display database statistics
   */
  async loadDatabaseStats() {
    try {
      const stats = await window.flashcards.getDatabaseStats();
      document.getElementById('flashcards-count').textContent = stats.flashcardsCount;
      document.getElementById('sessions-count').textContent = stats.sessionsCount;
      document.getElementById('active-sessions-count').textContent = stats.activeSessionsCount;
      document.getElementById('completed-sessions-count').textContent = stats.completedSessionsCount;
      console.log('Database stats loaded', stats);
    } catch (error) {
      console.error('Error loading database stats:', error);
      this.notificationSystem.error(
        'Stats Loading Failed',
        'Could not load database statistics',
        error.message
      );
    }
  }
  
  /**
   * Create a sample flashcard
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
  
  /**
   * Create and start a practice session
   * @param {Object} options - Session creation options
   */
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
  
  /**
   * Load the current card in the active session
   */
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
      
      // Clear the input
      document.getElementById('translation-input').value = '';
    } catch (error) {
      console.error('Error loading current card:', error);
      this.notificationSystem.error(
        'Card Loading Failed',
        'Could not load the current card',
        error.message
      );
    }
  }
  
  /**
   * Submit an answer for evaluation
   */
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
  
  /**
   * Show feedback for the submitted answer
   * @param {Object} result - The evaluation result
   */
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
  
  /**
   * Advance to the next card
   */
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
  
  /**
   * Show the results screen with session statistics
   */
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
  
  /**
   * Export database data
   */
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
  
  /**
   * Process database import
   */
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
  
  /**
   * Display operation result screen
   * @param {string} title - The operation title
   * @param {string} message - The result message
   * @param {Array} stats - Statistics to display
   * @param {string} resultClass - CSS class for styling (correct/incorrect)
   */
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FlashCardsApp();
});

// Export the app for testing
module.exports = FlashCardsApp;