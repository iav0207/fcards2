const { generateId } = require('../utils/helpers');

/**
 * Session class for tracking practice sessions
 */
class Session {
  /**
   * Create a new practice session
   * @param {Object} data - Session data
   * @param {string} [data.id] - Session ID
   * @param {string} [data.sourceLanguage] - Source language ISO code
   * @param {string} [data.targetLanguage] - Target language ISO code
   * @param {string[]} [data.cardIds] - Array of card IDs to practice
   * @param {number} [data.currentCardIndex] - Current position in the card list
   * @param {Array} [data.responses] - User's responses during the session
   * @param {Date|string} [data.createdAt] - Creation timestamp
   * @param {Date|string|null} [data.completedAt] - Completion timestamp
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.sourceLanguage = data.sourceLanguage || 'en';
    this.targetLanguage = data.targetLanguage || 'en';
    this.cardIds = data.cardIds || [];
    this.currentCardIndex = data.currentCardIndex || 0;
    this.responses = data.responses || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
  }

  /**
   * Record a response for the current card
   * @param {string} cardId - The ID of the card being responded to
   * @param {string} userResponse - The user's translation response
   * @param {boolean} correct - Whether the response was correct
   */
  recordResponse(cardId, userResponse, correct) {
    this.responses.push({
      cardId,
      userResponse,
      correct,
      timestamp: new Date()
    });
  }

  /**
   * Move to the next card
   * @returns {boolean} - True if there are more cards, false if session is complete
   */
  nextCard() {
    if (this.currentCardIndex < this.cardIds.length - 1) {
      this.currentCardIndex++;
      return true;
    }
    
    // Mark session as completed if we've gone through all cards
    if (this.currentCardIndex === this.cardIds.length - 1 && !this.completedAt) {
      this.completedAt = new Date();
    }
    
    return false;
  }

  /**
   * Get the current card ID
   * @returns {string|null} - The current card ID or null if no cards
   */
  getCurrentCardId() {
    if (this.cardIds.length === 0) {
      return null;
    }
    return this.cardIds[this.currentCardIndex];
  }

  /**
   * Get session statistics
   * @returns {Object} - Session statistics
   */
  getStats() {
    const totalCards = this.cardIds.length;
    const answeredCards = this.responses.length;
    const correctCards = this.responses.filter(r => r.correct).length;
    
    return {
      totalCards,
      answeredCards,
      correctCards,
      accuracy: answeredCards > 0 ? (correctCards / answeredCards) * 100 : 0,
      isComplete: Boolean(this.completedAt)
    };
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      sourceLanguage: this.sourceLanguage,
      targetLanguage: this.targetLanguage,
      cardIds: this.cardIds,
      currentCardIndex: this.currentCardIndex,
      responses: this.responses.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString()
      })),
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt ? this.completedAt.toISOString() : null
    };
  }

  /**
   * Create a Session instance from a plain object
   * @param {Object} data - Plain object data
   * @returns {Session} - New Session instance
   */
  static fromJSON(data) {
    const parsedData = {
      ...data,
      responses: (data.responses || []).map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      completedAt: data.completedAt ? new Date(data.completedAt) : null
    };
    
    return new Session(parsedData);
  }
}

module.exports = Session;