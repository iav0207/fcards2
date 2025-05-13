/**
 * IPC handlers for translation operations
 */
const { ipcMain } = require('electron');

/**
 * Register translation IPC handlers
 * @param {Object} translationService - The translation service instance
 * @param {Object} errorHandler - The error handler utility
 * @param {BrowserWindow} mainWindow - The main window instance
 */
function registerTranslationHandlers(translationService, errorHandler, mainWindow) {
  // Translation evaluation
  ipcMain.handle('translation:evaluate', async (event, data) => {
    try {
      return await translationService.evaluateTranslation(data);
    } catch (error) {
      // Create a structured error and send to renderer
      errorHandler.handleException(
        mainWindow,
        error,
        'translation',
        'translation evaluation'
      );

      // Return a fallback result to prevent app from crashing
      return {
        correct: false,
        score: 0,
        feedback: 'Unable to evaluate translation due to an error. Please try again later.',
        suggestedTranslation: data.referenceTranslation || 'Translation unavailable',
        details: {
          grammar: 'Evaluation unavailable',
          vocabulary: 'Evaluation unavailable',
          accuracy: 'Evaluation unavailable'
        },
        _error: true // Flag to indicate this is a fallback result
      };
    }
  });

  // Translation generation
  ipcMain.handle('translation:generate', async (event, data) => {
    try {
      return await translationService.generateTranslation(data);
    } catch (error) {
      // Create a structured error and send to renderer
      errorHandler.handleException(
        mainWindow,
        error,
        'translation',
        'translation generation'
      );

      // Return a fallback result with the error details
      let apiKeyMessage = '';
      if (error.message.includes('API key')) {
        apiKeyMessage = ' Please check your API key in settings.';
      }

      return `[Translation error: ${error.message}${apiKeyMessage}]`;
    }
  });
}

module.exports = {
  registerTranslationHandlers
};