/**
 * Tests for FlashCardRepository using real in-memory SQLite
 */
const sqlite3 = require('sqlite3').verbose();
const FlashCardRepository = require('../../src/repositories/FlashCardRepository');
const FlashCard = require('../../src/models/FlashCard');

// Helper function to setup an in-memory database
function setupDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create the flashcards table
      db.run(`
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
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(db);
      });
    });
  });
}

describe('FlashCardRepository with in-memory SQLite', () => {
  let db;
  let repository;
  
  // Setup database before tests
  beforeAll(async () => {
    db = await setupDatabase();
    repository = new FlashCardRepository(db, true);
  });
  
  // Close database after tests
  afterAll((done) => {
    if (db) {
      db.close(() => {
        done();
      });
    } else {
      done();
    }
  });
  
  // Clear the table before each test
  beforeEach((done) => {
    db.run('DELETE FROM flashcards', (err) => {
      if (err) {
        console.error('Error clearing flashcards table:', err);
      }
      done();
    });
  });
  
  describe('saveFlashCard', () => {
    it('should save a flashcard to the database', async () => {
      // Create a test flashcard
      const testId = 'test-id-' + Date.now();
      const flashcard = new FlashCard({
        id: testId,
        content: 'Test content',
        sourceLanguage: 'en',
        tags: ['test', 'example']
      });
      
      // Save the flashcard
      const result = await repository.saveFlashCard(flashcard);
      
      // Verify the flashcard was returned correctly
      expect(result).toEqual(flashcard);
      
      // Verify it was saved to the database by retrieving it
      const retrieved = await repository.getFlashCard(testId);
      expect(retrieved.id).toBe(testId);
      expect(retrieved.content).toBe('Test content');
      expect(retrieved.sourceLanguage).toBe('en');
      expect(retrieved.tags).toEqual(['test', 'example']);
    });
    
    it('should update an existing flashcard', async () => {
      // Create and save a flashcard
      const testId = 'update-test-id-' + Date.now();
      const flashcard = new FlashCard({
        id: testId,
        content: 'Original content',
        sourceLanguage: 'en',
        tags: ['original']
      });
      
      await repository.saveFlashCard(flashcard);
      
      // Update the flashcard
      flashcard.update({
        content: 'Updated content',
        tags: ['updated', 'modified']
      });
      
      // Save the updated flashcard
      await repository.saveFlashCard(flashcard);
      
      // Verify the update was saved
      const retrieved = await repository.getFlashCard(testId);
      expect(retrieved.content).toBe('Updated content');
      expect(retrieved.tags).toEqual(['updated', 'modified']);
    });
  });
  
  describe('getFlashCard', () => {
    it('should return null for non-existent flashcard', async () => {
      const result = await repository.getFlashCard('non-existent-id');
      expect(result).toBeNull();
    });
    
    it('should retrieve a flashcard by id', async () => {
      // Create and save a flashcard
      const testId = 'get-test-id-' + Date.now();
      const flashcard = new FlashCard({
        id: testId,
        content: 'Get test content',
        sourceLanguage: 'en',
        comment: 'Test comment',
        tags: ['get', 'test']
      });
      
      await repository.saveFlashCard(flashcard);
      
      // Retrieve the flashcard
      const result = await repository.getFlashCard(testId);
      
      // Verify the result
      expect(result).not.toBeNull();
      expect(result.id).toBe(testId);
      expect(result.content).toBe('Get test content');
      expect(result.comment).toBe('Test comment');
      expect(result.tags).toEqual(['get', 'test']);
    });
  });
  
  describe('getAllFlashCards', () => {
    beforeEach(async () => {
      // Create some test flashcards
      const cards = [
        new FlashCard({
          content: 'Card One',
          sourceLanguage: 'en',
          tags: ['common', 'greeting']
        }),
        new FlashCard({
          content: 'Card Two',
          sourceLanguage: 'en',
          tags: ['common', 'farewell']
        }),
        new FlashCard({
          content: 'Carte Trois',
          sourceLanguage: 'fr',
          tags: ['common']
        }),
        new FlashCard({
          content: 'Untagged Card',
          sourceLanguage: 'en'
        })
      ];
      
      // Save all flashcards
      for (const card of cards) {
        await repository.saveFlashCard(card);
      }
    });
    
    it('should retrieve all flashcards', async () => {
      const result = await repository.getAllFlashCards();
      expect(result.length).toBe(4);
    });
    
    it('should filter by source language', async () => {
      const result = await repository.getAllFlashCards({ sourceLanguage: 'en' });
      expect(result.length).toBe(3);
      expect(result.every(card => card.sourceLanguage === 'en')).toBe(true);
    });
    
    it('should filter by tags', async () => {
      const result = await repository.getAllFlashCards({ tags: ['common'] });
      expect(result.length).toBe(3);
      expect(result.every(card => card.tags.includes('common'))).toBe(true);
    });
    
    it('should handle multiple tag filters', async () => {
      const result = await repository.getAllFlashCards({ tags: ['greeting', 'farewell'] });
      expect(result.length).toBe(2);
    });
    
    it('should filter for untagged cards', async () => {
      const result = await repository.getAllFlashCards({ includeUntagged: true, tags: [] });
      const untaggedCards = result.filter(card => !card.tags || card.tags.length === 0);
      expect(untaggedCards.length).toBe(1);
    });
  });
  
  describe('deleteFlashCard', () => {
    it('should delete a flashcard from the database', async () => {
      // Create and save a flashcard
      const testId = 'delete-test-id-' + Date.now();
      const flashcard = new FlashCard({
        id: testId,
        content: 'Delete me',
        sourceLanguage: 'en'
      });
      
      await repository.saveFlashCard(flashcard);
      
      // Verify it was saved
      const savedCard = await repository.getFlashCard(testId);
      expect(savedCard).not.toBeNull();
      
      // Delete the flashcard
      const result = await repository.deleteFlashCard(testId);
      expect(result).toBe(true);
      
      // Verify it was deleted
      const deletedCard = await repository.getFlashCard(testId);
      expect(deletedCard).toBeNull();
    });
    
    it('should return false when deleting non-existent flashcard', async () => {
      const result = await repository.deleteFlashCard('non-existent-id');
      expect(result).toBe(false);
    });
  });
});