const SessionService = require('../src/services/SessionService');
const TranslationService = require('../src/services/TranslationService');
const Session = require('../src/models/Session');
const FlashCard = require('../src/models/FlashCard');

// Mock the database service
const mockDb = {
  saveFlashCard: jest.fn(card => card),
  getFlashCard: jest.fn(),
  getAllFlashCards: jest.fn(() => []),
  saveSession: jest.fn(session => session),
  getSession: jest.fn()
};

// Mock the translation service
jest.mock('../src/services/TranslationService', () => {
  return jest.fn().mockImplementation(() => ({
    generateTranslation: jest.fn().mockResolvedValue('Mocked Translation'),
    evaluateTranslation: jest.fn().mockResolvedValue({
      correct: true,
      score: 0.9,
      feedback: 'Good job!',
      suggestedTranslation: 'Mocked Translation',
      details: {}
    })
  }));
});

describe('SessionService', () => {
  let sessionService;
  let mockSession;
  let mockCard;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new service instance
    sessionService = new SessionService({ db: mockDb });
    
    // Create mock session and card
    mockSession = new Session({
      id: 'test-session-id',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      cardIds: ['card1', 'card2', 'card3'],
      currentCardIndex: 0
    });
    
    mockCard = new FlashCard({
      id: 'card1',
      content: 'Hello',
      sourceLanguage: 'en'
    });
    
    // Setup mock returns
    mockDb.getSession.mockResolvedValue(mockSession);
    mockDb.getFlashCard.mockResolvedValue(mockCard);
  });

  describe('constructor', () => {
    it('throws an error if database service is not provided', () => {
      expect(() => new SessionService()).toThrow('DatabaseService is required');
    });
    
    it('creates a default translation service if not provided', () => {
      const service = new SessionService({ db: mockDb });
      expect(TranslationService).toHaveBeenCalled();
    });
    
    it('uses the provided translation service', () => {
      const mockTranslationService = new TranslationService();
      const service = new SessionService({ 
        db: mockDb, 
        translationService: mockTranslationService 
      });
      
      expect(service.translationService).toBe(mockTranslationService);
    });
    
    it('generates sample cards', () => {
      expect(sessionService.sampleCards).toBeDefined();
      expect(sessionService.sampleCards.length).toBeGreaterThan(0);
      expect(sessionService.sampleCards[0]).toBeInstanceOf(FlashCard);
    });
  });

  describe('createSession', () => {
    it('creates a session with sample cards', async () => {
      // Mock the getFlashCard method to always return null (card doesn't exist)
      // so that saveFlashCard will be called
      mockDb.getFlashCard.mockResolvedValue(null);

      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });

      expect(session).toBeDefined();
      expect(mockDb.saveSession).toHaveBeenCalled();
      expect(mockDb.saveFlashCard).toHaveBeenCalled();
    });
    
    it('creates a session with cards from the database', async () => {
      const dbCards = [
        new FlashCard({ id: 'db-card-1', content: 'Test', sourceLanguage: 'en' })
      ];
      mockDb.getAllFlashCards.mockResolvedValue(dbCards);
      
      const session = await sessionService.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        useSampleCards: false
      });
      
      expect(session).toBeDefined();
      expect(mockDb.getAllFlashCards).toHaveBeenCalled();
      expect(mockDb.saveSession).toHaveBeenCalled();
    });
  });

  describe('getCurrentCard', () => {
    it('gets the current card for a session', async () => {
      const result = await sessionService.getCurrentCard('test-session-id');
      
      expect(result).toBeDefined();
      expect(result.card).toBeDefined();
      expect(result.sessionProgress).toBeDefined();
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
      expect(mockDb.getFlashCard).toHaveBeenCalledWith('card1');
    });
    
    it('returns null if the session is complete', async () => {
      mockSession.currentCardIndex = 3; // Beyond the end of cardIds
      mockDb.getSession.mockResolvedValue(mockSession);
      
      const result = await sessionService.getCurrentCard('test-session-id');
      
      expect(result).toBeNull();
    });
    
    it('throws an error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      await expect(sessionService.getCurrentCard('nonexistent')).rejects.toThrow('Session not found');
    });
    
    it('throws an error if card is not found', async () => {
      mockDb.getFlashCard.mockResolvedValue(null);
      
      await expect(sessionService.getCurrentCard('test-session-id')).rejects.toThrow('Card not found');
    });
  });

  describe('submitAnswer', () => {
    it('submits and evaluates an answer', async () => {
      const result = await sessionService.submitAnswer('test-session-id', 'Hallo');
      
      expect(result).toBeDefined();
      expect(result.evaluation).toBeDefined();
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
      expect(mockDb.getFlashCard).toHaveBeenCalledWith('card1');
      expect(mockDb.saveSession).toHaveBeenCalled();
      expect(sessionService.translationService.evaluateTranslation).toHaveBeenCalled();
    });
    
    it('uses card.userTranslation as reference if available', async () => {
      mockCard.userTranslation = 'Hallo';
      mockDb.getFlashCard.mockResolvedValue(mockCard);
      
      await sessionService.submitAnswer('test-session-id', 'Hallo');
      
      expect(sessionService.translationService.generateTranslation).not.toHaveBeenCalled();
    });
    
    it('throws an error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      await expect(sessionService.submitAnswer('nonexistent', 'Hallo')).rejects.toThrow('Session not found');
    });
    
    it('throws an error if session is complete', async () => {
      mockSession.completedAt = new Date();
      mockDb.getSession.mockResolvedValue(mockSession);
      
      await expect(sessionService.submitAnswer('test-session-id', 'Hallo')).rejects.toThrow('Session is already complete');
    });
  });

  describe('advanceSession', () => {
    it('advances to the next card', async () => {
      mockSession.nextCard = jest.fn().mockReturnValue(true);
      mockDb.getSession.mockResolvedValue(mockSession);
      
      const result = await sessionService.advanceSession('test-session-id');
      
      expect(result).toBeDefined();
      expect(result.isComplete).toBe(false);
      expect(result.nextCard).toBeDefined();
      expect(mockSession.nextCard).toHaveBeenCalled();
      expect(mockDb.saveSession).toHaveBeenCalled();
    });
    
    it('completes the session when no more cards', async () => {
      // Create a spy for the nextCard method
      const nextCardSpy = jest.spyOn(mockSession, 'nextCard').mockReturnValue(false);
      mockSession.getStats = jest.fn().mockReturnValue({ totalCards: 3, answeredCards: 3 });
      mockDb.getSession.mockResolvedValue(mockSession);

      const result = await sessionService.advanceSession('test-session-id');

      expect(result).toBeDefined();
      expect(result.isComplete).toBe(true);
      expect(result.stats).toBeDefined();
      expect(nextCardSpy).toHaveBeenCalled();
      expect(mockDb.saveSession).toHaveBeenCalled();

      // Clean up
      nextCardSpy.mockRestore();
    });

    it('returns stats if session already complete', async () => {
      // Use a new session instance with completedAt set
      const completedSession = new Session({
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        cardIds: ['card1', 'card2', 'card3'],
        currentCardIndex: 3,
        completedAt: new Date()
      });

      // Add spy to track if nextCard is called
      const nextCardSpy = jest.spyOn(completedSession, 'nextCard');
      completedSession.getStats = jest.fn().mockReturnValue({ totalCards: 3, answeredCards: 3 });

      // Use this session for the test
      mockDb.getSession.mockResolvedValue(completedSession);

      const result = await sessionService.advanceSession('test-session-id');

      expect(result).toBeDefined();
      expect(result.isComplete).toBe(true);
      expect(result.stats).toBeDefined();
      expect(nextCardSpy).not.toHaveBeenCalled();

      // Clean up
      nextCardSpy.mockRestore();
    });
  });

  describe('getSessionStats', () => {
    it('returns session statistics', async () => {
      mockSession.getStats = jest.fn().mockReturnValue({ totalCards: 3, answeredCards: 1 });
      mockDb.getSession.mockResolvedValue(mockSession);
      
      const result = await sessionService.getSessionStats('test-session-id');
      
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.isComplete).toBe(false);
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
    });
    
    it('throws an error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      await expect(sessionService.getSessionStats('nonexistent')).rejects.toThrow('Session not found');
    });
  });

  describe('generateSampleCards', () => {
    it('generates a list of sample flashcards', () => {
      const cards = sessionService.generateSampleCards();
      
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0]).toBeInstanceOf(FlashCard);
      expect(cards[0].sourceLanguage).toBe('en');
      expect(cards[0].tags).toContain('sample');
    });
  });
});