# RFC-00006: Translation API Integration

## Summary

This RFC outlines the implementation of real translation API integration with Google's Gemini API (primary) and OpenAI's API (fallback) to replace the current stub implementation. This will add AI-powered translation evaluation to improve the accuracy and usefulness of the practice sessions.

## Motivation

The current TranslationService uses a stub implementation that provides basic functionality but lacks:
- Accurate translation evaluation
- Real-time translation generation
- Detailed feedback on translation quality
- Language support beyond a limited set of hard-coded phrases

Integrating with established AI APIs will greatly enhance the application's value for language learners by providing:
1. More accurate evaluation of user translations
2. More detailed feedback to help users improve
3. Support for a wider range of languages and content
4. Generation of alternative translations and explanations

## Detailed Design

### API Selection

We will implement support for two leading AI providers:

1. **Gemini API (Google)** - Primary
   - Uses Google's AI models
   - Good multilingual capabilities
   - Cost-effective pricing
   - Direct access to Google translation knowledge

2. **OpenAI API** - Fallback
   - Uses GPT models (GPT-3.5 or GPT-4)
   - Strong multilingual capabilities
   - Widely used and stable
   - Provides detailed reasoning

### Architecture

The enhanced TranslationService will:
1. Accept API keys for both providers through application settings
2. Try the primary provider first (Gemini by default)
3. Fall back to the secondary provider if the primary fails
4. Return structured evaluation results
5. Cache responses for efficiency where appropriate

### API Integration

#### Gemini API Integration

```javascript
class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.modelName = 'gemini-1.5-pro';
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/';
  }

  async evaluateTranslation(data) {
    const prompt = this.buildEvaluationPrompt(data);
    const response = await this.callGeminiAPI(prompt);
    return this.parseResponse(response);
  }

  async generateTranslation(data) {
    const prompt = this.buildTranslationPrompt(data);
    const response = await this.callGeminiAPI(prompt);
    return this.extractTranslation(response);
  }

  // Private methods for API interaction...
}
```

#### OpenAI API Integration

```javascript
class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.modelName = 'gpt-3.5-turbo'; // or gpt-4 based on settings
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async evaluateTranslation(data) {
    const messages = this.buildEvaluationMessages(data);
    const response = await this.callOpenAIAPI(messages);
    return this.parseResponse(response);
  }

  async generateTranslation(data) {
    const messages = this.buildTranslationMessages(data);
    const response = await this.callOpenAIAPI(messages);
    return this.extractTranslation(response);
  }

  // Private methods for API interaction...
}
```

### Prompt Engineering

For effective evaluation and translation, we'll use carefully designed prompts:

#### Translation Evaluation Prompt Template

```
You are a language expert evaluating translations from {sourceLanguage} to {targetLanguage}.

Original text: "{sourceContent}"
User's translation: "{userTranslation}"
Reference translation (if available): "{referenceTranslation}"

Evaluate the user's translation based on:
1. Accuracy - Does it convey the same meaning?
2. Grammar - Is it grammatically correct?
3. Vocabulary - Is appropriate vocabulary used?
4. Style - Is the style appropriate?

Provide a structured response with:
- Overall correctness (true/false)
- Score (0.0-1.0)
- Feedback (brief explanation)
- Suggested translation (if the user's is incorrect)
- Detailed feedback on grammar, vocabulary, and accuracy
```

#### Translation Generation Prompt Template

```
Translate the following text from {sourceLanguage} to {targetLanguage}:
"{content}"

Provide only the translation itself without explanations or notes.
```

### Response Parsing

The service will parse structured API responses into consistent internal formats:

```javascript
{
  correct: boolean,        // Whether the translation is overall correct
  score: number,           // Score from 0.0 to 1.0
  feedback: string,        // User-friendly feedback message
  suggestedTranslation: string, // Suggested correct translation
  details: {               // Optional detailed feedback
    grammar: string,       // Grammar feedback
    vocabulary: string,    // Vocabulary feedback
    accuracy: string,      // Accuracy feedback
    alternativeTranslations: string[] // Optional alternative translations
  }
}
```

### Settings Integration

The updated TranslationService will read configuration from the application settings:

```javascript
constructor(options = {}) {
  // Get settings from options or database
  this.settings = options.settings || new Settings();
  
  // Create API providers based on settings
  this.providers = {
    gemini: this.settings.translationApiKey && this.settings.translationApiProvider === 'gemini' 
      ? new GeminiProvider(this.settings.translationApiKey)
      : null,
    openai: this.settings.translationApiKey && this.settings.translationApiProvider === 'openai'
      ? new OpenAIProvider(this.settings.translationApiKey)
      : null
  };
  
  // Set primary provider based on settings
  this.primaryProvider = this.settings.translationApiProvider || 'gemini';
}
```

### Error Handling and Fallbacks

The service will manage API errors and provide fallbacks:

```javascript
async evaluateTranslation(data) {
  try {
    // Try to use the primary provider
    const primaryProvider = this.providers[this.primaryProvider];
    if (primaryProvider) {
      return await primaryProvider.evaluateTranslation(data);
    }
    
    // If primary is not available, try fallback
    const fallbackProvider = this.getFallbackProvider();
    if (fallbackProvider) {
      return await fallbackProvider.evaluateTranslation(data);
    }
    
    // If no providers are available, use the baseline algorithm
    return this.evaluateTranslationBaseline(data);
  } catch (error) {
    console.error('Translation evaluation error:', error);
    // Fall back to baseline method in case of API errors
    return this.evaluateTranslationBaseline(data);
  }
}
```

## API Key Management

The application will provide:

1. **Settings UI** - For entering API keys directly in the application
2. **Environment Variables** - For development and testing
3. **Local Storage** - For persistently storing encrypted keys between sessions

API keys will be:
- Encrypted in storage
- Never exposed in logs or error messages
- Validated before use

## Implementation Strategy

1. **Phase 1: Core API Integration**
   - Implement API client classes for Gemini and OpenAI
   - Create prompt templates
   - Add response parsing
   - Add configuration management

2. **Phase 2: Error Handling & Fallbacks**
   - Add error handling
   - Implement fallback strategies
   - Ensure graceful failure modes
   - Add logging (minus sensitive information)

3. **Phase 3: UI Integration**
   - Add API key entry in settings UI
   - Provide feedback on API status
   - Show more detailed translation evaluation in UI

4. **Phase 4: Testing & Optimization**
   - Add comprehensive tests
   - Optimize prompts based on results
   - Implement caching for efficiency
   - Add detailed instruction guides

## Test Plan

1. **Unit Testing**
   - API client class methods
   - Response parsing functions
   - Error handling and fallbacks
   - Configuration management

2. **Prompt Testing**
   - Test various prompt configurations
   - Evaluate translation quality for different language pairs
   - Compare providers for the same inputs

3. **Integration Testing**
   - End-to-end flow testing
   - Test with real API keys
   - Test fallback mechanisms
   - Test with API rate limits

4. **Performance Testing**
   - Measure response times
   - Evaluate caching effectiveness
   - Test with large translations

## Security Considerations

1. **API Key Security**
   - Encrypt API keys in storage
   - Never expose keys in logs or UI
   - Implement key validation

2. **Content Security**
   - Consider data privacy when sending content to APIs
   - Warn users about data transmission to third parties
   - Do not send sensitive user information to APIs

3. **Error Handling**
   - Sanitize error messages for sensitive data
   - Provide meaningful errors without exposing system details

## Alternatives Considered

### Local Translation Models
We considered using local models like Llama or Phi, but deemed them:
- Too resource-intensive for desktop apps
- Less accurate than the API options
- More complex to integrate and maintain

### Traditional Translation APIs
Traditional translation APIs (Google Translate API, DeepL) were considered but:
- Lack the context-aware evaluation capabilities of Gemini/OpenAI
- Cannot provide detailed feedback on translation quality
- Generally aren't designed for translation evaluation, just translation

### Custom Evaluation Algorithm
We could develop a custom algorithm for evaluating translations, but:
- Would require significant linguistics expertise
- Would be limited in language coverage
- Would be less accurate than AI-powered solutions
- Would require extensive maintenance