/**
 * Tests for SessionRepository
 */
const SessionRepository = require('../../src/repositories/SessionRepository');
const Session = require('../../src/models/Session');

// Mock database
const mockDb = {
  prepare: jest.fn(),
};

// Mock prepared statement
const mockStmt = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
};

describe('SessionRepository', () => {
  let repository;

  beforeEach(() => {
    // Reset mocks
    mockDb.prepare.mockReset();
    mockStmt.run.mockReset();
    mockStmt.get.mockReset();
    mockStmt.all.mockReset();

    // Mock prepare to return our mock statement
    mockDb.prepare.mockReturnValue(mockStmt);

    // Create repository with initialized state
    repository = new SessionRepository(mockDb, true);
  });

  describe('saveSession', () => {
    test('should save a session to the database', () => {
      // Create a test session
      const session = new Session({
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        cardIds: ['card-1', 'card-2'],
        currentCardIndex: 0
      });

      // Mock successful run
      mockStmt.run.mockReturnValue({ changes: 1 });

      // Save the session
      const result = repository.saveSession(session);

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO sessions'));

      // Check that run was called with the correct parameters
      expect(mockStmt.run).toHaveBeenCalledWith(
        session.id,
        session.sourceLanguage,
        session.targetLanguage,
        JSON.stringify(session.cardIds),
        session.currentCardIndex,
        JSON.stringify(session.responses),
        expect.any(String), // createdAt as string
        session.completedAt
      );

      // Check that the session was returned
      expect(result).toBe(session);
    });

    test('should throw an error if database is not initialized', () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new SessionRepository(mockDb, false);

      // Create a test session
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });

      // Expect error when trying to save
      expect(() => {
        uninitializedRepo.saveSession(session);
      }).toThrow('Database not initialized');
    });
  });

  describe('getSession', () => {
    test('should retrieve a session by ID', () => {
      // Mock database row return
      const mockRow = {
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'de',
        cardIds: '["card-1","card-2"]',
        currentCardIndex: 0,
        responses: '[]',
        createdAt: new Date().toISOString(),
        completedAt: null
      };

      mockStmt.get.mockReturnValue(mockRow);

      // Get the session
      const result = repository.getSession('test-session-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM sessions WHERE id = ?');

      // Check that get was called with the correct ID
      expect(mockStmt.get).toHaveBeenCalledWith('test-session-id');

      // Check that a Session instance was returned
      expect(result).toBeInstanceOf(Session);
      expect(result.id).toBe('test-session-id');
      expect(result.sourceLanguage).toBe('en');
      expect(result.cardIds).toEqual(['card-1', 'card-2']);
    });

    test('should return null for empty ID', () => {
      const result = repository.getSession('');
      expect(result).toBeNull();
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });

    test('should return null when no session is found', () => {
      mockStmt.get.mockReturnValue(null);
      
      const result = repository.getSession('non-existent-id');
      
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM sessions WHERE id = ?');
      expect(mockStmt.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllSessions', () => {
    test('should retrieve all sessions with default options', () => {
      // Mock database rows return
      const mockRows = [
        {
          id: 'session1',
          sourceLanguage: 'en',
          targetLanguage: 'de',
          cardIds: '["card1","card2"]',
          currentCardIndex: 0,
          responses: '[]',
          createdAt: new Date().toISOString(),
          completedAt: null
        },
        {
          id: 'session2',
          sourceLanguage: 'en',
          targetLanguage: 'fr',
          cardIds: '["card3","card4"]',
          currentCardIndex: 1,
          responses: '[{"cardId":"card3","answer":"test","correct":true}]',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      ];

      mockStmt.all.mockReturnValue(mockRows);

      // Get all sessions
      const result = repository.getAllSessions();

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM sessions'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY createdAt DESC'));

      // Check that all was called
      expect(mockStmt.all).toHaveBeenCalled();

      // Check that Session instances were returned
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Session);
      expect(result[1]).toBeInstanceOf(Session);
      expect(result[0].id).toBe('session1');
      expect(result[1].id).toBe('session2');
    });

    test('should filter active sessions only', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllSessions({ activeOnly: true });

      // Check that prepare was called with a WHERE clause for active sessions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE completedAt IS NULL'));
    });

    test('should filter completed sessions only', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllSessions({ completedOnly: true });

      // Check that prepare was called with a WHERE clause for completed sessions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE completedAt IS NOT NULL'));
    });

    test('should apply limit and offset options', () => {
      mockStmt.all.mockReturnValue([]);

      repository.getAllSessions({ limit: 10, offset: 20 });

      // Check that prepare was called with limit and offset
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('LIMIT ? OFFSET ?'));

      // Check that all was called with the correct parameters
      expect(mockStmt.all).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('deleteSession', () => {
    test('should delete a session by ID', () => {
      // Mock successful deletion
      mockStmt.run.mockReturnValue({ changes: 1 });

      // Delete the session
      const result = repository.deleteSession('test-session-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE id = ?');

      // Check that run was called with the correct ID
      expect(mockStmt.run).toHaveBeenCalledWith('test-session-id');

      // Check that true was returned (deletion successful)
      expect(result).toBe(true);
    });

    test('should return false when no session is deleted', () => {
      // Mock unsuccessful deletion
      mockStmt.run.mockReturnValue({ changes: 0 });

      // Delete the session
      const result = repository.deleteSession('non-existent-id');

      // Check that prepare was called with the correct SQL
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE id = ?');

      // Check that run was called with the correct ID
      expect(mockStmt.run).toHaveBeenCalledWith('non-existent-id');

      // Check that false was returned (deletion unsuccessful)
      expect(result).toBe(false);
    });

    test('should return false for empty ID', () => {
      const result = repository.deleteSession('');
      expect(result).toBe(false);
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });
  });
});