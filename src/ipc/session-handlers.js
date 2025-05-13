/**
 * IPC handlers for session operations
 */
const { ipcMain } = require('electron');

/**
 * Register session IPC handlers
 * @param {Object} sessionService - The session service instance
 * @param {Object} errorHandler - The error handler utility
 * @param {BrowserWindow} mainWindow - The main window instance
 */
function registerSessionHandlers(sessionService, errorHandler, mainWindow) {
  // Session creation
  ipcMain.handle('session:create', async (event, options) => {
    try {
      return await sessionService.createSession(options);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'session',
        'creating practice session'
      );
      throw new Error(errorInfo.message || 'Failed to create practice session');
    }
  });

  // Get current card in session
  ipcMain.handle('session:getCurrentCard', async (event, sessionId) => {
    try {
      return await sessionService.getCurrentCard(sessionId);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'session',
        'retrieving current card'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve current card');
    }
  });

  // Submit an answer for the current card
  ipcMain.handle('session:submitAnswer', async (event, { sessionId, answer }) => {
    try {
      const result = await sessionService.submitAnswer(sessionId, answer);

      // If we had a translation error but still managed to create a result,
      // send a notification but don't break the flow
      if (result._hadTranslationError) {
        errorHandler.handleError(
          mainWindow,
          'Translation Issue',
          'There was a problem with the translation service, but your answer was accepted.',
          'translation',
          'warning'
        );
      }

      // If the evaluation used a fallback method, let the user know
      if (result.evaluation && result.evaluation._fallback) {
        errorHandler.handleError(
          mainWindow,
          'Evaluation Fallback',
          'We had to use a simplified evaluation method due to API issues.',
          'translation',
          'info'
        );
      }

      return result;
    } catch (error) {
      // Send the error to the renderer
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        error.sessionError ? 'session' : 'answer',
        'submitting answer'
      );

      // Throw a more user-friendly error
      throw new Error(errorInfo.message || 'Failed to submit your answer. Please try again.');
    }
  });

  // Advance to the next card in the session
  ipcMain.handle('session:advance', async (event, sessionId) => {
    try {
      return await sessionService.advanceSession(sessionId);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'session',
        'advancing session'
      );
      throw new Error(errorInfo.message || 'Failed to advance to next card');
    }
  });

  // Get session statistics
  ipcMain.handle('session:getStats', async (event, sessionId) => {
    try {
      return await sessionService.getSessionStats(sessionId);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'session',
        'retrieving session statistics'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve session statistics');
    }
  });
}

module.exports = {
  registerSessionHandlers
};