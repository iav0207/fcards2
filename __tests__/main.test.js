const path = require('path');

// Mock electron for testing
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    whenReady: jest.fn().mockReturnValue(Promise.resolve()),
    on: jest.fn()
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    webContents: {
      openDevTools: jest.fn()
    },
    on: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn()
  }
}));

// Mock DatabaseService for testing
jest.mock('../src/services/DatabaseService', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    close: jest.fn()
  }));
});

// More reliable tests without launching Electron UI
jest.setTimeout(10000); // Increase timeout for all tests

describe('Application configuration', () => {
  it('package.json has correct name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('fcardsweb2');
  });

  it('has electron as a dependency', () => {
    const pkg = require('../package.json');
    expect(pkg.devDependencies.electron).toBeDefined();
  });

  it('has main.js as entry point', () => {
    const pkg = require('../package.json');
    expect(pkg.main).toBe('main.js');
  });

  it('has better-sqlite3 as a dependency', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies['better-sqlite3']).toBeDefined();
  });
});

describe('Main process', () => {
  const electron = require('../main.js');

  it('exports required electron components', () => {
    expect(typeof electron).toBe('object');
    expect(electron.app).toBeDefined();
    expect(electron.BrowserWindow).toBeDefined();
    expect(electron.createWindow).toBeDefined();
    expect(electron.initializeDatabase).toBeDefined();
  });

  it('initializes database successfully', async () => {
    // Reset modules to ensure fresh imports
    jest.resetModules();

    // Import fresh instance
    const main = require('../main.js');

    // Call initialize database
    await main.initializeDatabase();

    // Verify DatabaseService was called
    const DatabaseService = require('../src/services/DatabaseService');
    expect(DatabaseService).toHaveBeenCalled();

    // Verify initialize was called
    const dbInstance = DatabaseService.mock.results[0].value;
    expect(dbInstance.initialize).toHaveBeenCalled();
  });
});