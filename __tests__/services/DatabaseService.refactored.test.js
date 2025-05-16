/**
 * Tests for the refactored DatabaseService with repositories
 */
const DatabaseService = require('../../src/services/DatabaseService');
const FlashCardRepository = require('../../src/repositories/FlashCardRepository');
const SessionRepository = require('../../src/repositories/SessionRepository');
const SettingsRepository = require('../../src/repositories/SettingsRepository');
const TagRepository = require('../../src/repositories/TagRepository');
const FlashCard = require('../../src/models/FlashCard');
const Session = require('../../src/models/Session');
const Settings = require('../../src/models/Settings');

// Mock database and repositories
jest.mock('sqlite3', () => {
  // Create a mock for sqlite3.verbose() that returns another mock
  const mockVerbose = jest.fn().mockReturnValue({
    Database: jest.fn().mockImplementation((path, mode, callback) => {
      if (callback) callback(null);
      return {
        run: jest.fn((query, params, callback) => {
          if (callback) callback(null);
        }),
        get: jest.fn((query, params, callback) => {
          if (callback) callback(null, {});
        }),
        all: jest.fn((query, params, callback) => {
          if (callback) callback(null, []);
        }),
        close: jest.fn((callback) => {
          if (callback) callback(null);
        }),
        serialize: jest.fn(fn => fn()),
        parallelize: jest.fn(fn => fn())
      };
    }),
    OPEN_READWRITE: 1,
    OPEN_CREATE: 2,
    MEMORY: ':memory:'
  });
  return { verbose: mockVerbose };
});
jest.mock('../../src/repositories/FlashCardRepository');
jest.mock('../../src/repositories/SessionRepository');
jest.mock('../../src/repositories/SettingsRepository');
jest.mock('../../src/repositories/TagRepository');

describe('DatabaseService with Repositories', () => {
  let dbService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create an in-memory database service
    dbService = new DatabaseService({ inMemory: true });
    
    // Mock the database for initialization
    dbService.db = {
      pragma: jest.fn(),
      exec: jest.fn(),
      prepare: jest.fn(),
      close: jest.fn()
    };
    
    // Mock repository methods
    FlashCardRepository.mockImplementation(() => ({
      setInitialized: jest.fn(),
      saveFlashCard: jest.fn(card => card),
      getFlashCard: jest.fn(id => new FlashCard({ id })),
      getAllFlashCards: jest.fn(() => []),
      deleteFlashCard: jest.fn()
    }));
    
    SessionRepository.mockImplementation(() => ({
      setInitialized: jest.fn(),
      saveSession: jest.fn(session => session),
      getSession: jest.fn(id => new Session({ id })),
      getAllSessions: jest.fn(() => []),
      deleteSession: jest.fn()
    }));
    
    SettingsRepository.mockImplementation(() => ({
      setInitialized: jest.fn(),
      saveSettings: jest.fn(settings => settings),
      getSettings: jest.fn(() => Settings.getDefaults())
    }));
    
    TagRepository.mockImplementation(() => ({
      setInitialized: jest.fn(),
      getAvailableTags: jest.fn(() => ({ tags: [], untaggedCount: 0 }))
    }));
  });
  
  describe('initialization', () => {
    test('should initialize repositories', async () => {
      // Setup
      dbService._createTables = jest.fn();
      
      // Initialize the database service
      await dbService._initializeRepositories();
      
      // Check that repositories were created
      expect(dbService.repositories.flashCard).toBeDefined();
      expect(dbService.repositories.session).toBeDefined();
      expect(dbService.repositories.settings).toBeDefined();
      expect(dbService.repositories.tag).toBeDefined();
      
      // Check repository constructors were called
      expect(FlashCardRepository).toHaveBeenCalledWith(dbService.db, dbService.initialized);
      expect(SessionRepository).toHaveBeenCalledWith(dbService.db, dbService.initialized);
      expect(SettingsRepository).toHaveBeenCalledWith(dbService.db, dbService.initialized);
      expect(TagRepository).toHaveBeenCalledWith(dbService.db, dbService.repositories.flashCard, dbService.initialized);
    });
    
    test('should update repository initialization state', async () => {
      // Setup
      dbService._createTables = jest.fn();
      await dbService._initializeRepositories();
      
      // Call the helper method to update repository state
      dbService._setRepositoriesInitialized(true);
      
      // Check that repositories were updated
      expect(dbService.repositories.flashCard.setInitialized).toHaveBeenCalledWith(true);
      expect(dbService.repositories.session.setInitialized).toHaveBeenCalledWith(true);
      expect(dbService.repositories.settings.setInitialized).toHaveBeenCalledWith(true);
      expect(dbService.repositories.tag.setInitialized).toHaveBeenCalledWith(true);
    });
  });
  
  describe('delegation to repositories', () => {
    beforeEach(async () => {
      // Initialize repositories for testing
      dbService._createTables = jest.fn();
      await dbService._initializeRepositories();
      dbService.initialized = true;
    });
    
    test('should delegate saveFlashCard to FlashCardRepository', () => {
      // Create a test card
      const card = new FlashCard({ content: 'Test' });
      
      // Call the method
      dbService.saveFlashCard(card);
      
      // Check delegation
      expect(dbService.repositories.flashCard.saveFlashCard).toHaveBeenCalledWith(card);
    });
    
    test('should delegate getFlashCard to FlashCardRepository', () => {
      // Call the method
      dbService.getFlashCard('test-id');
      
      // Check delegation
      expect(dbService.repositories.flashCard.getFlashCard).toHaveBeenCalledWith('test-id');
    });
    
    test('should delegate getAllFlashCards to FlashCardRepository', () => {
      // Call the method with options
      const options = { sourceLanguage: 'en', tags: ['test'] };
      dbService.getAllFlashCards(options);
      
      // Check delegation
      expect(dbService.repositories.flashCard.getAllFlashCards).toHaveBeenCalledWith(options);
    });
    
    test('should delegate deleteFlashCard to FlashCardRepository', () => {
      // Call the method
      dbService.deleteFlashCard('test-id');
      
      // Check delegation
      expect(dbService.repositories.flashCard.deleteFlashCard).toHaveBeenCalledWith('test-id');
    });
    
    test('should delegate saveSession to SessionRepository', () => {
      // Create a test session
      const session = new Session({ sourceLanguage: 'en', targetLanguage: 'fr' });
      
      // Call the method
      dbService.saveSession(session);
      
      // Check delegation
      expect(dbService.repositories.session.saveSession).toHaveBeenCalledWith(session);
    });
    
    test('should delegate getSession to SessionRepository', () => {
      // Call the method
      dbService.getSession('test-id');
      
      // Check delegation
      expect(dbService.repositories.session.getSession).toHaveBeenCalledWith('test-id');
    });
    
    test('should delegate getAllSessions to SessionRepository', () => {
      // Call the method with options
      const options = { activeOnly: true };
      dbService.getAllSessions(options);
      
      // Check delegation
      expect(dbService.repositories.session.getAllSessions).toHaveBeenCalledWith(options);
    });
    
    test('should delegate deleteSession to SessionRepository', () => {
      // Call the method
      dbService.deleteSession('test-id');
      
      // Check delegation
      expect(dbService.repositories.session.deleteSession).toHaveBeenCalledWith('test-id');
    });
    
    test('should delegate saveSettings to SettingsRepository', () => {
      // Create test settings
      const settings = new Settings();
      
      // Call the method
      dbService.saveSettings(settings);
      
      // Check delegation
      expect(dbService.repositories.settings.saveSettings).toHaveBeenCalledWith(settings);
    });
    
    test('should delegate getSettings to SettingsRepository', () => {
      // Call the method
      dbService.getSettings();
      
      // Check delegation
      expect(dbService.repositories.settings.getSettings).toHaveBeenCalled();
    });
    
    test('should delegate getAvailableTags to TagRepository', () => {
      // Call the method
      dbService.getAvailableTags('en');
      
      // Check delegation
      expect(dbService.repositories.tag.getAvailableTags).toHaveBeenCalledWith('en');
    });
  });
});