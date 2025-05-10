// Simple electron starter - this is a workaround for development mode
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

// Keep a global reference to prevent garbage collection
let mainWindow = null;
let dbPath = null;
let db = null;

// Ensure user data directory exists
const ensureUserDataDir = () => {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'flashcards.db');

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  return userDataPath;
};

// Setup database with initial data if needed
const setupDatabase = () => {
  console.log('Setting up database...');

  try {
    // Create database connection
    db = new Database(dbPath);

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        sourceLanguage TEXT NOT NULL,
        comment TEXT,
        userTranslation TEXT,
        tags TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        sourceLanguage TEXT NOT NULL,
        targetLanguage TEXT NOT NULL,
        cardIds TEXT NOT NULL,
        currentCardIndex INTEGER NOT NULL,
        responses TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      );
    `);

    // Check if we need to add sample data
    const count = db.prepare('SELECT COUNT(*) as count FROM flashcards').get();

    if (count.count === 0) {
      console.log('Adding sample flashcards...');

      const createCard = db.prepare(`
        INSERT INTO flashcards (id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();

      // Spanish cards
      createCard.run(
        uuidv4(), 'Hola', 'es', 'Common greeting', 'Hello',
        JSON.stringify(['greeting', 'basic']), now, now
      );

      createCard.run(
        uuidv4(), 'Buenos días', 'es', 'Formal morning greeting', 'Good morning',
        JSON.stringify(['greeting', 'basic']), now, now
      );

      createCard.run(
        uuidv4(), 'Me llamo', 'es', 'Used for introducing yourself', 'My name is',
        JSON.stringify(['introduction', 'basic']), now, now
      );

      // French cards
      createCard.run(
        uuidv4(), 'Bonjour', 'fr', 'Common greeting', 'Hello',
        JSON.stringify(['greeting', 'basic']), now, now
      );

      createCard.run(
        uuidv4(), 'Je m\'appelle', 'fr', 'Used for introducing yourself', 'My name is',
        JSON.stringify(['introduction', 'basic']), now, now
      );

      // German cards
      createCard.run(
        uuidv4(), 'Guten Tag', 'de', 'Formal greeting', 'Good day',
        JSON.stringify(['greeting', 'formal']), now, now
      );

      createCard.run(
        uuidv4(), 'Ich heiße', 'de', 'Used for introducing yourself', 'My name is',
        JSON.stringify(['introduction', 'basic']), now, now
      );

      console.log('Sample flashcards added successfully!');
    } else {
      console.log(`Database already contains ${count.count} flashcards.`);
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
};

const createWindow = () => {
  // Ensure user data directory exists and setup database
  ensureUserDataDir();
  setupDatabase();

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

  // Load the app
  const url = 'http://localhost:5173';
  mainWindow.loadURL(url);

  // Open DevTools in development mode
  mainWindow.webContents.openDevTools();

  // Set up IPC handlers
  setupIpcHandlers();
};

// Set up IPC handlers for communication with renderer
const setupIpcHandlers = () => {
  if (!db) return;

  // Flash card operations
  ipcMain.handle('getAllFlashCards', () => {
    const rows = db.prepare('SELECT * FROM flashcards ORDER BY updatedAt DESC').all();
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  });

  ipcMain.handle('getFlashCardsByLanguage', (_, language) => {
    const rows = db.prepare('SELECT * FROM flashcards WHERE sourceLanguage = ? ORDER BY updatedAt DESC')
      .all(language);
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  });

  ipcMain.handle('getFlashCardsByTag', (_, tag) => {
    const rows = db.prepare("SELECT * FROM flashcards WHERE tags LIKE ? ORDER BY updatedAt DESC")
      .all(`%"${tag}"%`);
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  });

  ipcMain.handle('createFlashCard', (_, card) => {
    const now = new Date().toISOString();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO flashcards (id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      card.content,
      card.sourceLanguage,
      card.comment || null,
      card.userTranslation || null,
      JSON.stringify(card.tags),
      now,
      now
    );

    return {
      ...card,
      id,
      createdAt: now,
      updatedAt: now
    };
  });

  ipcMain.handle('updateFlashCard', (_, card) => {
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE flashcards
      SET content = ?, sourceLanguage = ?, comment = ?, userTranslation = ?,
          tags = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      card.content,
      card.sourceLanguage,
      card.comment || null,
      card.userTranslation || null,
      JSON.stringify(card.tags),
      now,
      card.id
    );

    return {
      ...card,
      updatedAt: now
    };
  });

  ipcMain.handle('deleteFlashCard', (_, id) => {
    const result = db.prepare('DELETE FROM flashcards WHERE id = ?').run(id);
    return result.changes > 0;
  });

  // Database import/export
  ipcMain.handle('exportDatabase', async () => {
    if (!mainWindow) return false;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Database',
      defaultPath: 'flashcards-backup.db',
      filters: [{ name: 'Database Files', extensions: ['db'] }]
    });

    if (filePath) {
      try {
        // Close database connection before copying
        db.close();
        fs.copyFileSync(dbPath, filePath);
        // Reopen database
        db = new Database(dbPath);
        return true;
      } catch (error) {
        console.error('Error exporting database:', error);
        // Ensure database is reopened
        if (!db) db = new Database(dbPath);
        return false;
      }
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
      try {
        // Close current DB connection
        db.close();
        // Copy the imported file to the app's data directory
        fs.copyFileSync(filePaths[0], dbPath);
        // Reopen the database
        db = new Database(dbPath);
        return true;
      } catch (error) {
        console.error('Error importing database:', error);
        // Ensure database is reopened
        if (!db) db = new Database(dbPath);
        return false;
      }
    }
    return false;
  });
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

app.on('before-quit', () => {
  // Close database connection before quitting
  if (db) {
    db.close();
  }
});