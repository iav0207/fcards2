/**
 * Repository for tag-related operations
 */
class TagRepository {
  /**
   * Creates a new TagRepository instance
   * @param {Object} db - The database instance
   * @param {Object} flashCardRepository - The FlashCardRepository instance
   * @param {boolean} initialized - Whether the database is initialized
   */
  constructor(db, flashCardRepository, initialized = false) {
    this.db = db;
    this.flashCardRepository = flashCardRepository;
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
   * Get available tags for a given source language
   * @param {string} sourceLanguage - Source language to filter tags by
   * @returns {Object} - Available tags and counts
   */
  getAvailableTags(sourceLanguage) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // If no source language is provided, return empty result
    if (!sourceLanguage) {
      return {
        tags: [],
        untaggedCount: 0
      };
    }

    // First get all cards for this language
    const allCards = this.flashCardRepository.getAllFlashCards({ sourceLanguage });

    // Create a map to count occurrences of each tag
    const tagCounts = new Map();
    let untaggedCount = 0;

    // Count all tag occurrences
    allCards.forEach(card => {
      if (!card.tags || card.tags.length === 0) {
        untaggedCount++;
      } else {
        card.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0;
          tagCounts.set(tag, count + 1);
        });
      }
    });

    // Convert to the result format
    const tagsWithCounts = Array.from(tagCounts.entries()).map(([tag, count]) => ({
      tag,
      count
    }));

    // Sort by tag name
    tagsWithCounts.sort((a, b) => a.tag.localeCompare(b.tag));

    return {
      tags: tagsWithCounts,
      untaggedCount
    };
  }
}

module.exports = TagRepository;