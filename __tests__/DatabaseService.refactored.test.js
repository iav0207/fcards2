/**
 * Tests for DatabaseService with sqlite3 Promise-based API
 *
 * Note on testing strategy:
 * - We use an in-memory SQLite database for testing
 * - Each test uses its own isolated database instance
 * - Tests use async/await to handle Promise-based API
 */

const DatabaseService = require('../src/services/DatabaseService');
const FlashCard = require('../src/models/FlashCard');
const Session = require('../src/models/Session');
const Settings = require('../src/models/Settings');
const path = require('path');

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path')
  }
}));

describe('DatabaseService', () => {
  let db;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    db = new DatabaseService({ inMemory: true });
    await db.initialize();
  });

  afterEach(async () => {
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
    it('saves and retrieves a flashcard', async () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        tags: ['greeting', 'basic']
      });

      // Save the card
      await db.saveFlashCard(card);

      // Retrieve the card
      const retrieved = await db.getFlashCard(card.id);

      expect(retrieved).toBeInstanceOf(FlashCard);
      expect(retrieved.id).toBe(card.id);
      expect(retrieved.content).toBe('Hello');
      expect(retrieved.sourceLanguage).toBe('en');
      expect(retrieved.comment).toBe('A greeting');
      expect(retrieved.tags).toEqual(['greeting', 'basic']);
    });

    it('returns null for non-existent flashcard', async () => {
      const card = await db.getFlashCard('non-existent-id');
      expect(card).toBeNull();
    });

    it('updates an existing flashcard', async () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en'
      });

      // Save the card
      await db.saveFlashCard(card);

      // Update the card
      card.update({
        content: 'Goodbye',
        comment: 'A farewell'
      });

      // Save the updated card
      await db.saveFlashCard(card);

      // Retrieve the card
      const retrieved = await db.getFlashCard(card.id);

      expect(retrieved.content).toBe('Goodbye');
      expect(retrieved.comment).toBe('A farewell');
    });

    it('retrieves all flashcards', async () => {
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
      await db.saveFlashCard(card1);
      await db.saveFlashCard(card2);

      // Retrieve all cards
      const cards = await db.getAllFlashCards();

      expect(cards.length).toBe(2);
      expect(cards.some(c => c.id === card1.id)).toBe(true);
      expect(cards.some(c => c.id === card2.id)).toBe(true);
    });

    it('filters flashcards by sourceLanguage', async () => {
      const card1 = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en'
      });

      const card2 = new FlashCard({
        content: 'Bonjour',
        sourceLanguage: 'fr'
      });

      // Save the cards
      await db.saveFlashCard(card1);
      await db.saveFlashCard(card2);

      // Filter by source language
      const enCards = await db.getAllFlashCards({ sourceLanguage: 'en' });
      const frCards = await db.getAllFlashCards({ sourceLanguage: 'fr' });

      expect(enCards.length).toBe(1);
      expect(enCards[0].id).toBe(card1.id);

      expect(frCards.length).toBe(1);
      expect(frCards[0].id).toBe(card2.id);
    });

    it('filters flashcards by tag', async () => {
      const card1 = new FlashCard({
        content: 'Hello',
        tags: ['greeting', 'basic']
      });

      const card2 = new FlashCard({
        content: 'Goodbye',
        tags: ['farewell', 'basic']
      });

      // Save the cards
      await db.saveFlashCard(card1);
      await db.saveFlashCard(card2);

      // Filter by tag
      const greetingCards = await db.getAllFlashCards({ tag: 'greeting' });
      const farewellCards = await db.getAllFlashCards({ tag: 'farewell' });
      const basicCards = await db.getAllFlashCards({ tag: 'basic' });

      expect(greetingCards.length).toBe(1);
      expect(greetingCards[0].id).toBe(card1.id);

      expect(farewellCards.length).toBe(1);
      expect(farewellCards[0].id).toBe(card2.id);

      expect(basicCards.length).toBe(2);
    });

    it('deletes a flashcard', async () => {
      const card = new FlashCard({
        content: 'Hello'
      });

      // Save the card
      await db.saveFlashCard(card);

      // Delete the card
      const result = await db.deleteFlashCard(card.id);
      expect(result).toBe(true);

      // Verify it's gone
      const retrieved = await db.getFlashCard(card.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('session operations', () => {
    it('saves and retrieves a session', async () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2', 'card3']
      });

      // Save the session
      await db.saveSession(session);

      // Retrieve the session
      const retrieved = await db.getSession(session.id);

      expect(retrieved).toBeInstanceOf(Session);
      expect(retrieved.id).toBe(session.id);
      expect(retrieved.sourceLanguage).toBe('en');
      expect(retrieved.targetLanguage).toBe('fr');
      expect(retrieved.cardIds).toEqual(['card1', 'card2', 'card3']);
    });

    it('returns null for non-existent session', async () => {
      const session = await db.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('updates an existing session', async () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2']
      });

      // Save the session
      await db.saveSession(session);

      // Record a response
      session.recordResponse('card1', 'bonjour', true);

      // Save the updated session
      await db.saveSession(session);

      // Retrieve the session
      const retrieved = await db.getSession(session.id);

      expect(retrieved.responses.length).toBe(1);
      expect(retrieved.responses[0].cardId).toBe('card1');
      expect(retrieved.responses[0].userResponse).toBe('bonjour');
      expect(retrieved.responses[0].correct).toBe(true);
    });

    it('retrieves all sessions', async () => {
      const session1 = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      const session2 = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });

      // Save the sessions
      await db.saveSession(session1);
      await db.saveSession(session2);

      // Retrieve all sessions
      const sessions = await db.getAllSessions();

      expect(sessions.length).toBe(2);
      expect(sessions.some(s => s.id === session1.id)).toBe(true);
      expect(sessions.some(s => s.id === session2.id)).toBe(true);
    });

    it('filters active and completed sessions', async () => {
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
      await db.saveSession(activeSession);
      await db.saveSession(completedSession);

      // Filter active sessions
      const activeSessions = await db.getAllSessions({ activeOnly: true });
      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].id).toBe(activeSession.id);

      // Filter completed sessions
      const completedSessions = await db.getAllSessions({ completedOnly: true });
      expect(completedSessions.length).toBe(1);
      expect(completedSessions[0].id).toBe(completedSession.id);
    });

    it('deletes a session', async () => {
      const session = new Session({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      // Save the session
      await db.saveSession(session);

      // Delete the session
      const result = await db.deleteSession(session.id);
      expect(result).toBe(true);

      // Verify it's gone
      const retrieved = await db.getSession(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('settings operations', () => {
    it('saves and retrieves settings', async () => {
      const settings = new Settings({
        darkMode: false,
        translationApiKey: 'test-key',
        translationApiProvider: 'openai',
        maxCardsPerSession: 30
      });

      // Save the settings
      await db.saveSettings(settings);

      // Retrieve the settings
      const retrieved = await db.getSettings();

      expect(retrieved).toBeInstanceOf(Settings);
      expect(retrieved.darkMode).toBe(false);
      expect(retrieved.translationApiKey).toBe('test-key');
      expect(retrieved.translationApiProvider).toBe('openai');
      expect(retrieved.maxCardsPerSession).toBe(30);
    });

    it('returns default settings when none exists', async () => {
      // Get settings without saving any
      const settings = await db.getSettings();

      expect(settings).toBeInstanceOf(Settings);
      expect(settings.darkMode).toBe(true);
      expect(settings.translationApiKey).toBe('');
      expect(settings.translationApiProvider).toBe('gemini');
      expect(settings.maxCardsPerSession).toBe(20);
    });
  });

  describe('statistics', () => {
    it('returns correct database statistics', async () => {
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
      await db.saveFlashCard(card1);
      await db.saveFlashCard(card2);
      await db.saveSession(activeSession);
      await db.saveSession(completedSession);

      // Get statistics
      const stats = await db.getStats();

      expect(stats.flashcardsCount).toBe(2);
      expect(stats.sessionsCount).toBe(2);
      expect(stats.activeSessionsCount).toBe(1);
      expect(stats.completedSessionsCount).toBe(1);
    });
  });

  describe('import/export operations', () => {
    it('exports and imports data correctly', async () => {
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
      await db.saveFlashCard(card);
      await db.saveSession(session);
      await db.saveSettings(settings);

      // Export the data
      const exportedData = await db.exportData();

      // Create a new database
      const newDb = new DatabaseService({ inMemory: true });
      await newDb.initialize();

      // Import the data
      const importResult = await newDb.importData(exportedData);

      expect(importResult.success).toBe(true);
      expect(importResult.flashcardsImported).toBe(1);
      expect(importResult.sessionsImported).toBe(1);
      expect(importResult.settingsImported).toBe(true);

      // Verify the imported data
      const importedCard = await newDb.getFlashCard(card.id);
      const importedSession = await newDb.getSession(session.id);
      const importedSettings = await newDb.getSettings();

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
});