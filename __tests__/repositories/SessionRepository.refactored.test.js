/**
 * Tests for SessionRepository using real in-memory SQLite
 */
const sqlite3 = require('sqlite3').verbose();
const SessionRepository = require('../../src/repositories/SessionRepository');
const Session = require('../../src/models/Session');
const { promisify } = require('util');

describe('SessionRepository', () => {
  let db;
  let repository;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    db = new sqlite3.Database(':memory:');
    
    // Create promisified version of run for setup
    const run = promisify(db.run.bind(db));
    
    // Create sessions table
    await run(`
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
    
    // Initialize repository with database connection
    repository = new SessionRepository(db, true);
  });

  afterEach((done) => {
    // Close database connection
    if (db) {
      db.close(done);
    } else {
      done();
    }
  });

  describe('saveSession', () => {
    test('should save a session to the database', async () => {
      // Create a test session
      const session = new Session({
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 0,
        responses: []
      });

      // Save the session
      const savedSession = await repository.saveSession(session);

      // Verify the saved session matches the original
      expect(savedSession).toEqual(session);
      
      // Verify it was actually saved to the database
      const retrievedSession = await repository.getSession(session.id);
      expect(retrievedSession).toBeInstanceOf(Session);
      expect(retrievedSession.id).toBe(session.id);
      expect(retrievedSession.sourceLanguage).toBe('en');
      expect(retrievedSession.targetLanguage).toBe('fr');
      expect(retrievedSession.cardIds).toEqual(['card1', 'card2']);
    });

    test('should throw an error if database is not initialized', async () => {
      // Create repository with uninitialized state
      const uninitializedRepo = new SessionRepository(db, false);
      
      // Create a test session
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      // Attempt to save should reject with error
      await expect(uninitializedRepo.saveSession(session))
        .rejects.toThrow('Database not initialized');
    });
  });

  describe('getSession', () => {
    test('should retrieve a session by ID', async () => {
      // Create a test session
      const session = new Session({
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 0
      });

      // Add a response (this will add timestamp properly)
      session.recordResponse('card1', 'test', true);
      
      await repository.saveSession(session);
      
      // Retrieve the session
      const retrievedSession = await repository.getSession(session.id);
      
      // Verify retrieved session
      expect(retrievedSession).toBeInstanceOf(Session);
      expect(retrievedSession.id).toBe(session.id);
      expect(retrievedSession.sourceLanguage).toBe('en');
      expect(retrievedSession.targetLanguage).toBe('fr');
      expect(retrievedSession.cardIds).toEqual(['card1', 'card2']);
      expect(retrievedSession.responses.length).toBe(1);
      expect(retrievedSession.responses[0].cardId).toBe('card1');
    });

    test('should return null for empty ID', async () => {
      const result = await repository.getSession('');
      expect(result).toBeNull();
    });

    test('should return null when no session is found', async () => {
      const result = await repository.getSession('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllSessions', () => {
    beforeEach(async () => {
      // Create and save test sessions
      const activeSession = new Session({
        id: 'active-session',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 0
      });
      
      const completedSession = new Session({
        id: 'completed-session',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        cardIds: ['card3', 'card4'],
        currentCardIndex: 2,
        completedAt: new Date().toISOString()
      });
      
      // Save both sessions
      await repository.saveSession(activeSession);
      await repository.saveSession(completedSession);
    });
    
    test('should retrieve all sessions with default options', async () => {
      const sessions = await repository.getAllSessions();
      
      expect(sessions.length).toBe(2);
      expect(sessions.some(s => s.id === 'active-session')).toBe(true);
      expect(sessions.some(s => s.id === 'completed-session')).toBe(true);
    });
    
    test('should filter active sessions only', async () => {
      const sessions = await repository.getAllSessions({ activeOnly: true });
      
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('active-session');
      expect(sessions[0].completedAt).toBeNull();
    });
    
    test('should filter completed sessions only', async () => {
      const sessions = await repository.getAllSessions({ completedOnly: true });
      
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('completed-session');
      expect(sessions[0].completedAt).not.toBeNull();
    });
    
    test('should apply limit and offset options', async () => {
      // Add another session to test pagination
      const anotherSession = new Session({
        id: 'another-session',
        sourceLanguage: 'en',
        targetLanguage: 'de'
      });
      await repository.saveSession(anotherSession);
      
      // Test limit
      const limitedSessions = await repository.getAllSessions({ limit: 2 });
      expect(limitedSessions.length).toBe(2);
      
      // Test limit with offset
      const offsetSessions = await repository.getAllSessions({ limit: 2, offset: 1 });
      expect(offsetSessions.length).toBe(2);
      // The first session should be skipped due to offset
      expect(offsetSessions.some(s => s.id === limitedSessions[0].id)).toBe(false);
    });
  });

  describe('deleteSession', () => {
    test('should delete a session by ID', async () => {
      // Create and save a test session
      const session = new Session({
        id: 'test-session-id',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });
      await repository.saveSession(session);
      
      // Delete the session
      const result = await repository.deleteSession(session.id);
      expect(result).toBe(true);
      
      // Verify it's gone
      const retrievedSession = await repository.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });
    
    test('should return false when no session is deleted', async () => {
      const result = await repository.deleteSession('non-existent-id');
      expect(result).toBe(false);
    });
    
    test('should return false for empty ID', async () => {
      const result = await repository.deleteSession('');
      expect(result).toBe(false);
    });
  });
});