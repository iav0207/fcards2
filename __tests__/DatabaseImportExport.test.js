/**
 * Tests for database import/export functionality
 */

const fs = require('fs');
const path = require('path');
const DatabaseService = require('../src/services/DatabaseService');
const FlashCard = require('../src/models/FlashCard');
const Session = require('../src/models/Session');
const Settings = require('../src/models/Settings');

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  // Create mock data stores that will be reset for each test
  let mockFlashcards;
  let mockSessions;
  let mockSettings;
  
  // Reset function to clear all mock data
  const resetMockData = () => {
    mockFlashcards = new Map();
    mockSessions = new Map();
    mockSettings = null;
  };
  
  // Initialize mock data
  resetMockData();

  // Mock for prepare method with specific behaviors
  const mockPrepare = jest.fn().mockImplementation((query) => {
    // FlashCard operations
    if (query.includes('INSERT OR REPLACE INTO flashcards')) {
      return {
        run: jest.fn().mockImplementation((id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt) => {
          mockFlashcards.set(id, {
            id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt
          });
          return { changes: 1 };
        })
      };
    }
    if (query.includes('SELECT * FROM flashcards WHERE id = ?')) {
      return {
        get: jest.fn().mockImplementation((id) => mockFlashcards.get(id))
      };
    }
    if (query.includes('SELECT * FROM flashcards')) {
      return {
        all: jest.fn().mockImplementation((...params) => {
          let result = Array.from(mockFlashcards.values());
          return result;
        })
      };
    }

    // Session operations
    if (query.includes('INSERT OR REPLACE INTO sessions')) {
      return {
        run: jest.fn().mockImplementation((id, sourceLanguage, targetLanguage, cardIds, currentCardIndex, responses, createdAt, completedAt) => {
          mockSessions.set(id, {
            id, sourceLanguage, targetLanguage, cardIds, currentCardIndex, responses, createdAt, completedAt
          });
          return { changes: 1 };
        })
      };
    }
    if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
      return {
        get: jest.fn().mockImplementation((id) => mockSessions.get(id))
      };
    }
    if (query.includes('SELECT * FROM sessions')) {
      return {
        all: jest.fn().mockImplementation((...params) => {
          return Array.from(mockSessions.values());
        })
      };
    }

    // Settings operations
    if (query.includes('INSERT OR REPLACE INTO settings')) {
      return {
        run: jest.fn().mockImplementation((id, settings) => {
          mockSettings = { id, settings };
          return { changes: 1 };
        })
      };
    }
    if (query.includes('SELECT settings FROM settings WHERE id = ?')) {
      return {
        get: jest.fn().mockImplementation(() => mockSettings)
      };
    }

    // Default behavior
    return {
      run: jest.fn().mockReturnValue({ changes: 0 }),
      get: jest.fn(),
      all: jest.fn().mockReturnValue([])
    };
  });

  const mockDb = {
    prepare: mockPrepare,
    exec: jest.fn(),
    close: jest.fn(),
    pragma: jest.fn()
  };

  const mockBetterSqlite3 = jest.fn(() => mockDb);
  mockBetterSqlite3.resetMockData = resetMockData;
  return mockBetterSqlite3;
});

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

  beforeEach(async () => {
    // Reset the mock data
    require('better-sqlite3').resetMockData();
    
    // Create a new in-memory database for each test
    db = new DatabaseService({ inMemory: true });
    await db.initialize();
    
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
    
    // Save test data to database
    db.saveFlashCard(testCard);
    db.saveSession(testSession);
    db.saveSettings(testSettings);

    // Reset fs mock calls
    fs.promises.readFile.mockReset();
    fs.promises.writeFile.mockReset();
  });

  afterEach(() => {
    // Close the database connection after each test
    if (db) {
      db.close();
    }
  });

  describe('Export functionality', () => {
    it('exports all database content correctly', () => {
      // Export the data
      const exportedData = db.exportData();
      
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
    });
  });

  describe('Import functionality', () => {
    it('imports data correctly', () => {
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
      require('better-sqlite3').resetMockData();
      
      // Import the data
      const result = db.importData(importData);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.flashcardsImported).toBe(1);
      expect(result.sessionsImported).toBe(0);
      expect(result.settingsImported).toBe(false);
      
      // Verify the card was imported
      const importedCard = db.getFlashCard(importCard.id);
      expect(importedCard).not.toBeNull();
      expect(importedCard.content).toBe('Goodbye');
    });
    
    it('merges imported data with existing data', () => {
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
      const result = db.importData(importData);
      
      // Verify both cards exist
      const cards = db.getAllFlashCards();
      expect(cards.length).toBe(2);
      expect(cards.some(c => c.content === 'Hello')).toBe(true);
      expect(cards.some(c => c.content === 'Goodbye')).toBe(true);
    });
    
    it('handles settings import correctly', () => {
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
      const result = db.importData(importData);
      
      // Verify settings were imported
      expect(result.settingsImported).toBe(true);
      
      // Verify settings were updated
      const settings = db.getSettings();
      expect(settings.darkMode).toBe(false);
      expect(settings.translationApiProvider).toBe('openai');
      expect(settings.translationApiKey).toBe('new-key');
      expect(settings.maxCardsPerSession).toBe(20);
    });
    
    it('handles sessions import correctly', () => {
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
      const result = db.importData(importData);
      
      // Verify session was imported
      expect(result.sessionsImported).toBe(1);
      
      // Verify both sessions exist
      const sessions = db.getAllSessions();
      expect(sessions.length).toBe(2);
      
      // Find the imported session
      const foundSession = sessions.find(s => s.id === importSession.id);
      expect(foundSession).toBeDefined();
      expect(foundSession.sourceLanguage).toBe('fr');
      expect(foundSession.targetLanguage).toBe('es');
      expect(foundSession.completedAt).toBeTruthy();
    });
    
    it('rolls back transaction on error', () => {
      // Mock the exec method to simulate an error during transaction
      const mockExec = jest.fn()
        .mockImplementationOnce(() => {}) // First call (BEGIN TRANSACTION) succeeds
        .mockImplementationOnce(() => { throw new Error('Database error'); }); // Second call fails
      
      db.db.exec = mockExec;
      
      // Create import data
      const importData = {
        flashcards: [new FlashCard({ content: 'Test' }).toJSON()],
        sessions: [],
        settings: null
      };
      
      // Attempt to import, should fail
      expect(() => db.importData(importData)).toThrow('Database error');
      
      // Verify rollback was called
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});