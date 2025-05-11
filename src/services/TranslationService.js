const Settings = require('../models/Settings');
const TranslationProviderFactory = require('./translation/TranslationProviderFactory');
const TranslationEvaluator = require('./translation/TranslationEvaluator');
const TranslationGenerator = require('./translation/TranslationGenerator');

/**
 * Service for translation operations using AI providers
 */
class TranslationService {
  /**
   * Create a new TranslationService instance
   * @param {Object} options - Configuration options
   * @param {Object} [options.settings] - Settings object
   * @param {string} [options.apiProvider] - API provider ('gemini' or 'openai')
   * @param {string} [options.apiKey] - API key for the provider
   * @param {Object} [options.db] - DatabaseService instance for settings
   */
  constructor(options = {}) {
    this.db = options.db;
    
    // Initialize settings from options or defaults
    this.settings = options.settings || new Settings();
    
    // If explicit apiProvider/apiKey given in options, override settings
    if (options.apiProvider) {
      this.settings.translationApiProvider = options.apiProvider;
    }
    if (options.apiKey) {
      this.settings.translationApiKey = options.apiKey;
    }
    
    // Initialize providers using the factory
    const providerSetup = TranslationProviderFactory.createProviders(this.settings);
    
    // Update settings with resolved values from provider setup
    this.settings.translationApiProvider = providerSetup.primaryProvider;
    this.settings.translationApiKey = providerSetup.translationApiKey;
    
    // Store provider data
    this.providers = providerSetup.providers;
    this.primaryProvider = providerSetup.primaryProvider;
    
    // Initialize translation services
    this.evaluator = new TranslationEvaluator({
      providers: this.providers,
      primaryProvider: this.primaryProvider
    });
    
    this.generator = new TranslationGenerator({
      providers: this.providers,
      primaryProvider: this.primaryProvider
    });
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
    return this.evaluator.evaluateTranslation(data);
  }
  
  /**
   * Generate a reference translation
   * @param {Object} data - Translation data
   * @param {string} data.content - Content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @returns {Promise<string>} - Generated translation
   */
  async generateTranslation(data) {
    return this.generator.generateTranslation(data);
  }
  
  /**
   * Check if two strings are close matches
   * Retained for backward compatibility
   * @private
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {boolean} - True if the strings are close matches
   */
  _isCloseMatch(str1, str2) {
    const baselineTranslator = new (require('./translation/BaselineTranslator'))();
    return baselineTranslator._isCloseMatch(str1, str2);
  }
}

module.exports = TranslationService;