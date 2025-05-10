/**
 * Generates a unique ID
 * @returns {string} A unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Checks if a string is empty
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is empty or only whitespace
 */
function isEmpty(str) {
  return !str || str.trim() === '';
}

/**
 * Formats a date to a readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

module.exports = {
  generateId,
  isEmpty,
  formatDate
};