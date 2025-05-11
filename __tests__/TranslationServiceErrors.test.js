/**
 * Tests for the TranslationService error handling
 */
const TranslationService = require('../src/services/TranslationService');
// Mock the translation providers and components
jest.mock('../src/services/translation/TranslationProviderFactory', () => {
  return {
    createProviders: jest.fn().mockReturnValue({
      providers: {
        gemini: { evaluateTranslation: jest.fn(), generateTranslation: jest.fn() }
      },
      primaryProvider: 'gemini',
      translationApiKey: 'fake-key'
    }),
    getFallbackProvider: jest.fn().mockReturnValue(null)
  };
});

jest.mock('../src/services/translation/TranslationEvaluator');
jest.mock('../src/services/translation/TranslationGenerator');

// Mock environment utilities
jest.mock('../src/utils/environment', () => ({
  getEnvironmentConfig: jest.fn().mockReturnValue({
    GEMINI_API_KEY: 'fake-key',
    OPENAI_API_KEY: 'fake-key'
  }),
  checkApiKeysAvailability: jest.fn().mockReturnValue({
    gemini: true,
    openai: true,
    hasAnyTranslationApi: true
  }),
  isDevelopment: jest.fn().mockReturnValue(true)
}));

describe('TranslationService Error Handling', () => {
  let translationService;
  let mockGeminiProviderInstance;
  let mockOpenAIProviderInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create translation service with mocked providers
    translationService = new TranslationService({
      apiProvider: 'gemini',
      apiKey: 'fake-key'
    });

    // Setup mock evaluator
    translationService.evaluator = {
      evaluateTranslation: jest.fn()
    };

    // Setup mock generator
    translationService.generator = {
      generateTranslation: jest.fn()
    };

    // Spy on console methods
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('Error handling in evaluateTranslation', () => {
    const translationData = {
      sourceContent: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      userTranslation: 'Hallo'
    };

    it('should throw enhanced error when evaluator fails', async () => {
      // Cause the evaluator to fail
      const originalError = new Error('API key is invalid');
      translationService.evaluator.evaluateTranslation.mockRejectedValue(originalError);

      // Execute test
      try {
        await translationService.evaluateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is enhanced
        expect(error.message).toContain('API key is invalid');
      }
    });

    it('should pass the evaluation to the evaluator', async () => {
      // Setup successful evaluation
      translationService.evaluator.evaluateTranslation.mockResolvedValue({
        correct: true,
        score: 0.9,
        feedback: 'Great job!'
      });

      // Execute test
      const result = await translationService.evaluateTranslation(translationData);

      // Verify evaluator was called with correct data
      expect(translationService.evaluator.evaluateTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceContent: 'Hello',
          sourceLanguage: 'en',
          targetLanguage: 'de'
        })
      );

      // Verify result is returned
      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.9);
    });
  });

  describe('Error handling in generateTranslation', () => {
    const translationData = {
      content: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'de'
    };

    it('should throw error when generator fails', async () => {
      // Cause the generator to fail
      const originalError = new Error('API quota exceeded');
      translationService.generator.generateTranslation.mockRejectedValue(originalError);

      // Execute test
      try {
        await translationService.generateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is passed through
        expect(error.message).toContain('API quota exceeded');
      }
    });

    it('should pass the translation to the generator', async () => {
      // Setup successful generation
      translationService.generator.generateTranslation.mockResolvedValue('Hallo');

      // Execute test
      const result = await translationService.generateTranslation(translationData);

      // Verify generator was called with correct data
      expect(translationService.generator.generateTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
          sourceLanguage: 'en',
          targetLanguage: 'de'
        })
      );

      // Verify result is returned
      expect(result).toBe('Hallo');
    });
  });
});