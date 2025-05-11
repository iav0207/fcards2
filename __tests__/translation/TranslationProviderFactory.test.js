/**
 * Tests for TranslationProviderFactory
 */
const TranslationProviderFactory = require('../../src/services/translation/TranslationProviderFactory');
const Settings = require('../../src/models/Settings');

// Mock the provider classes
jest.mock('../../src/services/translation/providers/GeminiProvider');
jest.mock('../../src/services/translation/providers/OpenAIProvider');

// Mock environment module
jest.mock('../../src/utils/environment', () => ({
  getEnvironmentConfig: jest.fn().mockReturnValue({
    GEMINI_API_KEY: 'mock-gemini-key',
    OPENAI_API_KEY: 'mock-openai-key'
  }),
  checkApiKeysAvailability: jest.fn().mockReturnValue({
    gemini: true,
    openai: true,
    hasAnyTranslationApi: true
  })
}));

describe('TranslationProviderFactory', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
  });

  describe('createProviders', () => {
    it('should create providers based on settings', () => {
      const settings = new Settings();
      settings.translationApiProvider = 'gemini';
      settings.translationApiKey = 'test-key';

      const providerSetup = TranslationProviderFactory.createProviders(settings);

      expect(providerSetup.providers.gemini).toBeDefined();
      expect(providerSetup.primaryProvider).toBe('gemini');
      expect(providerSetup.translationApiKey).toBe('test-key');
    });

    it('should fall back to environment variables if no API key in settings', () => {
      const settings = new Settings();
      settings.translationApiProvider = 'gemini';
      settings.translationApiKey = '';

      const providerSetup = TranslationProviderFactory.createProviders(settings);

      expect(providerSetup.providers.gemini).toBeDefined();
      expect(providerSetup.primaryProvider).toBe('gemini');
      expect(providerSetup.translationApiKey).toBe('mock-gemini-key');
    });

    it('should handle case when no providers are available', () => {
      // Override environment mock for this test
      const environmentModule = require('../../src/utils/environment');
      environmentModule.checkApiKeysAvailability.mockReturnValueOnce({
        gemini: false,
        openai: false,
        hasAnyTranslationApi: false
      });

      const settings = new Settings();
      settings.translationApiProvider = 'gemini';
      settings.translationApiKey = '';

      const providerSetup = TranslationProviderFactory.createProviders(settings);

      expect(Object.keys(providerSetup.providers).length).toBe(0);
    });
  });

  describe('getFallbackProvider', () => {
    it('should return null if no providers are available', () => {
      const providers = {};
      const fallbackProvider = TranslationProviderFactory.getFallbackProvider(providers, 'gemini');
      expect(fallbackProvider).toBeNull();
    });

    it('should return null if only primary provider is available', () => {
      const providers = {
        gemini: {}
      };
      const fallbackProvider = TranslationProviderFactory.getFallbackProvider(providers, 'gemini');
      expect(fallbackProvider).toBeNull();
    });

    it('should return a fallback provider if available', () => {
      const providers = {
        gemini: { name: 'geminiProvider' },
        openai: { name: 'openaiProvider' }
      };
      const fallbackProvider = TranslationProviderFactory.getFallbackProvider(providers, 'gemini');
      expect(fallbackProvider).toEqual({ name: 'openaiProvider' });
    });
  });
});