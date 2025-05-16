/**
 * Tests for TagRepository using real in-memory SQLite
 */
const sqlite3 = require('sqlite3').verbose();
const TagRepository = require('../../src/repositories/TagRepository');
const FlashCardRepository = require('../../src/repositories/FlashCardRepository');
const FlashCard = require('../../src/models/FlashCard');
const { promisify } = require('util');

describe('TagRepository', () => {
  let db;
  let flashCardRepository;
  let repository;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    db = new sqlite3.Database(':memory:');
    
    // Create promisified version of run for setup
    const run = promisify(db.run.bind(db));
    
    // Create flashcards table
    await run(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        sourceLanguage TEXT NOT NULL,
        comment TEXT,
        userTranslation TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    
    // Initialize repositories
    flashCardRepository = new FlashCardRepository(db, true);
    repository = new TagRepository(db, flashCardRepository, true);
    
    // Populate with test cards
    const sampleCards = [
      { content: 'apple', sourceLanguage: 'en', tags: ['food', 'fruit'] },
      { content: 'banana', sourceLanguage: 'en', tags: ['food', 'fruit'] },
      { content: 'dog', sourceLanguage: 'en', tags: ['animal'] },
      { content: 'cat', sourceLanguage: 'en', tags: ['animal'] },
      { content: 'house', sourceLanguage: 'en', tags: ['building'] },
      { content: 'car', sourceLanguage: 'en', tags: [] }, // Untagged card
      { content: 'table', sourceLanguage: 'en', tags: [] }, // Untagged card
      { content: 'Apfel', sourceLanguage: 'de', tags: ['food', 'fruit'] }, // German card
      { content: 'Hund', sourceLanguage: 'de', tags: ['animal'] } // German card
    ];
    
    // Save sample cards
    for (const cardData of sampleCards) {
      await flashCardRepository.saveFlashCard(new FlashCard(cardData));
    }
  });

  afterEach((done) => {
    // Close database connection
    if (db) {
      db.close(done);
    } else {
      done();
    }
  });

  describe('getAvailableTags', () => {
    test('should return tags and counts for a source language', async () => {
      const result = await repository.getAvailableTags('en');
      
      // Should have 4 tags: animal, building, food, fruit
      expect(result.tags.length).toBe(4);
      
      // And 2 untagged cards
      expect(result.untaggedCount).toBe(2);
      
      // Check for specific tags and their counts
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
    
    test('should return empty result when no source language is provided', async () => {
      const result = await repository.getAvailableTags();
      
      // Should have no tags when source language is not specified
      expect(result.tags).toEqual([]);
      expect(result.untaggedCount).toBe(0);
    });
    
    test('should return empty tags when no cards are found', async () => {
      // Test with a language that has no cards
      const result = await repository.getAvailableTags('es');
      
      // Should have no tags for a language with no cards
      expect(result.tags).toEqual([]);
      expect(result.untaggedCount).toBe(0);
    });
    
    test('should return only tags for the specified language', async () => {
      const result = await repository.getAvailableTags('de');
      
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
    
    test('should return alphabetically sorted tags', async () => {
      const result = await repository.getAvailableTags('en');
      
      // First tag should be 'animal' (alphabetically first)
      expect(result.tags[0].tag).toBe('animal');
      
      // Tags should be in alphabetical order
      const tagNames = result.tags.map(t => t.tag);
      const sortedTagNames = [...tagNames].sort();
      expect(tagNames).toEqual(sortedTagNames);
    });
    
    test('should throw an error if database is not initialized', async () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new TagRepository(db, flashCardRepository, false);
      
      // Attempt to get tags should reject with error
      await expect(uninitializedRepo.getAvailableTags('en'))
        .rejects.toThrow('Database not initialized');
    });
  });
});