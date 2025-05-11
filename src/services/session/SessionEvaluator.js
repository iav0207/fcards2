/**
 * SessionEvaluator handles answer evaluation in a session
 */
class SessionEvaluator {
  /**
   * Create a new SessionEvaluator
   * @param {Object} options - Configuration options
   * @param {Object} options.translationService - TranslationService instance
   */
  constructor(options = {}) {
    if (!options.translationService) {
      throw new Error('TranslationService is required');
    }
    
    this.translationService = options.translationService;
  }
  
  /**
   * Evaluate a user's answer
   * @param {Object} data - Evaluation data
   * @param {Object} data.session - Session object
   * @param {Object} data.card - FlashCard object
   * @param {string} data.answer - User's answer
   * @returns {Promise<Object>} - Evaluation result
   */
  async evaluateAnswer(data) {
    const { session, card, answer } = data;
    
    // Generate a reference translation if needed
    let referenceTranslation = card.userTranslation;
    let translationError = null;
    
    try {
      if (!referenceTranslation) {
        referenceTranslation = await this.translationService.generateTranslation({
          content: card.content,
          sourceLanguage: session.sourceLanguage,
          targetLanguage: session.targetLanguage
        });
      }
    } catch (error) {
      console.error('Error generating reference translation:', error);
      translationError = error;
      // Continue with evaluation despite the error
      referenceTranslation = answer; // Fallback to user's answer
    }
    
    let evaluation;
    try {
      // Evaluate the answer
      evaluation = await this.translationService.evaluateTranslation({
        sourceContent: card.content,
        sourceLanguage: session.sourceLanguage,
        targetLanguage: session.targetLanguage,
        userTranslation: answer,
        referenceTranslation
      });
    } catch (error) {
      console.error('Error evaluating translation:', error);
      
      // Provide a fallback evaluation
      evaluation = {
        correct: true, // Give the benefit of the doubt
        score: 0.5,
        feedback: translationError ?
          "We couldn't properly evaluate your translation due to an API error. Continuing session." :
          "Your answer was accepted, but we couldn't provide detailed feedback.",
        suggestedTranslation: referenceTranslation,
        details: {
          grammar: "Evaluation unavailable",
          vocabulary: "Evaluation unavailable",
          accuracy: "Evaluation unavailable"
        },
        _fallback: true // Flag to indicate this is a fallback evaluation
      };
    }
    
    // Return the evaluation result
    return {
      sessionId: session.id,
      cardId: card.id,
      evaluation,
      referenceTranslation,
      _hadTranslationError: Boolean(translationError)
    };
  }
}

module.exports = SessionEvaluator;