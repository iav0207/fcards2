// Development preload script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to renderer process
contextBridge.exposeInMainWorld('api', {
  // Flash card operations
  getAllFlashCards: () => ipcRenderer.invoke('getAllFlashCards'),
  getFlashCardsByLanguage: (language) => ipcRenderer.invoke('getFlashCardsByLanguage', language),
  getFlashCardsByTag: (tag) => ipcRenderer.invoke('getFlashCardsByTag', tag),
  createFlashCard: (card) => ipcRenderer.invoke('createFlashCard', card),
  updateFlashCard: (card) => ipcRenderer.invoke('updateFlashCard', card),
  deleteFlashCard: (id) => ipcRenderer.invoke('deleteFlashCard', id),
  
  // Database import/export
  exportDatabase: () => ipcRenderer.invoke('exportDatabase'),
  importDatabase: () => ipcRenderer.invoke('importDatabase'),
  
  // Platform info
  platform: process.platform
});