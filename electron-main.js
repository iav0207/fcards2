// Simple electron starter - this is a workaround for development mode
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference to prevent garbage collection
let mainWindow = null;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'dist-electron/preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the app
  const url = 'http://localhost:5173';
  mainWindow.loadURL(url);
  
  // Open DevTools in development mode
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});