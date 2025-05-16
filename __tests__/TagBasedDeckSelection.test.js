/**
 * Tests for the Tag-Based Deck Selection feature (RFC-00008)
 */
const DatabaseService = require('../src/services/DatabaseService');
const SessionService = require('../src/services/SessionService');
const FlashCard = require('../src/models/FlashCard');

// Mock TranslationService
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

describe('Tag-Based Deck Selection', () => {
  let db;
  let sessionService;
  
  // Sample cards to use in tests
  const sampleCards = [
    { content: 'apple', sourceLanguage: 'en', tags: ['food', 'fruit'] },
    { content: 'banana', sourceLanguage: 'en', tags: ['food', 'fruit'] },
    { content: 'dog', sourceLanguage: 'en', tags: ['animal'] },
    { content: 'cat', sourceLanguage: 'en', tags: ['animal'] },
    { content: 'house', sourceLanguage: 'en', tags: ['building'] },
    { content: 'car', sourceLanguage: 'en', tags: [] }, // Untagged card
    { content: 'table', sourceLanguage: 'en', tags: [] }, // Untagged card
    { content: 'Apfel', sourceLanguage: 'de', tags: ['food', 'fruit'] }, // German card
    { content: 'Hund', sourceLanguage: 'de', tags: ['animal'] }, // German card
  ];
  
  beforeEach(async () => {
    // Create in-memory database for testing
    db = new DatabaseService({ inMemory: true });
    await db.initialize();
    
    // Create session service with the test database
    sessionService = new SessionService({ db });
    
    // Add sample cards to the database
    for (const cardData of sampleCards) {
      const card = new FlashCard(cardData);
      await db.saveFlashCard(card);
    }
  });
  
  afterEach(() => {
    if (db) {
      db.close();
    }
  });
  
  describe('DatabaseService.getAvailableTags', () => {
    test('should return all tags for a specific language with counts', async () => {
      const result = await db.getAvailableTags('en');

      // Debug - see what tags are actually returned
      console.log('Tags returned:', result.tags.map(t => t.tag));

      // Should have exactly 4 tags: animal, building, food, fruit
      expect(result.tags.length).toBe(4);
      // And 2 untagged cards
      expect(result.untaggedCount).toBe(2);

      // Check for specific tags
      const foodTag = result.tags.find(t => t.tag === 'food');
      expect(foodTag).toBeDefined();
      expect(foodTag.count).toBe(2);

      const animalTag = result.tags.find(t => t.tag === 'animal');
      expect(animalTag).toBeDefined();
      expect(animalTag.count).toBe(2);

      const buildingTag = result.tags.find(t => t.tag === 'building');
      expect(buildingTag).toBeDefined();
      expect(buildingTag.count).toBe(1);
    });
    
    test('should return only tags for the specified language', async () => {
      const result = await db.getAvailableTags('de');

      // Debug - see what tags are actually returned for German
      console.log('German tags returned:', result.tags.map(t => t.tag));

      // Should have 3 tags for German: animal, food, fruit
      expect(result.tags.length).toBe(3);

      const foodTag = result.tags.find(t => t.tag === 'food');
      expect(foodTag).toBeDefined();
      expect(foodTag.count).toBe(1);

      const animalTag = result.tags.find(t => t.tag === 'animal');
      expect(animalTag).toBeDefined();
      expect(animalTag.count).toBe(1);

      // 'building' tag shouldn't exist for German
      const buildingTag = result.tags.find(t => t.tag === 'building');
      expect(buildingTag).toBeUndefined();

      // There should be no untagged German cards
      expect(result.untaggedCount).toBe(0);
    });
    
    test('should return alphabetically sorted tags with untagged at the end', async () => {
      const result = await db.getAvailableTags('en');

      // Tags should be in alphabetical order
      expect(result.tags[0].tag).toBe('animal');
      expect(result.tags[1].tag).toBe('building');
      expect(result.tags[2].tag).toBe('food');
    });
    
    test('should return empty tags array when no source language is provided', async () => {
      // When no source language is provided, it should return empty tags array
      const result = await db.getAvailableTags();

      // Should have no tags when source language is not specified
      expect(result.tags).toEqual([]);
      expect(result.untaggedCount).toBe(0);
    });
  });
  
  describe('DatabaseService.getAllFlashCards with tag filtering', () => {
    test('should filter cards by a single tag', async () => {
      const cards = await db.getAllFlashCards({
        sourceLanguage: 'en',
        tags: ['food']
      });

      expect(cards.length).toBe(2);
      expect(cards.find(c => c.content === 'apple')).toBeDefined();
      expect(cards.find(c => c.content === 'banana')).toBeDefined();
    });
    
    test('should filter cards by multiple tags (OR logic)', async () => {
      const cards = await db.getAllFlashCards({
        sourceLanguage: 'en',
        tags: ['food', 'animal']
      });

      expect(cards.length).toBe(4);
      expect(cards.find(c => c.content === 'apple')).toBeDefined();
      expect(cards.find(c => c.content === 'banana')).toBeDefined();
      expect(cards.find(c => c.content === 'dog')).toBeDefined();
      expect(cards.find(c => c.content === 'cat')).toBeDefined();
    });
    
    test('should include untagged cards when requested', async () => {
      const cards = await db.getAllFlashCards({
        sourceLanguage: 'en',
        tags: ['food'],
        includeUntagged: true
      });

      expect(cards.length).toBe(4);
      expect(cards.find(c => c.content === 'apple')).toBeDefined();
      expect(cards.find(c => c.content === 'banana')).toBeDefined();
      expect(cards.find(c => c.content === 'car')).toBeDefined();
      expect(cards.find(c => c.content === 'table')).toBeDefined();
    });
    
    test('should get only untagged cards when requested', async () => {
      const cards = await db.getAllFlashCards({
        sourceLanguage: 'en',
        includeUntagged: true,
        tags: []
      });

      expect(cards.length).toBe(2);
      expect(cards.find(c => c.content === 'car')).toBeDefined();
      expect(cards.find(c => c.content === 'table')).toBeDefined();
    });
  });
  
  describe('SessionService.createSession with tag filtering', () => {
    test('should create session with cards filtered by tag', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 10,
        useSampleCards: false,
        tags: ['animal']
      });
      
      expect(session.cardIds.length).toBe(2); // Only 2 animal cards in English
    });
    
    test('should create session with cards from multiple tags', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 10,
        useSampleCards: false,
        tags: ['animal', 'building']
      });
      
      expect(session.cardIds.length).toBe(3); // 2 animal + 1 building card
    });
    
    test('should include untagged cards when requested', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 10,
        useSampleCards: false,
        tags: ['animal'],
        includeUntagged: true
      });
      
      expect(session.cardIds.length).toBe(4); // 2 animal + 2 untagged cards
    });
    
    test('should create session with only untagged cards', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 10,
        useSampleCards: false,
        tags: [],
        includeUntagged: true
      });
      
      expect(session.cardIds.length).toBe(2); // Only 2 untagged cards
    });
    
    test('should fallback to all cards when no tags specified and includeUntagged is false', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 10,
        useSampleCards: false
      });
      
      expect(session.cardIds.length).toBe(7); // All English cards
    });
    
    test('should respect maxCards limit with tag filtering', async () => {
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 1,
        useSampleCards: false,
        tags: ['food', 'animal']
      });
      
      expect(session.cardIds.length).toBe(1); // Only 1 card despite 4 matching cards
    });
  });
});