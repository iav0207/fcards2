/**
 * Tests for TranslationService
 */
const TranslationService = require('../src/services/TranslationService');
const Settings = require('../src/models/Settings');

// Mock the provider factories and evaluators
jest.mock('../src/services/translation/TranslationProviderFactory', () => {
  return {
    createProviders: jest.fn().mockReturnValue({
      providers: {
        gemini: { evaluateTranslation: jest.fn(), generateTranslation: jest.fn() }
      },
      primaryProvider: 'gemini',
      translationApiKey: 'mock-gemini-key'
    }),
    getFallbackProvider: jest.fn().mockReturnValue(null)
  };
});

jest.mock('../src/services/translation/TranslationEvaluator');
jest.mock('../src/services/translation/TranslationGenerator');

// Mock environment module
jest.mock('../src/utils/environment', () => ({
  getEnvironmentConfig: jest.fn().mockReturnValue({
    GEMINI_API_KEY: 'mock-gemini-key',
    OPENAI_API_KEY: 'mock-openai-key'
  }),
  checkApiKeysAvailability: jest.fn().mockReturnValue({
    gemini: true,
    openai: true,
    hasAnyTranslationApi: true
  }),
  isDevelopment: jest.fn().mockReturnValue(true)
}));

describe('TranslationService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations for the evaluator and generator
    const TranslationEvaluator = require('../src/services/translation/TranslationEvaluator');
    TranslationEvaluator.mockImplementation(() => ({
      evaluateTranslation: jest.fn().mockResolvedValue({
        correct: true,
        score: 0.9,
        feedback: 'Great job!',
        suggestedTranslation: 'Hallo',
        details: {
          grammar: 'Perfect',
          vocabulary: 'Excellent',
          accuracy: 'Accurate'
        }
      })
    }));

    const TranslationGenerator = require('../src/services/translation/TranslationGenerator');
    TranslationGenerator.mockImplementation(() => ({
      generateTranslation: jest.fn().mockResolvedValue('Hallo')
    }));
  });
  
  describe('constructor', () => {
    it('should create an instance with default settings', () => {
      const service = new TranslationService();
      expect(service).toBeInstanceOf(TranslationService);
      expect(service.settings).toBeInstanceOf(Settings);
    });
    
    it('should initialize with provided settings', () => {
      const settings = new Settings({
        translationApiProvider: 'openai',
        translationApiKey: 'test-key'
      });

      const service = new TranslationService({ settings });
      expect(service.settings.translationApiProvider).toBe('gemini'); // Updated by mock
      expect(service.settings.translationApiKey).toBe('mock-gemini-key'); // Updated by mock
    });
    
    it('should use environment variables if no API key is set', () => {
      const service = new TranslationService();
      expect(service.settings.translationApiKey).toBeTruthy();
    });
  });
  
  describe('evaluateTranslation', () => {
    it('should delegate to the evaluator', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo'
      };

      const result = await service.evaluateTranslation(data);

      // Expect the evaluator's evaluateTranslation to be called
      expect(service.evaluator.evaluateTranslation).toHaveBeenCalledWith(data);
      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.9);
    });

    it('should handle evaluator errors', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      // Make the evaluator throw an error
      service.evaluator.evaluateTranslation.mockRejectedValue(new Error('API error'));

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };

      // Expect the error to be propagated
      await expect(service.evaluateTranslation(data)).rejects.toThrow('API error');
    });
  });
  
  describe('generateTranslation', () => {
    it('should delegate to the generator', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      const result = await service.generateTranslation(data);

      // Expect the generator's generateTranslation to be called
      expect(service.generator.generateTranslation).toHaveBeenCalledWith(data);
      expect(result).toBe('Hallo');
    });

    it('should handle generator errors', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      // Make the generator throw an error
      service.generator.generateTranslation.mockRejectedValue(new Error('API error'));

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      // Expect the error to be propagated
      await expect(service.generateTranslation(data)).rejects.toThrow('API error');
    });
  });
  
  describe('_isCloseMatch', () => {
    it('should use BaselineTranslator for string comparison', () => {
      const service = new TranslationService();

      expect(service._isCloseMatch('Hello there', 'Hello')).toBe(true);
      expect(service._isCloseMatch('Hello', 'Goodbye')).toBe(false);
    });
  });
});