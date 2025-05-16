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
   * @returns {Promise<Session>} - Promise that resolves to the saved session
   */
  saveSession(session) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
      const json = session.toJSON();
      const query = `
        INSERT OR REPLACE INTO sessions (
          id, sourceLanguage, targetLanguage, cardIds, currentCardIndex,
          responses, createdAt, completedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      console.log('Saving session with id:', json.id);

      this.db.run(
        query,
        [
          json.id,
          json.sourceLanguage,
          json.targetLanguage,
          JSON.stringify(json.cardIds),
          json.currentCardIndex,
          JSON.stringify(json.responses),
          json.createdAt,
          json.completedAt
        ],
        (err) => {
          if (err) {
            console.error('Error saving session:', err);
            reject(err);
            return;
          }

          console.log('Session saved successfully:', json.id);
          resolve(session);
        }
      );
    });
  }

  /**
   * Get a session by its ID
   * @param {string} id - The session ID
   * @returns {Promise<Session|null>} - Promise that resolves to the session or null if not found
   */
  getSession(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    if (isEmpty(id)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM sessions WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error getting session:', err);
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        try {
          const session = Session.fromJSON({
            ...row,
            cardIds: JSON.parse(row.cardIds || '[]'),
            responses: JSON.parse(row.responses || '[]')
          });
          resolve(session);
        } catch (parseError) {
          console.error('Error parsing session data:', parseError);
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get all sessions
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only active (not completed) sessions
   * @param {boolean} [options.completedOnly] - Only completed sessions
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Results offset
   * @returns {Promise<Session[]>} - Promise that resolves to an array of sessions
   */
  getAllSessions(options = {}) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    return new Promise((resolve, reject) => {
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

      console.log('Running getAllSessions query:', query);
      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error getting sessions:', err);
          reject(err);
          return;
        }

        if (!rows || rows.length === 0) {
          console.log('No sessions found');
          resolve([]);
          return;
        }

        try {
          const sessions = rows.map(row => {
            // Ensure the row has all required properties
            return Session.fromJSON({
              ...row,
              cardIds: row.cardIds ? JSON.parse(row.cardIds) : [],
              responses: row.responses ? JSON.parse(row.responses) : []
            });
          });
          resolve(sessions);
        } catch (parseError) {
          console.error('Error parsing session data:', parseError);
          reject(parseError);
        }
      });
    });
  }

  /**
   * Delete a session by its ID
   * @param {string} id - The session ID
   * @returns {Promise<boolean>} - Promise that resolves to true if successful
   */
  deleteSession(id) {
    if (!this.initialized) {
      return Promise.reject(new Error('Database not initialized'));
    }

    if (isEmpty(id)) {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM sessions WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting session:', err);
          reject(err);
          return;
        }

        // 'this' context contains information about the operation
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = SessionRepository;