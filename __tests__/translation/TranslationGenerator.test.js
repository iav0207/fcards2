/**
 * Tests for TranslationGenerator
 */
const TranslationGenerator = require('../../src/services/translation/TranslationGenerator');
const BaselineTranslator = require('../../src/services/translation/BaselineTranslator');

// Mock the TranslationProviderFactory
jest.mock('../../src/services/translation/TranslationProviderFactory', () => ({
  getFallbackProvider: jest.fn().mockReturnValue(null)
}));

// Mock the BaselineTranslator but keep actual implementation for testing
jest.mock('../../src/services/translation/BaselineTranslator', () => {
  return jest.fn().mockImplementation(() => {
    return {
      generateTranslation: jest.fn().mockImplementation((data) => {
        // Simple implementation for testing
        const translations = {
          'en': {
            'de': {
              'hello': 'Hallo',
              'goodbye': 'Auf Wiedersehen'
            }
          }
        };
        
        // Normalize and look up translation
        const normalizedContent = data.content.toLowerCase().trim();
        const sourceTranslations = translations[data.sourceLanguage] || {};
        const targetTranslations = sourceTranslations[data.targetLanguage] || {};
        
        return targetTranslations[normalizedContent] || `[${data.content}]`;
      })
    };
  });
});

describe('TranslationGenerator', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
  });

  describe('generateTranslation', () => {
    it('should use primary provider if available', async () => {
      const mockProvider = {
        generateTranslation: jest.fn().mockResolvedValue('Hallo')
      };

      const generator = new TranslationGenerator({
        providers: { 'gemini': mockProvider },
        primaryProvider: 'gemini'
      });

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      const result = await generator.generateTranslation(data);

      expect(mockProvider.generateTranslation).toHaveBeenCalledWith(data);
      expect(result).toBe('Hallo');
    });

    it('should use baseline translator if no providers available', async () => {
      const generator = new TranslationGenerator({
        providers: {},
        primaryProvider: ''
      });

      const data = {
        content: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      const result = await generator.generateTranslation(data);

      // This confirms we're using the mocked baseline translator
      expect(BaselineTranslator).toHaveBeenCalled();
      expect(result).toBe('Hallo');
    });

    it('should handle unknown translations with baseline translator', async () => {
      const generator = new TranslationGenerator({
        providers: {},
        primaryProvider: ''
      });

      const data = {
        content: 'unknown phrase',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      const result = await generator.generateTranslation(data);

      expect(result).toBe('[unknown phrase]');
    });

    it('should handle generation errors and enhance them', async () => {
      const mockProvider = {
        generateTranslation: jest.fn().mockRejectedValue(
          new Error('API key is invalid')
        )
      };

      const generator = new TranslationGenerator({
        providers: { 'gemini': mockProvider },
        primaryProvider: 'gemini'
      });

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      await expect(generator.generateTranslation(data)).rejects.toThrow('API key');
      
      try {
        await generator.generateTranslation(data);
      } catch (error) {
        expect(error.apiKeyError).toBe(true);
        expect(error.translationContext).toBeDefined();
        expect(error.translationContext.provider).toBe('gemini');
        expect(error.translationContext.contentLength).toBe(5);
      }
    });
  });
});