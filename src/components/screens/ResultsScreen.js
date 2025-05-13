/**
 * Results Screen component
 * Displays the final results of a completed practice session
 */
class ResultsScreen {
  /**
   * Creates a new ResultsScreen component
   * @param {HTMLElement} container - The container element for the results screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onBackToHome: () => {},
      onStartNewSession: () => {},
      ...options
    };

    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    this.sessionId = null;
    this.sessionStats = null;

    this.elements = {};
    this._findElements();
    this._attachEventListeners();
  }

  /**
   * Find elements in the DOM
   * @private
   */
  _findElements() {
    // Find the results screen element from the index.html
    const resultsScreen = document.getElementById('results-screen');
    
    if (!resultsScreen) {
      console.error('Results screen element not found in HTML');
      return;
    }
    
    // Store references to elements we'll need to access
    this.elements = {
      resultsScreen,
      totalCards: document.getElementById('results-total'),
      correctCards: document.getElementById('results-correct'),
      accuracy: document.getElementById('results-accuracy'),
      backToHomeBtn: document.getElementById('back-to-home-from-results-btn'),
      startNewSessionBtn: document.getElementById('start-new-session-btn')
    };
  }

  /**
   * Attach event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    if (this.elements.backToHomeBtn && !this.elements.backToHomeBtn._hasResultsListener) {
      this.elements.backToHomeBtn.addEventListener('click', () => {
        this.options.onBackToHome();
      });
      this.elements.backToHomeBtn._hasResultsListener = true;
    }

    if (this.elements.startNewSessionBtn && !this.elements.startNewSessionBtn._hasResultsListener) {
      this.elements.startNewSessionBtn.addEventListener('click', () => {
        this.options.onStartNewSession();
      });
      this.elements.startNewSessionBtn._hasResultsListener = true;
    }
  }

  /**
   * Load session statistics and display results
   * @param {string} sessionId - The session ID
   */
  async loadSessionResults(sessionId) {
    try {
      this.sessionId = sessionId;
      
      const stats = await this.flashcards.getSessionStats(sessionId);
      this.sessionStats = stats;
      
      this._updateResultsUI(stats);
      
      // Show the results screen
      this.show();
      
      // Focus the start new session button for keyboard navigation
      if (this.elements.startNewSessionBtn) {
        setTimeout(() => {
          this.elements.startNewSessionBtn.focus();
        }, 100);
      }
      
      // Refresh database stats in the background
      this._refreshDatabaseStats();
    } catch (error) {
      console.error('Error loading session results:', error);
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Results Loading Failed',
          'Could not load session results',
          error.message
        );
      }
    }
  }

  /**
   * Update the results UI with session statistics
   * @param {Object} stats - Session statistics
   * @private
   */
  _updateResultsUI(stats) {
    if (!stats || !stats.stats) {
      console.error('Invalid stats object:', stats);
      return;
    }
    
    if (this.elements.totalCards) {
      this.elements.totalCards.textContent = stats.stats.totalCards || 0;
    }
    
    if (this.elements.correctCards) {
      this.elements.correctCards.textContent = stats.stats.correctCards || 0;
    }
    
    if (this.elements.accuracy) {
      const accuracy = stats.stats.accuracy || 0;
      this.elements.accuracy.textContent = Math.round(accuracy) + '%';
      
      // Add visual indicator based on accuracy
      this.elements.accuracy.classList.remove('high', 'medium', 'low');
      
      if (accuracy >= 80) {
        this.elements.accuracy.classList.add('high');
      } else if (accuracy >= 50) {
        this.elements.accuracy.classList.add('medium');
      } else {
        this.elements.accuracy.classList.add('low');
      }
    }
  }

  /**
   * Refresh database statistics in the background
   * @private
   */
  async _refreshDatabaseStats() {
    try {
      await this.flashcards.getDatabaseStats();
    } catch (error) {
      console.error('Error refreshing database stats:', error);
    }
  }

  /**
   * Show the results screen
   */
  show() {
    if (!this.elements.resultsScreen) {
      console.error('Results screen element not found');
      return;
    }
    
    this.elements.resultsScreen.classList.add('active');
  }

  /**
   * Hide the results screen
   */
  hide() {
    if (!this.elements.resultsScreen) {
      console.error('Results screen element not found');
      return;
    }
    
    this.elements.resultsScreen.classList.remove('active');
  }

  /**
   * Reset the results screen
   */
  reset() {
    this.sessionId = null;
    this.sessionStats = null;
    
    if (this.elements.totalCards) {
      this.elements.totalCards.textContent = '0';
    }
    
    if (this.elements.correctCards) {
      this.elements.correctCards.textContent = '0';
    }
    
    if (this.elements.accuracy) {
      this.elements.accuracy.textContent = '0%';
      this.elements.accuracy.classList.remove('high', 'medium', 'low');
    }
  }
}

// Export the component for use in UI modules
module.exports = ResultsScreen;