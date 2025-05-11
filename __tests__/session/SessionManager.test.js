const SessionManager = require('../../src/services/session/SessionManager');
const Session = require('../../src/models/Session');
const FlashCard = require('../../src/models/FlashCard');

// Mock the dependencies
const mockDb = {
  saveSession: jest.fn(),
  getSession: jest.fn(),
  getFlashCard: jest.fn()
};

const mockCardSelector = {
  selectCards: jest.fn()
};

const mockProgressTracker = {
  getCurrentCard: jest.fn(),
  advanceSession: jest.fn(),
  getSessionStats: jest.fn(),
  recordResponse: jest.fn()
};

const mockEvaluator = {
  evaluateAnswer: jest.fn()
};

describe('SessionManager', () => {
  let sessionManager;
  let mockSession;
  let mockCard;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new manager instance
    sessionManager = new SessionManager({
      db: mockDb,
      cardSelector: mockCardSelector,
      progressTracker: mockProgressTracker,
      evaluator: mockEvaluator
    });
    
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
    mockCardSelector.selectCards.mockResolvedValue(['card1', 'card2', 'card3']);
    mockProgressTracker.getCurrentCard.mockResolvedValue({
      sessionId: 'test-session-id',
      card: mockCard
    });
    mockProgressTracker.advanceSession.mockResolvedValue({
      isComplete: false,
      nextCard: { card: mockCard }
    });
    mockProgressTracker.getSessionStats.mockResolvedValue({
      stats: { totalCards: 3 }
    });
    mockEvaluator.evaluateAnswer.mockResolvedValue({
      evaluation: { correct: true }
    });
  });

  describe('constructor', () => {
    it('throws an error if required dependencies are not provided', () => {
      expect(() => new SessionManager()).toThrow('DatabaseService is required');
      expect(() => new SessionManager({ db: mockDb })).toThrow('SessionCardSelector is required');
      expect(() => new SessionManager({ 
        db: mockDb, 
        cardSelector: mockCardSelector 
      })).toThrow('SessionProgressTracker is required');
      expect(() => new SessionManager({ 
        db: mockDb, 
        cardSelector: mockCardSelector,
        progressTracker: mockProgressTracker
      })).toThrow('SessionEvaluator is required');
    });
  });

  describe('createSession', () => {
    it('creates a new session with the provided options', async () => {
      // Setup Session constructor mock
      jest.spyOn(Session.prototype, 'toJSON').mockReturnValue({
        id: 'new-session-id',
        cardIds: ['card1', 'card2', 'card3']
      });
      
      const result = await sessionManager.createSession({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 5,
        useSampleCards: true,
        tags: ['grammar'],
        includeUntagged: true
      });
      
      expect(result).toBeDefined();
      expect(result.cardIds).toEqual(['card1', 'card2', 'card3']);
      expect(mockCardSelector.selectCards).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        maxCards: 5,
        useSampleCards: true,
        tags: ['grammar'],
        includeUntagged: true
      });
      expect(mockDb.saveSession).toHaveBeenCalled();
    });
  });

  describe('getCurrentCard', () => {
    it('delegates to the progress tracker', async () => {
      const result = await sessionManager.getCurrentCard('test-session-id');
      
      expect(result).toBeDefined();
      expect(mockProgressTracker.getCurrentCard).toHaveBeenCalledWith('test-session-id');
    });
  });

  describe('submitAnswer', () => {
    it('submits and evaluates an answer', async () => {
      const result = await sessionManager.submitAnswer('test-session-id', 'Hallo');
      
      expect(result).toBeDefined();
      expect(mockDb.getSession).toHaveBeenCalledWith('test-session-id');
      expect(mockDb.getFlashCard).toHaveBeenCalledWith('card1');
      expect(mockEvaluator.evaluateAnswer).toHaveBeenCalled();
      expect(mockProgressTracker.recordResponse).toHaveBeenCalled();
    });
    
    it('throws an enhanced error if session is not found', async () => {
      mockDb.getSession.mockResolvedValue(null);
      
      try {
        await sessionManager.submitAnswer('nonexistent', 'Hallo');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('session could not be found');
        expect(error.sessionError).toBe(true);
      }
    });
    
    it('throws an error if session is already complete', async () => {
      mockSession.completedAt = new Date();
      mockDb.getSession.mockResolvedValue(mockSession);
      
      await expect(sessionManager.submitAnswer('test-session-id', 'Hallo')).rejects.toThrow('Session is already complete');
    });
  });

  describe('advanceSession', () => {
    it('delegates to the progress tracker', async () => {
      const result = await sessionManager.advanceSession('test-session-id');
      
      expect(result).toBeDefined();
      expect(mockProgressTracker.advanceSession).toHaveBeenCalledWith('test-session-id');
    });
  });

  describe('getSessionStats', () => {
    it('delegates to the progress tracker', async () => {
      const result = await sessionManager.getSessionStats('test-session-id');
      
      expect(result).toBeDefined();
      expect(mockProgressTracker.getSessionStats).toHaveBeenCalledWith('test-session-id');
    });
  });
});