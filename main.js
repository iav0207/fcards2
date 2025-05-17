// Basic Electron main process file
const { app, BrowserWindow } = require('electron');
const path = require('path');
const DatabaseService = require('./src/services/DatabaseService');
const TranslationService = require('./src/services/TranslationService');
const SessionService = require('./src/services/SessionService');
const errorHandler = require('./src/utils/errorHandler');

// Import IPC handlers
const { registerDatabaseHandlers } = require('./src/ipc/database-handlers');
const { registerSessionHandlers } = require('./src/ipc/session-handlers');
const { registerTranslationHandlers } = require('./src/ipc/translation-handlers');
const { registerSettingsHandlers } = require('./src/ipc/settings-handlers');

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

    return { db, translationService, sessionService };
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error; // Re-throw to allow handling in the caller
  }
}

/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {
  try {
    // Register database handlers
    registerDatabaseHandlers(db, errorHandler, mainWindow, app);
    console.log('Database IPC handlers registered');

    // Register session handlers
    registerSessionHandlers(sessionService, errorHandler, mainWindow);
    console.log('Session IPC handlers registered');

    // Register translation handlers
    registerTranslationHandlers(translationService, errorHandler, mainWindow);
    console.log('Translation IPC handlers registered');

    // Register settings handlers
    registerSettingsHandlers(db, errorHandler, mainWindow);
    console.log('Settings IPC handlers registered');
  } catch (error) {
    console.error('Failed to register IPC handlers:', error);
    throw error;
  }
}

/**
 * Create the application window
 */
function createWindow() {
  // Check if headless mode is enabled for testing
  const isHeadless = process.env.ELECTRON_HEADLESS === '1';

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload', 'preload.js')
    },
    // For headless testing, hide the window
    show: !isHeadless
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

/**
 * Initialize the application
 */
async function initialize() {
  try {
    // Initialize services first
    await initializeServices();
    
    // Create the main window
    createWindow();
    
    // Register IPC handlers after window creation
    registerIpcHandlers();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Application initialization error:', error);
    
    // Create an error window or show an error message
    if (mainWindow) {
      errorHandler.handleFatalError(
        mainWindow,
        'Initialization Error',
        'Failed to initialize the application. Please restart.',
        error.message
      );
    } else {
      // If window creation failed, create a minimal error window
      const errorWindow = new BrowserWindow({
        width: 600,
        height: 300,
        webPreferences: { nodeIntegration: true }
      });
      
      errorWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><title>Error</title></head>
          <body>
            <h2>Application Initialization Error</h2>
            <p>Failed to initialize the application. Please restart.</p>
            <pre>${error.message}</pre>
          </body>
        </html>
      `);
    }
  }
}

// Don't initialize the app when running tests
if (!process.env.JEST_WORKER_ID) {
  // Create window when Electron has finished initialization
  app.whenReady().then(initialize);

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // On macOS, recreate the window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (mainWindow === null) {
      initialize();
    }
  });

  // Close database connection when app is quitting
  app.on('quit', () => {
    if (db) {
      db.close();
    }
  });
}

// Export components for testing
module.exports = {
  app,
  BrowserWindow,
  createWindow,
  initializeServices,
  registerIpcHandlers,
  initialize
};