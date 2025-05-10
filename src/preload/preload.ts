import { contextBridge, ipcRenderer } from 'electron';
import type { FlashCard } from '@/models';

/**
 * Expose protected APIs to renderer process
 */
contextBridge.exposeInMainWorld('api', {
  // Flash card operations
  getAllFlashCards: () => ipcRenderer.invoke('getAllFlashCards'),
  getFlashCardsByLanguage: (language: string) => ipcRenderer.invoke('getFlashCardsByLanguage', language),
  getFlashCardsByTag: (tag: string) => ipcRenderer.invoke('getFlashCardsByTag', tag),
  createFlashCard: (card: Omit<FlashCard, 'id' | 'createdAt' | 'updatedAt'>) => ipcRenderer.invoke('createFlashCard', card),
  updateFlashCard: (card: FlashCard) => ipcRenderer.invoke('updateFlashCard', card),
  deleteFlashCard: (id: string) => ipcRenderer.invoke('deleteFlashCard', id),
  
  // Database import/export
  exportDatabase: () => ipcRenderer.invoke('exportDatabase'),
  importDatabase: () => ipcRenderer.invoke('importDatabase'),
  
  // Electron info
  platform: process.platform
});