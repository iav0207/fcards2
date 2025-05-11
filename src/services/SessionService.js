const TranslationService = require('./TranslationService');
const SessionManager = require('./session/SessionManager');
const SessionCardSelector = require('./session/SessionCardSelector');
const SessionProgressTracker = require('./session/SessionProgressTracker');
const SessionEvaluator = require('./session/SessionEvaluator');

/**
 * Service for managing practice sessions
 */
class SessionService {
  /**
   * Create a new SessionService instance
   * @param {Object} options - Configuration options
   * @param {Object} options.db - DatabaseService instance
   * @param {Object} [options.translationService] - TranslationService instance
   */
  constructor(options = {}) {
    if (!options.db) {
      throw new Error('DatabaseService is required');
    }
    
    this.db = options.db;
    this.translationService = options.translationService || new TranslationService();
    
    // Initialize session components
    this._initializeComponents();
    
    // For backwards compatibility, keep sample cards on the main service
    this.sampleCards = this.cardSelector.generateSampleCards();
  }
  
  /**
   * Initialize session components
   * @private
   */
  _initializeComponents() {
    // Create card selector
    this.cardSelector = new SessionCardSelector({
      db: this.db
    });
    
    // Create progress tracker
    this.progressTracker = new SessionProgressTracker({
      db: this.db
    });
    
    // Create evaluator
    this.evaluator = new SessionEvaluator({
      translationService: this.translationService
    });
    
    // Create session manager
    this.sessionManager = new SessionManager({
      db: this.db,
      cardSelector: this.cardSelector,
      progressTracker: this.progressTracker,
      evaluator: this.evaluator
    });
  }
  
  /**
   * Create a new practice session
   * @param {Object} options - Session options
   * @param {string} options.sourceLanguage - Source language code
   * @param {string} options.targetLanguage - Target language code
   * @param {number} [options.maxCards=10] - Maximum number of cards
   * @param {boolean} [options.useSampleCards=true] - Whether to use sample cards
   * @param {string[]} [options.tags=[]] - Tags to filter cards by
   * @param {boolean} [options.includeUntagged=false] - Whether to include untagged cards
   * @returns {Promise<Object>} - Created session data
   */
  async createSession(options = {}) {
    return this.sessionManager.createSession(options);
  }
  
  /**
   * Get the current card for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} - Current card data or null if session is complete
   */
  async getCurrentCard(sessionId) {
    return this.sessionManager.getCurrentCard(sessionId);
  }
  
  /**
   * Submit an answer for the current card
   * @param {string} sessionId - Session ID
   * @param {string} answer - User's answer
   * @returns {Promise<Object>} - Evaluation result
   */
  async submitAnswer(sessionId, answer) {
    return this.sessionManager.submitAnswer(sessionId, answer);
  }
  
  /**
   * Advance to the next card in the session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Updated session data
   */
  async advanceSession(sessionId) {
    return this.sessionManager.advanceSession(sessionId);
  }
  
  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session statistics
   */
  async getSessionStats(sessionId) {
    return this.sessionManager.getSessionStats(sessionId);
  }
  
  /**
   * Get a random sample of cards
   * @param {Array} cards - Array of cards to sample from
   * @param {number} count - Number of cards to select
   * @returns {Array} - Random sample of cards
   */
  getRandomSample(cards, count) {
    return this.cardSelector.getRandomSample(cards, count);
  }
  
  /**
   * Generate sample flashcards for testing
   * @returns {FlashCard[]} - Array of sample flashcards
   */
  generateSampleCards() {
    return this.cardSelector.generateSampleCards();
  }
}

module.exports = SessionService;