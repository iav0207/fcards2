const { generateId } = require('../utils/helpers');

/**
 * FlashCard class representing a single flashcard in the application
 */
class FlashCard {
  /**
   * Create a new FlashCard
   * @param {Object} data - FlashCard data
   * @param {string} data.content - Word, phrase, or sentence
   * @param {string} data.sourceLanguage - ISO language code
   * @param {string} [data.comment] - Optional user comment
   * @param {string} [data.userTranslation] - Optional user-provided translation
   * @param {string[]} [data.tags] - Array of tags for organization
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.content = data.content || '';
    this.sourceLanguage = data.sourceLanguage || 'en';
    this.comment = data.comment || '';
    this.userTranslation = data.userTranslation || '';
    this.tags = data.tags || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Updates the flashcard data
   * @param {Object} data - FlashCard data to update
   */
  update(data = {}) {
    if (data.content !== undefined) this.content = data.content;
    if (data.sourceLanguage !== undefined) this.sourceLanguage = data.sourceLanguage;
    if (data.comment !== undefined) this.comment = data.comment;
    if (data.userTranslation !== undefined) this.userTranslation = data.userTranslation;
    if (data.tags !== undefined) this.tags = data.tags;
    this.updatedAt = new Date();
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      content: this.content,
      sourceLanguage: this.sourceLanguage,
      comment: this.comment,
      userTranslation: this.userTranslation,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Create a FlashCard instance from a plain object (from storage)
   * @param {Object} data - Plain object data
   * @returns {FlashCard} New FlashCard instance
   */
  static fromJSON(data) {
    return new FlashCard({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    });
  }
}

module.exports = FlashCard;