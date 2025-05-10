/**
 * Settings class for application configuration
 */
class Settings {
  /**
   * Create a new Settings instance
   * @param {Object} data - Settings data
   * @param {boolean} [data.darkMode] - Whether dark mode is enabled
   * @param {string} [data.translationApiKey] - API key for translation service
   * @param {'gemini'|'openai'} [data.translationApiProvider] - Which translation API provider to use
   * @param {number} [data.maxCardsPerSession] - Maximum cards per practice session
   * @param {string} [data.defaultSourceLanguage] - Default source language ISO code
   * @param {string} [data.defaultTargetLanguage] - Default target language ISO code
   */
  constructor(data = {}) {
    this.darkMode = data.darkMode ?? true;
    this.translationApiKey = data.translationApiKey || '';
    // Use nullish coalescing to allow empty string but not undefined/null
    this.translationApiProvider = data.translationApiProvider !== undefined ? data.translationApiProvider : 'gemini';
    this.maxCardsPerSession = data.maxCardsPerSession || 20;
    this.defaultSourceLanguage = data.defaultSourceLanguage || 'en';
    this.defaultTargetLanguage = data.defaultTargetLanguage || 'es';
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings to apply
   */
  update(newSettings = {}) {
    if (newSettings.darkMode !== undefined) this.darkMode = newSettings.darkMode;
    if (newSettings.translationApiKey !== undefined) this.translationApiKey = newSettings.translationApiKey;
    if (newSettings.translationApiProvider !== undefined) this.translationApiProvider = newSettings.translationApiProvider;
    if (newSettings.maxCardsPerSession !== undefined) this.maxCardsPerSession = newSettings.maxCardsPerSession;
    if (newSettings.defaultSourceLanguage !== undefined) this.defaultSourceLanguage = newSettings.defaultSourceLanguage;
    if (newSettings.defaultTargetLanguage !== undefined) this.defaultTargetLanguage = newSettings.defaultTargetLanguage;
  }

  /**
   * Check if translation API settings are configured
   * @returns {boolean} - True if translation API settings are configured
   */
  hasTranslationApiConfiguration() {
    return Boolean(this.translationApiKey && this.translationApiProvider && this.translationApiProvider !== '');
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      darkMode: this.darkMode,
      translationApiKey: this.translationApiKey,
      translationApiProvider: this.translationApiProvider,
      maxCardsPerSession: this.maxCardsPerSession,
      defaultSourceLanguage: this.defaultSourceLanguage,
      defaultTargetLanguage: this.defaultTargetLanguage
    };
  }

  /**
   * Create a Settings instance from a plain object
   * @param {Object} data - Plain object data
   * @returns {Settings} - New Settings instance
   */
  static fromJSON(data) {
    return new Settings(data);
  }

  /**
   * Get default settings
   * @returns {Settings} - Default settings
   */
  static getDefaults() {
    return new Settings();
  }
}

module.exports = Settings;