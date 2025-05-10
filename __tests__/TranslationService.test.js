const TranslationService = require('../src/services/TranslationService');

// Mock setTimeout to make tests run faster
jest.useFakeTimers();

// Mock the provider classes to avoid actual provider initialization
jest.mock('../src/services/translation/GeminiProvider');
jest.mock('../src/services/translation/OpenAIProvider');

// Mock environment module
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
      expect(service.settings.translationApiProvider).toBe('gemini');
      expect(service.settings.translationApiKey).toBe('test-key');
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