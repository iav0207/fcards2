const Settings = require('../models/Settings');

/**
 * Repository for Settings entity operations
 */
class SettingsRepository {
  /**
   * Creates a new SettingsRepository instance
   * @param {Object} db - The database instance
   * @param {boolean} initialized - Whether the database is initialized
   */
  constructor(db, initialized = false) {
    this.db = db;
    this.initialized = initialized;
  }

  /**
   * Set the initialized state of the repository
   * @param {boolean} initialized - Whether the database is initialized
   */
  setInitialized(initialized) {
    this.initialized = initialized;
  }

  /**
   * Save application settings
   * @param {Settings} settings - The settings to save
   * @returns {Settings} - The saved settings
   */
  saveSettings(settings) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, settings
      ) VALUES (?, ?)
    `);

    stmt.run(
      'app_settings',
      JSON.stringify(settings.toJSON())
    );

    return settings;
  }

  /**
   * Get application settings
   * @returns {Settings} - Application settings
   */
  getSettings() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT settings FROM settings WHERE id = ?');
    const row = stmt.get('app_settings');

    if (!row) {
      return Settings.getDefaults();
    }

    try {
      const settingsData = JSON.parse(row.settings);
      return Settings.fromJSON(settingsData);
    } catch (error) {
      console.error('Failed to parse settings:', error);
      return Settings.getDefaults();
    }
  }
}

module.exports = SettingsRepository;