/**
 * Tests for TranslationService
 */
const TranslationService = require('../src/services/TranslationService');
const GeminiProvider = require('../src/services/translation/GeminiProvider');
const OpenAIProvider = require('../src/services/translation/OpenAIProvider');
const Settings = require('../src/models/Settings');

// Mock the provider classes
jest.mock('../src/services/translation/GeminiProvider');
jest.mock('../src/services/translation/OpenAIProvider');

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
    
    // Setup mock implementations for the providers
    GeminiProvider.mockImplementation(() => ({
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
      }),
      generateTranslation: jest.fn().mockResolvedValue('Hallo')
    }));
    
    OpenAIProvider.mockImplementation(() => ({
      evaluateTranslation: jest.fn().mockResolvedValue({
        correct: true,
        score: 0.85,
        feedback: 'Good work!',
        suggestedTranslation: 'Hallo',
        details: {
          grammar: 'Good',
          vocabulary: 'Good',
          accuracy: 'Good'
        }
      }),
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
      expect(service.settings.translationApiProvider).toBe('openai');
      expect(service.settings.translationApiKey).toBe('test-key');
      expect(OpenAIProvider).toHaveBeenCalledWith('test-key');
    });
    
    it('should use environment variables if no API key is set', () => {
      const service = new TranslationService();
      expect(service.settings.translationApiKey).toBeTruthy();
    });
  });
  
  describe('evaluateTranslation', () => {
    it('should use the primary provider when available', async () => {
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
      
      // Expect the provider's evaluateTranslation to be called
      expect(service.providers.gemini.evaluateTranslation).toHaveBeenCalledWith(data);
      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.9);
    });
    
    it('should fall back to baseline when no providers are available', async () => {
      // Create a service with no providers
      const service = new TranslationService();
      service.providers = {}; // Remove all providers
      
      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };
      
      const result = await service.evaluateTranslation(data);
      
      // Expect the result to come from the baseline implementation
      expect(result.correct).toBe(true);
      expect(result.suggestedTranslation).toBe('Hallo');
    });
    
    it('should handle provider errors gracefully', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      // Make the provider throw an error
      service.providers.gemini.evaluateTranslation.mockRejectedValue(new Error('API error'));

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };

      // With our enhanced error handling, we expect this to throw an error now
      await expect(service.evaluateTranslation(data)).rejects.toThrow('Translation evaluation failed');
    });
  });
  
  describe('generateTranslation', () => {
    it('should use the primary provider when available', async () => {
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
      
      // Expect the provider's generateTranslation to be called
      expect(service.providers.gemini.generateTranslation).toHaveBeenCalledWith(data);
      expect(result).toBe('Hallo');
    });
    
    it('should fall back to baseline when no providers are available', async () => {
      // Create a service with no providers
      const service = new TranslationService();
      service.providers = {}; // Remove all providers
      
      const data = {
        content: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };
      
      const result = await service.generateTranslation(data);
      
      // Expect the result to come from the baseline implementation
      expect(result).toBe('Hallo');
    });
    
    it('should handle provider errors gracefully', async () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });

      // Make the provider throw an error
      service.providers.gemini.generateTranslation.mockRejectedValue(new Error('API error'));

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      // With our enhanced error handling, we expect this to throw an error now
      await expect(service.generateTranslation(data)).rejects.toThrow('Translation generation failed');
    });
  });
  
  describe('_getFallbackProvider', () => {
    it('should return null if no providers are available', () => {
      const service = new TranslationService();
      service.providers = {};
      
      expect(service._getFallbackProvider()).toBeNull();
    });
    
    it('should return null if only the primary provider is available', () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });
      
      service.providers = { gemini: {} };
      service.primaryProvider = 'gemini';
      
      expect(service._getFallbackProvider()).toBeNull();
    });
    
    it('should return the non-primary provider if multiple are available', () => {
      const service = new TranslationService();
      
      service.providers = { 
        gemini: { name: 'gemini' },
        openai: { name: 'openai' }
      };
      service.primaryProvider = 'gemini';
      
      const fallback = service._getFallbackProvider();
      expect(fallback).toBeDefined();
      expect(fallback.name).toBe('openai');
    });
  });
});