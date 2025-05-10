// Simple Electron development script that just loads the Vite dev server
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference to prevent garbage collection
let mainWindow = null;

const createWindow = () => {
  console.log('Creating window for development mode');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload/dev-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the Vite development server
  const url = 'http://localhost:5173';
  console.log(`Loading URL: ${url}`);
  mainWindow.loadURL(url);
  
  // Open DevTools in development mode
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});