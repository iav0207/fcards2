const Settings = require('../src/models/Settings');

describe('Settings Model', () => {
  describe('constructor', () => {
    it('creates a new Settings with default values', () => {
      const settings = new Settings();
      
      expect(settings.darkMode).toBe(true);
      expect(settings.translationApiKey).toBe('');
      expect(settings.translationApiProvider).toBe('gemini');
      expect(settings.maxCardsPerSession).toBe(20);
      expect(settings.defaultSourceLanguage).toBe('en');
      expect(settings.defaultTargetLanguage).toBe('es');
    });

    it('creates a Settings with provided values', () => {
      const data = {
        darkMode: false,
        translationApiKey: 'test-api-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 10,
        defaultSourceLanguage: 'fr',
        defaultTargetLanguage: 'it'
      };
      
      const settings = new Settings(data);
      
      expect(settings.darkMode).toBe(false);
      expect(settings.translationApiKey).toBe('test-api-key');
      expect(settings.translationApiProvider).toBe('openai');
      expect(settings.maxCardsPerSession).toBe(10);
      expect(settings.defaultSourceLanguage).toBe('fr');
      expect(settings.defaultTargetLanguage).toBe('it');
    });
    
    it('handles null coalescing for darkMode', () => {
      const settingsWithFalse = new Settings({ darkMode: false });
      expect(settingsWithFalse.darkMode).toBe(false);
      
      const settingsWithTrue = new Settings({ darkMode: true });
      expect(settingsWithTrue.darkMode).toBe(true);
    });
  });

  describe('update method', () => {
    it('updates only the provided settings', () => {
      const settings = new Settings({
        darkMode: true,
        translationApiKey: 'old-key',
        translationApiProvider: 'gemini',
        maxCardsPerSession: 20
      });
      
      settings.update({
        darkMode: false,
        translationApiKey: 'new-key'
      });
      
      expect(settings.darkMode).toBe(false);
      expect(settings.translationApiKey).toBe('new-key');
      expect(settings.translationApiProvider).toBe('gemini');
      expect(settings.maxCardsPerSession).toBe(20);
    });
    
    it('handles boolean value updates correctly', () => {
      const settings = new Settings({ darkMode: true });
      
      settings.update({ darkMode: false });
      expect(settings.darkMode).toBe(false);
      
      settings.update({ darkMode: true });
      expect(settings.darkMode).toBe(true);
    });
  });

  describe('hasTranslationApiConfiguration method', () => {
    it('returns true when translation API is configured', () => {
      const settings = new Settings({
        translationApiKey: 'some-key',
        translationApiProvider: 'gemini'
      });
      
      expect(settings.hasTranslationApiConfiguration()).toBe(true);
    });
    
    it('returns false when translation API key is missing', () => {
      const settings = new Settings({
        translationApiKey: '',
        translationApiProvider: 'gemini'
      });
      
      expect(settings.hasTranslationApiConfiguration()).toBe(false);
    });
    
    it('returns false when translation API provider is missing', () => {
      const settings = new Settings({
        translationApiKey: 'some-key',
        translationApiProvider: ''
      });
      
      expect(settings.hasTranslationApiConfiguration()).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('converts a Settings to a plain object', () => {
      const settings = new Settings({
        darkMode: false,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 15,
        defaultSourceLanguage: 'es',
        defaultTargetLanguage: 'fr'
      });
      
      const json = settings.toJSON();
      
      expect(json).toEqual({
        darkMode: false,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 15,
        defaultSourceLanguage: 'es',
        defaultTargetLanguage: 'fr'
      });
    });
  });

  describe('fromJSON method', () => {
    it('creates a Settings from a plain object', () => {
      const data = {
        darkMode: false,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 15,
        defaultSourceLanguage: 'es',
        defaultTargetLanguage: 'fr'
      };
      
      const settings = Settings.fromJSON(data);
      
      expect(settings).toBeInstanceOf(Settings);
      expect(settings.darkMode).toBe(false);
      expect(settings.translationApiKey).toBe('test-key');
      expect(settings.translationApiProvider).toBe('openai');
      expect(settings.maxCardsPerSession).toBe(15);
      expect(settings.defaultSourceLanguage).toBe('es');
      expect(settings.defaultTargetLanguage).toBe('fr');
    });
  });

  describe('getDefaults method', () => {
    it('returns default settings', () => {
      const defaults = Settings.getDefaults();
      
      expect(defaults).toBeInstanceOf(Settings);
      expect(defaults.darkMode).toBe(true);
      expect(defaults.translationApiKey).toBe('');
      expect(defaults.translationApiProvider).toBe('gemini');
      expect(defaults.maxCardsPerSession).toBe(20);
      expect(defaults.defaultSourceLanguage).toBe('en');
      expect(defaults.defaultTargetLanguage).toBe('es');
    });
  });
});