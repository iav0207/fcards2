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
   * @returns {Promise<Settings>} - Promise that resolves to the saved settings
   */
  saveSettings(settings) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO settings (
          id, settings
        ) VALUES (?, ?)
      `;

      console.log('Saving application settings');

      this.db.run(
        query,
        ['app_settings', JSON.stringify(settings.toJSON())],
        (err) => {
          if (err) {
            console.error('Error saving settings:', err);
            reject(err);
            return;
          }

          console.log('Settings saved successfully');
          resolve(settings);
        }
      );
    });
  }

  /**
   * Get application settings
   * @returns {Promise<Settings>} - Promise that resolves to application settings
   */
  getSettings() {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
      console.log('Getting application settings from database');
      this.db.get('SELECT settings FROM settings WHERE id = ?', ['app_settings'], (err, row) => {
        if (err) {
          console.error('Error querying settings:', err);
          reject(err);
          return;
        }

        if (!row) {
          console.log('No settings found, returning defaults');
          resolve(Settings.getDefaults());
          return;
        }

        try {
          console.log('Parsing settings:', row.settings);
          const settingsData = JSON.parse(row.settings);
          resolve(Settings.fromJSON(settingsData));
        } catch (error) {
          console.error('Failed to parse settings:', error);
          resolve(Settings.getDefaults());
        }
      });
    });
  }
}

module.exports = SettingsRepository;