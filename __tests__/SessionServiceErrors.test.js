/**
 * Tests for SessionService error handling
 */
const SessionService = require('../src/services/SessionService');
const DatabaseService = require('../src/services/DatabaseService');
const TranslationService = require('../src/services/TranslationService');
const FlashCard = require('../src/models/FlashCard');
const Session = require('../src/models/Session');

// Mock dependencies
jest.mock('../src/services/DatabaseService');
jest.mock('../src/services/TranslationService');
jest.mock('../src/models/FlashCard');
jest.mock('../src/models/Session');

describe('SessionService Error Handling', () => {
  let sessionService;
  let mockDbService;
  let mockTranslationService;
  let mockSession;
  let mockFlashCard;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockDbService = {
      getSession: jest.fn(),
      getFlashCard: jest.fn(),
      saveSession: jest.fn(),
      getAllFlashCards: jest.fn().mockResolvedValue([])
    };
    
    mockTranslationService = {
      evaluateTranslation: jest.fn(),
      generateTranslation: jest.fn()
    };
    
    mockSession = {
      id: 'session-123',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      cardIds: ['card-123'],
      currentCardIndex: 0,
      completedAt: null,
      recordResponse: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 'session-123',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        cardIds: ['card-123'],
        currentCardIndex: 0,
        completedAt: null
      })
    };
    
    mockFlashCard = {
      id: 'card-123',
      content: 'Hello',
      sourceLanguage: 'en',
      userTranslation: null,
      toJSON: jest.fn().mockReturnValue({
        id: 'card-123',
        content: 'Hello',
        sourceLanguage: 'en',
        userTranslation: null
      })
    };
    
    // Setup session service with mocked dependencies
    sessionService = new SessionService({
      db: mockDbService,
      translationService: mockTranslationService
    });
    
    // Spy on console methods
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('submitAnswer error handling', () => {
    it('should throw enhanced error when session not found', async () => {
      // Setup - session not found
      mockDbService.getSession.mockResolvedValue(null);
      
      // Execute test
      try {
        await sessionService.submitAnswer('invalid-session-id', 'Hallo');
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is enhanced
        expect(error.message).toContain('Session error');
        expect(error.message).toContain('session could not be found or has expired');
        expect(error.sessionError).toBe(true);
      }
    });

    it('should throw error when session is already complete', async () => {
      // Setup - completed session
      const completedSession = { 
        ...mockSession, 
        completedAt: new Date().toISOString(),
        currentCardIndex: 1,
        cardIds: ['card-123']
      };
      mockDbService.getSession.mockResolvedValue(completedSession);
      
      // Execute test
      try {
        await sessionService.submitAnswer('session-123', 'Hallo');
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error contains expected message
        expect(error.message).toContain('Session is already complete');
      }
    });

    it('should handle translation errors and still complete answer submission', async () => {
      // Setup - session and card found
      mockDbService.getSession.mockResolvedValue(mockSession);
      mockDbService.getFlashCard.mockResolvedValue(mockFlashCard);
      
      // Setup - translation generation error
      mockTranslationService.generateTranslation.mockRejectedValue(
        new Error('Translation API error')
      );
      
      // Setup - evaluation still succeeds
      mockTranslationService.evaluateTranslation.mockResolvedValue({
        correct: true,
        score: 0.8,
        feedback: 'Good job!'
      });
      
      // Execute test
      const result = await sessionService.submitAnswer('session-123', 'Hallo');
      
      // Verify functions called
      expect(mockDbService.getSession).toHaveBeenCalledWith('session-123');
      expect(mockDbService.getFlashCard).toHaveBeenCalledWith('card-123');
      expect(mockTranslationService.generateTranslation).toHaveBeenCalled();
      expect(mockTranslationService.evaluateTranslation).toHaveBeenCalled();
      expect(mockSession.recordResponse).toHaveBeenCalled();
      expect(mockDbService.saveSession).toHaveBeenCalled();
      
      // Verify result indicates error occurred but continued
      expect(result._hadTranslationError).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation.correct).toBe(true);
    });

    it('should handle both translation and evaluation errors with fallback behavior', async () => {
      // Setup - session and card found
      mockDbService.getSession.mockResolvedValue(mockSession);
      mockDbService.getFlashCard.mockResolvedValue(mockFlashCard);
      
      // Setup - translation generation error
      mockTranslationService.generateTranslation.mockRejectedValue(
        new Error('Translation API error')
      );
      
      // Setup - evaluation also fails
      mockTranslationService.evaluateTranslation.mockRejectedValue(
        new Error('Evaluation API error')
      );
      
      // Execute test
      const result = await sessionService.submitAnswer('session-123', 'Hallo');
      
      // Verify result uses fallback evaluation
      expect(result._hadTranslationError).toBe(true);
      expect(result.evaluation._fallback).toBe(true);
      expect(result.evaluation.correct).toBe(true); // Gives benefit of the doubt
      expect(result.evaluation.feedback).toContain('API error');
      
      // Ensure session was still updated despite errors
      expect(mockSession.recordResponse).toHaveBeenCalled();
      expect(mockDbService.saveSession).toHaveBeenCalled();
    });
  });
});