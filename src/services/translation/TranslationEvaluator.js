/**
 * Service for evaluating translations
 */
const BaselineTranslator = require('./BaselineTranslator');
const TranslationProviderFactory = require('./TranslationProviderFactory');

class TranslationEvaluator {
  /**
   * Create a new TranslationEvaluator instance
   * @param {Object} options - Configuration options
   * @param {Object} options.providers - Object containing provider instances
   * @param {string} options.primaryProvider - Name of the primary provider
   */
  constructor(options = {}) {
    this.providers = options.providers || {};
    this.primaryProvider = options.primaryProvider || '';
    this.baselineTranslator = new BaselineTranslator();
  }

  /**
   * Evaluate a translation
   * @param {Object} data - Translation data to evaluate
   * @param {string} data.sourceContent - Original content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @param {string} data.userTranslation - User's translation to evaluate
   * @param {string} [data.referenceTranslation] - Optional reference translation
   * @returns {Promise<Object>} - Evaluation result
   */
  async evaluateTranslation(data) {
    try {
      // Try to use the primary provider
      const primaryProvider = this.providers[this.primaryProvider];
      if (primaryProvider) {
        return await primaryProvider.evaluateTranslation(data);
      }

      // If primary provider not available, try fallback provider
      const fallbackProvider = TranslationProviderFactory.getFallbackProvider(
        this.providers, 
        this.primaryProvider
      );
      
      if (fallbackProvider) {
        return await fallbackProvider.evaluateTranslation(data);
      }

      // If no providers are available, use the baseline algorithm
      console.warn('No translation providers available. Using baseline evaluation.');
      return this.baselineTranslator.evaluateTranslation(data);
    } catch (error) {
      console.error('Translation evaluation error:', error.message);

      // Enhance the error with translation-specific context
      const enhancedError = new Error(`Translation evaluation failed: ${error.message}`);

      // Add metadata to help diagnose the issue
      enhancedError.originalError = error;
      enhancedError.translationContext = {
        provider: this.primaryProvider,
        hasProviders: Object.keys(this.providers).length > 0,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        apiAvailable: Boolean(this.providers[this.primaryProvider])
      };

      // If this is an API key error, make it more user-friendly
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        enhancedError.message = `Translation API key error: The API key for ${this.primaryProvider} ` +
          `is missing or invalid. Please check your settings.`;
        enhancedError.apiKeyError = true;
      }

      // Throw the enhanced error for better error handling upstream
      throw enhancedError;
    }
  }
}

module.exports = TranslationEvaluator;