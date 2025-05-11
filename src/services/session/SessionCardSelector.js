const FlashCard = require('../../models/FlashCard');

/**
 * SessionCardSelector handles card selection for new sessions
 */
class SessionCardSelector {
  /**
   * Create a new SessionCardSelector
   * @param {Object} options - Configuration options
   * @param {Object} options.db - DatabaseService instance
   */
  constructor(options = {}) {
    if (!options.db) {
      throw new Error('DatabaseService is required');
    }
    
    this.db = options.db;
    this.sampleCards = this.generateSampleCards();
  }
  
  /**
   * Select cards for a new session
   * @param {Object} options - Session options
   * @param {string} options.sourceLanguage - Source language code
   * @param {string} options.targetLanguage - Target language code
   * @param {number} options.maxCards - Maximum number of cards
   * @param {boolean} options.useSampleCards - Whether to use sample cards
   * @param {string[]} options.tags - Tags to filter cards by
   * @param {boolean} options.includeUntagged - Whether to include untagged cards
   * @returns {Promise<string[]>} - Array of selected card IDs
   */
  async selectCards(options = {}) {
    const {
      sourceLanguage,
      maxCards,
      useSampleCards,
      tags,
      includeUntagged
    } = options;
    
    let cardIds = [];
    
    if (useSampleCards) {
      // Use sample cards
      cardIds = await this._selectSampleCards(sourceLanguage, maxCards);
    } else {
      // Use database cards
      cardIds = await this._selectDatabaseCards(sourceLanguage, maxCards, tags, includeUntagged);
    }
    
    return cardIds;
  }
  
  /**
   * Select sample cards for a session
   * @param {string} sourceLanguage - Source language code
   * @param {number} maxCards - Maximum number of cards
   * @returns {Promise<string[]>} - Array of selected card IDs
   * @private
   */
  async _selectSampleCards(sourceLanguage, maxCards) {
    const cardIds = [];
    
    // Filter sample cards by source language and limit to maxCards
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
    
    return cardIds;
  }
  
  /**
   * Select cards from the database for a session
   * @param {string} sourceLanguage - Source language code
   * @param {number} maxCards - Maximum number of cards
   * @param {string[]} tags - Tags to filter cards by
   * @param {boolean} includeUntagged - Whether to include untagged cards
   * @returns {Promise<string[]>} - Array of selected card IDs
   * @private
   */
  async _selectDatabaseCards(sourceLanguage, maxCards, tags, includeUntagged) {
    // Build query options
    const queryOptions = {
      sourceLanguage
    };
    
    // Add tag filtering if tags are specified
    if (tags.length > 0 || includeUntagged) {
      if (tags.length > 0) {
        queryOptions.tags = tags;
      }
      if (includeUntagged) {
        queryOptions.includeUntagged = true;
      }
    }
    
    // Log query options for debugging
    console.log('Fetching cards with options:', JSON.stringify(queryOptions));
    
    // Get all matching cards
    const allMatchingCards = await this.db.getAllFlashCards(queryOptions);
    console.log(`Found ${allMatchingCards.length} matching cards in database`);
    
    // If we have more cards than needed, select a random sample
    let selectedCards;
    if (allMatchingCards.length > maxCards) {
      selectedCards = this.getRandomSample(allMatchingCards, maxCards);
      console.log(`Selected ${selectedCards.length} random cards for session`);
    } else {
      selectedCards = allMatchingCards;
    }
    
    // Extract card IDs
    return selectedCards.map(card => card.id);
  }
  
  /**
   * Get a random sample of cards
   * @param {Array} cards - Array of cards to sample from
   * @param {number} count - Number of cards to select
   * @returns {Array} - Random sample of cards
   */
  getRandomSample(cards, count) {
    // Make a copy of the array to avoid modifying the original
    const cardsCopy = [...cards];
    const result = [];
    
    // Get a random sample
    for (let i = 0; i < Math.min(count, cardsCopy.length); i++) {
      const randomIndex = Math.floor(Math.random() * cardsCopy.length);
      result.push(cardsCopy.splice(randomIndex, 1)[0]);
    }
    
    return result;
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

module.exports = SessionCardSelector;