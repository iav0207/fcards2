/**
 * SessionProgressTracker handles tracking progress in a session
 */
class SessionProgressTracker {
  /**
   * Create a new SessionProgressTracker
   * @param {Object} options - Configuration options
   * @param {Object} options.db - DatabaseService instance
   */
  constructor(options = {}) {
    if (!options.db) {
      throw new Error('DatabaseService is required');
    }
    
    this.db = options.db;
  }
  
  /**
   * Get the current card for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} - Current card data or null if session is complete
   */
  async getCurrentCard(sessionId) {
    const session = await this.db.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (session.currentCardIndex >= session.cardIds.length || session.completedAt) {
      return null; // Session is complete
    }
    
    const cardId = session.cardIds[session.currentCardIndex];
    const card = await this.db.getFlashCard(cardId);
    
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    
    return {
      sessionId: session.id,
      sessionProgress: {
        current: session.currentCardIndex + 1,
        total: session.cardIds.length
      },
      card: card.toJSON()
    };
  }
  
  /**
   * Advance to the next card in the session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Updated session data
   */
  async advanceSession(sessionId) {
    const session = await this.db.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (session.completedAt) {
      return {
        sessionId: session.id,
        isComplete: true,
        stats: session.getStats()
      };
    }
    
    const hasMoreCards = session.nextCard();
    await this.db.saveSession(session);
    
    if (!hasMoreCards) {
      return {
        sessionId: session.id,
        isComplete: true,
        stats: session.getStats()
      };
    }
    
    // Return next card info
    const cardData = await this.getCurrentCard(sessionId);
    
    return {
      sessionId: session.id,
      isComplete: false,
      nextCard: cardData
    };
  }
  
  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session statistics
   */
  async getSessionStats(sessionId) {
    const session = await this.db.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    return {
      sessionId: session.id,
      stats: session.getStats(),
      isComplete: Boolean(session.completedAt)
    };
  }
  
  /**
   * Record a response in the session
   * @param {Object} session - Session object
   * @param {string} cardId - Card ID
   * @param {string} userAnswer - User's answer
   * @param {boolean} correct - Whether the answer was correct
   * @returns {Promise<void>} - Promise resolving once the response is recorded
   */
  async recordResponse(session, cardId, userAnswer, correct) {
    // Record the response
    session.recordResponse(cardId, userAnswer, correct);
    
    // Save the updated session
    await this.db.saveSession(session);
  }
}

module.exports = SessionProgressTracker;