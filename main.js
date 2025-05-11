// Basic Electron main process file
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const DatabaseService = require('./src/services/DatabaseService');
const TranslationService = require('./src/services/TranslationService');
const SessionService = require('./src/services/SessionService');
const errorHandler = require('./src/utils/errorHandler');

// Keep a reference to the main window to prevent it from being garbage collected
let mainWindow;

// Services
let db;
let translationService;
let sessionService;

/**
 * Initialize the services
 * @returns {Promise<void>}
 */
async function initializeServices() {
  try {
    // Initialize database
    db = new DatabaseService();
    await db.initialize();
    console.log('Database initialized successfully');

    // Initialize translation service with API keys from environment
    const { getEnvironmentConfig, checkApiKeysAvailability } = require('./src/utils/environment');
    const apiKeys = getEnvironmentConfig();
    const apiAvailability = checkApiKeysAvailability();

    console.log('API keys availability:', {
      gemini: apiAvailability.gemini ? 'Available' : 'Not available',
      openai: apiAvailability.openai ? 'Available' : 'Not available'
    });

    if (apiAvailability.gemini) {
      translationService = new TranslationService({
        apiProvider: 'gemini',
        apiKey: apiKeys.GEMINI_API_KEY
      });
      console.log('Translation service initialized with Gemini API');
    } else if (apiAvailability.openai) {
      translationService = new TranslationService({
        apiProvider: 'openai',
        apiKey: apiKeys.OPENAI_API_KEY
      });
      console.log('Translation service initialized with OpenAI API');
    } else {
      translationService = new TranslationService();
      console.log('Translation service initialized with STUB implementation (no API keys available)');
    }

    // Initialize session service
    sessionService = new SessionService({ db });
    console.log('Session service initialized');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

// Create the application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload', 'preload.js')
    }
  });

  // Load the HTML file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Don't initialize the app when running tests
if (!process.env.JEST_WORKER_ID) {
  // Create window when Electron has finished initialization
  app.whenReady().then(async () => {
    await initializeServices();
    createWindow();
  });

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // On macOS, recreate the window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });

  // Close database connection when app is quitting
  app.on('quit', () => {
    if (db) {
      db.close();
    }
  });
}

// IPC Handlers for database operations
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
    const FlashCard = require('./src/models/FlashCard');
    const card = new FlashCard(cardData);
    return db.saveFlashCard(card).toJSON();
  } catch (error) {
    console.error('Error saving flashcard:', error);
    throw error;
  }
});

ipcMain.handle('flashcard:get', async (event, id) => {
  try {
    const card = db.getFlashCard(id);
    return card ? card.toJSON() : null;
  } catch (error) {
    console.error('Error getting flashcard:', error);
    throw error;
  }
});

ipcMain.handle('flashcard:getAll', async (event, options) => {
  try {
    const cards = db.getAllFlashCards(options);
    return cards.map(card => card.toJSON());
  } catch (error) {
    console.error('Error getting all flashcards:', error);
    throw error;
  }
});

ipcMain.handle('flashcard:delete', async (event, id) => {
  try {
    return db.deleteFlashCard(id);
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
});

// Session operations
ipcMain.handle('session:save', async (event, sessionData) => {
  try {
    const Session = require('./src/models/Session');
    const session = new Session(sessionData);
    return db.saveSession(session).toJSON();
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
});

ipcMain.handle('session:get', async (event, id) => {
  try {
    const session = db.getSession(id);
    return session ? session.toJSON() : null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
});

ipcMain.handle('session:getAll', async (event, options) => {
  try {
    const sessions = db.getAllSessions(options);
    return sessions.map(session => session.toJSON());
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw error;
  }
});

ipcMain.handle('session:delete', async (event, id) => {
  try {
    return db.deleteSession(id);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
});

// Settings operations
ipcMain.handle('settings:save', async (event, settingsData) => {
  try {
    const Settings = require('./src/models/Settings');
    const settings = new Settings(settingsData);
    return db.saveSettings(settings).toJSON();
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:get', async (event) => {
  try {
    const settings = db.getSettings();
    return settings.toJSON();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

// Database operations
ipcMain.handle('database:stats', async (event) => {
  try {
    return db.getStats();
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
});

ipcMain.handle('database:export', async (event, options = {}) => {
  try {
    // Get the data to export
    const data = db.exportData();

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
    const fs = require('fs');
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
    console.error('Error exporting database:', error);
    throw error;
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
    const fs = require('fs');
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
    const result = db.importData(importData.data);

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
    console.error('Error importing database:', error);
    throw error;
  }
});

// Session operations
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

ipcMain.handle('session:getCurrentCard', async (event, sessionId) => {
  try {
    return await sessionService.getCurrentCard(sessionId);
  } catch (error) {
    console.error('Error getting current card:', error);
    throw error;
  }
});

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

ipcMain.handle('session:advance', async (event, sessionId) => {
  try {
    return await sessionService.advanceSession(sessionId);
  } catch (error) {
    console.error('Error advancing session:', error);
    throw error;
  }
});

ipcMain.handle('session:getStats', async (event, sessionId) => {
  try {
    return await sessionService.getSessionStats(sessionId);
  } catch (error) {
    console.error('Error getting session stats:', error);
    throw error;
  }
});

// Translation operations
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

// Export components for testing
module.exports = {
  app,
  BrowserWindow,
  createWindow,
  initializeServices
};