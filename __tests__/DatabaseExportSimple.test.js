/**
 * Simplified test for database export functionality
 */

const DatabaseService = require('../src/services/DatabaseService');
const FlashCard = require('../src/models/FlashCard');
const Session = require('../src/models/Session');
const Settings = require('../src/models/Settings');

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
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
  };
});

describe('Database Export Test', () => {
  let db;
  let testCard;
  let testSession;
  let testSettings;

  // Set up the database before tests
  beforeAll(() => {
    console.log('Setting up test database');
    db = new DatabaseService({ inMemory: true });
    
    return db.initialize()
      .then(() => {
        console.log('Database initialized');
        
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
        console.log('Saving test data');
        return db.saveFlashCard(testCard);
      })
      .then(() => db.saveSession(testSession))
      .then(() => db.saveSettings(testSettings))
      .then(() => {
        console.log('Test setup complete');
      });
  });
  
  // Clean up after tests
  afterAll(() => {
    if (db) {
      console.log('Closing database connection');
      db.close();
    }
  });

  // Test the export functionality
  it('exports database content correctly', () => {
    console.log('Starting export test');
    return db.exportData().then(exportedData => {
      console.log('Verifying exported data');
      
      // Check structure
      expect(exportedData).toHaveProperty('flashcards');
      expect(exportedData).toHaveProperty('sessions');
      expect(exportedData).toHaveProperty('settings');
      expect(exportedData).toHaveProperty('exportDate');
      
      // Check content
      expect(exportedData.flashcards.length).toBe(1);
      expect(exportedData.flashcards[0].id).toBe(testCard.id);
      expect(exportedData.flashcards[0].content).toBe('Hello');
      
      expect(exportedData.sessions.length).toBe(1);
      expect(exportedData.sessions[0].id).toBe(testSession.id);
      
      expect(exportedData.settings).toEqual(testSettings.toJSON());
      
      console.log('Export test passed');
    });
  });
});