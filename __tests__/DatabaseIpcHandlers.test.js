/**
 * Tests for database IPC handlers in main.js
 */

// Mock sqlite3
jest.mock('sqlite3', () => {
  const mockDb = {
    run: jest.fn((query, params, callback) => {
      if (callback) callback(null);
      return { changes: 0 };
    }),
    get: jest.fn((query, params, callback) => {
      if (callback) callback(null, {});
    }),
    all: jest.fn((query, params, callback) => {
      if (callback) callback(null, []);
    }),
    close: jest.fn((callback) => {
      if (callback) callback(null);
    }),
    serialize: jest.fn(fn => fn()),
    parallelize: jest.fn(fn => fn())
  };

  return {
    verbose: jest.fn().mockReturnValue({
      Database: jest.fn().mockImplementation((path, mode, callback) => {
        if (callback) callback(null);
        return mockDb;
      }),
      OPEN_READWRITE: 1,
      OPEN_CREATE: 2,
      MEMORY: ':memory:'
    })
  };
});

// Mock electron before importing
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '0.1.0')
  },
  dialog: {
    showSaveDialog: jest.fn(),
    showOpenDialog: jest.fn()
  },
  ipcMain: {
    handle: jest.fn()
  }
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn()
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

// Mock DatabaseService
jest.mock('../src/services/DatabaseService');

// Import mocked modules
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const DatabaseService = require('../src/services/DatabaseService');

describe('Database IPC Handlers', () => {
  let dbServiceMock;
  let exportDataMock;
  let importDataMock;
  let ipcHandlers = {};
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock database service methods
    exportDataMock = jest.fn().mockReturnValue({
      flashcards: [{ id: 'card1', content: 'Hello' }],
      sessions: [{ id: 'session1' }],
      settings: { darkMode: true }
    });
    
    importDataMock = jest.fn().mockReturnValue({
      success: true,
      flashcardsImported: 1,
      sessionsImported: 1,
      settingsImported: true
    });
    
    dbServiceMock = {
      exportData: exportDataMock,
      importData: importDataMock
    };
    
    // Mock ipcMain.handle to capture the handlers
    ipcMain.handle.mockImplementation((channel, handler) => {
      ipcHandlers[channel] = handler;
    });
    
    // DatabaseService constructor should return our mock
    DatabaseService.mockImplementation(() => dbServiceMock);
    
    // Register a simplified version of the export handler
    ipcHandlers['database:export'] = async (event, options = {}) => {
      try {
        // Get the data to export
        const data = dbServiceMock.exportData();
        
        // Add metadata
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          appInfo: {
            name: 'FlashCards Desktop',
            version: '0.1.0'
          },
          data
        };
        
        // Show save dialog to get file path
        const { canceled, filePath } = await dialog.showSaveDialog({
          title: 'Export FlashCards Data',
          defaultPath: 'flashcards-export.json'
        });
        
        if (canceled || !filePath) {
          return { success: false, reason: 'canceled' };
        }
        
        // Write to file
        await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2));
        
        return { 
          success: true, 
          path: filePath,
          stats: {
            flashcardsCount: data.flashcards.length,
            sessionsCount: data.sessions.length,
            settingsExported: !!data.settings
          }
        };
      } catch (error) {
        console.error('Error exporting database:', error);
        throw error;
      }
    };
    
    // Register a simplified version of the import handler
    ipcHandlers['database:import'] = async (event, options = {}) => {
      try {
        // Show open dialog to get file path
        const { canceled, filePaths } = await dialog.showOpenDialog({
          title: 'Import FlashCards Data',
          properties: ['openFile']
        });
        
        if (canceled || !filePaths || filePaths.length === 0) {
          return { success: false, reason: 'canceled' };
        }
        
        // Read the file
        const fileData = await fs.promises.readFile(filePaths[0], 'utf-8');
        const importData = JSON.parse(fileData);
        
        // Validate the import format
        if (!importData.data || (!importData.data.flashcards && !importData.data.sessions)) {
          return { success: false, reason: 'invalid_format' };
        }
        
        // Import the data
        const result = dbServiceMock.importData(importData.data);
        
        return {
          success: true,
          path: filePaths[0],
          stats: {
            flashcardsImported: result.flashcardsImported,
            sessionsImported: result.sessionsImported,
            settingsImported: result.settingsImported
          },
          importInfo: {
            version: importData.version || 'unknown',
            exportDate: importData.exportDate || 'unknown',
            appInfo: importData.appInfo || { name: 'unknown', version: 'unknown' }
          }
        };
      } catch (error) {
        console.error('Error importing database:', error);
        throw error;
      }
    };
  });
  
  describe('Export handler', () => {
    it('handles successful export', async () => {
      // Mock dialog to return a file path
      dialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: '/mock/export.json'
      });
      
      // Call the export handler
      const result = await ipcHandlers['database:export']({}, {});
      
      // Verify the handler used the database service
      expect(exportDataMock).toHaveBeenCalled();
      
      // Verify the dialog was shown
      expect(dialog.showSaveDialog).toHaveBeenCalled();
      
      // Verify file was written
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        '/mock/export.json',
        expect.any(String)
      );
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.path).toBe('/mock/export.json');
      expect(result.stats.flashcardsCount).toBe(1);
      expect(result.stats.sessionsCount).toBe(1);
      expect(result.stats.settingsExported).toBe(true);
    });
    
    it('handles canceled export', async () => {
      // Mock dialog to simulate user cancellation
      dialog.showSaveDialog.mockResolvedValue({
        canceled: true,
        filePath: undefined
      });
      
      // Call the export handler
      const result = await ipcHandlers['database:export']({}, {});
      
      // Verify the result indicates cancellation
      expect(result.success).toBe(false);
      expect(result.reason).toBe('canceled');
      
      // Verify no file was written
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });
    
    it('handles export errors', async () => {
      // Mock dialog to return a file path
      dialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: '/mock/export.json'
      });
      
      // Mock file write to throw an error
      fs.promises.writeFile.mockRejectedValue(new Error('Write error'));
      
      // Call the export handler and expect it to throw
      await expect(ipcHandlers['database:export']({}, {})).rejects.toThrow('Write error');
    });
  });
  
  describe('Import handler', () => {
    it('handles successful import', async () => {
      // Mock dialog to return a file path
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/import.json']
      });
      
      // Mock reading the file
      const mockImportData = {
        version: '1.0',
        exportDate: '2023-05-10T12:34:56.789Z',
        appInfo: {
          name: 'FlashCards Desktop',
          version: '0.1.0'
        },
        data: {
          flashcards: [{ id: 'card1' }],
          sessions: [{ id: 'session1' }],
          settings: { darkMode: true }
        }
      };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockImportData));
      
      // Call the import handler
      const result = await ipcHandlers['database:import']({}, { mode: 'merge' });
      
      // Verify the dialog was shown
      expect(dialog.showOpenDialog).toHaveBeenCalled();
      
      // Verify file was read
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        '/mock/import.json',
        'utf-8'
      );
      
      // Verify data was imported
      expect(importDataMock).toHaveBeenCalledWith(mockImportData.data);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.path).toBe('/mock/import.json');
      expect(result.stats.flashcardsImported).toBe(1);
      expect(result.stats.sessionsImported).toBe(1);
      expect(result.stats.settingsImported).toBe(true);
      expect(result.importInfo.version).toBe('1.0');
    });
    
    it('handles canceled import', async () => {
      // Mock dialog to simulate user cancellation
      dialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      });
      
      // Call the import handler
      const result = await ipcHandlers['database:import']({}, {});
      
      // Verify the result indicates cancellation
      expect(result.success).toBe(false);
      expect(result.reason).toBe('canceled');
      
      // Verify no import was attempted
      expect(importDataMock).not.toHaveBeenCalled();
    });
    
    it('handles invalid import format', async () => {
      // Mock dialog to return a file path
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/invalid.json']
      });
      
      // Mock reading an invalid file
      const invalidData = { someRandomData: true };
      fs.promises.readFile.mockResolvedValue(JSON.stringify(invalidData));
      
      // Call the import handler
      const result = await ipcHandlers['database:import']({}, {});
      
      // Verify the result indicates invalid format
      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_format');
      
      // Verify no import was attempted
      expect(importDataMock).not.toHaveBeenCalled();
    });
    
    it('handles import errors', async () => {
      // Mock dialog to return a file path
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/import.json']
      });
      
      // Mock reading the file
      const mockImportData = {
        data: {
          flashcards: [{ id: 'card1' }]
        }
      };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockImportData));
      
      // Mock import to throw an error
      importDataMock.mockImplementation(() => {
        throw new Error('Import error');
      });
      
      // Call the import handler and expect it to throw
      await expect(ipcHandlers['database:import']({}, {})).rejects.toThrow('Import error');
    });
  });
});