/**
 * Tests for database import/export functionality
 */

const fs = require('fs');
const path = require('path');
const DatabaseService = require('../src/services/DatabaseService');
const FlashCard = require('../src/models/FlashCard');
const Session = require('../src/models/Session');
const Settings = require('../src/models/Settings');

// No need to mock sqlite3 for these tests - we'll use a real in-memory database
// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path')
  }
}));

// Mock fs for file operations
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      readFile: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(undefined)
    },
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
  };
});

describe('Database Import/Export', () => {
  let db;
  let testCard;
  let testSession;
  let testSettings;

  // Set up test database and data before each test
  beforeEach(() => {
    console.log('Setting up test environment');
    // Create a new in-memory database
    db = new DatabaseService({ inMemory: true });

    // Initialize the database and set up test data
    return db.initialize()
      .then(() => {
        console.log('Database initialized, creating test data');
        // Create test data
        testCard = new FlashCard({
          content: 'Hello',
          sourceLanguage: 'en',
          comment: 'Test comment',
          tags: ['test', 'greeting']
        });

        testSession = new Session({
          sourceLanguage: 'en',
          targetLanguage: 'fr',
          cardIds: [testCard.id],
          currentCardIndex: 0
        });

        testSettings = new Settings({
          darkMode: true,
          translationApiProvider: 'gemini',
          translationApiKey: 'test-key',
          maxCardsPerSession: 10
        });

        // Save test data to database sequentially
        console.log('Saving test flashcard');
        return db.saveFlashCard(testCard);
      })
      .then(() => {
        console.log('Saving test session');
        return db.saveSession(testSession);
      })
      .then(() => {
        console.log('Saving test settings');
        return db.saveSettings(testSettings);
      })
      .then(() => {
        console.log('Test setup complete');
        // Reset fs mock calls
        fs.promises.readFile.mockReset();
        fs.promises.writeFile.mockReset();
      });
  });

  afterEach(() => {
    // Close the database connection after each test
    if (db) {
      db.close();
    }
  });

  describe('Export functionality', () => {
    it('exports all database content correctly', (done) => {
      // Export the data
      db.exportData().then(exportedData => {
        // Verify the structure
        expect(exportedData).toHaveProperty('flashcards');
        expect(exportedData).toHaveProperty('sessions');
        expect(exportedData).toHaveProperty('settings');
        expect(exportedData).toHaveProperty('exportDate');

        // Verify the content
        expect(exportedData.flashcards.length).toBe(1);
        expect(exportedData.flashcards[0].id).toBe(testCard.id);
        expect(exportedData.flashcards[0].content).toBe('Hello');

        expect(exportedData.sessions.length).toBe(1);
        expect(exportedData.sessions[0].id).toBe(testSession.id);

        expect(exportedData.settings).toEqual(testSettings.toJSON());
        done();
      }).catch(err => done(err));
    });
  });

  describe('Import functionality', () => {
    it('imports data correctly', (done) => {
      // Create import data with additional card
      const importCard = new FlashCard({
        content: 'Goodbye',
        sourceLanguage: 'en',
        tags: ['test', 'farewell']
      });

      const importData = {
        flashcards: [importCard.toJSON()],
        sessions: [],
        settings: null
      };

      // Reset the database to ensure clean import
      // Create a new clean database
      db.close();
      db = new DatabaseService({ inMemory: true });
      db.initialize().then(() => {
        // Import the data
        return db.importData(importData);
      }).then((result) => {
        // Verify the result
        expect(result.success).toBe(true);
        expect(result.flashcardsImported).toBe(1);
        expect(result.sessionsImported).toBe(0);
        expect(result.settingsImported).toBe(false);

        // Verify the card was imported
        return db.getFlashCard(importCard.id);
      }).then((importedCard) => {
        expect(importedCard).not.toBeNull();
        expect(importedCard.content).toBe('Goodbye');
        done();
      }).catch(error => {
        done(error);
      });
    });
    
    it('merges imported data with existing data', (done) => {
      // Create import data with different card
      const importCard = new FlashCard({
        content: 'Goodbye',
        sourceLanguage: 'en',
        tags: ['test', 'farewell']
      });

      const importData = {
        flashcards: [importCard.toJSON()],
        sessions: [],
        settings: null
      };

      // Import the data (should merge with existing)
      db.importData(importData).then(result => {
        // Verify both cards exist
        return db.getAllFlashCards();
      }).then(cards => {
        expect(cards.length).toBe(2);
        expect(cards.some(c => c.content === 'Hello')).toBe(true);
        expect(cards.some(c => c.content === 'Goodbye')).toBe(true);
        done();
      }).catch(err => done(err));
    });
    
    it('handles settings import correctly', (done) => {
      // Create import data with different settings
      const importSettings = new Settings({
        darkMode: false,
        translationApiProvider: 'openai',
        translationApiKey: 'new-key',
        maxCardsPerSession: 20
      });

      const importData = {
        flashcards: [],
        sessions: [],
        settings: importSettings.toJSON()
      };

      // Import the data
      db.importData(importData).then(result => {
        // Verify settings were imported
        expect(result.settingsImported).toBe(true);

        // Verify settings were updated
        return db.getSettings();
      }).then(settings => {
        expect(settings.darkMode).toBe(false);
        expect(settings.translationApiProvider).toBe('openai');
        expect(settings.translationApiKey).toBe('new-key');
        expect(settings.maxCardsPerSession).toBe(20);
        done();
      }).catch(err => done(err));
    });
    
    it('handles sessions import correctly', (done) => {
      // Create a new session to import
      const importSession = new Session({
        sourceLanguage: 'fr',
        targetLanguage: 'es',
        cardIds: ['card1', 'card2'],
        completedAt: new Date().toISOString() // Completed session
      });

      const importData = {
        flashcards: [],
        sessions: [importSession.toJSON()],
        settings: null
      };

      // Import the data
      db.importData(importData).then(result => {
        // Verify session was imported
        expect(result.sessionsImported).toBe(1);

        // Verify both sessions exist
        return db.getAllSessions();
      }).then(sessions => {
        expect(sessions.length).toBe(2);

        // Find the imported session
        const foundSession = sessions.find(s => s.id === importSession.id);
        expect(foundSession).toBeDefined();
        expect(foundSession.sourceLanguage).toBe('fr');
        expect(foundSession.targetLanguage).toBe('es');
        expect(foundSession.completedAt).toBeTruthy();
        done();
      }).catch(err => done(err));
    });
    
    it('handles transaction errors properly', (done) => {
      // Create import data
      const importData = {
        flashcards: [new FlashCard({ content: 'Test' }).toJSON()],
        sessions: [],
        settings: null
      };

      // Update mock implementation for sqlite3 db.run to simulate an error
      const originalRun = db.db.run;

      // Mock to fail on the second call with proper callback handling
      let callCount = 0;
      db.db.run = function(query, ...args) {
        // Extract callback from args, which might be at different positions
        const lastArg = args[args.length - 1];
        const params = typeof lastArg === 'function' ? args.slice(0, -1) : args;
        const callback = typeof lastArg === 'function' ? lastArg : null;

        callCount++;
        if (callCount === 1 && query.includes('BEGIN TRANSACTION')) {
          // First call (BEGIN TRANSACTION) succeeds
          if (callback) callback(null);
        } else {
          // Second call fails with error
          if (callback) {
            setTimeout(() => callback(new Error('Database error')), 0);
          }
          return { lastID: 0, changes: 0 };
        }
      };

      // Attempt to import, should fail
      db.importData(importData).then(() => {
        // Should not reach here
        db.db.run = originalRun; // Restore original
        done(new Error('Expected importData to fail'));
      }).catch(error => {
        // Verify error was thrown
        db.db.run = originalRun; // Restore original
        expect(error.message).toMatch(/Database error/);
        done();
      });
    });
  });
});