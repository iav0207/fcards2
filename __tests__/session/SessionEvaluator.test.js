const SessionEvaluator = require('../../src/services/session/SessionEvaluator');
const Session = require('../../src/models/Session');
const FlashCard = require('../../src/models/FlashCard');

// Mock the translation service
const mockTranslationService = {
  evaluateTranslation: jest.fn(),
  generateTranslation: jest.fn()
};

describe('SessionEvaluator', () => {
  let evaluator;
  let mockSession;
  let mockCard;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new evaluator instance
    evaluator = new SessionEvaluator({ translationService: mockTranslationService });
    
    // Spy on console methods
    console.error = jest.fn();
    
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
    
    // Setup default mock responses
    mockTranslationService.generateTranslation.mockResolvedValue('Hallo');
    mockTranslationService.evaluateTranslation.mockResolvedValue({
      correct: true,
      score: 0.9,
      feedback: 'Great job!',
      suggestedTranslation: 'Hallo',
      details: {
        grammar: 'Perfect',
        vocabulary: 'Excellent',
        accuracy: 'Accurate'
      }
    });
  });

  describe('constructor', () => {
    it('throws an error if translation service is not provided', () => {
      expect(() => new SessionEvaluator()).toThrow('TranslationService is required');
    });
  });

  describe('evaluateAnswer', () => {
    it('evaluates an answer successfully', async () => {
      const result = await evaluator.evaluateAnswer({
        session: mockSession,
        card: mockCard,
        answer: 'Hallo'
      });
      
      expect(result).toBeDefined();
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation.correct).toBe(true);
      expect(result.referenceTranslation).toBe('Hallo');
      expect(mockTranslationService.generateTranslation).toHaveBeenCalled();
      expect(mockTranslationService.evaluateTranslation).toHaveBeenCalled();
    });
    
    it('uses card.userTranslation as reference if available', async () => {
      mockCard.userTranslation = 'Hallo';
      
      await evaluator.evaluateAnswer({
        session: mockSession,
        card: mockCard,
        answer: 'Hallo'
      });
      
      expect(mockTranslationService.generateTranslation).not.toHaveBeenCalled();
    });
    
    it('continues after translation generation error with fallback', async () => {
      // Make translation generation fail
      mockTranslationService.generateTranslation.mockRejectedValue(
        new Error('API error')
      );
      
      const result = await evaluator.evaluateAnswer({
        session: mockSession,
        card: mockCard,
        answer: 'Hallo'
      });
      
      expect(result).toBeDefined();
      expect(result._hadTranslationError).toBe(true);
      expect(result.referenceTranslation).toBe('Hallo'); // Fallback to user answer
      expect(mockTranslationService.evaluateTranslation).toHaveBeenCalled();
    });
    
    it('provides fallback evaluation if both translation and evaluation fail', async () => {
      // Make both services fail
      mockTranslationService.generateTranslation.mockRejectedValue(
        new Error('Generation API error')
      );
      mockTranslationService.evaluateTranslation.mockRejectedValue(
        new Error('Evaluation API error')
      );
      
      const result = await evaluator.evaluateAnswer({
        session: mockSession,
        card: mockCard,
        answer: 'Hallo'
      });
      
      expect(result).toBeDefined();
      expect(result._hadTranslationError).toBe(true);
      expect(result.evaluation._fallback).toBe(true);
      expect(result.evaluation.correct).toBe(true); // Benefit of the doubt
      expect(result.evaluation.feedback).toContain('API error');
    });
  });
});