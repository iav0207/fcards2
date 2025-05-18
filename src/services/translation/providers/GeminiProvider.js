/**
 * Gemini API provider for translation services
 */
class GeminiProvider {
  /**
   * Create a new GeminiProvider instance
   * @param {string} apiKey - Gemini API key
   * @param {Object} options - Additional options
   * @param {string} [options.modelName] - Model name to use
   * @param {number} [options.maxRetries] - Maximum number of retries
   * @param {number} [options.timeout] - Request timeout in ms
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.modelName = options.modelName || 'gemini-1.5-pro';
    this.apiEndpoint = `https://generativelanguage.googleapis.com/v1/models/${this.modelName}:generateContent`;
    this.maxRetries = options.maxRetries || 2;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Evaluate a translation using Gemini API
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
      const prompt = this._buildEvaluationPrompt(data);
      const response = await this._callGeminiAPI(prompt);
      return this._parseEvaluationResponse(response, data);
    } catch (error) {
      console.error('Gemini translation evaluation error:', error.message);
      throw new Error(`Gemini API evaluation failed: ${error.message}`);
    }
  }

  /**
   * Generate a translation using Gemini API
   * @param {Object} data - Translation data
   * @param {string} data.content - Content to translate
   * @param {string} data.sourceLanguage - Source language code
   * @param {string} data.targetLanguage - Target language code
   * @returns {Promise<string>} - Generated translation
   */
  async generateTranslation(data) {
    try {
      const prompt = this._buildTranslationPrompt(data);
      const response = await this._callGeminiAPI(prompt);
      return this._extractTranslation(response);
    } catch (error) {
      console.error('Gemini translation generation error:', error.message);
      throw new Error(`Gemini API translation failed: ${error.message}`);
    }
  }

  /**
   * Build a prompt for translation evaluation
   * @private
   * @param {Object} data - Translation data
   * @returns {string} - Formatted prompt
   */
  _buildEvaluationPrompt(data) {
    // Get language names instead of codes for better results
    const sourceLanguageName = this._getLanguageName(data.sourceLanguage);
    const targetLanguageName = this._getLanguageName(data.targetLanguage);

    let prompt = `You are a language expert evaluating translations from ${sourceLanguageName} to ${targetLanguageName}.

Original text: "${data.sourceContent}"
User's translation: "${data.userTranslation}"`;

    // Add reference translation if available
    if (data.referenceTranslation) {
      prompt += `\nReference translation: "${data.referenceTranslation}"`;
    }

    prompt += `\n
Evaluate the user's translation with these criteria:
1. Accuracy - It should convey the same meaning - significant changes in meaning should be considered incorrect
2. Grammar - It should be grammatically correct
3. Vocabulary - Appropriate vocabulary should be used, with key terms correctly translated
4. Style - The style should match the context
5. Spelling - Up to 2 typos or spelling mistakes may be acceptable, but more than that must be considered incorrect

EVALUATION RULES:
- Accuracy is your top priority
- Core meaning must be preserved, though synonyms and alternative phrasings are acceptable
- Translations should be rejected if they significantly change the action, object, direction, or core meaning
- Focus first on whether the core meaning is preserved before evaluating grammar or style
- Allow for different ways of expressing the same idea as long as the meaning is equivalent

Respond with JSON only, using this exact format:
{
  "correct": boolean,  (Whether the translation is overall correct)
  "score": number,  (A score from 0.0 to 1.0 indicating quality)
  "feedback": string,  (A short, helpful feedback message for the user)
  "suggestedTranslation": string,  (A correct translation if the user's is wrong)
  "details": {
    "grammar": string,  (Brief feedback on grammar)
    "vocabulary": string,  (Brief feedback on vocabulary)
    "accuracy": string  (Brief feedback on accuracy)
  }
}`;

    return prompt;
  }

  /**
   * Build a prompt for translation generation
   * @private
   * @param {Object} data - Translation data
   * @returns {string} - Formatted prompt
   */
  _buildTranslationPrompt(data) {
    // Get language names instead of codes for better results
    const sourceLanguageName = this._getLanguageName(data.sourceLanguage);
    const targetLanguageName = this._getLanguageName(data.targetLanguage);

    return `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}:
"${data.content}"

Provide only the translation itself without explanations or notes.`;
  }

  /**
   * Call the Gemini API
   * @private
   * @param {string} prompt - Prompt to send
   * @returns {Promise<Object>} - API response
   */
  async _callGeminiAPI(prompt, retryCount = 0) {
    const url = `${this.apiEndpoint}?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        return this._callGeminiAPI(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Parse the evaluation response from Gemini API
   * @private
   * @param {Object} response - API response
   * @param {Object} originalData - Original request data
   * @returns {Object} - Parsed evaluation result
   */
  _parseEvaluationResponse(response, originalData) {
    try {
      // Extract the text from the response
      const textResponse = response.candidates[0].content.parts[0].text;
      
      // Try to parse JSON from the response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
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
      console.error('Error parsing Gemini evaluation response:', error);
      
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
   * Extract translation from Gemini API response
   * @private
   * @param {Object} response - API response
   * @returns {string} - Extracted translation
   */
  _extractTranslation(response) {
    try {
      // Extract the text from the response
      const translation = response.candidates[0].content.parts[0].text.trim();
      
      // Remove quotes if the model included them
      return translation.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error extracting translation from Gemini response:', error);
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

module.exports = GeminiProvider;