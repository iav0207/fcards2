/**
 * Utility for handling environment variables and configuration
 */

/**
 * Get environment variables for the application
 * In Electron, this would run in the main process
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig() {
  return {
    // Translation API settings
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    
    // App settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Feature flags
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true' || false,
    
    // Other configuration
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10)
  };
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
function isDevelopment() {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Check if necessary API keys are available
 * @returns {Object} Object with availability info
 */
function checkApiKeysAvailability() {
  const config = getEnvironmentConfig();
  
  return {
    gemini: Boolean(config.GEMINI_API_KEY),
    openai: Boolean(config.OPENAI_API_KEY),
    hasAnyTranslationApi: Boolean(config.GEMINI_API_KEY || config.OPENAI_API_KEY)
  };
}

module.exports = {
  getEnvironmentConfig,
  isDevelopment,
  checkApiKeysAvailability
};