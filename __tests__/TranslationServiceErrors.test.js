/**
 * Tests for the TranslationService error handling
 */
const TranslationService = require('../src/services/TranslationService');
const GeminiProvider = require('../src/services/translation/GeminiProvider');
const OpenAIProvider = require('../src/services/translation/OpenAIProvider');

// Mock the translation providers
jest.mock('../src/services/translation/GeminiProvider');
jest.mock('../src/services/translation/OpenAIProvider');

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
    
    // Setup mock implementations for the provider instances
    mockGeminiProviderInstance = {
      evaluateTranslation: jest.fn(),
      generateTranslation: jest.fn()
    };
    
    mockOpenAIProviderInstance = {
      evaluateTranslation: jest.fn(),
      generateTranslation: jest.fn()
    };
    
    // Make the constructors return our mock instances
    GeminiProvider.mockImplementation(() => mockGeminiProviderInstance);
    OpenAIProvider.mockImplementation(() => mockOpenAIProviderInstance);
    
    // Create translation service with mocked providers
    translationService = new TranslationService({
      apiProvider: 'gemini',
      apiKey: 'fake-key'
    });
    
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

    it('should throw enhanced error when provider fails', async () => {
      // Cause the provider to fail
      const originalError = new Error('API key is invalid');
      mockGeminiProviderInstance.evaluateTranslation.mockRejectedValue(originalError);
      
      // Execute test
      try {
        await translationService.evaluateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is enhanced
        expect(error.message).toContain('Translation API key error');
        expect(error.apiKeyError).toBe(true);
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.provider).toBe('gemini');
        expect(error.originalError).toBe(originalError);
      }
      
      // Verify console calls
      expect(console.error).toHaveBeenCalledWith(
        'Translation evaluation error:',
        'API key is invalid'
      );
    });

    it('should check for fallback providers when primary fails', async () => {
      // Make primary provider fail
      mockGeminiProviderInstance.evaluateTranslation.mockRejectedValue(
        new Error('Primary provider failed')
      );

      // Execute test
      try {
        await translationService.evaluateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify that the error is properly enhanced
        expect(error.message).toContain('Translation evaluation failed');
        expect(error.message).toContain('Primary provider failed');
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.provider).toBe('gemini');

        // Verify primary provider was called
        expect(mockGeminiProviderInstance.evaluateTranslation).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceContent: 'Hello',
            sourceLanguage: 'en',
            targetLanguage: 'de'
          })
        );
      }
    });

    it('should enhance network errors with useful information', async () => {
      // Network error
      mockGeminiProviderInstance.evaluateTranslation.mockRejectedValue(
        new Error('Failed to fetch')
      );
      
      // Execute test
      try {
        await translationService.evaluateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is enhanced
        expect(error.message).toContain('Translation evaluation failed');
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.sourceLanguage).toBe('en');
        expect(error.translationContext.targetLanguage).toBe('de');
      }
    });
  });

  describe('Error handling in generateTranslation', () => {
    const translationData = {
      content: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'de'
    };

    it('should throw enhanced error when provider fails', async () => {
      // Cause the provider to fail
      const originalError = new Error('API quota exceeded');
      mockGeminiProviderInstance.generateTranslation.mockRejectedValue(originalError);
      
      // Execute test
      try {
        await translationService.generateTranslation(translationData);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error is enhanced
        expect(error.message).toContain('Translation generation failed');
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.contentLength).toBe(5); // "Hello".length
        expect(error.originalError).toBe(originalError);
      }
      
      // Verify console calls
      expect(console.error).toHaveBeenCalledWith(
        'Translation generation error:',
        'API quota exceeded'
      );
    });

    it('should use baseline translation when no providers are available', async () => {
      // Create service with no providers
      translationService = new TranslationService();
      translationService.providers = {}; // Clear providers
      
      // Execute test
      const result = await translationService.generateTranslation({
        content: 'hello',  // lowercase to test normalization
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });
      
      // Verify baseline translation is used
      expect(result).toBe('Hallo');
      expect(console.warn).toHaveBeenCalledWith(
        'No translation providers available. Using baseline translation generation.'
      );
    });
  });
});