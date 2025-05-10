import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { DatabaseService } from '../services/DatabaseService';
import { setupDatabase } from './setupDatabase';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let databaseService: DatabaseService | null = null;

/**
 * Create the main application window
 */
const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // Set app icon
    icon: path.join(__dirname, '../../public/icon.png')
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  }

  // Initialize database and add sample data if needed
  setupDatabase();

  // Initialize database service
  databaseService = new DatabaseService();

  // Set up IPC event handlers
  setupIpcHandlers();
};

/**
 * Setup IPC handlers for communication with renderer
 */
const setupIpcHandlers = () => {
  if (!databaseService) return;

  // Flash card operations
  ipcMain.handle('getAllFlashCards', () => databaseService.getAllFlashCards());
  ipcMain.handle('getFlashCardsByLanguage', (_, language) => databaseService.getFlashCardsByLanguage(language));
  ipcMain.handle('getFlashCardsByTag', (_, tag) => databaseService.getFlashCardsByTag(tag));
  ipcMain.handle('createFlashCard', (_, card) => databaseService.createFlashCard(card));
  ipcMain.handle('updateFlashCard', (_, card) => databaseService.updateFlashCard(card));
  ipcMain.handle('deleteFlashCard', (_, id) => databaseService.deleteFlashCard(id));

  // Database import/export
  ipcMain.handle('exportDatabase', async () => {
    if (!mainWindow) return false;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Database',
      defaultPath: 'flashcards-backup.db',
      filters: [{ name: 'Database Files', extensions: ['db'] }]
    });

    if (filePath) {
      return databaseService.exportDatabase(filePath);
    }
    return false;
  });

  ipcMain.handle('importDatabase', async () => {
    if (!mainWindow) return false;

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Database',
      filters: [{ name: 'Database Files', extensions: ['db'] }],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      return databaseService.importDatabase(filePaths[0]);
    }
    return false;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // On macOS, recreate window when dock icon is clicked
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

app.on('before-quit', () => {
  // Close database connection before quitting
  if (databaseService) {
    databaseService.close();
  }
});