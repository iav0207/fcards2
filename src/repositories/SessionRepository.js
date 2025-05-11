const Session = require('../models/Session');
const { isEmpty } = require('../utils/helpers');

/**
 * Repository for Session entity operations
 */
class SessionRepository {
  /**
   * Creates a new SessionRepository instance
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
   * Save a session to the database
   * @param {Session} session - The session to save
   * @returns {Session} - The saved session
   */
  saveSession(session) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, sourceLanguage, targetLanguage, cardIds, currentCardIndex,
        responses, createdAt, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const json = session.toJSON();

    stmt.run(
      json.id,
      json.sourceLanguage,
      json.targetLanguage,
      JSON.stringify(json.cardIds),
      json.currentCardIndex,
      JSON.stringify(json.responses),
      json.createdAt,
      json.completedAt
    );

    return session;
  }

  /**
   * Get a session by its ID
   * @param {string} id - The session ID
   * @returns {Session|null} - The session or null if not found
   */
  getSession(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (isEmpty(id)) {
      return null;
    }

    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return null;
    }

    return Session.fromJSON({
      ...row,
      cardIds: JSON.parse(row.cardIds || '[]'),
      responses: JSON.parse(row.responses || '[]')
    });
  }

  /**
   * Get all sessions
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only active (not completed) sessions
   * @param {boolean} [options.completedOnly] - Only completed sessions
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {Session[]} - Array of sessions
   */
  getAllSessions(options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    let query = 'SELECT * FROM sessions';
    const params = [];
    const conditions = [];

    if (options.activeOnly) {
      conditions.push('completedAt IS NULL');
    }

    if (options.completedOnly) {
      conditions.push('completedAt IS NOT NULL');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC';

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

    return rows.map(row => Session.fromJSON({
      ...row,
      cardIds: JSON.parse(row.cardIds || '[]'),
      responses: JSON.parse(row.responses || '[]')
    }));
  }

  /**
   * Delete a session by its ID
   * @param {string} id - The session ID
   * @returns {boolean} - True if successful
   */
  deleteSession(id) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (isEmpty(id)) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }
}

module.exports = SessionRepository;