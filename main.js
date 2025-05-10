// Basic Electron main process file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseService = require('./src/services/DatabaseService');

// Keep a reference to the main window to prevent it from being garbage collected
let mainWindow;

// Database service
let db;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  db = new DatabaseService();
  try {
    await db.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
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
    await initializeDatabase();
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

// Export components for testing
module.exports = {
  app,
  BrowserWindow,
  createWindow,
  initializeDatabase
};