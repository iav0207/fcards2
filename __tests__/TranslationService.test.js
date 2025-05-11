const TranslationService = require('../src/services/TranslationService');

// Mock setTimeout to make tests run faster
jest.useFakeTimers();

// Mock the provider factories and evaluators
jest.mock('../src/services/translation/TranslationProviderFactory', () => {
  return {
    createProviders: jest.fn().mockReturnValue({
      providers: {},
      primaryProvider: 'gemini',
      translationApiKey: ''
    }),
    getFallbackProvider: jest.fn().mockReturnValue(null)
  };
});

jest.mock('../src/services/translation/TranslationEvaluator', () => {
  return jest.fn().mockImplementation(() => {
    return {
      evaluateTranslation: jest.fn().mockImplementation((data) => {
        // Simple mock implementation for testing
        if (data.referenceTranslation) {
          if (data.userTranslation === data.referenceTranslation) {
            return Promise.resolve({
              correct: true,
              score: 1.0,
              feedback: "Perfect! Your translation matches exactly.",
              suggestedTranslation: data.referenceTranslation,
              details: {
                grammar: "Perfect",
                vocabulary: "Appropriate",
                accuracy: "Precise"
              }
            });
          } else if (data.userTranslation.includes(data.referenceTranslation.substring(0, 5))) {
            return Promise.resolve({
              correct: true,
              score: 0.8,
              feedback: "Good job! Your translation is very close.",
              suggestedTranslation: data.referenceTranslation,
              details: {
                grammar: "Good",
                vocabulary: "Appropriate",
                accuracy: "Close"
              }
            });
          } else {
            return Promise.resolve({
              correct: false,
              score: 0.2,
              feedback: "Try again. Your translation doesn't match the expected answer.",
              suggestedTranslation: data.referenceTranslation,
              details: {
                grammar: "Check your word order",
                vocabulary: "Review key terms",
                accuracy: "Needs improvement"
              }
            });
          }
        } else {
          return Promise.resolve({
            correct: true,
            score: 1.0,
            feedback: "Great job! Your translation is correct.",
            suggestedTranslation: data.userTranslation,
            details: {
              grammar: "Perfect",
              vocabulary: "Appropriate",
              accuracy: "Precise"
            }
          });
        }
      })
    };
  });
});

jest.mock('../src/services/translation/TranslationGenerator', () => {
  return jest.fn().mockImplementation(() => {
    return {
      generateTranslation: jest.fn().mockImplementation((data) => {
        // Provide some basic translations for testing
        const translations = {
          'en': {
            'de': {
              'hello': 'Hallo',
              'thank you': 'Danke',
            },
            'fr': {
              'hello': 'Bonjour',
              'thank you': 'Merci',
            }
          }
        };

        const content = data.content.toLowerCase().trim();
        const sourceTranslations = translations[data.sourceLanguage] || {};
        const targetTranslations = sourceTranslations[data.targetLanguage] || {};

        return Promise.resolve(targetTranslations[content] || `[${data.content}]`);
      })
    };
  });
});

// Mock environment module (still needed for settings initialization)
jest.mock('../src/utils/environment', () => ({
  getEnvironmentConfig: jest.fn().mockReturnValue({
    GEMINI_API_KEY: '',
    OPENAI_API_KEY: ''
  }),
  checkApiKeysAvailability: jest.fn().mockReturnValue({
    gemini: false,
    openai: false,
    hasAnyTranslationApi: false
  }),
  isDevelopment: jest.fn().mockReturnValue(true)
}));

describe('TranslationService', () => {
  let translationService;

  beforeEach(() => {
    translationService = new TranslationService();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('creates a TranslationService with default options', () => {
      expect(translationService.settings.translationApiProvider).toBe('gemini');
      expect(translationService.settings.translationApiKey).toBe('');
    });

    it('creates a TranslationService with provided options', () => {
      const service = new TranslationService({
        apiProvider: 'gemini',
        apiKey: 'test-key'
      });
      // In our mock, the TranslationProviderFactory returns fixed values
      expect(service.settings.translationApiProvider).toBe('gemini');
      expect(service.primaryProvider).toBe('gemini');
    });
  });

  describe('evaluateTranslation', () => {
    it('evaluates a translation without reference as correct', async () => {
      const evaluationPromise = translationService.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await evaluationPromise;
      
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain('Great job');
    });

    it('evaluates an exact match with reference as correct', async () => {
      const evaluationPromise = translationService.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await evaluationPromise;
      
      expect(result.correct).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.feedback).toContain('Perfect');
    });

    it('evaluates a close match with reference as correct with lower score', async () => {
      const evaluationPromise = translationService.evaluateTranslation({
        sourceContent: 'How are you doing today',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Wie geht es dir',
        referenceTranslation: 'Wie geht es dir heute'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await evaluationPromise;
      
      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.8);
      expect(result.feedback).toContain('close');
    });

    it('evaluates an incorrect translation with reference', async () => {
      const evaluationPromise = translationService.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Tschüss',
        referenceTranslation: 'Hallo'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await evaluationPromise;
      
      expect(result.correct).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.feedback).toContain('Try again');
    });
  });

  describe('generateTranslation', () => {
    it('generates translations for known phrases', async () => {
      const translationPromise = translationService.generateTranslation({
        content: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await translationPromise;
      
      expect(result).toBe('Hallo');
    });

    it('handles different language pairs', async () => {
      const translationPromise = translationService.generateTranslation({
        content: 'Thank you',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await translationPromise;
      
      expect(result).toBe('Merci');
    });

    it('handles unknown phrases by returning bracketed content', async () => {
      const translationPromise = translationService.generateTranslation({
        content: 'This is an unknown phrase',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await translationPromise;
      
      expect(result).toBe('[This is an unknown phrase]');
    });

    it('normalizes content before looking up translations', async () => {
      const translationPromise = translationService.generateTranslation({
        content: '  Hello  ',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });
      
      // Fast-forward timers to resolve the Promise
      jest.runAllTimers();
      
      const result = await translationPromise;
      
      expect(result).toBe('Hallo');
    });
  });

  describe('_isCloseMatch', () => {
    it('identifies contained strings as close matches', () => {
      expect(translationService._isCloseMatch('Hello there', 'Hello')).toBe(true);
      expect(translationService._isCloseMatch('Hello', 'Hello there')).toBe(true);
    });

    it('identifies strings with shared words as close matches', () => {
      expect(translationService._isCloseMatch('Hello my friend', 'Hello my dear friend')).toBe(true);
      expect(translationService._isCloseMatch('I am going home', 'I am going to school')).toBe(true);
    });

    it('identifies different strings as not close matches', () => {
      expect(translationService._isCloseMatch('Hello', 'Goodbye')).toBe(false);
      expect(translationService._isCloseMatch('I like apples', 'She likes oranges')).toBe(false);
    });
  });
});