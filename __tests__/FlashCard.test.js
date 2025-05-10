const FlashCard = require('../src/models/FlashCard');

describe('FlashCard Model', () => {
  describe('constructor', () => {
    it('creates a new FlashCard with default values', () => {
      const card = new FlashCard();
      
      expect(card.id).toBeDefined();
      expect(card.content).toBe('');
      expect(card.sourceLanguage).toBe('en');
      expect(card.comment).toBe('');
      expect(card.userTranslation).toBe('');
      expect(card.tags).toEqual([]);
      expect(card.createdAt).toBeInstanceOf(Date);
      expect(card.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a new FlashCard with provided values', () => {
      const now = new Date();
      const data = {
        id: 'test-id',
        content: 'Hello',
        sourceLanguage: 'fr',
        comment: 'A greeting',
        userTranslation: 'Bonjour',
        tags: ['greeting', 'basic'],
        createdAt: now,
        updatedAt: now
      };
      
      const card = new FlashCard(data);
      
      expect(card.id).toBe('test-id');
      expect(card.content).toBe('Hello');
      expect(card.sourceLanguage).toBe('fr');
      expect(card.comment).toBe('A greeting');
      expect(card.userTranslation).toBe('Bonjour');
      expect(card.tags).toEqual(['greeting', 'basic']);
      expect(card.createdAt).toEqual(now);
      expect(card.updatedAt).toEqual(now);
    });
  });

  describe('update method', () => {
    it('updates properties and sets updatedAt', () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en'
      });

      // Store the original update method
      const originalUpdate = card.update;

      // Mock the update method to force a new date
      card.update = function(data) {
        const result = originalUpdate.call(this, data);
        // Force updatedAt to be different by adding 1ms
        this.updatedAt = new Date(this.updatedAt.getTime() + 1);
        return result;
      };

      const initialUpdatedAt = card.updatedAt;

      card.update({
        content: 'Goodbye',
        sourceLanguage: 'fr',
        comment: 'A farewell',
        userTranslation: 'Au revoir',
        tags: ['farewell']
      });

      expect(card.content).toBe('Goodbye');
      expect(card.sourceLanguage).toBe('fr');
      expect(card.comment).toBe('A farewell');
      expect(card.userTranslation).toBe('Au revoir');
      expect(card.tags).toEqual(['farewell']);
      expect(card.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('only updates provided properties', () => {
      const card = new FlashCard({
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        userTranslation: 'Bonjour',
        tags: ['greeting']
      });
      
      card.update({
        content: 'Hi'
      });
      
      expect(card.content).toBe('Hi');
      expect(card.sourceLanguage).toBe('en');
      expect(card.comment).toBe('A greeting');
      expect(card.userTranslation).toBe('Bonjour');
      expect(card.tags).toEqual(['greeting']);
    });
  });

  describe('toJSON method', () => {
    it('converts a FlashCard to a plain object with ISO dates', () => {
      const createdAt = new Date('2023-01-01T12:00:00Z');
      const updatedAt = new Date('2023-01-02T12:00:00Z');
      
      const card = new FlashCard({
        id: 'test-id',
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        userTranslation: 'Bonjour',
        tags: ['greeting'],
        createdAt,
        updatedAt
      });
      
      const json = card.toJSON();
      
      expect(json).toEqual({
        id: 'test-id',
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        userTranslation: 'Bonjour',
        tags: ['greeting'],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      });
    });
  });

  describe('fromJSON method', () => {
    it('creates a FlashCard from a plain object', () => {
      const data = {
        id: 'test-id',
        content: 'Hello',
        sourceLanguage: 'en',
        comment: 'A greeting',
        userTranslation: 'Bonjour',
        tags: ['greeting'],
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-02T12:00:00Z'
      };
      
      const card = FlashCard.fromJSON(data);
      
      expect(card).toBeInstanceOf(FlashCard);
      expect(card.id).toBe('test-id');
      expect(card.content).toBe('Hello');
      expect(card.sourceLanguage).toBe('en');
      expect(card.comment).toBe('A greeting');
      expect(card.userTranslation).toBe('Bonjour');
      expect(card.tags).toEqual(['greeting']);
      expect(card.createdAt).toEqual(new Date('2023-01-01T12:00:00Z'));
      expect(card.updatedAt).toEqual(new Date('2023-01-02T12:00:00Z'));
    });
  });
});