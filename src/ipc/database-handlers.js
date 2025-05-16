/**
 * IPC handlers for database operations
 */
const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Register database IPC handlers
 * @param {Object} db - The database service instance
 * @param {Object} errorHandler - The error handler utility
 * @param {BrowserWindow} mainWindow - The main window instance
 * @param {Electron.App} app - The Electron app instance
 */
function registerDatabaseHandlers(db, errorHandler, mainWindow, app) {
  // Tag operations
  ipcMain.handle('tags:getAvailable', async (event, sourceLanguage) => {
    try {
      return await db.getAvailableTags(sourceLanguage);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving available tags'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve tags');
    }
  });

  // FlashCard operations
  ipcMain.handle('flashcard:save', async (event, cardData) => {
    try {
      const FlashCard = require('../models/FlashCard');
      const card = new FlashCard(cardData);
      const savedCard = await db.saveFlashCard(card);
      return savedCard.toJSON();
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'saving flashcard'
      );
      throw new Error(errorInfo.message || 'Failed to save flashcard');
    }
  });

  ipcMain.handle('flashcard:get', async (event, id) => {
    try {
      const card = await db.getFlashCard(id);
      return card ? card.toJSON() : null;
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving flashcard'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve flashcard');
    }
  });

  ipcMain.handle('flashcard:getAll', async (event, options) => {
    try {
      const cards = await db.getAllFlashCards(options);
      return cards.map(card => card.toJSON());
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving flashcards'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve flashcards');
    }
  });

  ipcMain.handle('flashcard:delete', async (event, id) => {
    try {
      return await db.deleteFlashCard(id);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'deleting flashcard'
      );
      throw new Error(errorInfo.message || 'Failed to delete flashcard');
    }
  });

  // Session operations
  ipcMain.handle('session:save', async (event, sessionData) => {
    try {
      const Session = require('../models/Session');
      const session = new Session(sessionData);
      const savedSession = await db.saveSession(session);
      return savedSession.toJSON();
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'saving session'
      );
      throw new Error(errorInfo.message || 'Failed to save session');
    }
  });

  ipcMain.handle('session:get', async (event, id) => {
    try {
      const session = await db.getSession(id);
      return session ? session.toJSON() : null;
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving session'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve session');
    }
  });

  ipcMain.handle('session:getAll', async (event, options) => {
    try {
      const sessions = await db.getAllSessions(options);
      return sessions.map(session => session.toJSON());
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving sessions'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve sessions');
    }
  });

  ipcMain.handle('session:delete', async (event, id) => {
    try {
      return await db.deleteSession(id);
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'deleting session'
      );
      throw new Error(errorInfo.message || 'Failed to delete session');
    }
  });

  // Database operations
  ipcMain.handle('database:stats', async (event) => {
    try {
      return await db.getStats();
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'retrieving database statistics'
      );
      throw new Error(errorInfo.message || 'Failed to retrieve database statistics');
    }
  });

  ipcMain.handle('database:export', async (event, options = {}) => {
    try {
      // Get the data to export
      const data = await db.exportData();

      // Add metadata
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appInfo: {
          name: 'FlashCards Desktop',
          version: app.getVersion() || '0.1.0'
        },
        data
      };

      // Show save dialog to get file path
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export FlashCards Data',
        defaultPath: 'flashcards-export.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      });

      if (canceled || !filePath) {
        return { success: false, reason: 'canceled' };
      }

      // Write to file
      await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2));

      return {
        success: true,
        path: filePath,
        stats: {
          flashcardsCount: data.flashcards.length,
          sessionsCount: data.sessions.length,
          settingsExported: !!data.settings
        }
      };
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'exporting database'
      );
      throw new Error(errorInfo.message || 'Failed to export database');
    }
  });

  ipcMain.handle('database:import', async (event, options = {}) => {
    try {
      // Show open dialog to get file path
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Import FlashCards Data',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, reason: 'canceled' };
      }

      // Read the file
      const fileData = await fs.promises.readFile(filePaths[0], 'utf-8');
      const importData = JSON.parse(fileData);

      // Validate the import format
      if (!importData.data || (!importData.data.flashcards && !importData.data.sessions)) {
        return { success: false, reason: 'invalid_format' };
      }

      // Merge or replace option (merge is default)
      const shouldReplace = options.mode === 'replace';

      // If replacing, first clear the database (not implemented yet)
      // TODO: Implement database clear method in DatabaseService

      // Import the data
      const result = await db.importData(importData.data);

      return {
        success: true,
        path: filePaths[0],
        stats: {
          flashcardsImported: result.flashcardsImported,
          sessionsImported: result.sessionsImported,
          settingsImported: result.settingsImported
        },
        importInfo: {
          version: importData.version || 'unknown',
          exportDate: importData.exportDate || 'unknown',
          appInfo: importData.appInfo || { name: 'unknown', version: 'unknown' }
        }
      };
    } catch (error) {
      const errorInfo = errorHandler.handleException(
        mainWindow,
        error,
        'database',
        'importing database'
      );
      throw new Error(errorInfo.message || 'Failed to import database');
    }
  });
}

module.exports = {
  registerDatabaseHandlers
};