// Basic Electron main process file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseService = require('./src/services/DatabaseService');
const TranslationService = require('./src/services/TranslationService');
const SessionService = require('./src/services/SessionService');

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

    // Initialize translation service
    translationService = new TranslationService();
    console.log('Translation service initialized');

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

ipcMain.handle('database:export', async (event) => {
  try {
    return db.exportData();
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
});

ipcMain.handle('database:import', async (event, data) => {
  try {
    return db.importData(data);
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
    console.error('Error creating session:', error);
    throw error;
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
    return await sessionService.submitAnswer(sessionId, answer);
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
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
    console.error('Error evaluating translation:', error);
    throw error;
  }
});

ipcMain.handle('translation:generate', async (event, data) => {
  try {
    return await translationService.generateTranslation(data);
  } catch (error) {
    console.error('Error generating translation:', error);
    throw error;
  }
});

// Export components for testing
module.exports = {
  app,
  BrowserWindow,
  createWindow,
  initializeServices
};