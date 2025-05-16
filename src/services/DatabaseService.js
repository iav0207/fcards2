const sqlite3 = require('sqlite3').verbose();
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
  initialize() {
    console.log('Starting database initialization');
    // Return early if already initialized
    if (this.initialized) {
      console.log('Database already initialized');
      return Promise.resolve(true);
    }

    // Determine database path if not provided
    if (!this.dbPath && !this.inMemory) {
      console.log('Setting up database path');
      const userDataPath = app ?
        app.getPath('userData') :
        path.join(process.cwd(), 'data');

      // Ensure the directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      this.dbPath = path.join(userDataPath, 'flashcards.db');
    }

    console.log('Creating database connection, in-memory:', this.inMemory);

      // Create or connect to the database with a promise
      return new Promise((resolve, reject) => {
        console.log('Setting up database mode');
        // sqlite3 doesn't have a MEMORY constant, need to use the path
        const dbMode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
        const dbPath = this.inMemory ? ':memory:' : this.dbPath;
        console.log('Database path/mode:', dbPath, dbMode);

        console.log('Creating database instance');
        this.db = new sqlite3.Database(dbPath, dbMode, (err) => {
          if (err) {
            console.error('Error opening database:', err);
            reject(err);
            return;
          }
          console.log('Database instance created successfully');

          // Enable foreign keys
          console.log('Enabling foreign keys');
          this.db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
              console.error('Error enabling foreign keys:', err);
              reject(err);
              return;
            }
            console.log('Foreign keys enabled');
            resolve();
          });
        });
      }).then(() => {
        console.log('Starting to create tables');
        // Create tables if they don't exist
        return this._createTables();
      }).then(() => {
        console.log('Tables created successfully');
        // Initialize repositories
        console.log('Initializing repositories');
        this._initializeRepositories();
        console.log('Repositories initialized');

        // Mark service as initialized
        this.initialized = true;
        console.log('Database service marked as initialized');

        // Update initialized state in repositories
        this._setRepositoriesInitialized(true);
        console.log('Repositories marked as initialized');

        return true;
      }).catch((error) => {
        console.error('Failed to initialize database:', error);
        console.error('Stack trace:', error.stack);

        // Clean up on error
        console.log('Cleaning up database resources');
        if (this.db) {
          console.log('Closing database connection');
          this.db.close();
          this.db = null;
        }

        console.log('Resetting initialization state');
        this.initialized = false;
        this._setRepositoriesInitialized(false);

        console.log('Re-throwing error');
        throw error;
      });
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
   * @returns {Promise} - Promise that resolves when tables are created
   */
  _createTables() {
    console.log('Starting _createTables method');
    return new Promise((resolve, reject) => {
      console.log('Creating flashcards table');
      // Create flashcards table
      this.db.run(`
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
      `, (err) => {
        if (err) {
          console.error('Error creating flashcards table:', err);
          reject(err);
          return;
        }
        console.log('Flashcards table created successfully');

        console.log('Creating sessions table');
        // Create sessions table
        this.db.run(`
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
        `, (err) => {
          if (err) {
            console.error('Error creating sessions table:', err);
            reject(err);
            return;
          }
          console.log('Sessions table created successfully');

          console.log('Creating settings table');
          // Create settings table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS settings (
              id TEXT PRIMARY KEY,
              settings TEXT NOT NULL
            )
          `, (err) => {
            if (err) {
              console.error('Error creating settings table:', err);
              reject(err);
              return;
            }
            console.log('Settings table created successfully');
            console.log('All tables created, resolving promise');
            resolve();
          });
        });
      });
    });
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
   * @returns {Promise<FlashCard>} - Promise that resolves to the saved flashcard
   */
  saveFlashCard(flashcard) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to FlashCardRepository
    return Promise.resolve(this.repositories.flashCard.saveFlashCard(flashcard));
  }

  /**
   * Get a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {Promise<FlashCard|null>} - Promise that resolves to the flashcard or null if not found
   */
  getFlashCard(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to FlashCardRepository
    return Promise.resolve(this.repositories.flashCard.getFlashCard(id));
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
   * @returns {Promise<FlashCard[]>} - Promise that resolves to an array of flashcards
   */
  getAllFlashCards(options = {}) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to FlashCardRepository
    return Promise.resolve(this.repositories.flashCard.getAllFlashCards(options));
  }

  /**
   * Delete a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {Promise<boolean>} - Promise that resolves to true if successful
   */
  deleteFlashCard(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to FlashCardRepository
    return Promise.resolve(this.repositories.flashCard.deleteFlashCard(id));
  }

  /**
   * Save a session to the database
   * @param {Session} session - The session to save
   * @returns {Promise<Session>} - Promise that resolves to the saved session
   */
  saveSession(session) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SessionRepository
    return Promise.resolve(this.repositories.session.saveSession(session));
  }

  /**
   * Get a session by its ID
   * @param {string} id - The session ID
   * @returns {Promise<Session|null>} - Promise that resolves to the session or null if not found
   */
  getSession(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SessionRepository
    return Promise.resolve(this.repositories.session.getSession(id));
  }

  /**
   * Get all sessions
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only active (not completed) sessions
   * @param {boolean} [options.completedOnly] - Only completed sessions
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {Promise<Session[]>} - Promise that resolves to an array of sessions
   */
  getAllSessions(options = {}) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SessionRepository
    return Promise.resolve(this.repositories.session.getAllSessions(options));
  }

  /**
   * Delete a session by its ID
   * @param {string} id - The session ID
   * @returns {Promise<boolean>} - Promise that resolves to true if successful
   */
  deleteSession(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SessionRepository
    return Promise.resolve(this.repositories.session.deleteSession(id));
  }

  /**
   * Save application settings
   * @param {Settings} settings - The settings to save
   * @returns {Promise<Settings>} - Promise that resolves to the saved settings
   */
  saveSettings(settings) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SettingsRepository
    return Promise.resolve(this.repositories.settings.saveSettings(settings));
  }

  /**
   * Get application settings
   * @returns {Promise<Settings>} - Promise that resolves to application settings
   */
  getSettings() {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to SettingsRepository
    return Promise.resolve(this.repositories.settings.getSettings());
  }

  /**
   * Get available tags for a given source language
   * @param {string} sourceLanguage - Source language to filter tags by
   * @returns {Promise<Object>} - Promise that resolves to available tags and counts
   */
  getAvailableTags(sourceLanguage) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    // Delegate to TagRepository
    return Promise.resolve(this.repositories.tag.getAvailableTags(sourceLanguage));
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics promise
   */
  getStats() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      let stats = {
        flashcardsCount: 0,
        sessionsCount: 0,
        activeSessionsCount: 0,
        completedSessionsCount: 0
      };

      this.db.get('SELECT COUNT(*) as count FROM flashcards', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.flashcardsCount = row.count;

        this.db.get('SELECT COUNT(*) as count FROM sessions', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          stats.sessionsCount = row.count;

          this.db.get('SELECT COUNT(*) as count FROM sessions WHERE completedAt IS NULL', (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            stats.activeSessionsCount = row.count;

            this.db.get('SELECT COUNT(*) as count FROM sessions WHERE completedAt IS NOT NULL', (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              stats.completedSessionsCount = row.count;
              resolve(stats);
            });
          });
        });
      });
    });
  }

  /**
   * Import data from a JSON file
   * @param {Object} data - The data to import
   * @param {FlashCard[]} [data.flashcards] - Flashcards to import
   * @param {Session[]} [data.sessions] - Sessions to import
   * @param {Settings} [data.settings] - Settings to import
   * @returns {Promise<Object>} - Import statistics promise
   */
  importData(data) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
      let flashcardsImported = 0;
      let sessionsImported = 0;
      let settingsImported = false;

      // Start a transaction
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }

        const processFlashcards = () => {
          return new Promise((resolve, reject) => {
            if (Array.isArray(data.flashcards)) {
              // Use recursive function to handle async operations sequentially
              const importNextCard = (index) => {
                if (index >= data.flashcards.length) {
                  resolve();
                  return;
                }

                const cardData = data.flashcards[index];
                const card = FlashCard.fromJSON(cardData);

                this.saveFlashCard(card)
                  .then(() => {
                    flashcardsImported++;
                    importNextCard(index + 1);
                  })
                  .catch(reject);
              };

              importNextCard(0);
            } else {
              resolve();
            }
          });
        };

        const processSessions = () => {
          return new Promise((resolve, reject) => {
            if (Array.isArray(data.sessions)) {
              // Use recursive function to handle async operations sequentially
              const importNextSession = (index) => {
                if (index >= data.sessions.length) {
                  resolve();
                  return;
                }

                const sessionData = data.sessions[index];
                const session = Session.fromJSON(sessionData);

                this.saveSession(session)
                  .then(() => {
                    sessionsImported++;
                    importNextSession(index + 1);
                  })
                  .catch(reject);
              };

              importNextSession(0);
            } else {
              resolve();
            }
          });
        };

        const processSettings = () => {
          return new Promise((resolve, reject) => {
            if (data.settings) {
              const settings = Settings.fromJSON(data.settings);
              this.saveSettings(settings)
                .then(() => {
                  settingsImported = true;
                  resolve();
                })
                .catch(reject);
            } else {
              resolve();
            }
          });
        };

        // Process all data sequentially
        processFlashcards()
          .then(() => processSessions())
          .then(() => processSettings())
          .then(() => {
            // Commit the transaction
            this.db.run('COMMIT', (err) => {
              if (err) {
                // Try to rollback on error
                this.db.run('ROLLBACK', () => {
                  reject(err);
                });
                return;
              }

              resolve({
                success: true,
                flashcardsImported,
                sessionsImported,
                settingsImported
              });
            });
          })
          .catch((error) => {
            // Rollback on error
            this.db.run('ROLLBACK', () => {
              console.error('Import failed:', error);
              reject(error);
            });
          });
      });
    });
  }

  /**
   * Export all data to a JSON object
   * @returns {Promise<Object>} - Exported data promise
   */
  exportData() {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return Promise.all([
      this.getAllFlashCards(),
      this.getAllSessions(),
      this.getSettings()
    ]).then(([flashcards, sessions, settings]) => {
      return {
        flashcards: flashcards.map(card => card.toJSON()),
        sessions: sessions.map(session => session.toJSON()),
        settings: settings.toJSON(),
        exportDate: new Date().toISOString()
      };
    });
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