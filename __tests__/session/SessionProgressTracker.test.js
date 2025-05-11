const SessionProgressTracker = require('../../src/services/session/SessionProgressTracker');
const Session = require('../../src/models/Session');
const FlashCard = require('../../src/models/FlashCard');

// Mock the database service
const mockDb = {
  getSession: jest.fn(),
  getFlashCard: jest.fn(),
  saveSession: jest.fn()
};

describe('SessionProgressTracker', () => {
  let progressTracker;
  let mockSession;
  let mockCard;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new tracker instance
    progressTracker = new SessionProgressTracker({ db: mockDb });
    
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
      expect(() => new SessionProgressTracker()).toThrow('DatabaseService is required');
    });
  });

  describe('getCurrentCard', () => {
    it('gets the current card for a session', async () => {
      const result = await progressTracker.getCurrentCard('test-session-id');
      
      expect(result).toBeDefined();
      expect(result.card).toBeDefined();
      expect(result.sessionProgress).toBeDefined();
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
      expect(mockDb.getFlashCard).toHaveBeenCalledWith('card1');
    });
    
    it('returns null if the session is complete', async () => {
      mockSession.currentCardIndex = 3; // Beyond the end of cardIds
      mockDb.getSession.mockResolvedValue(mockSession);
      
      const result = await progressTracker.getCurrentCard('test-session-id');
      
      expect(result).toBeNull();
    });
    
    it('throws an error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      await expect(progressTracker.getCurrentCard('nonexistent')).rejects.toThrow('Session not found');
    });
    
    it('throws an error if card is not found', async () => {
      mockDb.getFlashCard.mockResolvedValue(null);
      
      await expect(progressTracker.getCurrentCard('test-session-id')).rejects.toThrow('Card not found');
    });
  });

  describe('advanceSession', () => {
    it('advances to the next card', async () => {
      mockSession.nextCard = jest.fn().mockReturnValue(true);
      mockDb.getSession.mockResolvedValue(mockSession);
      
      const result = await progressTracker.advanceSession('test-session-id');
      
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

      const result = await progressTracker.advanceSession('test-session-id');

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

      const result = await progressTracker.advanceSession('test-session-id');

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
      
      const result = await progressTracker.getSessionStats('test-session-id');
      
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.isComplete).toBe(false);
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
    });
    
    it('throws an error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      await expect(progressTracker.getSessionStats('nonexistent')).rejects.toThrow('Session not found');
    });
  });

  describe('recordResponse', () => {
    it('records a response in the session', async () => {
      mockSession.recordResponse = jest.fn();
      
      await progressTracker.recordResponse(mockSession, 'card1', 'Hallo', true);
      
      expect(mockSession.recordResponse).toHaveBeenCalledWith('card1', 'Hallo', true);
      expect(mockDb.saveSession).toHaveBeenCalledWith(mockSession);
    });
  });
});