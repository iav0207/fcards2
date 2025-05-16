/**
 * Simple test for database initialization
 */

const DatabaseService = require('../src/services/DatabaseService');

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path')
  }
}));

// Mock fs for file operations
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
  };
});

describe('Database Initialization Test', () => {
  it('initializes correctly with in-memory database', () => {
    console.log('Starting initialization test');
    const db = new DatabaseService({ inMemory: true });
    
    return db.initialize().then(result => {
      console.log('Database initialized successfully:', result);
      expect(result).toBe(true);
      
      // Close db connection
      if (db.db) {
        db.close();
      }
    });
  }, 10000); // Increase timeout to 10 seconds
});