/**
 * Tests for GeminiProvider
 */
const GeminiProvider = require('../../src/services/translation/providers/GeminiProvider');

// Mock the global fetch function
global.fetch = jest.fn();

describe('GeminiProvider', () => {
  let provider;
  const mockApiKey = 'mock-api-key';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new provider instance
    provider = new GeminiProvider(mockApiKey);
    
    // Mock successful API response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: `{
                "correct": true,
                "score": 0.9,
                "feedback": "Great job! Your translation is accurate.",
                "suggestedTranslation": "Hallo",
                "details": {
                  "grammar": "Perfect",
                  "vocabulary": "Excellent",
                  "accuracy": "Accurate"
                }
              }`
            }]
          }
        }]
      })
    });
  });
  
  describe('constructor', () => {
    it('should create a new provider instance', () => {
      expect(provider).toBeInstanceOf(GeminiProvider);
    });
    
    it('should throw an error if no API key is provided', () => {
      expect(() => new GeminiProvider()).toThrow('Gemini API key is required');
    });
  });
  
  describe('evaluateTranslation', () => {
    it('should evaluate a translation successfully', async () => {
      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };
      
      const result = await provider.evaluateTranslation(data);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.9);
      expect(result.feedback).toBe('Great job! Your translation is accurate.');
      expect(result.suggestedTranslation).toBe('Hallo');
      expect(result.details.grammar).toBe('Perfect');
      expect(result.details.vocabulary).toBe('Excellent');
      expect(result.details.accuracy).toBe('Accurate');
    });
    
    it('should handle API errors gracefully', async () => {
      // Replace the existing mock with a rejected promise
      jest.clearAllMocks();
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

      const data = {
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo'
      };

      await expect(provider.evaluateTranslation(data)).rejects.toThrow('Gemini API evaluation failed');
    });
  });
  
  describe('generateTranslation', () => {
    it('should generate a translation successfully', async () => {
      // Mock translation response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'Hallo'
              }]
            }
          }]
        })
      });
      
      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };
      
      const result = await provider.generateTranslation(data);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toBe('Hallo');
    });
    
    it('should handle API errors gracefully', async () => {
      // Replace the existing mock with a rejected promise
      jest.clearAllMocks();
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

      const data = {
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      };

      await expect(provider.generateTranslation(data)).rejects.toThrow('Gemini API translation failed');
    });
  });
  
  describe('_parseEvaluationResponse', () => {
    it('should handle malformed API responses', () => {
      // Test internal method directly
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'This is not valid JSON'
            }]
          }
        }]
      };

      const originalData = {
        sourceContent: 'Hello',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      };

      // When calling the internal method directly, it should return a fallback
      const result = provider._parseEvaluationResponse(mockResponse, originalData);

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0.5);
      expect(result.feedback).toContain('Unable to evaluate');
      expect(result.suggestedTranslation).toBe('Hallo');
      expect(result.details.grammar).toBe('Evaluation unavailable');
    });
  });
});