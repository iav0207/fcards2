/**
 * Tests for TagRepository
 */
const TagRepository = require('../../src/repositories/TagRepository');
const FlashCard = require('../../src/models/FlashCard');

// Mock database
const mockDb = {
  prepare: jest.fn(),
};

// Mock FlashCardRepository
const mockFlashCardRepository = {
  getAllFlashCards: jest.fn()
};

describe('TagRepository', () => {
  let repository;

  beforeEach(() => {
    // Reset mocks
    mockDb.prepare.mockReset();
    mockFlashCardRepository.getAllFlashCards.mockReset();

    // Create repository with initialized state
    repository = new TagRepository(mockDb, mockFlashCardRepository, true);
  });

  describe('getAvailableTags', () => {
    test('should return tags and counts for a source language', () => {
      // Mock sample flash cards
      const mockCards = [
        new FlashCard({ content: 'apple', sourceLanguage: 'en', tags: ['food', 'fruit'] }),
        new FlashCard({ content: 'banana', sourceLanguage: 'en', tags: ['food', 'fruit'] }),
        new FlashCard({ content: 'dog', sourceLanguage: 'en', tags: ['animal'] }),
        new FlashCard({ content: 'cat', sourceLanguage: 'en', tags: ['animal'] }),
        new FlashCard({ content: 'house', sourceLanguage: 'en', tags: ['building'] }),
        new FlashCard({ content: 'car', sourceLanguage: 'en', tags: [] }),
        new FlashCard({ content: 'table', sourceLanguage: 'en', tags: [] })
      ];

      // Set up mock to return these cards
      mockFlashCardRepository.getAllFlashCards.mockReturnValue(mockCards);

      // Get available tags
      const result = repository.getAvailableTags('en');

      // Check that FlashCardRepository was called correctly
      expect(mockFlashCardRepository.getAllFlashCards).toHaveBeenCalledWith({ sourceLanguage: 'en' });

      // Check the tags returned
      expect(result.tags.length).toBe(4); // 4 unique tags: animal, building, food, fruit
      expect(result.untaggedCount).toBe(2); // 2 untagged cards

      // Check specific tags and their counts
      const foodTag = result.tags.find(t => t.tag === 'food');
      expect(foodTag).toBeDefined();
      expect(foodTag.count).toBe(2);

      const animalTag = result.tags.find(t => t.tag === 'animal');
      expect(animalTag).toBeDefined();
      expect(animalTag.count).toBe(2);

      const buildingTag = result.tags.find(t => t.tag === 'building');
      expect(buildingTag).toBeDefined();
      expect(buildingTag.count).toBe(1);

      // Check that tags are sorted alphabetically
      expect(result.tags[0].tag).toBe('animal');
      expect(result.tags[1].tag).toBe('building');
      expect(result.tags[2].tag).toBe('food');
      expect(result.tags[3].tag).toBe('fruit');
    });

    test('should return empty result when no source language is provided', () => {
      // Get available tags without source language
      const result = repository.getAvailableTags();

      // Check that FlashCardRepository was not called
      expect(mockFlashCardRepository.getAllFlashCards).not.toHaveBeenCalled();

      // Check the empty result
      expect(result.tags).toEqual([]);
      expect(result.untaggedCount).toBe(0);
    });

    test('should return empty tags when no cards are found', () => {
      // Mock empty result
      mockFlashCardRepository.getAllFlashCards.mockReturnValue([]);

      // Get available tags
      const result = repository.getAvailableTags('en');

      // Check that FlashCardRepository was called correctly
      expect(mockFlashCardRepository.getAllFlashCards).toHaveBeenCalledWith({ sourceLanguage: 'en' });

      // Check the empty result
      expect(result.tags).toEqual([]);
      expect(result.untaggedCount).toBe(0);
    });

    test('should return only tags for the specified language', () => {
      // Different cards for different languages
      const mockCards = [
        new FlashCard({ content: 'apple', sourceLanguage: 'en', tags: ['food'] }),
        new FlashCard({ content: 'Apfel', sourceLanguage: 'de', tags: ['food', 'fruit'] })
      ];

      // Only return the German card
      mockFlashCardRepository.getAllFlashCards.mockImplementation(options => {
        if (options.sourceLanguage === 'de') {
          return [mockCards[1]];
        }
        return [];
      });

      // Get available tags for German
      const result = repository.getAvailableTags('de');

      // Check that FlashCardRepository was called correctly
      expect(mockFlashCardRepository.getAllFlashCards).toHaveBeenCalledWith({ sourceLanguage: 'de' });

      // Check the tags returned
      expect(result.tags.length).toBe(2);
      expect(result.untaggedCount).toBe(0);

      // Verify specific tags
      const foodTag = result.tags.find(t => t.tag === 'food');
      expect(foodTag).toBeDefined();
      expect(foodTag.count).toBe(1);

      const fruitTag = result.tags.find(t => t.tag === 'fruit');
      expect(fruitTag).toBeDefined();
      expect(fruitTag.count).toBe(1);
    });

    test('should throw an error if database is not initialized', () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new TagRepository(mockDb, mockFlashCardRepository, false);

      // Expect error when trying to get tags
      expect(() => {
        uninitializedRepo.getAvailableTags('en');
      }).toThrow('Database not initialized');
    });
  });
});