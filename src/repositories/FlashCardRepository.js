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
   * @returns {Promise<FlashCard>} - Promise that resolves to the saved flashcard
   */
  saveFlashCard(flashcard) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
      const json = flashcard.toJSON();
      const query = `
        INSERT OR REPLACE INTO flashcards (
          id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      console.log('Saving flashcard with id:', json.id);

      this.db.run(
        query,
        [
          json.id,
          json.content,
          json.sourceLanguage,
          json.comment,
          json.userTranslation,
          JSON.stringify(json.tags),
          json.createdAt,
          json.updatedAt
        ],
        (err) => {
          if (err) {
            console.error('Error saving flashcard:', err);
            reject(err);
            return;
          }

          console.log('Flashcard saved successfully:', json.id);
          resolve(flashcard);
        }
      );
    });
  }

  /**
   * Get a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {Promise<FlashCard|null>} - Promise resolving to the flashcard or null if not found
   */
  getFlashCard(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    if (isEmpty(id)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM flashcards WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error getting flashcard:', err);
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        try {
          const flashcard = FlashCard.fromJSON({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : []
          });
          resolve(flashcard);
        } catch (parseError) {
          console.error('Error parsing flashcard data:', parseError);
          reject(parseError);
        }
      });
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
   * @returns {Promise<FlashCard[]>} - Promise that resolves to an array of flashcards
   */
  getAllFlashCards(options = {}) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
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

    return new Promise((resolve, reject) => {
      console.log('Running getAllFlashCards query:', query, params);
      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error getting flashcards:', err);
          reject(err);
          return;
        }

        if (!rows || rows.length === 0) {
          console.log('No flashcards found');
          resolve([]);
          return;
        }

        try {
          const flashcards = rows.map(row => {
            return FlashCard.fromJSON({
              ...row,
              tags: row.tags ? JSON.parse(row.tags) : []
            });
          });
          console.log(`Found ${flashcards.length} flashcards`);
          resolve(flashcards);
        } catch (parseError) {
          console.error('Error parsing flashcard data:', parseError);
          reject(parseError);
        }
      });
    });
  }

  /**
   * Delete a flashcard by its ID
   * @param {string} id - The flashcard ID
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  deleteFlashCard(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    if (isEmpty(id)) {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM flashcards WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting flashcard:', err);
          reject(err);
          return;
        }

        // this.changes refers to the number of rows affected by the query
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = FlashCardRepository;