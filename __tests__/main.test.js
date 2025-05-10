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
  },
  dialog: {
    showOpenDialog: jest.fn().mockResolvedValue({ filePaths: ['/mock/file.json'], canceled: false }),
    showSaveDialog: jest.fn().mockResolvedValue({ filePath: '/mock/file.json', canceled: false })
  }
}));

// Mock DatabaseService for testing
jest.mock('../src/services/DatabaseService', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    close: jest.fn()
  }));
});

// Mock TranslationService for testing
jest.mock('../src/services/TranslationService', () => {
  const mockService = jest.fn().mockImplementation(options => ({
    evaluateTranslation: jest.fn(),
    generateTranslation: jest.fn(),
    settings: {
      translationApiProvider: options?.apiProvider || 'gemini',
      translationApiKey: options?.apiKey || ''
    }
  }));

  return mockService;
});

// Mock SessionService for testing
jest.mock('../src/services/SessionService', () => {
  return jest.fn().mockImplementation(() => ({
    createSession: jest.fn(),
    getCurrentCard: jest.fn(),
    submitAnswer: jest.fn(),
    advanceSession: jest.fn(),
    getSessionStats: jest.fn()
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
    expect(electron.initializeServices).toBeDefined();
  });

  it('initializes services successfully', async () => {
    // Reset modules to ensure fresh imports
    jest.resetModules();

    // Import fresh instance
    const main = require('../main.js');

    // Call initialize services
    await main.initializeServices();

    // Verify services were initialized
    const DatabaseService = require('../src/services/DatabaseService');
    const TranslationService = require('../src/services/TranslationService');
    const SessionService = require('../src/services/SessionService');

    expect(DatabaseService).toHaveBeenCalled();
    expect(TranslationService).toHaveBeenCalled();
    expect(SessionService).toHaveBeenCalled();

    // Verify database was initialized
    const dbInstance = DatabaseService.mock.results[0].value;
    expect(dbInstance.initialize).toHaveBeenCalled();
  });

  describe('Translation provider selection', () => {
    // Mock environment utility for testing
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset modules for each test
      jest.resetModules();

      // Mock environment utility
      jest.mock('../src/utils/environment', () => ({
        getEnvironmentConfig: jest.fn().mockReturnValue({
          GEMINI_API_KEY: '',
          OPENAI_API_KEY: '',
          NODE_ENV: 'test'
        }),
        checkApiKeysAvailability: jest.fn().mockReturnValue({
          gemini: false,
          openai: false,
          hasAnyTranslationApi: false
        }),
        isDevelopment: jest.fn().mockReturnValue(true)
      }));

      // Clear mocks
      const TranslationService = require('../src/services/TranslationService');
      TranslationService.mockClear();
    });

    afterAll(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('initializes with Gemini API when available', async () => {
      // Mock environment utility to return Gemini API key
      const environment = require('../src/utils/environment');
      environment.getEnvironmentConfig.mockReturnValue({
        GEMINI_API_KEY: 'mock-gemini-key',
        OPENAI_API_KEY: '',
        NODE_ENV: 'test'
      });

      environment.checkApiKeysAvailability.mockReturnValue({
        gemini: true,
        openai: false,
        hasAnyTranslationApi: true
      });

      // Initialize services
      const main = require('../main.js');
      await main.initializeServices();

      // Verify TranslationService was initialized with Gemini
      const TranslationService = require('../src/services/TranslationService');
      expect(TranslationService).toHaveBeenCalledWith(expect.objectContaining({
        apiProvider: 'gemini',
        apiKey: 'mock-gemini-key'
      }));
    });

    it('initializes with OpenAI API when Gemini is not available', async () => {
      // Mock environment utility to return OpenAI API key only
      const environment = require('../src/utils/environment');
      environment.getEnvironmentConfig.mockReturnValue({
        GEMINI_API_KEY: '',
        OPENAI_API_KEY: 'mock-openai-key',
        NODE_ENV: 'test'
      });

      environment.checkApiKeysAvailability.mockReturnValue({
        gemini: false,
        openai: true,
        hasAnyTranslationApi: true
      });

      // Initialize services
      const main = require('../main.js');
      await main.initializeServices();

      // Verify TranslationService was initialized with OpenAI
      const TranslationService = require('../src/services/TranslationService');
      expect(TranslationService).toHaveBeenCalledWith(expect.objectContaining({
        apiProvider: 'openai',
        apiKey: 'mock-openai-key'
      }));
    });

    it('initializes with default implementation when no API keys are available', async () => {
      // Mock environment utility to return no API keys
      const environment = require('../src/utils/environment');
      environment.getEnvironmentConfig.mockReturnValue({
        GEMINI_API_KEY: '',
        OPENAI_API_KEY: '',
        NODE_ENV: 'test'
      });

      environment.checkApiKeysAvailability.mockReturnValue({
        gemini: false,
        openai: false,
        hasAnyTranslationApi: false
      });

      // Initialize services
      const main = require('../main.js');
      await main.initializeServices();

      // Verify TranslationService was initialized with default options
      const TranslationService = require('../src/services/TranslationService');
      expect(TranslationService).toHaveBeenCalledWith();
    });

    it('prefers Gemini when both APIs are available', async () => {
      // Mock environment utility to return both API keys
      const environment = require('../src/utils/environment');
      environment.getEnvironmentConfig.mockReturnValue({
        GEMINI_API_KEY: 'mock-gemini-key',
        OPENAI_API_KEY: 'mock-openai-key',
        NODE_ENV: 'test'
      });

      environment.checkApiKeysAvailability.mockReturnValue({
        gemini: true,
        openai: true,
        hasAnyTranslationApi: true
      });

      // Initialize services
      const main = require('../main.js');
      await main.initializeServices();

      // Verify TranslationService was initialized with Gemini (preferred)
      const TranslationService = require('../src/services/TranslationService');
      expect(TranslationService).toHaveBeenCalledWith(expect.objectContaining({
        apiProvider: 'gemini',
        apiKey: 'mock-gemini-key'
      }));
    });
  });
});