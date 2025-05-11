/**
 * Tests for BaselineTranslator
 */
const BaselineTranslator = require('../../src/services/translation/BaselineTranslator');

describe('BaselineTranslator', () => {
  let translator;

  beforeEach(() => {
    translator = new BaselineTranslator();
  });

  describe('evaluateTranslation', () => {
    it('should evaluate an exact match with reference as correct', () => {
      const result = translator.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Hallo',
        referenceTranslation: 'Hallo'
      });

      expect(result.correct).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.feedback).toContain('Perfect');
    });

    it('should evaluate a close match with reference as correct with lower score', () => {
      const result = translator.evaluateTranslation({
        sourceContent: 'How are you doing today',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Wie geht es dir',
        referenceTranslation: 'Wie geht es dir heute'
      });

      expect(result.correct).toBe(true);
      expect(result.score).toBe(0.8);
      expect(result.feedback).toContain('close');
    });

    it('should evaluate an incorrect translation with reference', () => {
      const result = translator.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Tschüss',
        referenceTranslation: 'Hallo'
      });

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0.2);
      expect(result.feedback).toContain('Try again');
    });

    it('should evaluate any translation without reference as correct', () => {
      const result = translator.evaluateTranslation({
        sourceContent: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        userTranslation: 'Any translation'
      });

      expect(result.correct).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.feedback).toContain('Great job');
    });
  });

  describe('generateTranslation', () => {
    it('should generate translations for known phrases', () => {
      const result = translator.generateTranslation({
        content: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });

      expect(result).toBe('Hallo');
    });

    it('should handle different language pairs', () => {
      const result = translator.generateTranslation({
        content: 'thank you',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      expect(result).toBe('Merci');
    });

    it('should handle unknown phrases by returning bracketed content', () => {
      const result = translator.generateTranslation({
        content: 'This is an unknown phrase',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });

      expect(result).toBe('[This is an unknown phrase]');
    });

    it('should normalize content before looking up translations', () => {
      const result = translator.generateTranslation({
        content: '  Hello  ',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });

      expect(result).toBe('Hallo');
    });
  });

  describe('_isCloseMatch', () => {
    it('should identify contained strings as close matches', () => {
      expect(translator._isCloseMatch('Hello there', 'Hello')).toBe(true);
      expect(translator._isCloseMatch('Hello', 'Hello there')).toBe(true);
    });

    it('should identify strings with shared words as close matches', () => {
      expect(translator._isCloseMatch('Hello my friend', 'Hello my dear friend')).toBe(true);
      expect(translator._isCloseMatch('I am going home', 'I am going to school')).toBe(true);
    });

    it('should identify different strings as not close matches', () => {
      expect(translator._isCloseMatch('Hello', 'Goodbye')).toBe(false);
      expect(translator._isCloseMatch('I like apples', 'She likes oranges')).toBe(false);
    });
  });
});