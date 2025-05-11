/**
 * Tests for the errorHandler utility
 */
const errorHandler = require('../src/utils/errorHandler');

describe('Error Handler', () => {
  describe('createError', () => {
    it('should create a properly structured error object', () => {
      const error = errorHandler.createError(
        'Test Error',
        'This is a test error message',
        'test-source',
        'error',
        'Error details'
      );

      expect(error).toEqual(expect.objectContaining({
        title: 'Test Error',
        message: 'This is a test error message',
        source: 'test-source',
        type: 'error',
        details: 'Error details'
      }));

      // Check that timestamp exists and is in ISO format
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
    });

    it('should use default values when optional params are not provided', () => {
      const error = errorHandler.createError('Test Error', 'This is a test error message');

      expect(error).toEqual(expect.objectContaining({
        title: 'Test Error',
        message: 'This is a test error message',
        source: 'app',
        type: 'error',
        details: null
      }));
    });

    it('should convert object details to JSON string', () => {
      const details = { key: 'value', nested: { prop: true } };
      const error = errorHandler.createError(
        'Test Error',
        'This is a test error message',
        'test-source',
        'error',
        details
      );

      expect(error.details).toBe(JSON.stringify(details, null, 2));
    });
  });

  describe('createErrorFromException', () => {
    it('should create a structured error from an exception', () => {
      const originalError = new Error('Original error message');
      originalError.stack = 'Error: Original error message\n    at someFunction';

      const error = errorHandler.createErrorFromException(
        originalError,
        'test-source',
        'test operation'
      );

      expect(error).toEqual(expect.objectContaining({
        title: 'Error in test-source',
        message: 'Failed to perform test operation: Original error message',
        source: 'test-source',
        type: 'error',
        details: originalError.stack
      }));
    });

    it('should use default context when not provided', () => {
      const originalError = new Error('Original error message');
      
      const error = errorHandler.createErrorFromException(
        originalError,
        'test-source'
      );

      expect(error.message).toBe('Failed to perform operation: Original error message');
    });
  });

  describe('sendErrorToRenderer', () => {
    it('should not throw when window is not provided', () => {
      expect(() => {
        errorHandler.sendErrorToRenderer(null, { title: 'Test Error' });
      }).not.toThrow();
    });

    it('should not throw when window is destroyed', () => {
      const mockWindow = {
        isDestroyed: () => true,
        webContents: {
          send: jest.fn()
        }
      };

      expect(() => {
        errorHandler.sendErrorToRenderer(mockWindow, { title: 'Test Error' });
      }).not.toThrow();
      
      expect(mockWindow.webContents.send).not.toHaveBeenCalled();
    });

    it('should send error to renderer when window is valid', () => {
      const mockWindow = {
        isDestroyed: () => false,
        webContents: {
          send: jest.fn()
        }
      };

      const error = { title: 'Test Error' };
      errorHandler.sendErrorToRenderer(mockWindow, error);
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('flashcards:error', error);
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      console.error = jest.fn();
    });

    it('should log error to console and send to renderer', () => {
      const mockWindow = {
        isDestroyed: () => false,
        webContents: {
          send: jest.fn()
        }
      };

      const result = errorHandler.handleError(
        mockWindow,
        'Test Error',
        'This is a test error message',
        'test-source'
      );

      expect(console.error).toHaveBeenCalledWith(
        '[test-source] Test Error: This is a test error message', 
        ''
      );
      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'flashcards:error',
        expect.objectContaining({
          title: 'Test Error',
          message: 'This is a test error message',
          source: 'test-source'
        })
      );
      expect(result).toEqual(expect.objectContaining({
        title: 'Test Error',
        message: 'This is a test error message'
      }));
    });
  });

  describe('handleException', () => {
    beforeEach(() => {
      console.error = jest.fn();
    });

    it('should create an error from exception and send to renderer', () => {
      const mockWindow = {
        isDestroyed: () => false,
        webContents: {
          send: jest.fn()
        }
      };

      const originalError = new Error('Original error message');
      
      const result = errorHandler.handleException(
        mockWindow,
        originalError,
        'test-source',
        'test operation'
      );

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'flashcards:error',
        expect.objectContaining({
          title: 'Error in test-source',
          message: 'Failed to perform test operation: Original error message',
          source: 'test-source'
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        title: 'Error in test-source',
        message: 'Failed to perform test operation: Original error message'
      }));
    });
  });
});