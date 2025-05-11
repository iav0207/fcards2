/**
 * Tests for FlashCardRepository
 */
const FlashCardRepository = require('../../src/repositories/FlashCardRepository');
const FlashCard = require('../../src/models/FlashCard');

// Mock database
const mockDb = {
  prepare: jest.fn(),
};

// Mock prepared statement
const mockStmt = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
};

describe('FlashCardRepository', () => {
  let repository;

  beforeEach(() => {
    // Reset mocks
    mockDb.prepare.mockReset();
    mockStmt.run.mockReset();
    mockStmt.get.mockReset();
    mockStmt.all.mockReset();

    // Mock prepare to return our mock statement
    mockDb.prepare.mockReturnValue(mockStmt);

    // Create repository with initialized state
    repository = new FlashCardRepository(mockDb, true);
  });

  describe('saveFlashCard', () => {
    test('should save a flashcard to the database', () => {
      // Create a test flashcard
      const flashcard = new FlashCard({
        id: 'test-id',
        content: 'Test content',
        sourceLanguage: 'en',
        tags: ['test', 'example']
      });

      // Mock successful run
      mockStmt.run.mockReturnValue({ changes: 1 });

      // Save the flashcard
      const result = repository.saveFlashCard(flashcard);

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO flashcards'));

      // Check that run was called with the correct parameters
      expect(mockStmt.run).toHaveBeenCalledWith(
        flashcard.id,
        flashcard.content,
        flashcard.sourceLanguage,
        flashcard.comment,
        flashcard.userTranslation,
        JSON.stringify(flashcard.tags),
        expect.any(String), // createdAt as string
        expect.any(String)  // updatedAt as string
      );

      // Check that the flashcard was returned
      expect(result).toBe(flashcard);
    });

    test('should throw an error if database is not initialized', () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new FlashCardRepository(mockDb, false);

      // Create a test flashcard
      const flashcard = new FlashCard({
        content: 'Test content',
        sourceLanguage: 'en'
      });

      // Expect error when trying to save
      expect(() => {
        uninitializedRepo.saveFlashCard(flashcard);
      }).toThrow('Database not initialized');
    });
  });

  describe('getFlashCard', () => {
    test('should retrieve a flashcard by ID', () => {
      // Mock database row return
      const mockRow = {
        id: 'test-id',
        content: 'Test content',
        sourceLanguage: 'en',
        tags: '["test","example"]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStmt.get.mockReturnValue(mockRow);

      // Get the flashcard
      const result = repository.getFlashCard('test-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM flashcards WHERE id = ?');

      // Check that get was called with the correct ID
      expect(mockStmt.get).toHaveBeenCalledWith('test-id');

      // Check that a FlashCard instance was returned
      expect(result).toBeInstanceOf(FlashCard);
      expect(result.id).toBe('test-id');
      expect(result.content).toBe('Test content');
      expect(result.tags).toEqual(['test', 'example']);
    });

    test('should return null for empty ID', () => {
      const result = repository.getFlashCard('');
      expect(result).toBeNull();
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });

    test('should return null when no flashcard is found', () => {
      mockStmt.get.mockReturnValue(null);
      
      const result = repository.getFlashCard('non-existent-id');
      
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM flashcards WHERE id = ?');
      expect(mockStmt.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllFlashCards', () => {
    test('should retrieve all flashcards with default options', () => {
      // Mock database rows return
      const mockRows = [
        {
          id: 'card1',
          content: 'Card 1',
          sourceLanguage: 'en',
          tags: '["test"]',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'card2',
          content: 'Card 2',
          sourceLanguage: 'en',
          tags: '["example"]',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockStmt.all.mockReturnValue(mockRows);

      // Get all flashcards
      const result = repository.getAllFlashCards();

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM flashcards'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY updatedAt DESC'));

      // Check that all was called
      expect(mockStmt.all).toHaveBeenCalled();

      // Check that FlashCard instances were returned
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(FlashCard);
      expect(result[1]).toBeInstanceOf(FlashCard);
      expect(result[0].id).toBe('card1');
      expect(result[1].id).toBe('card2');
    });

    test('should filter by source language', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllFlashCards({ sourceLanguage: 'en' });

      // Check that prepare was called with a WHERE clause
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE sourceLanguage = ?'));

      // Check that all was called with the correct parameter
      expect(mockStmt.all).toHaveBeenCalledWith('en');
    });

    test('should filter by tags', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllFlashCards({ tags: ['test', 'example'] });

      // Check that prepare was called with tags LIKE conditions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE (tags LIKE ? OR tags LIKE ?)'));

      // Check that all was called with the correct parameters
      expect(mockStmt.all).toHaveBeenCalledWith('%"test"%', '%"example"%');
    });

    test('should include untagged cards when requested', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllFlashCards({ includeUntagged: true });

      // Check that prepare was called with untagged condition
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE ((tags IS NULL OR tags = ? OR tags = ?))'));

      // Check that all was called with the correct parameters
      expect(mockStmt.all).toHaveBeenCalledWith('[]', '');
    });
  });

  describe('deleteFlashCard', () => {
    test('should delete a flashcard by ID', () => {
      // Mock successful deletion
      mockStmt.run.mockReturnValue({ changes: 1 });

      // Delete the flashcard
      const result = repository.deleteFlashCard('test-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM flashcards WHERE id = ?');

      // Check that run was called with the correct ID
      expect(mockStmt.run).toHaveBeenCalledWith('test-id');

      // Check that true was returned (deletion successful)
      expect(result).toBe(true);
    });

    test('should return false when no flashcard is deleted', () => {
      // Mock unsuccessful deletion
      mockStmt.run.mockReturnValue({ changes: 0 });

      // Delete the flashcard
      const result = repository.deleteFlashCard('non-existent-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM flashcards WHERE id = ?');

      // Check that run was called with the correct ID
      expect(mockStmt.run).toHaveBeenCalledWith('non-existent-id');

      // Check that false was returned (deletion unsuccessful)
      expect(result).toBe(false);
    });

    test('should return false for empty ID', () => {
      const result = repository.deleteFlashCard('');
      expect(result).toBe(false);
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });
  });
});