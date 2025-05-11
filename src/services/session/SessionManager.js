const Session = require('../../models/Session');

/**
 * SessionManager handles creating and managing sessions
 */
class SessionManager {
  /**
   * Create a new SessionManager
   * @param {Object} options - Configuration options
   * @param {Object} options.db - DatabaseService instance
   * @param {Object} options.cardSelector - SessionCardSelector instance
   * @param {Object} options.progressTracker - SessionProgressTracker instance
   * @param {Object} options.evaluator - SessionEvaluator instance
   */
  constructor(options = {}) {
    if (!options.db) {
      throw new Error('DatabaseService is required');
    }
    if (!options.cardSelector) {
      throw new Error('SessionCardSelector is required');
    }
    if (!options.progressTracker) {
      throw new Error('SessionProgressTracker is required');
    }
    if (!options.evaluator) {
      throw new Error('SessionEvaluator is required');
    }
    
    this.db = options.db;
    this.cardSelector = options.cardSelector;
    this.progressTracker = options.progressTracker;
    this.evaluator = options.evaluator;
  }
  
  /**
   * Create a new practice session
   * @param {Object} options - Session options
   * @param {string} [options.sourceLanguage='en'] - Source language code
   * @param {string} [options.targetLanguage='de'] - Target language code
   * @param {number} [options.maxCards=10] - Maximum number of cards
   * @param {boolean} [options.useSampleCards=true] - Whether to use sample cards
   * @param {string[]} [options.tags=[]] - Tags to filter cards by
   * @param {boolean} [options.includeUntagged=false] - Whether to include untagged cards
   * @returns {Promise<Object>} - Created session data
   */
  async createSession(options = {}) {
    const {
      sourceLanguage = 'en',
      targetLanguage = 'de',
      maxCards = 10,
      useSampleCards = true,
      tags = [],
      includeUntagged = false
    } = options;
    
    // Select cards for the session
    const cardIds = await this.cardSelector.selectCards({
      sourceLanguage,
      targetLanguage,
      maxCards,
      useSampleCards,
      tags,
      includeUntagged
    });
    
    // Create a new session
    const session = new Session({
      sourceLanguage,
      targetLanguage,
      cardIds,
      currentCardIndex: 0,
      responses: [],
      completedAt: null
    });
    
    // Save the session to the database
    await this.db.saveSession(session);
    
    return session.toJSON();
  }
  
  /**
   * Get the current card for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} - Current card data or null if session is complete
   */
  async getCurrentCard(sessionId) {
    return this.progressTracker.getCurrentCard(sessionId);
  }
  
  /**
   * Submit an answer for the current card
   * @param {string} sessionId - Session ID
   * @param {string} answer - User's answer
   * @returns {Promise<Object>} - Evaluation result
   */
  async submitAnswer(sessionId, answer) {
    try {
      const session = await this.db.getSession(sessionId);
      
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      if (session.currentCardIndex >= session.cardIds.length || session.completedAt) {
        throw new Error('Session is already complete');
      }
      
      // Get the current card
      const cardId = session.cardIds[session.currentCardIndex];
      const card = await this.db.getFlashCard(cardId);
      
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }
      
      // Evaluate the answer
      const evaluationResult = await this.evaluator.evaluateAnswer({
        session,
        card,
        answer
      });
      
      // Record the response
      await this.progressTracker.recordResponse(
        session, 
        cardId, 
        answer, 
        evaluationResult.evaluation.correct
      );
      
      return evaluationResult;
    } catch (error) {
      // Throw a more descriptive error for session issues
      if (error.message.includes('Session not found')) {
        const enhancedError = new Error(`Session error: The practice session could not be found or has expired.`);
        enhancedError.sessionError = true;
        throw enhancedError;
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Advance to the next card in the session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Updated session data
   */
  async advanceSession(sessionId) {
    return this.progressTracker.advanceSession(sessionId);
  }
  
  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session statistics
   */
  async getSessionStats(sessionId) {
    return this.progressTracker.getSessionStats(sessionId);
  }
}

module.exports = SessionManager;