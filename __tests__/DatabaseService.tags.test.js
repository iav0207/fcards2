const DatabaseService = require('../src/services/DatabaseService');
const FlashCard = require('../src/models/FlashCard');

describe('DatabaseService Tag Operations', () => {
  let db;
  
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
    },
    {
      content: 'Bonjour',
      sourceLanguage: 'fr',
      userTranslation: 'Hello',
      tags: ['greeting']
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
  });
  
  afterEach(() => {
    if (db) {
      db.close();
    }
  });
  
  test('getAvailableTags should return tags for a specific language', async () => {
    const result = await db.getAvailableTags('en');
    
    // Should identify 4 unique tags and 2 untagged cards for English
    expect(result.tags.length).toBe(4);
    expect(result.untaggedCount).toBe(2);
    
    // Check specific tags
    const tagNames = result.tags.map(t => t.tag);
    expect(tagNames).toContain('common');
    expect(tagNames).toContain('greeting');
    expect(tagNames).toContain('farewell');
    expect(tagNames).toContain('polite');
    
    // Check counts
    const commonTag = result.tags.find(t => t.tag === 'common');
    expect(commonTag.count).toBe(3);
  });
  
  test('getAvailableTags should return different tags for different languages', async () => {
    const enTags = await db.getAvailableTags('en');
    const frTags = await db.getAvailableTags('fr');
    
    expect(enTags.tags.length).toBe(4);
    expect(frTags.tags.length).toBe(1);
    
    // French should have only 'greeting' tag
    expect(frTags.tags[0].tag).toBe('greeting');
    expect(frTags.tags[0].count).toBe(1);
    expect(frTags.untaggedCount).toBe(0);
  });
  
  test('getAllFlashCards should filter by multiple tags', async () => {
    // Get cards with 'common' tag
    const commonCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      tags: ['common']
    });
    expect(commonCards.length).toBe(3);
    
    // Get cards with 'greeting' tag
    const greetingCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      tags: ['greeting']
    });
    expect(greetingCards.length).toBe(1);
    
    // Get cards with either 'greeting' or 'farewell' tags
    const mixedCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      tags: ['greeting', 'farewell']
    });
    expect(mixedCards.length).toBe(2);
  });
  
  test('getAllFlashCards should handle untagged cards filter', async () => {
    // Get only untagged cards
    const untaggedCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      includeUntagged: true,
      tags: [] // No tags selected
    });
    expect(untaggedCards.length).toBe(2);
    
    // Get both tagged and untagged cards
    const mixedCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      tags: ['greeting'],
      includeUntagged: true
    });
    expect(mixedCards.length).toBe(3); // 1 with 'greeting' tag + 2 untagged
  });
  
  test('getAllFlashCards should handle empty tag array as no tag filter', async () => {
    // Empty tags array without includeUntagged should return all cards
    const allCards = await db.getAllFlashCards({
      sourceLanguage: 'en',
      tags: []
    });
    expect(allCards.length).toBe(5); // All English cards
  });
});