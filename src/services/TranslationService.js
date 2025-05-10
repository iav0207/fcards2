/**
 * Service for evaluating translations using AI (stub implementation for now)
 */
class TranslationService {
  /**
   * Create a new TranslationService instance
   * @param {Object} options - Configuration options
   * @param {string} [options.apiProvider] - API provider ('gemini' or 'openai')
   * @param {string} [options.apiKey] - API key for the provider
   */
  constructor(options = {}) {
    this.apiProvider = options.apiProvider || 'stub';
    this.apiKey = options.apiKey || '';
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
    // In a real implementation, this would call the AI API
    // For now, we'll return a stub response

    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

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

    // STUB: Without reference, always return "correct" for any translation
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
   * Generate a reference translation
   * @param {Object} data - Translation data
   * @param {string} data.content - Content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code 
   * @returns {Promise<string>} - Generated translation
   */
  async generateTranslation(data) {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 700));

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
          'good evening': 'Bonsoir',
          'how are you': 'Comment allez-vous',
          'fine': 'Bien',
          'what is your name': 'Comment vous appelez-vous',
          'my name is': 'Je m\'appelle',
          'nice to meet you': 'Enchanté',
          'where is': 'Où est',
          'when': 'Quand',
          'why': 'Pourquoi',
          'today': 'Aujourd\'hui',
          'tomorrow': 'Demain'
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
          'good evening': 'Buenas noches',
          'how are you': 'Cómo estás',
          'fine': 'Bien',
          'what is your name': 'Cómo te llamas',
          'my name is': 'Me llamo',
          'nice to meet you': 'Encantado de conocerte',
          'where is': 'Dónde está',
          'when': 'Cuándo',
          'why': 'Por qué',
          'today': 'Hoy',
          'tomorrow': 'Mañana'
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