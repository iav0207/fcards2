const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const FlashCardRepository = require('../repositories/FlashCardRepository');
const SessionRepository = require('../repositories/SessionRepository');
const SettingsRepository = require('../repositories/SettingsRepository');
const TagRepository = require('../repositories/TagRepository');
const FlashCard = require('../models/FlashCard');
const Session = require('../models/Session');
const Settings = require('../models/Settings');

/**
 * Service for managing database operations
 * Now uses the repository pattern to delegate entity operations
 */
class DatabaseService {
  /**
   * Creates a new DatabaseService instance
   * @param {Object} options - Configuration options
   * @param {string} [options.dbPath] - Path to the database file (default: user data directory)
   * @param {boolean} [options.inMemory] - Whether to use an in-memory database (for testing)
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath;
    this.inMemory = options.inMemory || false;
    this.db = null;
    this.initialized = false;

    // Repositories will be initialized after database connection
    this.repositories = {
      flashCard: null,
      session: null,
      settings: null,
      tag: null
    };
  }

  /**
   * Initialize the database
   * @returns {Promise<boolean>} - True if successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      // Determine database path if not provided
      if (!this.dbPath && !this.inMemory) {
        const userDataPath = app ?
          app.getPath('userData') :
          path.join(process.cwd(), 'data');

        // Ensure the directory exists
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }

        this.dbPath = path.join(userDataPath, 'flashcards.db');
      }

      // Create or connect to the database
      this.db = this.inMemory ?
        new Database(':memory:') :
        new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Create tables if they don't exist
      this._createTables();

      // Initialize repositories
      this._initializeRepositories();

      // Mark service as initialized
      this.initialized = true;

      // Update initialized state in repositories
      this._setRepositoriesInitialized(true);

      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);

      // Clean up on error
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      this.initialized = false;
      this._setRepositoriesInitialized(false);

      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      // Update repositories state first
      this._setRepositoriesInitialized(false);

      // Close the database connection
      this.db.close();
      this.db = null;
      this.initialized = false;

      // Reset repositories
      this.repositories = {
        flashCard: null,
        session: null,
        settings: null,
        tag: null
      };
    }
  }

  /**
   * Create database tables
   * @private
   */
  _createTables() {
    // Create flashcards table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        sourceLanguage TEXT NOT NULL,
        comment TEXT,
        userTranslation TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        sourceLanguage TEXT NOT NULL,
        targetLanguage TEXT NOT NULL,
        cardIds TEXT NOT NULL,
        currentCardIndex INTEGER NOT NULL,
        responses TEXT,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      )
    `);

    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        settings TEXT NOT NULL
      )
    `);
  }

  /**
   * Initialize repositories
   * @private
   */
  _initializeRepositories() {
    // Initialize repositories with the database connection
    this.repositories.flashCard = new FlashCardRepository(this.db, this.initialized);
    this.repositories.session = new SessionRepository(this.db, this.initialized);
    this.repositories.settings = new SettingsRepository(this.db, this.initialized);

    // TagRepository depends on FlashCardRepository
    this.repositories.tag = new TagRepository(this.db, this.repositories.flashCard, this.initialized);
  }

  /**
   * Save a flashcard to the database
   * @param {FlashCard} flashcard - The flashcard to save
   * @returns {FlashCard} - The saved flashcard
   */
  saveFlashCard(flashcard) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to FlashCardRepository
    return this.repositories.flashCard.saveFlashCard(flashcard);
  }

  /**
   * Get a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {FlashCard|null} - The flashcard or null if not found
   */
  getFlashCard(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to FlashCardRepository
    return this.repositories.flashCard.getFlashCard(id);
  }

  /**
   * Get all flashcards
   * @param {Object} options - Query options
   * @param {string} [options.sourceLanguage] - Filter by source language
   * @param {string|string[]} [options.tags] - Filter by one or more tags
   * @param {boolean} [options.includeUntagged] - Whether to include cards with no tags
   * @param {string} [options.tag] - Filter by a single tag (legacy, use tags instead)
   * @param {string} [options.searchTerm] - Search in content or comments
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {FlashCard[]} - Array of flashcards
   */
  getAllFlashCards(options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to FlashCardRepository
    return this.repositories.flashCard.getAllFlashCards(options);
  }

  /**
   * Delete a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {boolean} - True if successful
   */
  deleteFlashCard(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to FlashCardRepository
    return this.repositories.flashCard.deleteFlashCard(id);
  }

  /**
   * Save a session to the database
   * @param {Session} session - The session to save
   * @returns {Session} - The saved session
   */
  saveSession(session) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SessionRepository
    return this.repositories.session.saveSession(session);
  }

  /**
   * Get a session by its ID
   * @param {string} id - The session ID
   * @returns {Session|null} - The session or null if not found
   */
  getSession(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SessionRepository
    return this.repositories.session.getSession(id);
  }

  /**
   * Get all sessions
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only active (not completed) sessions
   * @param {boolean} [options.completedOnly] - Only completed sessions
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {Session[]} - Array of sessions
   */
  getAllSessions(options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SessionRepository
    return this.repositories.session.getAllSessions(options);
  }

  /**
   * Delete a session by its ID
   * @param {string} id - The session ID
   * @returns {boolean} - True if successful
   */
  deleteSession(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SessionRepository
    return this.repositories.session.deleteSession(id);
  }

  /**
   * Save application settings
   * @param {Settings} settings - The settings to save
   * @returns {Settings} - The saved settings
   */
  saveSettings(settings) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SettingsRepository
    return this.repositories.settings.saveSettings(settings);
  }

  /**
   * Get application settings
   * @returns {Settings} - Application settings
   */
  getSettings() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to SettingsRepository
    return this.repositories.settings.getSettings();
  }

  /**
   * Get available tags for a given source language
   * @param {string} sourceLanguage - Source language to filter tags by
   * @returns {Object} - Available tags and counts
   */
  getAvailableTags(sourceLanguage) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Delegate to TagRepository
    return this.repositories.tag.getAvailableTags(sourceLanguage);
  }

  /**
   * Get database statistics
   * @returns {Object} - Database statistics
   */
  getStats() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const flashcardsCount = this.db.prepare('SELECT COUNT(*) as count FROM flashcards').get().count;
    const sessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
    const activeSessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE completedAt IS NULL').get().count;
    const completedSessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE completedAt IS NOT NULL').get().count;

    return {
      flashcardsCount,
      sessionsCount,
      activeSessionsCount,
      completedSessionsCount
    };
  }

  /**
   * Import data from a JSON file
   * @param {Object} data - The data to import
   * @param {FlashCard[]} [data.flashcards] - Flashcards to import
   * @param {Session[]} [data.sessions] - Sessions to import
   * @param {Settings} [data.settings] - Settings to import
   * @returns {Object} - Import statistics
   */
  importData(data) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    let flashcardsImported = 0;
    let sessionsImported = 0;
    let settingsImported = false;

    // Start a transaction
    this.db.exec('BEGIN TRANSACTION');

    try {
      // Import flashcards
      if (Array.isArray(data.flashcards)) {
        data.flashcards.forEach(cardData => {
          const card = FlashCard.fromJSON(cardData);
          this.saveFlashCard(card);
          flashcardsImported++;
        });
      }

      // Import sessions
      if (Array.isArray(data.sessions)) {
        data.sessions.forEach(sessionData => {
          const session = Session.fromJSON(sessionData);
          this.saveSession(session);
          sessionsImported++;
        });
      }

      // Import settings
      if (data.settings) {
        const settings = Settings.fromJSON(data.settings);
        this.saveSettings(settings);
        settingsImported = true;
      }

      // Commit the transaction
      this.db.exec('COMMIT');

      return {
        success: true,
        flashcardsImported,
        sessionsImported,
        settingsImported
      };
    } catch (error) {
      // Rollback on error
      this.db.exec('ROLLBACK');
      console.error('Import failed:', error);

      throw error;
    }
  }

  /**
   * Export all data to a JSON object
   * @returns {Object} - Exported data
   */
  exportData() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const flashcards = this.getAllFlashCards();
    const sessions = this.getAllSessions();
    const settings = this.getSettings();

    return {
      flashcards: flashcards.map(card => card.toJSON()),
      sessions: sessions.map(session => session.toJSON()),
      settings: settings.toJSON(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Update the initialized state for all repositories
   * Called internally when the database initialization state changes
   * @private
   */
  _setRepositoriesInitialized(initialized) {
    if (this.repositories.flashCard) {
      this.repositories.flashCard.setInitialized(initialized);
    }

    if (this.repositories.session) {
      this.repositories.session.setInitialized(initialized);
    }

    if (this.repositories.settings) {
      this.repositories.settings.setInitialized(initialized);
    }

    if (this.repositories.tag) {
      this.repositories.tag.setInitialized(initialized);
    }
  }
}

module.exports = DatabaseService;