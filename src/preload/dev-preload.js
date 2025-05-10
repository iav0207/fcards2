// Development preload script - simplified version with mock data
const { contextBridge } = require('electron');

// Sample data for development
const SAMPLE_FLASHCARDS = [
  {
    id: '1',
    content: 'Hola',
    sourceLanguage: 'es',
    comment: 'Common greeting',
    userTranslation: 'Hello',
    tags: ['greeting', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    content: 'Buenos días',
    sourceLanguage: 'es',
    comment: 'Formal morning greeting',
    userTranslation: 'Good morning',
    tags: ['greeting', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    content: 'Me llamo',
    sourceLanguage: 'es',
    comment: 'Used for introducing yourself',
    userTranslation: 'My name is',
    tags: ['introduction', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    content: 'Bonjour',
    sourceLanguage: 'fr',
    comment: 'Common greeting',
    userTranslation: 'Hello',
    tags: ['greeting', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    content: 'Je m\'appelle',
    sourceLanguage: 'fr',
    comment: 'Used for introducing yourself',
    userTranslation: 'My name is',
    tags: ['introduction', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    content: 'Guten Tag',
    sourceLanguage: 'de',
    comment: 'Formal greeting',
    userTranslation: 'Good day',
    tags: ['greeting', 'formal'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    content: 'Ich heiße',
    sourceLanguage: 'de',
    comment: 'Used for introducing yourself',
    userTranslation: 'My name is',
    tags: ['introduction', 'basic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Convert date strings to Date objects for proper formatting
SAMPLE_FLASHCARDS.forEach(card => {
  card.createdAt = new Date(card.createdAt);
  card.updatedAt = new Date(card.updatedAt);
});

// Expose protected APIs to renderer process
contextBridge.exposeInMainWorld('api', {
  // Flash card operations with mock data
  getAllFlashCards: () => Promise.resolve(SAMPLE_FLASHCARDS),
  
  getFlashCardsByLanguage: (language) => Promise.resolve(
    SAMPLE_FLASHCARDS.filter(card => card.sourceLanguage === language)
  ),
  
  getFlashCardsByTag: (tag) => Promise.resolve(
    SAMPLE_FLASHCARDS.filter(card => card.tags.includes(tag))
  ),
  
  createFlashCard: (card) => {
    const newCard = {
      ...card,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    SAMPLE_FLASHCARDS.push(newCard);
    return Promise.resolve(newCard);
  },
  
  updateFlashCard: (card) => {
    const index = SAMPLE_FLASHCARDS.findIndex(c => c.id === card.id);
    if (index !== -1) {
      SAMPLE_FLASHCARDS[index] = {
        ...card,
        updatedAt: new Date()
      };
      return Promise.resolve(SAMPLE_FLASHCARDS[index]);
    }
    return Promise.reject(new Error('Card not found'));
  },
  
  deleteFlashCard: (id) => {
    const index = SAMPLE_FLASHCARDS.findIndex(c => c.id === id);
    if (index !== -1) {
      SAMPLE_FLASHCARDS.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },
  
  // Database mock operations
  exportDatabase: () => Promise.resolve(true),
  importDatabase: () => Promise.resolve(true),
  
  // Platform info
  platform: process.platform
});