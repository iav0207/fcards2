/**
 * Error handling utility for the application
 * Manages consistent error structures and IPC communication
 */

/**
 * Create an error object with consistent structure
 * @param {string} title - Short error title
 * @param {string} message - Detailed error message
 * @param {string} [source='app'] - Error source (e.g., 'database', 'translation')
 * @param {string} [type='error'] - Error type (e.g., 'error', 'warning')
 * @param {string|Object} [details=null] - Additional error details or stack trace
 * @returns {Object} Structured error object
 */
function createError(title, message, source = 'app', type = 'error', details = null) {
  return {
    title,
    message,
    source,
    type,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Send an error to the renderer process via IPC
 * @param {Object} window - BrowserWindow instance
 * @param {Object} error - Error object (from createError)
 */
function sendErrorToRenderer(window, error) {
  if (window && !window.isDestroyed()) {
    window.webContents.send('flashcards:error', error);
  }
}

/**
 * Create and send an error to the renderer
 * @param {Object} window - BrowserWindow instance
 * @param {string} title - Short error title
 * @param {string} message - Detailed error message
 * @param {string} [source='app'] - Error source
 * @param {string} [type='error'] - Error type
 * @param {string|Object} [details=null] - Additional error details
 */
function handleError(window, title, message, source = 'app', type = 'error', details = null) {
  const error = createError(title, message, source, type, details);
  console.error(`[${source}] ${title}: ${message}`, details || '');
  sendErrorToRenderer(window, error);
  return error;
}

/**
 * Create an error from a caught exception with source context
 * @param {Error} error - The caught error
 * @param {string} source - Error source
 * @param {string} [context='operation'] - Context description
 * @returns {Object} Structured error object
 */
function createErrorFromException(error, source, context = 'operation') {
  return createError(
    `Error in ${source}`,
    `Failed to perform ${context}: ${error.message}`,
    source,
    'error',
    error.stack
  );
}

/**
 * Handle a caught exception with source context
 * @param {Object} window - BrowserWindow instance
 * @param {Error} error - The caught error
 * @param {string} source - Error source
 * @param {string} [context='operation'] - Context description
 */
function handleException(window, error, source, context = 'operation') {
  const structuredError = createErrorFromException(error, source, context);
  sendErrorToRenderer(window, structuredError);
  return structuredError;
}

module.exports = {
  createError,
  sendErrorToRenderer,
  handleError,
  createErrorFromException,
  handleException
};