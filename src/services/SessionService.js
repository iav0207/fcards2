const { generateId } = require('../utils/helpers');
const FlashCard = require('../models/FlashCard');
const Session = require('../models/Session');
const TranslationService = require('./TranslationService');

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
    this.sampleCards = this.generateSampleCards();
  }

  /**
   * Create a new practice session
   * @param {Object} options - Session options
   * @param {string} options.sourceLanguage - Source language code
   * @param {string} options.targetLanguage - Target language code
   * @param {number} [options.maxCards=10] - Maximum number of cards
   * @param {boolean} [options.useSampleCards=true] - Whether to use sample cards
   * @returns {Promise<Object>} - Created session data
   */
  async createSession(options = {}) {
    const { sourceLanguage = 'en', targetLanguage = 'de', maxCards = 10, useSampleCards = true } = options;
    
    let cardIds = [];
    
    if (useSampleCards) {
      // Use sample cards
      const cards = this.sampleCards
        .filter(card => card.sourceLanguage === sourceLanguage)
        .slice(0, maxCards);
      
      // Save sample cards to database if they don't exist
      for (const card of cards) {
        const existingCard = await this.db.getFlashCard(card.id);
        if (!existingCard) {
          await this.db.saveFlashCard(card);
        }
        cardIds.push(card.id);
      }
    } else {
      // Get cards from database
      console.log(`Fetching cards for session: sourceLanguage=${sourceLanguage}, limit=${maxCards}`);
      const cards = await this.db.getAllFlashCards({
        sourceLanguage,
        limit: maxCards
      });

      console.log(`Found ${cards.length} cards in database for sourceLanguage=${sourceLanguage}`);
      if (cards.length > 0) {
        console.log('First card:', cards[0].toJSON());
      }

      cardIds = cards.map(card => card.id);
    }
    
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
   * Submit an answer for the current card
   * @param {string} sessionId - Session ID
   * @param {string} answer - User's answer
   * @returns {Promise<Object>} - Evaluation result
   */
  async submitAnswer(sessionId, answer) {
    const session = await this.db.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (session.currentCardIndex >= session.cardIds.length || session.completedAt) {
      throw new Error('Session is already complete');
    }
    
    const cardId = session.cardIds[session.currentCardIndex];
    const card = await this.db.getFlashCard(cardId);
    
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    
    // Generate a reference translation if needed
    let referenceTranslation = card.userTranslation;
    
    if (!referenceTranslation) {
      referenceTranslation = await this.translationService.generateTranslation({
        content: card.content,
        sourceLanguage: session.sourceLanguage,
        targetLanguage: session.targetLanguage
      });
    }
    
    // Evaluate the answer
    const evaluation = await this.translationService.evaluateTranslation({
      sourceContent: card.content,
      sourceLanguage: session.sourceLanguage,
      targetLanguage: session.targetLanguage,
      userTranslation: answer,
      referenceTranslation
    });
    
    // Record the response
    session.recordResponse(cardId, answer, evaluation.correct);
    
    // Save the updated session
    await this.db.saveSession(session);
    
    // Return the evaluation result
    return {
      sessionId: session.id,
      cardId,
      evaluation,
      referenceTranslation
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
   * Generate sample flashcards for testing
   * @returns {FlashCard[]} - Array of sample flashcards
   */
  generateSampleCards() {
    const sampleData = [
      { content: 'Hello', sourceLanguage: 'en', userTranslation: 'Hallo' },
      { content: 'Goodbye', sourceLanguage: 'en', userTranslation: 'Auf Wiedersehen' },
      { content: 'Thank you', sourceLanguage: 'en', userTranslation: 'Danke' },
      { content: 'Yes', sourceLanguage: 'en', userTranslation: 'Ja' },
      { content: 'No', sourceLanguage: 'en', userTranslation: 'Nein' },
      { content: 'Please', sourceLanguage: 'en', userTranslation: 'Bitte' },
      { content: 'Excuse me', sourceLanguage: 'en', userTranslation: 'Entschuldigung' },
      { content: 'Sorry', sourceLanguage: 'en', userTranslation: 'Es tut mir leid' },
      { content: 'Good morning', sourceLanguage: 'en', userTranslation: 'Guten Morgen' },
      { content: 'Good evening', sourceLanguage: 'en', userTranslation: 'Guten Abend' },
      { content: 'How are you', sourceLanguage: 'en', userTranslation: 'Wie geht es dir' },
      { content: 'What is your name', sourceLanguage: 'en', userTranslation: 'Wie heißt du' },
      { content: 'My name is', sourceLanguage: 'en', userTranslation: 'Ich heiße' },
      { content: 'Where is the bathroom', sourceLanguage: 'en', userTranslation: 'Wo ist die Toilette' },
      { content: 'How much does it cost', sourceLanguage: 'en', userTranslation: 'Wie viel kostet das' },
      { content: 'I don\'t understand', sourceLanguage: 'en', userTranslation: 'Ich verstehe nicht' },
      { content: 'Can you help me', sourceLanguage: 'en', userTranslation: 'Können Sie mir helfen' },
      { content: 'I would like', sourceLanguage: 'en', userTranslation: 'Ich möchte' },
      { content: 'I am from', sourceLanguage: 'en', userTranslation: 'Ich komme aus' },
      { content: 'Do you speak English', sourceLanguage: 'en', userTranslation: 'Sprechen Sie Englisch' }
    ];
    
    return sampleData.map(data => {
      return new FlashCard({
        content: data.content,
        sourceLanguage: data.sourceLanguage,
        userTranslation: data.userTranslation,
        tags: ['sample']
      });
    });
  }
}

module.exports = SessionService;