/**
 * OpenAI API provider for translation services
 */
class OpenAIProvider {
  /**
   * Create a new OpenAIProvider instance
   * @param {string} apiKey - OpenAI API key
   * @param {Object} options - Additional options
   * @param {string} [options.modelName] - Model name to use
   * @param {number} [options.maxRetries] - Maximum number of retries
   * @param {number} [options.timeout] - Request timeout in ms
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = apiKey;
    this.modelName = options.modelName || 'gpt-3.5-turbo';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.maxRetries = options.maxRetries || 2;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Evaluate a translation using OpenAI API
   * @param {Object} data - Translation data
   * @param {string} data.sourceContent - Original content
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @param {string} data.userTranslation - User's translation to evaluate
   * @param {string} [data.referenceTranslation] - Optional reference translation
   * @returns {Promise<Object>} - Evaluation result
   */
  async evaluateTranslation(data) {
    try {
      const messages = this._buildEvaluationMessages(data);
      const response = await this._callOpenAIAPI(messages);
      return this._parseEvaluationResponse(response, data);
    } catch (error) {
      console.error('OpenAI translation evaluation error:', error.message);
      throw new Error(`OpenAI API evaluation failed: ${error.message}`);
    }
  }

  /**
   * Generate a translation using OpenAI API
   * @param {Object} data - Translation data
   * @param {string} data.content - Content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @returns {Promise<string>} - Generated translation
   */
  async generateTranslation(data) {
    try {
      const messages = this._buildTranslationMessages(data);
      const response = await this._callOpenAIAPI(messages);
      return this._extractTranslation(response);
    } catch (error) {
      console.error('OpenAI translation generation error:', error.message);
      throw new Error(`OpenAI API translation failed: ${error.message}`);
    }
  }

  /**
   * Build messages for translation evaluation
   * @private
   * @param {Object} data - Translation data
   * @returns {Array} - Formatted messages
   */
  _buildEvaluationMessages(data) {
    // Get language names instead of codes for better results
    const sourceLanguageName = this._getLanguageName(data.sourceLanguage);
    const targetLanguageName = this._getLanguageName(data.targetLanguage);

    const systemMessage = `You are a language expert evaluating translations from ${sourceLanguageName} to ${targetLanguageName}.
Evaluate the user's translation with EXTREMELY strict criteria:
1. Accuracy - It MUST convey the EXACT same meaning with NO exceptions - ANY changes in meaning MUST be considered incorrect
2. Grammar - It MUST be grammatically correct
3. Vocabulary - The precise vocabulary MUST be used, with ALL key terms correctly translated
4. Style - The style should match the context
5. Spelling - Up to 2 typos or spelling mistakes may be acceptable, but more than that must be considered incorrect

CRITICAL EVALUATION RULES:
- Accuracy is your ABSOLUTE top priority - verbs/actions MUST match exactly
- ANY change in the fundamental action or object is a critical error (e.g., "to delete an email" vs "to forward an email" are COMPLETELY different actions)
- Core verbs MUST match - "arrange" vs "cancel", "send" vs "receive", "open" vs "close", "forward" vs "delete" - these are FUNDAMENTALLY different meanings
- Translations must be REJECTED if they change the action, object, direction, or core meaning
- NO LENIENCY for meaning changes - even if one word is changed that alters the meaning, mark as incorrect
- Score anything with a different meaning as 0.0 and "correct: false" regardless of how similar the words appear
- FIRST look for meaning changes before evaluating grammar or style
- Use a "guilty until proven innocent" approach - if you can find ANY significant meaning difference, it is wrong
- Different verbs with different meanings (e.g., "delete" vs "forward", "arrange" vs "drop") MUST be considered incorrect

Respond with JSON only, using this exact format:
{
  "correct": boolean,  (Whether the translation is overall correct, be strict)
  "score": number,  (A score from 0.0 to 1.0 indicating quality)
  "feedback": string,  (A short, helpful feedback message for the user)
  "suggestedTranslation": string,  (A correct translation if the user's is wrong)
  "details": {
    "grammar": string,  (Brief feedback on grammar)
    "vocabulary": string,  (Brief feedback on vocabulary)
    "accuracy": string  (Brief feedback on accuracy)
  }
}`;

    let userMessage = `Original text: "${data.sourceContent}"
User's translation: "${data.userTranslation}"`;

    // Add reference translation if available
    if (data.referenceTranslation) {
      userMessage += `\nReference translation: "${data.referenceTranslation}"`;
    }

    return [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];
  }

  /**
   * Build messages for translation generation
   * @private
   * @param {Object} data - Translation data
   * @returns {Array} - Formatted messages
   */
  _buildTranslationMessages(data) {
    // Get language names instead of codes for better results
    const sourceLanguageName = this._getLanguageName(data.sourceLanguage);
    const targetLanguageName = this._getLanguageName(data.targetLanguage);

    return [
      {
        role: 'system',
        content: `You are a professional translator from ${sourceLanguageName} to ${targetLanguageName}. Translate the text provided by the user. Provide only the translation itself without explanations or notes.`
      },
      {
        role: 'user',
        content: data.content
      }
    ];
  }

  /**
   * Call the OpenAI API
   * @private
   * @param {Array} messages - Messages to send
   * @returns {Promise<Object>} - API response
   */
  async _callOpenAIAPI(messages, retryCount = 0) {
    const requestBody = {
      model: this.modelName,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        timeout: this.timeout
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._callOpenAIAPI(messages, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Parse the evaluation response from OpenAI API
   * @private
   * @param {Object} response - API response
   * @param {Object} originalData - Original request data
   * @returns {Object} - Parsed evaluation result
   */
  _parseEvaluationResponse(response, originalData) {
    try {
      // Extract the content from the response
      const content = response.choices[0].message.content;
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate the response has the expected fields
      if (typeof parsedResponse.correct !== 'boolean' || 
          typeof parsedResponse.score !== 'number' ||
          typeof parsedResponse.feedback !== 'string' ||
          typeof parsedResponse.suggestedTranslation !== 'string' ||
          !parsedResponse.details) {
        throw new Error('Response format is invalid');
      }
      
      return {
        correct: parsedResponse.correct,
        score: parsedResponse.score,
        feedback: parsedResponse.feedback,
        suggestedTranslation: parsedResponse.suggestedTranslation,
        details: {
          grammar: parsedResponse.details.grammar || 'No grammar feedback available',
          vocabulary: parsedResponse.details.vocabulary || 'No vocabulary feedback available',
          accuracy: parsedResponse.details.accuracy || 'No accuracy feedback available'
        }
      };
    } catch (error) {
      console.error('Error parsing OpenAI evaluation response:', error);
      
      // Return a fallback response based on the original request
      return {
        correct: false,
        score: 0.5,
        feedback: 'Unable to evaluate translation due to a technical issue.',
        suggestedTranslation: originalData.referenceTranslation || originalData.userTranslation,
        details: {
          grammar: 'Evaluation unavailable',
          vocabulary: 'Evaluation unavailable',
          accuracy: 'Evaluation unavailable'
        }
      };
    }
  }

  /**
   * Extract translation from OpenAI API response
   * @private
   * @param {Object} response - API response
   * @returns {string} - Extracted translation
   */
  _extractTranslation(response) {
    try {
      // Extract the content from the response
      const translation = response.choices[0].message.content.trim();
      
      // Remove quotes if the model included them
      return translation.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error extracting translation from OpenAI response:', error);
      throw new Error('Failed to extract translation from API response');
    }
  }

  /**
   * Get human-readable language name from ISO code
   * @private
   * @param {string} languageCode - ISO language code
   * @returns {string} - Human-readable language name
   */
  _getLanguageName(languageCode) {
    const languageNames = {
      'en': 'English',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      // Add more languages as needed
    };

    return languageNames[languageCode] || languageCode;
  }
}

module.exports = OpenAIProvider;