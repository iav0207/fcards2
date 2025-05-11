/**
 * Factory for creating translation provider instances
 */
const GeminiProvider = require('./providers/GeminiProvider');
const OpenAIProvider = require('./providers/OpenAIProvider');
const { getEnvironmentConfig, checkApiKeysAvailability } = require('../../utils/environment');

class TranslationProviderFactory {
  /**
   * Create provider instances based on settings and available APIs
   * @param {Object} settings - Settings object with configuration
   * @returns {Object} - Object containing provider instances and metadata
   */
  static createProviders(settings) {
    const providers = {};
    let primaryProvider = settings.translationApiProvider;
    let translationApiKey = settings.translationApiKey;
    
    // Check environment variables if no API key is set
    if (!translationApiKey) {
      const config = getEnvironmentConfig();
      const apiAvailability = checkApiKeysAvailability();
      
      if (apiAvailability.gemini && primaryProvider === 'gemini') {
        translationApiKey = config.GEMINI_API_KEY;
      } else if (apiAvailability.openai && primaryProvider === 'openai') {
        translationApiKey = config.OPENAI_API_KEY;
      } else if (apiAvailability.gemini) {
        primaryProvider = 'gemini';
        translationApiKey = config.GEMINI_API_KEY;
      } else if (apiAvailability.openai) {
        primaryProvider = 'openai';
        translationApiKey = config.OPENAI_API_KEY;
      }
    }
    
    // Initialize Gemini provider if API key is available
    if (translationApiKey && primaryProvider === 'gemini') {
      try {
        providers.gemini = new GeminiProvider(translationApiKey);
        console.log('Gemini provider initialized');
      } catch (error) {
        console.error('Failed to initialize Gemini provider:', error.message);
      }
    }
    
    // Initialize OpenAI provider if API key is available
    if (translationApiKey && primaryProvider === 'openai') {
      try {
        providers.openai = new OpenAIProvider(translationApiKey);
        console.log('OpenAI provider initialized');
      } catch (error) {
        console.error('Failed to initialize OpenAI provider:', error.message);
      }
    }
    
    // Log initialization status
    if (Object.keys(providers).length === 0) {
      console.warn('No translation providers initialized. Using baseline implementation.');
    }
    
    return {
      providers,
      primaryProvider,
      translationApiKey
    };
  }
  
  /**
   * Get fallback provider (a provider that's not the primary one)
   * @param {Object} providers - Object containing provider instances
   * @param {string} primaryProvider - Name of the primary provider
   * @returns {Object|null} - Fallback provider or null if none available
   */
  static getFallbackProvider(providers, primaryProvider) {
    const providerKeys = Object.keys(providers);
    if (providerKeys.length === 0) {
      return null;
    }
    
    // If there's only the primary provider, return null
    if (providerKeys.length === 1 && providerKeys[0] === primaryProvider) {
      return null;
    }
    
    // Return the first provider that's not the primary one
    const fallbackKey = providerKeys.find(key => key !== primaryProvider);
    return fallbackKey ? providers[fallbackKey] : null;
  }
}

module.exports = TranslationProviderFactory;