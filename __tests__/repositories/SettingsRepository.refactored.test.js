/**
 * Tests for SettingsRepository using real in-memory SQLite
 */
const sqlite3 = require('sqlite3').verbose();
const SettingsRepository = require('../../src/repositories/SettingsRepository');
const Settings = require('../../src/models/Settings');
const { promisify } = require('util');

describe('SettingsRepository', () => {
  let db;
  let repository;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    db = new sqlite3.Database(':memory:');
    
    // Create promisified version of run for setup
    const run = promisify(db.run.bind(db));
    
    // Create settings table
    await run(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        settings TEXT NOT NULL
      )
    `);
    
    // Initialize repository with database connection
    repository = new SettingsRepository(db, true);
  });

  afterEach((done) => {
    // Close database connection
    if (db) {
      db.close(done);
    } else {
      done();
    }
  });

  describe('saveSettings', () => {
    test('should save settings to the database', async () => {
      // Create test settings
      const settings = new Settings({
        darkMode: true,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 30
      });

      // Save the settings
      const savedSettings = await repository.saveSettings(settings);

      // Verify the saved settings match the original
      expect(savedSettings).toEqual(settings);
      
      // Verify it was actually saved to the database
      const retrievedSettings = await repository.getSettings();
      expect(retrievedSettings).toBeInstanceOf(Settings);
      expect(retrievedSettings.darkMode).toBe(true);
      expect(retrievedSettings.translationApiKey).toBe('test-key');
      expect(retrievedSettings.translationApiProvider).toBe('openai');
      expect(retrievedSettings.maxCardsPerSession).toBe(30);
    });

    test('should throw an error if database is not initialized', async () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new SettingsRepository(db, false);
      
      // Create test settings
      const settings = new Settings({
        darkMode: true
      });

      // Attempt to save should reject with error
      await expect(uninitializedRepo.saveSettings(settings))
        .rejects.toThrow('Database not initialized');
    });
  });

  describe('getSettings', () => {
    test('should retrieve settings from the database', async () => {
      // Create and save test settings
      const settings = new Settings({
        darkMode: false,
        translationApiKey: 'test-key-123',
        translationApiProvider: 'gemini',
        maxCardsPerSession: 25
      });
      
      await repository.saveSettings(settings);
      
      // Retrieve the settings
      const retrievedSettings = await repository.getSettings();
      
      // Verify retrieved settings
      expect(retrievedSettings).toBeInstanceOf(Settings);
      expect(retrievedSettings.darkMode).toBe(false);
      expect(retrievedSettings.translationApiKey).toBe('test-key-123');
      expect(retrievedSettings.translationApiProvider).toBe('gemini');
      expect(retrievedSettings.maxCardsPerSession).toBe(25);
    });

    test('should return default settings when no settings are found', async () => {
      // No settings saved, should return defaults
      const settings = await repository.getSettings();
      
      // Verify default settings
      expect(settings).toBeInstanceOf(Settings);
      expect(settings.darkMode).toBe(true); // default darkMode is true
      expect(settings.translationApiKey).toBe('');
      expect(settings.translationApiProvider).toBe('gemini');
      expect(settings.maxCardsPerSession).toBe(20);
    });

    test('should return default settings when parsing fails', async () => {
      // Manually insert invalid JSON to cause parsing failure
      const run = promisify(db.run.bind(db));
      await run('INSERT INTO settings (id, settings) VALUES (?, ?)', [
        'app_settings',
        'not valid json'
      ]);
      
      // Try to retrieve settings, should get defaults
      const settings = await repository.getSettings();
      
      // Verify default settings returned
      expect(settings).toBeInstanceOf(Settings);
      expect(settings.darkMode).toBe(true);
      expect(settings.translationApiProvider).toBe('gemini');
    });
  });
});