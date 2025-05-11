const DatabaseService = require('../src/services/DatabaseService');
const SessionService = require('../src/services/SessionService');
const FlashCard = require('../src/models/FlashCard');

// Mock the TranslationService
jest.mock('../src/services/TranslationService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      evaluateTranslation: jest.fn().mockResolvedValue({
        correct: true,
        score: 0.9,
        feedback: 'Good job!',
        suggestedTranslation: 'Test suggestion',
        details: {}
      }),
      generateTranslation: jest.fn().mockResolvedValue('Test translation')
    };
  });
});

describe('SessionService Tag Filtering', () => {
  let db;
  let sessionService;
  
  // Sample cards with different tag configurations
  const sampleCards = [
    {
      content: 'Hello',
      sourceLanguage: 'en',
      userTranslation: 'Hallo',
      tags: ['common', 'greeting']
    },
    {
      content: 'Goodbye',
      sourceLanguage: 'en',
      userTranslation: 'Auf Wiedersehen',
      tags: ['common', 'farewell']
    },
    {
      content: 'Thank you',
      sourceLanguage: 'en',
      userTranslation: 'Danke',
      tags: ['common', 'polite']
    },
    {
      content: 'Yes',
      sourceLanguage: 'en',
      userTranslation: 'Ja',
      tags: []
    },
    {
      content: 'No',
      sourceLanguage: 'en',
      userTranslation: 'Nein',
      tags: null
    }
  ];
  
  beforeEach(async () => {
    // Create an in-memory database for testing
    db = new DatabaseService({ inMemory: true });
    await db.initialize();
    
    // Add sample cards
    for (const cardData of sampleCards) {
      const card = new FlashCard(cardData);
      await db.saveFlashCard(card);
    }
    
    // Create session service with the DB
    sessionService = new SessionService({ db });
  });
  
  afterEach(() => {
    if (db) {
      db.close();
    }
  });
  
  test('createSession should create a session with all cards when no tags specified', async () => {
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 10
    });
    
    expect(session.cardIds.length).toBe(5); // All cards available
  });
  
  test('createSession should filter cards by specified tags', async () => {
    // Get only cards with 'greeting' tag
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 10,
      tags: ['greeting']
    });
    
    expect(session.cardIds.length).toBe(1);
    
    // Verify it's the right card
    const card = await db.getFlashCard(session.cardIds[0]);
    expect(card.content).toBe('Hello');
  });
  
  test('createSession should handle multiple tags', async () => {
    // Get cards with either 'greeting' or 'farewell' tags
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 10,
      tags: ['greeting', 'farewell']
    });
    
    expect(session.cardIds.length).toBe(2);
  });
  
  test('createSession should handle untagged cards', async () => {
    // Get only untagged cards
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 10,
      includeUntagged: true,
      tags: []
    });
    
    expect(session.cardIds.length).toBe(2);
  });
  
  test('createSession should handle combination of tags and untagged', async () => {
    // Get cards with 'greeting' tag and untagged cards
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 10,
      tags: ['greeting'],
      includeUntagged: true
    });
    
    expect(session.cardIds.length).toBe(3); // 1 greeting + 2 untagged
  });
  
  test('createSession should limit the number of cards', async () => {
    // Get all cards but limit to 2
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: false,
      maxCards: 2
    });
    
    expect(session.cardIds.length).toBe(2);
  });
  
  test('createSession should not filter when using sample cards', async () => {
    // Tags should be ignored when useSampleCards is true
    const session = await sessionService.createSession({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      useSampleCards: true,
      maxCards: 10,
      tags: ['non-existent-tag']
    });
    
    // Should still have sample cards 
    expect(session.cardIds.length).toBeGreaterThan(0);
  });
});