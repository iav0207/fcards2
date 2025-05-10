const Session = require('../src/models/Session');

describe('Session Model', () => {
  describe('constructor', () => {
    it('creates a new Session with default values', () => {
      const session = new Session();
      
      expect(session.id).toBeDefined();
      expect(session.sourceLanguage).toBe('en');
      expect(session.targetLanguage).toBe('en');
      expect(session.cardIds).toEqual([]);
      expect(session.currentCardIndex).toBe(0);
      expect(session.responses).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.completedAt).toBeNull();
    });

    it('creates a Session with provided values', () => {
      const now = new Date();
      const completedAt = new Date(now.getTime() + 3600000);
      
      const data = {
        id: 'test-session',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2', 'card3'],
        currentCardIndex: 1,
        responses: [
          { cardId: 'card1', userResponse: 'bonjour', correct: true, timestamp: now }
        ],
        createdAt: now,
        completedAt: completedAt
      };
      
      const session = new Session(data);
      
      expect(session.id).toBe('test-session');
      expect(session.sourceLanguage).toBe('en');
      expect(session.targetLanguage).toBe('fr');
      expect(session.cardIds).toEqual(['card1', 'card2', 'card3']);
      expect(session.currentCardIndex).toBe(1);
      expect(session.responses.length).toBe(1);
      expect(session.responses[0].cardId).toBe('card1');
      expect(session.createdAt).toEqual(now);
      expect(session.completedAt).toEqual(completedAt);
    });
  });

  describe('recordResponse method', () => {
    it('adds a response to the session', () => {
      const session = new Session({
        cardIds: ['card1', 'card2'],
        currentCardIndex: 0
      });
      
      session.recordResponse('card1', 'hello', true);
      
      expect(session.responses.length).toBe(1);
      expect(session.responses[0].cardId).toBe('card1');
      expect(session.responses[0].userResponse).toBe('hello');
      expect(session.responses[0].correct).toBe(true);
      expect(session.responses[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('nextCard method', () => {
    it('moves to the next card if available', () => {
      const session = new Session({
        cardIds: ['card1', 'card2', 'card3'],
        currentCardIndex: 0
      });
      
      const hasMoreCards = session.nextCard();
      
      expect(hasMoreCards).toBe(true);
      expect(session.currentCardIndex).toBe(1);
      expect(session.completedAt).toBeNull();
    });
    
    it('completes the session if no more cards', () => {
      const session = new Session({
        cardIds: ['card1', 'card2'],
        currentCardIndex: 1
      });
      
      const hasMoreCards = session.nextCard();
      
      expect(hasMoreCards).toBe(false);
      expect(session.currentCardIndex).toBe(1);
      expect(session.completedAt).toBeInstanceOf(Date);
    });
    
    it('returns false if no cards', () => {
      const session = new Session();
      
      const hasMoreCards = session.nextCard();
      
      expect(hasMoreCards).toBe(false);
    });
  });

  describe('getCurrentCardId method', () => {
    it('returns the current card ID', () => {
      const session = new Session({
        cardIds: ['card1', 'card2', 'card3'],
        currentCardIndex: 1
      });
      
      const cardId = session.getCurrentCardId();
      
      expect(cardId).toBe('card2');
    });
    
    it('returns null if no cards', () => {
      const session = new Session();
      
      const cardId = session.getCurrentCardId();
      
      expect(cardId).toBeNull();
    });
  });

  describe('getStats method', () => {
    it('calculates correct statistics', () => {
      const session = new Session({
        cardIds: ['card1', 'card2', 'card3', 'card4'],
        responses: [
          { cardId: 'card1', userResponse: 'one', correct: true },
          { cardId: 'card2', userResponse: 'two', correct: false },
          { cardId: 'card3', userResponse: 'three', correct: true }
        ]
      });
      
      const stats = session.getStats();
      
      expect(stats.totalCards).toBe(4);
      expect(stats.answeredCards).toBe(3);
      expect(stats.correctCards).toBe(2);
      expect(stats.accuracy).toBe((2/3) * 100);
      expect(stats.isComplete).toBe(false);
    });
    
    it('handles empty session correctly', () => {
      const session = new Session();
      
      const stats = session.getStats();
      
      expect(stats.totalCards).toBe(0);
      expect(stats.answeredCards).toBe(0);
      expect(stats.correctCards).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.isComplete).toBe(false);
    });
    
    it('recognizes completed sessions', () => {
      const session = new Session({
        completedAt: new Date()
      });
      
      const stats = session.getStats();
      
      expect(stats.isComplete).toBe(true);
    });
  });

  describe('toJSON method', () => {
    it('converts a Session to a plain object with ISO dates', () => {
      const now = new Date('2023-01-15T12:00:00Z');
      const responseTime = new Date('2023-01-15T12:05:00Z');
      const completedAt = new Date('2023-01-15T12:10:00Z');
      
      const session = new Session({
        id: 'test-session',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 1,
        responses: [
          { cardId: 'card1', userResponse: 'bonjour', correct: true, timestamp: responseTime }
        ],
        createdAt: now,
        completedAt: completedAt
      });
      
      const json = session.toJSON();
      
      expect(json).toEqual({
        id: 'test-session',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 1,
        responses: [
          { cardId: 'card1', userResponse: 'bonjour', correct: true, timestamp: responseTime.toISOString() }
        ],
        createdAt: now.toISOString(),
        completedAt: completedAt.toISOString()
      });
    });
  });

  describe('fromJSON method', () => {
    it('creates a Session from a plain object', () => {
      const now = '2023-01-15T12:00:00Z';
      const responseTime = '2023-01-15T12:05:00Z';
      const completedAt = '2023-01-15T12:10:00Z';
      
      const data = {
        id: 'test-session',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        cardIds: ['card1', 'card2'],
        currentCardIndex: 1,
        responses: [
          { cardId: 'card1', userResponse: 'bonjour', correct: true, timestamp: responseTime }
        ],
        createdAt: now,
        completedAt: completedAt
      };
      
      const session = Session.fromJSON(data);
      
      expect(session).toBeInstanceOf(Session);
      expect(session.id).toBe('test-session');
      expect(session.sourceLanguage).toBe('en');
      expect(session.targetLanguage).toBe('fr');
      expect(session.cardIds).toEqual(['card1', 'card2']);
      expect(session.currentCardIndex).toBe(1);
      expect(session.responses[0].cardId).toBe('card1');
      expect(session.responses[0].timestamp).toEqual(new Date(responseTime));
      expect(session.createdAt).toEqual(new Date(now));
      expect(session.completedAt).toEqual(new Date(completedAt));
    });
  });
});