/**
 * Tests for SettingsRepository
 */
const SettingsRepository = require('../../src/repositories/SettingsRepository');
const Settings = require('../../src/models/Settings');

// Mock database
const mockDb = {
  prepare: jest.fn(),
};

// Mock prepared statement
const mockStmt = {
  run: jest.fn(),
  get: jest.fn(),
};

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

describe('SettingsRepository', () => {
  let repository;

  beforeEach(() => {
    // Reset mocks
    mockDb.prepare.mockReset();
    mockStmt.run.mockReset();
    mockStmt.get.mockReset();
    console.error.mockReset();

    // Mock prepare to return our mock statement
    mockDb.prepare.mockReturnValue(mockStmt);

    // Create repository with initialized state
    repository = new SettingsRepository(mockDb, true);
  });

  describe('saveSettings', () => {
    test('should save settings to the database', () => {
      // Create test settings
      const settings = new Settings({
        darkMode: true,
        translationApiKey: 'test-gemini-key',
        translationApiProvider: 'gemini',
        defaultSourceLanguage: 'en',
        defaultTargetLanguage: 'de'
      });

      // Mock successful run
      mockStmt.run.mockReturnValue({ changes: 1 });

      // Save the settings
      const result = repository.saveSettings(settings);

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO settings'));

      // Check that run was called with the correct parameters
      expect(mockStmt.run).toHaveBeenCalledWith(
        'app_settings',
        expect.any(String) // JSON string is hard to match exactly
      );

      // Check that the settings were serialized properly
      const jsonArg = mockStmt.run.mock.calls[0][1];
      const parsedJson = JSON.parse(jsonArg);
      expect(parsedJson.translationApiKey).toBe('test-gemini-key');
      expect(parsedJson.translationApiProvider).toBe('gemini');
      expect(parsedJson.darkMode).toBe(true);

      // Check that the settings were returned
      expect(result).toBe(settings);
    });

    test('should throw an error if database is not initialized', () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new SettingsRepository(mockDb, false);

      // Create test settings
      const settings = new Settings({
        apiKeys: { gemini: 'test-key' }
      });

      // Expect error when trying to save
      expect(() => {
        uninitializedRepo.saveSettings(settings);
      }).toThrow('Database not initialized');
    });
  });

  describe('getSettings', () => {
    test('should retrieve settings from the database', () => {
      // Mock database row return
      const mockRow = {
        settings: JSON.stringify({
          darkMode: true,
          translationApiKey: 'test-gemini-key',
          translationApiProvider: 'gemini',
          defaultSourceLanguage: 'en',
          defaultTargetLanguage: 'de'
        })
      };

      mockStmt.get.mockReturnValue(mockRow);

      // Get the settings
      const result = repository.getSettings();

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT settings FROM settings WHERE id = ?');

      // Check that get was called with the correct ID
      expect(mockStmt.get).toHaveBeenCalledWith('app_settings');

      // Check that a Settings instance was returned
      expect(result).toBeInstanceOf(Settings);
      expect(result.translationApiKey).toBe('test-gemini-key');
      expect(result.translationApiProvider).toBe('gemini');
      expect(result.darkMode).toBe(true);
    });

    test('should return default settings when no settings are found', () => {
      // Mock empty database result
      mockStmt.get.mockReturnValue(null);

      // Spy on the getDefaults method
      const getDefaultsSpy = jest.spyOn(Settings, 'getDefaults');

      // Get the settings
      const result = repository.getSettings();

      // Check that default settings were requested
      expect(getDefaultsSpy).toHaveBeenCalled();

      // Check that a Settings instance was returned
      expect(result).toBeInstanceOf(Settings);
    });

    test('should return default settings when parsing fails', () => {
      // Mock invalid JSON
      const mockRow = {
        settings: 'not valid json'
      };

      mockStmt.get.mockReturnValue(mockRow);

      // Get the settings
      const result = repository.getSettings();

      // Check that error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse settings:',
        expect.any(Error)
      );

      // Check that default settings were returned
      expect(result).toBeInstanceOf(Settings);
    });
  });
});