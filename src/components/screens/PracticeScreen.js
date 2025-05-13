/**
 * Practice Screen component
 * Displays the current flashcard and allows the user to submit a translation
 */
class PracticeScreen {
  /**
   * Creates a new PracticeScreen component
   * @param {HTMLElement} container - The container element for the practice screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSubmitAnswer: () => {},
      ...options
    };

    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    this.sessionId = null;
    this.currentCard = null;

    this.elements = {};
    this._findElements();
    this._attachEventListeners();
  }

  /**
   * Find elements in the DOM
   * @private
   */
  _findElements() {
    // Find the practice screen element from the index.html
    const practiceScreen = document.getElementById('practice-screen');
    
    if (!practiceScreen) {
      console.error('Practice screen element not found in HTML');
      return;
    }
    
    // Store references to elements we'll need to access
    this.elements = {
      practiceScreen,
      progressBar: document.getElementById('session-progress'),
      cardContent: document.getElementById('card-content'),
      translationInput: document.getElementById('translation-input'),
      submitButton: document.getElementById('submit-answer-btn')
    };
  }

  /**
   * Attach event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    if (this.elements.submitButton && !this.elements.submitButton._hasPracticeListener) {
      this.elements.submitButton.addEventListener('click', () => {
        this._submitAnswer();
      });
      this.elements.submitButton._hasPracticeListener = true;
    }

    // Add keyboard shortcut for submitting (Ctrl+Enter or Cmd+Enter)
    if (this.elements.translationInput && !this.elements.translationInput._hasPracticeListener) {
      this.elements.translationInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this._submitAnswer();
        }
      });
      this.elements.translationInput._hasPracticeListener = true;
    }
  }

  /**
   * Submit the current answer
   * @private
   */
  async _submitAnswer() {
    if (!this.sessionId) {
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Session Error',
          'No active session found.',
          'Please restart the practice session.'
        );
      }
      return;
    }

    try {
      const answer = this.elements.translationInput.value.trim();
      
      if (!answer) {
        if (this.notificationSystem) {
          this.notificationSystem.warning(
            'Empty Answer',
            'Please enter a translation before submitting!'
          );
        }
        return;
      }
      
      // Disable submit button to prevent double submission
      this.elements.submitButton.disabled = true;
      const originalText = this.elements.submitButton.textContent;
      this.elements.submitButton.textContent = 'Evaluating...';
      
      // Call the submit answer handler
      await this.options.onSubmitAnswer(this.sessionId, answer);
      
      // Re-enable submit button (in case of error, the feedback screen won't show)
      this.elements.submitButton.disabled = false;
      this.elements.submitButton.textContent = originalText;
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      // Re-enable submit button
      if (this.elements.submitButton) {
        this.elements.submitButton.disabled = false;
        this.elements.submitButton.textContent = 'Submit Answer';
      }
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Answer Submission Failed',
          'Could not submit your answer',
          error.message
        );
      }
    }
  }

  /**
   * Load the current card for the session
   * @param {string} sessionId - The session ID
   * @returns {Promise<void>}
   */
  async loadCurrentCard(sessionId) {
    try {
      this.sessionId = sessionId;
      
      const cardData = await this.flashcards.getCurrentCard(sessionId);
      
      if (!cardData) {
        // Session is complete
        if (this.options.onSessionComplete) {
          this.options.onSessionComplete();
        }
        return;
      }
      
      this.currentCard = cardData;
      
      // Update UI
      if (this.elements.cardContent) {
        this.elements.cardContent.textContent = cardData.card.content;
      }
      
      // Update progress
      if (this.elements.progressBar) {
        const progressPercent = (cardData.sessionProgress.current / cardData.sessionProgress.total) * 100;
        this.elements.progressBar.style.width = `${progressPercent}%`;
      }
      
      // Clear the input
      if (this.elements.translationInput) {
        this.elements.translationInput.value = '';
        
        // Focus the input field for immediate typing
        setTimeout(() => {
          this.elements.translationInput.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading current card:', error);
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Card Loading Failed',
          'Could not load the current card',
          error.message
        );
      }
    }
  }

  /**
   * Show the practice screen
   */
  show() {
    if (!this.elements.practiceScreen) {
      console.error('Practice screen element not found');
      return;
    }
    
    this.elements.practiceScreen.classList.add('active');
    
    // Focus the input field
    if (this.elements.translationInput) {
      setTimeout(() => {
        this.elements.translationInput.focus();
      }, 100);
    }
  }

  /**
   * Hide the practice screen
   */
  hide() {
    if (!this.elements.practiceScreen) {
      console.error('Practice screen element not found');
      return;
    }
    
    this.elements.practiceScreen.classList.remove('active');
  }

  /**
   * Reset the practice screen for a new session
   */
  reset() {
    this.sessionId = null;
    this.currentCard = null;
    
    if (this.elements.cardContent) {
      this.elements.cardContent.textContent = '';
    }
    
    if (this.elements.translationInput) {
      this.elements.translationInput.value = '';
    }
    
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = '0%';
    }
  }
}

// Export the component for use in UI modules
module.exports = PracticeScreen;