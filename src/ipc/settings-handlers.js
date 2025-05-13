/**
 * IPC handlers for settings operations
 */
const { ipcMain } = require('electron');

/**
 * Register settings IPC handlers
 * @param {Object} db - The database service instance
 * @param {Object} errorHandler - The error handler utility
 * @param {BrowserWindow} mainWindow - The main window instance
 */
function registerSettingsHandlers(db, errorHandler, mainWindow) {
  // Save settings
  ipcMain.handle('settings:save', async (event, settingsData) => {
    try {
      const Settings = require('../models/Settings');
      const settings = new Settings(settingsData);
      return db.saveSettings(settings).toJSON();
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'settings',
        'saving settings'
      );
      throw new Error(errorInfo.message || 'Failed to save settings');
    }
  });

  // Get settings
  ipcMain.handle('settings:get', async (event) => {
    try {
      const settings = db.getSettings();
      return settings.toJSON();
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'settings',
        'retrieving settings'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve settings');
    }
  });
}

module.exports = {
  registerSettingsHandlers
};