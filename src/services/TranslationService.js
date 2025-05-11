const { getEnvironmentConfig, checkApiKeysAvailability } = require('../utils/environment');
const GeminiProvider = require('./translation/GeminiProvider');
const OpenAIProvider = require('./translation/OpenAIProvider');
const Settings = require('../models/Settings');

/**
 * Service for evaluating translations using AI
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
    
    // Check environment variables if no API key is set
    if (!this.settings.translationApiKey) {
      const config = getEnvironmentConfig();
      const apiAvailability = checkApiKeysAvailability();
      
      if (apiAvailability.gemini && this.settings.translationApiProvider === 'gemini') {
        this.settings.translationApiKey = config.GEMINI_API_KEY;
      } else if (apiAvailability.openai && this.settings.translationApiProvider === 'openai') {
        this.settings.translationApiKey = config.OPENAI_API_KEY;
      } else if (apiAvailability.gemini) {
        this.settings.translationApiProvider = 'gemini';
        this.settings.translationApiKey = config.GEMINI_API_KEY;
      } else if (apiAvailability.openai) {
        this.settings.translationApiProvider = 'openai';
        this.settings.translationApiKey = config.OPENAI_API_KEY;
      }
    }
    
    // Initialize API providers
    this._initializeProviders();
  }
  
  /**
   * Initialize API providers based on configuration
   * @private
   */
  _initializeProviders() {
    this.providers = {};
    
    // Initialize Gemini provider if API key is available
    if (this.settings.translationApiKey && this.settings.translationApiProvider === 'gemini') {
      try {
        this.providers.gemini = new GeminiProvider(this.settings.translationApiKey);
        console.log('Gemini provider initialized');
      } catch (error) {
        console.error('Failed to initialize Gemini provider:', error.message);
      }
    }
    
    // Initialize OpenAI provider if API key is available
    if (this.settings.translationApiKey && this.settings.translationApiProvider === 'openai') {
      try {
        this.providers.openai = new OpenAIProvider(this.settings.translationApiKey);
        console.log('OpenAI provider initialized');
      } catch (error) {
        console.error('Failed to initialize OpenAI provider:', error.message);
      }
    }
    
    // Set primary provider based on settings
    this.primaryProvider = this.settings.translationApiProvider;
    
    // Log initialization status
    if (Object.keys(this.providers).length === 0) {
      console.warn('No translation providers initialized. Using stub implementation.');
    }
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
      const fallbackProvider = this._getFallbackProvider();
      if (fallbackProvider) {
        return await fallbackProvider.evaluateTranslation(data);
      }

      // If no providers are available, use the baseline algorithm
      console.warn('No translation providers available. Using baseline evaluation.');
      return this._evaluateTranslationBaseline(data);
    } catch (error) {
      console.error('Translation evaluation error:', error.message);

      // Enhance the error with translation-specific context
      const enhancedError = new Error(`Translation evaluation failed: ${error.message}`);

      // Add metadata to help diagnose the issue
      enhancedError.originalError = error;
      enhancedError.translationContext = {
        provider: this.primaryProvider,
        hasApiKey: Boolean(this.settings.translationApiKey),
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

  /**
   * Generate a reference translation
   * @param {Object} data - Translation data
   * @param {string} data.content - Content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @returns {Promise<string>} - Generated translation
   */
  async generateTranslation(data) {
    try {
      // Try to use the primary provider
      const primaryProvider = this.providers[this.primaryProvider];
      if (primaryProvider) {
        return await primaryProvider.generateTranslation(data);
      }

      // If primary provider not available, try fallback provider
      const fallbackProvider = this._getFallbackProvider();
      if (fallbackProvider) {
        return await fallbackProvider.generateTranslation(data);
      }

      // If no providers are available, use the baseline algorithm
      console.warn('No translation providers available. Using baseline translation generation.');
      return this._generateTranslationBaseline(data);
    } catch (error) {
      console.error('Translation generation error:', error.message);

      // Enhance the error with translation-specific context
      const enhancedError = new Error(`Translation generation failed: ${error.message}`);

      // Add metadata to help diagnose the issue
      enhancedError.originalError = error;
      enhancedError.translationContext = {
        provider: this.primaryProvider,
        hasApiKey: Boolean(this.settings.translationApiKey),
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        contentLength: data.content.length,
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
  
  /**
   * Get fallback provider (a provider that's not the primary one)
   * @private
   * @returns {Object|null} - Fallback provider or null if none available
   */
  _getFallbackProvider() {
    const providers = Object.keys(this.providers);
    if (providers.length === 0) {
      return null;
    }
    
    // If there's only the primary provider, return null
    if (providers.length === 1 && providers[0] === this.primaryProvider) {
      return null;
    }
    
    // Return the first provider that's not the primary one
    const fallbackKey = providers.find(key => key !== this.primaryProvider);
    return fallbackKey ? this.providers[fallbackKey] : null;
  }
  
  /**
   * Baseline implementation for translation evaluation
   * Used when no API providers are available
   * @private
   * @param {Object} data - Translation data
   * @returns {Object} - Evaluation result
   */
  _evaluateTranslationBaseline(data) {
    console.log('Using baseline translation evaluation');
    
    // If reference translation is provided, do a simple comparison
    if (data.referenceTranslation) {
      const userTranslation = data.userTranslation.toLowerCase().trim();
      const referenceTranslation = data.referenceTranslation.toLowerCase().trim();
      
      const isExactMatch = userTranslation === referenceTranslation;
      const isCloseMatch = this._isCloseMatch(userTranslation, referenceTranslation);
      
      if (isExactMatch) {
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
      } else if (isCloseMatch) {
        return {
          correct: true,
          score: 0.8,
          feedback: "Good job! Your translation is very close.",
          suggestedTranslation: data.referenceTranslation,
          details: {
            grammar: "Good",
            vocabulary: "Appropriate",
            accuracy: "Close"
          }
        };
      } else {
        return {
          correct: false,
          score: 0.2,
          feedback: "Try again. Your translation doesn't match the expected answer.",
          suggestedTranslation: data.referenceTranslation,
          details: {
            grammar: "Check your word order",
            vocabulary: "Review key terms",
            accuracy: "Needs improvement"
          }
        };
      }
    }

    // Without reference, always return "correct" for any translation
    // This is just for testing the game flow
    return {
      correct: true,
      score: 1.0,
      feedback: "Great job! Your translation is correct.",
      suggestedTranslation: data.userTranslation,
      details: {
        grammar: "Perfect",
        vocabulary: "Appropriate",
        accuracy: "Precise"
      }
    };
  }
  
  /**
   * Baseline implementation for translation generation
   * Used when no API providers are available
   * @private
   * @param {Object} data - Translation data
   * @returns {string} - Generated translation
   */
  _generateTranslationBaseline(data) {
    console.log('Using baseline translation generation');
    
    // STUB: Return basic translations for common phrases
    // This is just for testing the game flow
    const translations = {
      'en': {
        'de': {
          'hello': 'Hallo',
          'goodbye': 'Auf Wiedersehen',
          'thank you': 'Danke',
          'yes': 'Ja',
          'no': 'Nein',
          'please': 'Bitte',
          'excuse me': 'Entschuldigung',
          'sorry': 'Es tut mir leid',
          'good morning': 'Guten Morgen',
          'good evening': 'Guten Abend',
          'how are you': 'Wie geht es dir',
          'fine': 'Gut',
          'what is your name': 'Wie heißt du',
          'my name is': 'Ich heiße',
          'nice to meet you': 'Schön, dich kennenzulernen',
          'where is': 'Wo ist',
          'when': 'Wann',
          'why': 'Warum',
          'today': 'Heute',
          'tomorrow': 'Morgen'
        },
        'fr': {
          'hello': 'Bonjour',
          'goodbye': 'Au revoir',
          'thank you': 'Merci',
          'yes': 'Oui',
          'no': 'Non',
          'please': 'S\'il vous plaît',
          'excuse me': 'Excusez-moi',
          'sorry': 'Désolé',
          'good morning': 'Bonjour',
          'good evening': 'Bonsoir'
        },
        'es': {
          'hello': 'Hola',
          'goodbye': 'Adiós',
          'thank you': 'Gracias',
          'yes': 'Sí',
          'no': 'No',
          'please': 'Por favor',
          'excuse me': 'Disculpe',
          'sorry': 'Lo siento',
          'good morning': 'Buenos días',
          'good evening': 'Buenas noches'
        }
      },
      'de': {
        'en': {
          'hallo': 'Hello',
          'auf wiedersehen': 'Goodbye',
          'danke': 'Thank you',
          'ja': 'Yes',
          'nein': 'No',
          'bitte': 'Please',
          'entschuldigung': 'Excuse me',
          'es tut mir leid': 'I am sorry',
          'guten morgen': 'Good morning',
          'guten abend': 'Good evening',
          'wie geht es dir': 'How are you',
          'gut': 'Fine',
          'wie heißt du': 'What is your name',
          'ich heiße': 'My name is',
          'schön, dich kennenzulernen': 'Nice to meet you'
        }
      }
    };

    // Normalize content to lowercase for matching
    const normalizedContent = data.content.toLowerCase().trim();
    
    // Get translations for the language pair
    const sourceTranslations = translations[data.sourceLanguage] || {};
    const targetTranslations = sourceTranslations[data.targetLanguage] || {};
    
    // Return the translation if available, otherwise return the original
    return targetTranslations[normalizedContent] || `[${data.content}]`;
  }

  /**
   * Check if two strings are close matches
   * @private
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {boolean} - True if the strings are close matches
   */
  _isCloseMatch(str1, str2) {
    // Very simple implementation: check if either string contains the other
    // or if they share a significant number of words
    if (str1.includes(str2) || str2.includes(str1)) {
      return true;
    }

    // Check for shared words
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    // Count shared words
    const sharedWords = words1.filter(word => words2.includes(word)).length;
    
    // If more than half the words match, consider it close
    const threshold = Math.min(words1.length, words2.length) * 0.5;
    return sharedWords >= threshold;
  }
}

module.exports = TranslationService;