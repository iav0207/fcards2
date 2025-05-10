const { generateId, isEmpty, formatDate } = require('../src/utils/helpers');

describe('Helper Functions', () => {
  describe('generateId', () => {
    it('returns a string', () => {
      expect(typeof generateId()).toBe('string');
    });

    it('returns unique values', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isEmpty', () => {
    it('returns true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('returns true for strings with only whitespace', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('returns true for null or undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty('  hello  ')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('formats a date correctly', () => {
      const testDate = new Date('2023-01-15');
      const formatted = formatDate(testDate);
      
      // This test is flexible because formatting depends on locale
      expect(formatted).toContain('2023');
      expect(formatted.length).toBeGreaterThan(5);
    });

    it('returns an empty string for invalid dates', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('not a date')).toBe('');
      expect(formatDate(123)).toBe('');
    });
  });
});