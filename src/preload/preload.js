const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('flashcards', {
  // FlashCard operations
  saveFlashCard: (cardData) => ipcRenderer.invoke('flashcard:save', cardData),
  getFlashCard: (id) => ipcRenderer.invoke('flashcard:get', id),
  getAllFlashCards: (options) => ipcRenderer.invoke('flashcard:getAll', options),
  deleteFlashCard: (id) => ipcRenderer.invoke('flashcard:delete', id),
  
  // Session operations
  saveSession: (sessionData) => ipcRenderer.invoke('session:save', sessionData),
  getSession: (id) => ipcRenderer.invoke('session:get', id),
  getAllSessions: (options) => ipcRenderer.invoke('session:getAll', options),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),
  
  // Settings operations
  saveSettings: (settingsData) => ipcRenderer.invoke('settings:save', settingsData),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  
  // Database operations
  getDatabaseStats: () => ipcRenderer.invoke('database:stats'),
  exportDatabase: () => ipcRenderer.invoke('database:export'),
  importDatabase: (data) => ipcRenderer.invoke('database:import', data)
});

// Expose versions
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
});