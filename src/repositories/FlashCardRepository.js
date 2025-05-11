const FlashCard = require('../models/FlashCard');
const { isEmpty } = require('../utils/helpers');

/**
 * Repository for FlashCard entity operations
 */
class FlashCardRepository {
  /**
   * Creates a new FlashCardRepository instance
   * @param {Object} db - The database instance
   * @param {boolean} initialized - Whether the database is initialized
   */
  constructor(db, initialized = false) {
    this.db = db;
    this.initialized = initialized;
  }

  /**
   * Set the initialized state of the repository
   * @param {boolean} initialized - Whether the database is initialized
   */
  setInitialized(initialized) {
    this.initialized = initialized;
  }

  /**
   * Save a flashcard to the database
   * @param {FlashCard} flashcard - The flashcard to save
   * @returns {FlashCard} - The saved flashcard
   */
  saveFlashCard(flashcard) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO flashcards (
        id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const json = flashcard.toJSON();

    stmt.run(
      json.id,
      json.content,
      json.sourceLanguage,
      json.comment,
      json.userTranslation,
      JSON.stringify(json.tags),
      json.createdAt,
      json.updatedAt
    );

    return flashcard;
  }

  /**
   * Get a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {FlashCard|null} - The flashcard or null if not found
   */
  getFlashCard(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (isEmpty(id)) {
      return null;
    }

    const stmt = this.db.prepare('SELECT * FROM flashcards WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return null;
    }

    return FlashCard.fromJSON({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    });
  }

  /**
   * Get all flashcards
   * @param {Object} options - Query options
   * @param {string} [options.sourceLanguage] - Filter by source language
   * @param {string|string[]} [options.tags] - Filter by one or more tags
   * @param {boolean} [options.includeUntagged] - Whether to include cards with no tags
   * @param {string} [options.tag] - Filter by a single tag (legacy, use tags instead)
   * @param {string} [options.searchTerm] - Search in content or comments
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {FlashCard[]} - Array of flashcards
   */
  getAllFlashCards(options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Handle multiple filtering options for tags
    const useLegacyTagFilter = !!options.tag && !options.tags;
    const hasMultipleTags = options.tags && Array.isArray(options.tags) && options.tags.length > 0;
    const includeUntagged = !!options.includeUntagged;

    // Start building the query
    let query = 'SELECT * FROM flashcards';
    const params = [];
    const conditions = [];

    if (options.sourceLanguage) {
      conditions.push('sourceLanguage = ?');
      params.push(options.sourceLanguage);
    }

    // Legacy single tag filter
    if (useLegacyTagFilter) {
      conditions.push('tags LIKE ?');
      params.push(`%"${options.tag}"%`);
    }
    // Multi-tag filtering
    else if (hasMultipleTags || includeUntagged) {
      const tagConditions = [];

      // Add condition for each tag
      if (hasMultipleTags) {
        options.tags.forEach(tag => {
          tagConditions.push('tags LIKE ?');
          params.push(`%"${tag}"%`);
        });
      }

      // Add condition for untagged cards
      if (includeUntagged) {
        tagConditions.push('(tags IS NULL OR tags = ? OR tags = ?)');
        params.push('[]', '');
      }

      // Combine tag conditions with OR
      if (tagConditions.length > 0) {
        conditions.push(`(${tagConditions.join(' OR ')})`);
      }
    }

    if (options.searchTerm) {
      conditions.push('(content LIKE ? OR comment LIKE ?)');
      params.push(`%${options.searchTerm}%`, `%${options.searchTerm}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updatedAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => FlashCard.fromJSON({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  /**
   * Delete a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {boolean} - True if successful
   */
  deleteFlashCard(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (isEmpty(id)) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM flashcards WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }
}

module.exports = FlashCardRepository;