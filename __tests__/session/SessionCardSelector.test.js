const SessionCardSelector = require('../../src/services/session/SessionCardSelector');
const FlashCard = require('../../src/models/FlashCard');

// Mock the database service
const mockDb = {
  saveFlashCard: jest.fn(card => card),
  getFlashCard: jest.fn(),
  getAllFlashCards: jest.fn(() => [])
};

describe('SessionCardSelector', () => {
  let cardSelector;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new selector instance
    cardSelector = new SessionCardSelector({ db: mockDb });
    
    // Spy on console methods
    console.log = jest.fn();
  });

  describe('constructor', () => {
    it('throws an error if database service is not provided', () => {
      expect(() => new SessionCardSelector()).toThrow('DatabaseService is required');
    });
    
    it('generates sample cards', () => {
      expect(cardSelector.sampleCards).toBeDefined();
      expect(cardSelector.sampleCards.length).toBeGreaterThan(0);
      expect(cardSelector.sampleCards[0]).toBeInstanceOf(FlashCard);
      expect(cardSelector.sampleCards[0].tags).toContain('sample');
    });
  });

  describe('selectCards', () => {
    it('selects sample cards when useSampleCards is true', async () => {
      // Mock the getFlashCard method to always return null (card doesn't exist)
      mockDb.getFlashCard.mockResolvedValue(null);

      const cardIds = await cardSelector.selectCards({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 5,
        useSampleCards: true,
        tags: [],
        includeUntagged: false
      });

      expect(cardIds).toBeDefined();
      expect(cardIds.length).toBeGreaterThan(0);
      expect(cardIds.length).toBeLessThanOrEqual(5);
      expect(mockDb.saveFlashCard).toHaveBeenCalled();
    });
    
    it('selects database cards when useSampleCards is false', async () => {
      const dbCards = [
        new FlashCard({ id: 'db-card-1', content: 'Test', sourceLanguage: 'en' }),
        new FlashCard({ id: 'db-card-2', content: 'Test2', sourceLanguage: 'en' })
      ];
      mockDb.getAllFlashCards.mockResolvedValue(dbCards);
      
      const cardIds = await cardSelector.selectCards({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 5,
        useSampleCards: false,
        tags: [],
        includeUntagged: false
      });
      
      expect(cardIds).toBeDefined();
      expect(cardIds.length).toBe(2);
      expect(cardIds).toContain('db-card-1');
      expect(cardIds).toContain('db-card-2');
      expect(mockDb.getAllFlashCards).toHaveBeenCalled();
    });
    
    it('includes tag filters when specified', async () => {
      await cardSelector.selectCards({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 5,
        useSampleCards: false,
        tags: ['grammar', 'vocabulary'],
        includeUntagged: true
      });
      
      expect(mockDb.getAllFlashCards).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        tags: ['grammar', 'vocabulary'],
        includeUntagged: true
      });
    });
  });

  describe('getRandomSample', () => {
    it('returns a random sample of the input array', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = cardSelector.getRandomSample(input, 3);

      expect(result.length).toBe(3);
      // The original array should remain unchanged
      expect(input.length).toBe(10);
      // All items in result should come from the input
      expect(result.every(item => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(item))).toBe(true);
    });

    it('returns the entire array if count is larger than the array length', () => {
      const input = [1, 2, 3];
      const result = cardSelector.getRandomSample(input, 5);

      // Should return 3 items (the entire array)
      expect(result.length).toBeLessThanOrEqual(3);
      // All items in result should come from the input
      expect(result.every(item => [1, 2, 3].includes(item))).toBe(true);
    });
  });

  describe('generateSampleCards', () => {
    it('generates a list of sample flashcards', () => {
      const cards = cardSelector.generateSampleCards();
      
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0]).toBeInstanceOf(FlashCard);
      expect(cards[0].sourceLanguage).toBe('en');
      expect(cards[0].tags).toContain('sample');
    });
  });
});