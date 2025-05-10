// Basic Electron main process file
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a reference to the main window to prevent it from being garbage collected
let mainWindow;

// Create the application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the HTML file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  // mainWindow.webContents.openDevTools();

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Don't initialize the app when running tests
if (!process.env.JEST_WORKER_ID) {
  // Create window when Electron has finished initialization
  app.whenReady().then(createWindow);

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
}

// Export components for testing
module.exports = {
  app,
  BrowserWindow,
  createWindow
};