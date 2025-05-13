/**
 * Feedback Screen component
 * Displays feedback for the user's translation attempt
 */
class FeedbackScreen {
  /**
   * Creates a new FeedbackScreen component
   * @param {HTMLElement} container - The container element for the feedback screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onNextCard: () => {},
      ...options
    };

    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    this.sessionId = null;
    this.evaluationResult = null;
    this.lastAnswer = null;
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
    // Find the feedback screen element from the index.html
    const feedbackScreen = document.getElementById('feedback-screen');
    
    if (!feedbackScreen) {
      console.error('Feedback screen element not found in HTML');
      return;
    }
    
    // Store references to elements we'll need to access
    this.elements = {
      feedbackScreen,
      progressBar: document.getElementById('feedback-progress'),
      originalText: document.getElementById('feedback-original'),
      userAnswer: document.getElementById('feedback-user-answer'),
      suggestedTranslation: document.getElementById('feedback-suggested'),
      feedbackResult: document.getElementById('feedback-result'),
      nextButton: document.getElementById('next-card-btn')
    };
  }

  /**
   * Attach event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    if (this.elements.nextButton && !this.elements.nextButton._hasFeedbackListener) {
      this.elements.nextButton.addEventListener('click', () => {
        this._nextCard();
      });
      this.elements.nextButton._hasFeedbackListener = true;
    }

    // Add keyboard shortcut for next card (Space, Enter)
    document.addEventListener('keydown', (e) => {
      // Only if the feedback screen is active
      if (this.elements.feedbackScreen && 
          this.elements.feedbackScreen.classList.contains('active') &&
          (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        this._nextCard();
      }
    });
  }

  /**
   * Advance to the next card
   * @private
   */
  async _nextCard() {
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
      // Disable button to prevent multiple clicks
      if (this.elements.nextButton) {
        this.elements.nextButton.disabled = true;
      }
      
      // Call the next card handler
      await this.options.onNextCard(this.sessionId);
      
      // Re-enable button (in case of error, this will ensure it's enabled)
      if (this.elements.nextButton) {
        this.elements.nextButton.disabled = false;
      }
    } catch (error) {
      console.error('Error advancing to next card:', error);
      
      // Re-enable button
      if (this.elements.nextButton) {
        this.elements.nextButton.disabled = false;
      }
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Navigation Failed',
          'Could not advance to the next card',
          error.message
        );
      }
    }
  }

  /**
   * Display feedback for the user's answer
   * @param {Object} data - Feedback data
   * @param {Object} data.card - The current card data
   * @param {Object} data.evaluation - The evaluation result
   * @param {string} data.userAnswer - The user's submitted answer
   * @param {Object} data.sessionProgress - Session progress information
   * @param {string} data.sessionId - The session ID
   */
  showFeedback(data) {
    this.sessionId = data.sessionId;
    this.evaluationResult = data.evaluation;
    this.lastAnswer = data.userAnswer;
    this.currentCard = data.card;
    
    // Update progress in the feedback screen
    if (this.elements.progressBar && data.sessionProgress) {
      const progressPercent = (data.sessionProgress.current / data.sessionProgress.total) * 100;
      this.elements.progressBar.style.width = `${progressPercent}%`;
    }
    
    // Show the original text
    if (this.elements.originalText && data.card) {
      this.elements.originalText.textContent = data.card.content;
    }
    
    // Show the user's answer
    if (this.elements.userAnswer) {
      this.elements.userAnswer.textContent = data.userAnswer || '';
    }
    
    // Show the suggested translation
    if (this.elements.suggestedTranslation) {
      this.elements.suggestedTranslation.textContent = data.evaluation.suggestedTranslation || '';
    }
    
    // Show the feedback message
    if (this.elements.feedbackResult) {
      const feedbackElement = this.elements.feedbackResult;
      feedbackElement.textContent = data.evaluation.feedback || '';
      
      // Update CSS classes based on correctness
      if (data.evaluation.correct) {
        feedbackElement.classList.add('correct');
        feedbackElement.classList.remove('incorrect');
      } else {
        feedbackElement.classList.add('incorrect');
        feedbackElement.classList.remove('correct');
      }
    }
    
    // Show the feedback screen
    this.show();
    
    // Focus the next button for keyboard navigation
    if (this.elements.nextButton) {
      setTimeout(() => {
        this.elements.nextButton.focus();
      }, 100);
    }
  }

  /**
   * Show the feedback screen
   */
  show() {
    if (!this.elements.feedbackScreen) {
      console.error('Feedback screen element not found');
      return;
    }
    
    this.elements.feedbackScreen.classList.add('active');
  }

  /**
   * Hide the feedback screen
   */
  hide() {
    if (!this.elements.feedbackScreen) {
      console.error('Feedback screen element not found');
      return;
    }
    
    this.elements.feedbackScreen.classList.remove('active');
  }

  /**
   * Reset the feedback screen
   */
  reset() {
    this.sessionId = null;
    this.evaluationResult = null;
    this.lastAnswer = null;
    this.currentCard = null;
    
    if (this.elements.originalText) {
      this.elements.originalText.textContent = '';
    }
    
    if (this.elements.userAnswer) {
      this.elements.userAnswer.textContent = '';
    }
    
    if (this.elements.suggestedTranslation) {
      this.elements.suggestedTranslation.textContent = '';
    }
    
    if (this.elements.feedbackResult) {
      this.elements.feedbackResult.textContent = '';
      this.elements.feedbackResult.classList.remove('correct', 'incorrect');
    }
    
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = '0%';
    }
  }
}

// Export the component for use in UI modules
module.exports = FeedbackScreen;