/**
 * Tests for DatabaseService
 *
 * Note on mocking strategy:
 * - We use jest.mock to mock the better-sqlite3 module
 * - Mock data is stored in Maps (mockFlashcards, mockSessions) and variables (mockSettings)
 * - A resetMockData function ensures each test starts with a clean state
 * - The mock implements basic SQL-like filtering for queries with WHERE clauses
 * - Each test case should be isolated from others, with no state leakage
 */

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

          // Handle WHERE clauses for filtering
          if (query.includes('WHERE')) {
            // sourceLanguage filter
            if (query.includes('sourceLanguage = ?') && params.length > 0) {
              const language = params[0];
              result = result.filter(card => card.sourceLanguage === language);
            }

            // tag filter
            if (query.includes('tags LIKE ?')) {
              const tagParam = params.find(p => typeof p === 'string' && p.includes('%"'));
              if (tagParam) {
                const tag = tagParam.replace(/^%"|"%$/g, '');
                result = result.filter(card => {
                  try {
                    const tags = JSON.parse(card.tags || '[]');
                    return tags.includes(tag);
                  } catch {
                    return false;
                  }
                });
              }
            }
          }

          return result;
        })
      };
    }
    if (query.includes('DELETE FROM flashcards WHERE id = ?')) {
      return {
        run: jest.fn().mockImplementation((id) => {
          const result = mockFlashcards.delete(id);
          return { changes: result ? 1 : 0 };
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
          let result = Array.from(mockSessions.values());

          // Handle WHERE clauses for filtering
          if (query.includes('WHERE')) {
            // Active sessions filter
            if (query.includes('completedAt IS NULL')) {
              result = result.filter(session => !session.completedAt);
            }

            // Completed sessions filter
            if (query.includes('completedAt IS NOT NULL')) {
              result = result.filter(session => session.completedAt);
            }
          }

          return result;
        })
      };
    }
    if (query.includes('DELETE FROM sessions WHERE id = ?')) {
      return {
        run: jest.fn().mockImplementation((id) => {
          const result = mockSessions.delete(id);
          return { changes: result ? 1 : 0 };
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

    // Stats operations
    if (query.includes('COUNT(*) as count FROM flashcards')) {
      return {
        get: jest.fn().mockReturnValue({ count: mockFlashcards.size })
      };
    }
    if (query.includes('COUNT(*) as count FROM sessions WHERE completedAt IS NULL')) {
      return {
        get: jest.fn().mockReturnValue({ count: 1 })
      };
    }
    if (query.includes('COUNT(*) as count FROM sessions WHERE completedAt IS NOT NULL')) {
      return {
        get: jest.fn().mockReturnValue({ count: 1 })
      };
    }
    if (query.includes('COUNT(*) as count FROM sessions')) {
      return {
        get: jest.fn().mockReturnValue({ count: mockSessions.size })
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
  // Expose the reset function for tests
  mockBetterSqlite3.resetMockData = resetMockData;
  return mockBetterSqlite3;
});

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path')
  }
}));

describe('DatabaseService', () => {
  let db;

  beforeEach(async () => {
    // Reset the mock data
    require('better-sqlite3').resetMockData();

    // Create a new in-memory database for each test
    db = new DatabaseService({ inMemory: true });
    await db.initialize();
  });

  afterEach(() => {
    // Close the database connection after each test
    if (db) {
      db.close();
    }
  });

  describe('initialization', () => {
    it('initializes successfully', async () => {
      expect(db.initialized).toBe(true);
      expect(db.db).not.toBeNull();
    });

    it('initializes only once', async () => {
      const initSpy = jest.spyOn(db, '_createTables');
      await db.initialize();
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('flashcard operations', () => {
    it('saves and retrieves a flashcard', () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        tags: ['greeting', 'basic']
      });

      // Save the card
      db.saveFlashCard(card);

      // Retrieve the card
      const retrieved = db.getFlashCard(card.id);

      expect(retrieved).toBeInstanceOf(FlashCard);
      expect(retrieved.id).toBe(card.id);
      expect(retrieved.content).toBe('Hello');
      expect(retrieved.sourceLanguage).toBe('en');
      expect(retrieved.comment).toBe('A greeting');
      expect(retrieved.tags).toEqual(['greeting', 'basic']);
    });

    it('returns null for non-existent flashcard', () => {
      const card = db.getFlashCard('non-existent-id');
      expect(card).toBeNull();
    });

    it('updates an existing flashcard', () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en'
      });

      // Save the card
      db.saveFlashCard(card);

      // Update the card
      card.update({
        content: 'Goodbye',
        comment: 'A farewell'
      });

      // Save the updated card
      db.saveFlashCard(card);

      // Retrieve the card
      const retrieved = db.getFlashCard(card.id);

      expect(retrieved.content).toBe('Goodbye');
      expect(retrieved.comment).toBe('A farewell');
    });

    it('retrieves all flashcards', () => {
      const card1 = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        tags: ['greeting']
      });

      const card2 = new FlashCard({
        content: 'Goodbye',
        sourceLanguage: 'en',
        tags: ['farewell']
      });

      // Save the cards
      db.saveFlashCard(card1);
      db.saveFlashCard(card2);

      // Retrieve all cards
      const cards = db.getAllFlashCards();

      expect(cards.length).toBe(2);
      expect(cards.some(c => c.id === card1.id)).toBe(true);
      expect(cards.some(c => c.id === card2.id)).toBe(true);
    });

    it('filters flashcards by sourceLanguage', () => {
      const card1 = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en'
      });

      const card2 = new FlashCard({
        content: 'Bonjour',
        sourceLanguage: 'fr'
      });

      // Save the cards
      db.saveFlashCard(card1);
      db.saveFlashCard(card2);

      // Filter by source language
      const enCards = db.getAllFlashCards({ sourceLanguage: 'en' });
      const frCards = db.getAllFlashCards({ sourceLanguage: 'fr' });

      expect(enCards.length).toBe(1);
      expect(enCards[0].id).toBe(card1.id);

      expect(frCards.length).toBe(1);
      expect(frCards[0].id).toBe(card2.id);
    });

    it('filters flashcards by tag', () => {
      const card1 = new FlashCard({
        content: 'Hello',
        tags: ['greeting', 'basic']
      });

      const card2 = new FlashCard({
        content: 'Goodbye',
        tags: ['farewell', 'basic']
      });

      // Save the cards
      db.saveFlashCard(card1);
      db.saveFlashCard(card2);

      // Filter by tag
      const greetingCards = db.getAllFlashCards({ tag: 'greeting' });
      const farewellCards = db.getAllFlashCards({ tag: 'farewell' });
      const basicCards = db.getAllFlashCards({ tag: 'basic' });

      expect(greetingCards.length).toBe(1);
      expect(greetingCards[0].id).toBe(card1.id);

      expect(farewellCards.length).toBe(1);
      expect(farewellCards[0].id).toBe(card2.id);

      expect(basicCards.length).toBe(2);
    });

    it('deletes a flashcard', () => {
      const card = new FlashCard({
        content: 'Hello'
      });

      // Save the card
      db.saveFlashCard(card);

      // Delete the card
      const result = db.deleteFlashCard(card.id);
      expect(result).toBe(true);

      // Verify it's gone
      const retrieved = db.getFlashCard(card.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('session operations', () => {
    it('saves and retrieves a session', () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2', 'card3']
      });

      // Save the session
      db.saveSession(session);

      // Retrieve the session
      const retrieved = db.getSession(session.id);

      expect(retrieved).toBeInstanceOf(Session);
      expect(retrieved.id).toBe(session.id);
      expect(retrieved.sourceLanguage).toBe('en');
      expect(retrieved.targetLanguage).toBe('fr');
      expect(retrieved.cardIds).toEqual(['card1', 'card2', 'card3']);
    });

    it('returns null for non-existent session', () => {
      const session = db.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('updates an existing session', () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2']
      });

      // Save the session
      db.saveSession(session);

      // Record a response
      session.recordResponse('card1', 'bonjour', true);

      // Save the updated session
      db.saveSession(session);

      // Retrieve the session
      const retrieved = db.getSession(session.id);

      expect(retrieved.responses.length).toBe(1);
      expect(retrieved.responses[0].cardId).toBe('card1');
      expect(retrieved.responses[0].userResponse).toBe('bonjour');
      expect(retrieved.responses[0].correct).toBe(true);
    });

    it('retrieves all sessions', () => {
      const session1 = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      const session2 = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });

      // Save the sessions
      db.saveSession(session1);
      db.saveSession(session2);

      // Retrieve all sessions
      const sessions = db.getAllSessions();

      expect(sessions.length).toBe(2);
      expect(sessions.some(s => s.id === session1.id)).toBe(true);
      expect(sessions.some(s => s.id === session2.id)).toBe(true);
    });

    it('filters active and completed sessions', () => {
      const activeSession = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      const completedSession = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'es',
        completedAt: new Date()
      });

      // Save the sessions
      db.saveSession(activeSession);
      db.saveSession(completedSession);

      // Filter active sessions
      const activeSessions = db.getAllSessions({ activeOnly: true });
      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].id).toBe(activeSession.id);

      // Filter completed sessions
      const completedSessions = db.getAllSessions({ completedOnly: true });
      expect(completedSessions.length).toBe(1);
      expect(completedSessions[0].id).toBe(completedSession.id);
    });

    it('deletes a session', () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      // Save the session
      db.saveSession(session);

      // Delete the session
      const result = db.deleteSession(session.id);
      expect(result).toBe(true);

      // Verify it's gone
      const retrieved = db.getSession(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('settings operations', () => {
    it('saves and retrieves settings', () => {
      const settings = new Settings({
        darkMode: false,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 30
      });

      // Save the settings
      db.saveSettings(settings);

      // Retrieve the settings
      const retrieved = db.getSettings();

      expect(retrieved).toBeInstanceOf(Settings);
      expect(retrieved.darkMode).toBe(false);
      expect(retrieved.translationApiKey).toBe('test-key');
      expect(retrieved.translationApiProvider).toBe('openai');
      expect(retrieved.maxCardsPerSession).toBe(30);
    });

    it('returns default settings when none exists', () => {
      // Reset mock data to ensure no settings exist
      require('better-sqlite3').resetMockData();

      // Get settings without saving any
      const settings = db.getSettings();

      expect(settings).toBeInstanceOf(Settings);
      expect(settings.darkMode).toBe(true);
      expect(settings.translationApiKey).toBe('');
      expect(settings.translationApiProvider).toBe('gemini');
      expect(settings.maxCardsPerSession).toBe(20);
    });
  });

  describe('import/export operations', () => {
    it('exports and imports data correctly', () => {
      // Create test data
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        tags: ['greeting']
      });

      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: [card.id]
      });

      const settings = new Settings({
        darkMode: false,
        translationApiKey: 'test-key'
      });

      // Save all data
      db.saveFlashCard(card);
      db.saveSession(session);
      db.saveSettings(settings);

      // Export the data
      const exportedData = db.exportData();

      // Create a new database
      const newDb = new DatabaseService({ inMemory: true });
      newDb.initialize();

      // Import the data
      const importResult = newDb.importData(exportedData);

      expect(importResult.success).toBe(true);
      expect(importResult.flashcardsImported).toBe(1);
      expect(importResult.sessionsImported).toBe(1);
      expect(importResult.settingsImported).toBe(true);

      // Verify the imported data
      const importedCard = newDb.getFlashCard(card.id);
      const importedSession = newDb.getSession(session.id);
      const importedSettings = newDb.getSettings();

      expect(importedCard).toBeInstanceOf(FlashCard);
      expect(importedCard.content).toBe('Hello');

      expect(importedSession).toBeInstanceOf(Session);
      expect(importedSession.cardIds).toEqual([card.id]);

      expect(importedSettings).toBeInstanceOf(Settings);
      expect(importedSettings.darkMode).toBe(false);
      expect(importedSettings.translationApiKey).toBe('test-key');

      // Clean up
      newDb.close();
    });
  });

  describe('statistics', () => {
    it('returns correct database statistics', () => {
      // Create test data
      const card1 = new FlashCard({ content: 'Hello' });
      const card2 = new FlashCard({ content: 'Goodbye' });

      const activeSession = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      const completedSession = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'es',
        completedAt: new Date()
      });

      // Save all data
      db.saveFlashCard(card1);
      db.saveFlashCard(card2);
      db.saveSession(activeSession);
      db.saveSession(completedSession);

      // Get statistics
      const stats = db.getStats();

      expect(stats.flashcardsCount).toBe(2);
      expect(stats.sessionsCount).toBe(2);
      expect(stats.activeSessionsCount).toBe(1);
      expect(stats.completedSessionsCount).toBe(1);
    });
  });
});