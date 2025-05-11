/**
 * Tests for TranslationEvaluator
 */
const TranslationEvaluator = require('../../src/services/translation/TranslationEvaluator');
const BaselineTranslator = require('../../src/services/translation/BaselineTranslator');

// Mock the TranslationProviderFactory
jest.mock('../../src/services/translation/TranslationProviderFactory', () => ({
  getFallbackProvider: jest.fn().mockReturnValue(null)
}));

// Mock the BaselineTranslator but keep actual implementation for testing
jest.mock('../../src/services/translation/BaselineTranslator', () => {
  return jest.fn().mockImplementation(() => {
    return {
      evaluateTranslation: jest.fn().mockImplementation((data) => {
        // Simple implementation for testing
        if (data.referenceTranslation && data.userTranslation === data.referenceTranslation) {
          return {
            correct: true,
            score: 1.0,
            feedback: "Perfect! Your translation matches exactly.",
            suggestedTranslation: data.referenceTranslation,
            details: {
              grammar: "Perfect",
              vocabulary: "Appropriate",
              accuracy: "Precise"
            }
          };
        } else {
          return {
            correct: false,
            score: 0.5,
            feedback: "Try again.",
            suggestedTranslation: data.referenceTranslation || "Suggested translation",
            details: {
              grammar: "Check grammar",
              vocabulary: "Review vocabulary",
              accuracy: "Needs improvement"
            }
          };
        }
      })
    };
  });
});

describe('TranslationEvaluator', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
  });

  describe('evaluateTranslation', () => {
    it('should use primary provider if available', async () => {
      const mockProvider = {
        evaluateTranslation: jest.fn().mockResolvedValue({
          correct: true,
          score: 0.9,
          feedback: "Provider evaluation"
        })
      };

      const evaluator = new TranslationEvaluator({
        providers: { 'gemini': mockProvider },
        primaryProvider: 'gemini'
      });

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo'
      };

      const result = await evaluator.evaluateTranslation(data);

      expect(mockProvider.evaluateTranslation).toHaveBeenCalledWith(data);
      expect(result.correct).toBe(true);
      expect(result.feedback).toBe("Provider evaluation");
    });

    it('should use baseline translator if no providers available', async () => {
      const evaluator = new TranslationEvaluator({
        providers: {},
        primaryProvider: ''
      });

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };

      const result = await evaluator.evaluateTranslation(data);

      // This confirms we're using the mocked baseline translator
      expect(BaselineTranslator).toHaveBeenCalled();
      expect(result.correct).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('should handle evaluation errors and enhance them', async () => {
      const mockProvider = {
        evaluateTranslation: jest.fn().mockRejectedValue(
          new Error('API key is invalid')
        )
      };

      const evaluator = new TranslationEvaluator({
        providers: { 'gemini': mockProvider },
        primaryProvider: 'gemini'
      });

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo'
      };

      await expect(evaluator.evaluateTranslation(data)).rejects.toThrow('API key');
      
      try {
        await evaluator.evaluateTranslation(data);
      } catch (error) {
        expect(error.apiKeyError).toBe(true);
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.provider).toBe('gemini');
      }
    });
  });
});