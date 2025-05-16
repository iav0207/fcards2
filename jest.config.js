module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Allow test files to specify their own environment with docblocks
  // Example: /** @jest-environment jsdom */ at the top of the file
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};