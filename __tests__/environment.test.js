const { getEnvironmentConfig, isDevelopment, checkApiKeysAvailability } = require('../src/utils/environment');

describe('Environment Utilities', () => {
  // Store original environment
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset the env between tests
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env after all tests
    process.env = originalEnv;
  });

  /**
   * Helper function to run a test with a temporarily modified environment
   * @param {Object} envVars - Environment variables to set
   * @param {Function} testFn - Test function to run
   * @returns {any} The result of the test function
   */
  function withEnv(envVars, testFn) {
    // Save original values
    const originalValues = {};

    // Set environment variables
    Object.keys(envVars).forEach(key => {
      originalValues[key] = process.env[key];
      if (envVars[key] === null) {
        delete process.env[key];
      } else {
        process.env[key] = envVars[key];
      }
    });

    try {
      // Run the test function
      return testFn();
    } finally {
      // Restore original values
      Object.keys(originalValues).forEach(key => {
        if (originalValues[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = originalValues[key];
        }
      });
    }
  }

  describe('getEnvironmentConfig', () => {
    it('returns default values when environment variables are not set', () => {
      // Use our helper function to temporarily modify the environment
      // Explicitly unset API keys and other variables
      withEnv({
        NODE_ENV: null,
        GEMINI_API_KEY: null,
        OPENAI_API_KEY: null,
        ENABLE_ANALYTICS: null,
        API_TIMEOUT: null
      }, () => {
        const config = getEnvironmentConfig();

        expect(config.GEMINI_API_KEY).toBe('');
        expect(config.OPENAI_API_KEY).toBe('');
        expect(config.NODE_ENV).toBe('development');
        expect(config.ENABLE_ANALYTICS).toBe(false);
        expect(config.API_TIMEOUT).toBe(30000);
      });
    });
    
    it('returns values from environment variables when set', () => {
      withEnv({
        GEMINI_API_KEY: 'test-gemini-key',
        OPENAI_API_KEY: 'test-openai-key',
        NODE_ENV: 'production',
        ENABLE_ANALYTICS: 'true',
        API_TIMEOUT: '60000'
      }, () => {
        const config = getEnvironmentConfig();

        expect(config.GEMINI_API_KEY).toBe('test-gemini-key');
        expect(config.OPENAI_API_KEY).toBe('test-openai-key');
        expect(config.NODE_ENV).toBe('production');
        expect(config.ENABLE_ANALYTICS).toBe(true);
        expect(config.API_TIMEOUT).toBe(60000);
      });
    });

    it('parses numeric values correctly', () => {
      withEnv({ API_TIMEOUT: '15000' }, () => {
        const config = getEnvironmentConfig();

        expect(config.API_TIMEOUT).toBe(15000);
      });
    });
  });

  describe('isDevelopment', () => {
    it('returns true when NODE_ENV is not production', () => {
      withEnv({ NODE_ENV: 'development' }, () => {
        expect(isDevelopment()).toBe(true);
      });

      withEnv({ NODE_ENV: 'test' }, () => {
        expect(isDevelopment()).toBe(true);
      });

      withEnv({ NODE_ENV: null }, () => {
        expect(isDevelopment()).toBe(true);
      });
    });

    it('returns false when NODE_ENV is production', () => {
      withEnv({ NODE_ENV: 'production' }, () => {
        expect(isDevelopment()).toBe(false);
      });
    });
  });

  describe('checkApiKeysAvailability', () => {
    it('detects when Gemini API key is available', () => {
      withEnv({
        GEMINI_API_KEY: 'test-key',
        OPENAI_API_KEY: null
      }, () => {
        const availability = checkApiKeysAvailability();

        expect(availability.gemini).toBe(true);
        expect(availability.openai).toBe(false);
        expect(availability.hasAnyTranslationApi).toBe(true);
      });
    });

    it('detects when OpenAI API key is available', () => {
      withEnv({
        GEMINI_API_KEY: null,
        OPENAI_API_KEY: 'test-key'
      }, () => {
        const availability = checkApiKeysAvailability();

        expect(availability.gemini).toBe(false);
        expect(availability.openai).toBe(true);
        expect(availability.hasAnyTranslationApi).toBe(true);
      });
    });

    it('detects when both API keys are available', () => {
      withEnv({
        GEMINI_API_KEY: 'test-gemini-key',
        OPENAI_API_KEY: 'test-openai-key'
      }, () => {
        const availability = checkApiKeysAvailability();

        expect(availability.gemini).toBe(true);
        expect(availability.openai).toBe(true);
        expect(availability.hasAnyTranslationApi).toBe(true);
      });
    });

    it('detects when no API keys are available', () => {
      withEnv({
        GEMINI_API_KEY: null,
        OPENAI_API_KEY: null
      }, () => {
        const availability = checkApiKeysAvailability();

        expect(availability.gemini).toBe(false);
        expect(availability.openai).toBe(false);
        expect(availability.hasAnyTranslationApi).toBe(false);
      });
    });
  });
});