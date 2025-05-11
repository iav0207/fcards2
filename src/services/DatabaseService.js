const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { isEmpty } = require('../utils/helpers');
const FlashCard = require('../models/FlashCard');
const Session = require('../models/Session');
const Settings = require('../models/Settings');

/**
 * Service for managing database operations
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

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
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
   * Save a flashcard to the database
   * @param {FlashCard} flashcard - The flashcard to save
   * @returns {FlashCard} - The saved flashcard
   */
  saveFlashCard(flashcard) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO flashcards (
        id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const json = flashcard.toJSON();

    stmt.run(
      json.id,
      json.content,
      json.sourceLanguage,
      json.comment,
      json.userTranslation,
      JSON.stringify(json.tags),
      json.createdAt,
      json.updatedAt
    );

    return flashcard;
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

    if (isEmpty(id)) {
      return null;
    }

    const stmt = this.db.prepare('SELECT * FROM flashcards WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return null;
    }

    return FlashCard.fromJSON({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    });
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

    // Handle multiple filtering options for tags
    const useLegacyTagFilter = !!options.tag && !options.tags;
    const hasMultipleTags = options.tags && Array.isArray(options.tags) && options.tags.length > 0;
    const includeUntagged = !!options.includeUntagged;

    // Start building the query
    let query = 'SELECT * FROM flashcards';
    const params = [];
    const conditions = [];

    if (options.sourceLanguage) {
      conditions.push('sourceLanguage = ?');
      params.push(options.sourceLanguage);
    }

    // Legacy single tag filter
    if (useLegacyTagFilter) {
      conditions.push('tags LIKE ?');
      params.push(`%"${options.tag}"%`);
    }
    // Multi-tag filtering
    else if (hasMultipleTags || includeUntagged) {
      const tagConditions = [];

      // Add condition for each tag
      if (hasMultipleTags) {
        options.tags.forEach(tag => {
          tagConditions.push('tags LIKE ?');
          params.push(`%"${tag}"%`);
        });
      }

      // Add condition for untagged cards
      if (includeUntagged) {
        tagConditions.push('(tags IS NULL OR tags = ? OR tags = ?)');
        params.push('[]', '');
      }

      // Combine tag conditions with OR
      if (tagConditions.length > 0) {
        conditions.push(`(${tagConditions.join(' OR ')})`);
      }
    }

    if (options.searchTerm) {
      conditions.push('(content LIKE ? OR comment LIKE ?)');
      params.push(`%${options.searchTerm}%`, `%${options.searchTerm}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updatedAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => FlashCard.fromJSON({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
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

    if (isEmpty(id)) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM flashcards WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
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

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, sourceLanguage, targetLanguage, cardIds, currentCardIndex, 
        responses, createdAt, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const json = session.toJSON();

    stmt.run(
      json.id,
      json.sourceLanguage,
      json.targetLanguage,
      JSON.stringify(json.cardIds),
      json.currentCardIndex,
      JSON.stringify(json.responses),
      json.createdAt,
      json.completedAt
    );

    return session;
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

    if (isEmpty(id)) {
      return null;
    }

    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return null;
    }

    return Session.fromJSON({
      ...row,
      cardIds: JSON.parse(row.cardIds || '[]'),
      responses: JSON.parse(row.responses || '[]')
    });
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

    let query = 'SELECT * FROM sessions';
    const params = [];
    const conditions = [];

    if (options.activeOnly) {
      conditions.push('completedAt IS NULL');
    }

    if (options.completedOnly) {
      conditions.push('completedAt IS NOT NULL');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => Session.fromJSON({
      ...row,
      cardIds: JSON.parse(row.cardIds || '[]'),
      responses: JSON.parse(row.responses || '[]')
    }));
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

    if (isEmpty(id)) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
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

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, settings
      ) VALUES (?, ?)
    `);

    stmt.run(
      'app_settings',
      JSON.stringify(settings.toJSON())
    );

    return settings;
  }

  /**
   * Get application settings
   * @returns {Settings} - Application settings
   */
  getSettings() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT settings FROM settings WHERE id = ?');
    const row = stmt.get('app_settings');

    if (!row) {
      return Settings.getDefaults();
    }

    try {
      const settingsData = JSON.parse(row.settings);
      return Settings.fromJSON(settingsData);
    } catch (error) {
      console.error('Failed to parse settings:', error);
      return Settings.getDefaults();
    }
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

    // If no source language is provided, return empty result
    if (!sourceLanguage) {
      return {
        tags: [],
        untaggedCount: 0
      };
    }

    // First get all cards for this language
    const allCards = this.getAllFlashCards({ sourceLanguage });

    // Create a map to count occurrences of each tag
    const tagCounts = new Map();
    let untaggedCount = 0;

    // Count all tag occurrences
    allCards.forEach(card => {
      if (!card.tags || card.tags.length === 0) {
        untaggedCount++;
      } else {
        card.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0;
          tagCounts.set(tag, count + 1);
        });
      }
    });

    // Convert to the result format
    const tagsWithCounts = Array.from(tagCounts.entries()).map(([tag, count]) => ({
      tag,
      count
    }));

    // Sort by tag name
    tagsWithCounts.sort((a, b) => a.tag.localeCompare(b.tag));

    return {
      tags: tagsWithCounts,
      untaggedCount
    };
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
}

module.exports = DatabaseService;