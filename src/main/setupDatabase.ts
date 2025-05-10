import { DatabaseService } from '../services/DatabaseService';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Creates initial sample flashcards in the database
 */
export const setupDatabase = (): void => {
  console.log('Setting up database with initial sample data...');
  
  try {
    const databaseService = new DatabaseService();
    
    // Create sample flashcards if database is empty
    const cards = databaseService.getAllFlashCards();
    
    if (cards.length === 0) {
      console.log('Adding sample flashcards...');
      
      // Spanish flashcards
      databaseService.createFlashCard({
        content: 'Hola',
        sourceLanguage: 'es',
        comment: 'Common greeting',
        userTranslation: 'Hello',
        tags: ['greeting', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Buenos días',
        sourceLanguage: 'es',
        comment: 'Formal morning greeting',
        userTranslation: 'Good morning',
        tags: ['greeting', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Me llamo',
        sourceLanguage: 'es',
        comment: 'Used for introducing yourself, followed by your name',
        userTranslation: 'My name is',
        tags: ['introduction', 'basic']
      });
      
      databaseService.createFlashCard({
        content: '¿Cómo estás?',
        sourceLanguage: 'es',
        comment: 'Asking how someone is doing (informal)',
        userTranslation: 'How are you?',
        tags: ['question', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Gracias',
        sourceLanguage: 'es',
        comment: 'Expression of gratitude',
        userTranslation: 'Thank you',
        tags: ['basic', 'polite']
      });
      
      // French flashcards
      databaseService.createFlashCard({
        content: 'Bonjour',
        sourceLanguage: 'fr',
        comment: 'Common greeting',
        userTranslation: 'Hello',
        tags: ['greeting', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Je m\'appelle',
        sourceLanguage: 'fr',
        comment: 'Used for introducing yourself, followed by your name',
        userTranslation: 'My name is',
        tags: ['introduction', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Comment allez-vous?',
        sourceLanguage: 'fr',
        comment: 'Asking how someone is doing (formal)',
        userTranslation: 'How are you?',
        tags: ['question', 'formal']
      });
      
      databaseService.createFlashCard({
        content: 'Merci',
        sourceLanguage: 'fr',
        comment: 'Expression of gratitude',
        userTranslation: 'Thank you',
        tags: ['basic', 'polite']
      });
      
      databaseService.createFlashCard({
        content: 'Au revoir',
        sourceLanguage: 'fr',
        comment: 'Saying goodbye',
        userTranslation: 'Goodbye',
        tags: ['basic', 'farewell']
      });
      
      // German flashcards
      databaseService.createFlashCard({
        content: 'Guten Tag',
        sourceLanguage: 'de',
        comment: 'Formal greeting',
        userTranslation: 'Good day',
        tags: ['greeting', 'formal']
      });
      
      databaseService.createFlashCard({
        content: 'Ich heiße',
        sourceLanguage: 'de',
        comment: 'Used for introducing yourself, followed by your name',
        userTranslation: 'My name is',
        tags: ['introduction', 'basic']
      });
      
      databaseService.createFlashCard({
        content: 'Wie geht es Ihnen?',
        sourceLanguage: 'de',
        comment: 'Asking how someone is doing (formal)',
        userTranslation: 'How are you?',
        tags: ['question', 'formal']
      });
      
      databaseService.createFlashCard({
        content: 'Danke',
        sourceLanguage: 'de',
        comment: 'Expression of gratitude',
        userTranslation: 'Thank you',
        tags: ['basic', 'polite']
      });
      
      databaseService.createFlashCard({
        content: 'Auf Wiedersehen',
        sourceLanguage: 'de',
        comment: 'Formal goodbye',
        userTranslation: 'Goodbye',
        tags: ['farewell', 'formal']
      });
      
      console.log('Sample flashcards added successfully!');
    } else {
      console.log(`Database already contains ${cards.length} flashcards. Skipping sample data creation.`);
    }
    
    // Close the database connection
    databaseService.close();
  } catch (error) {
    console.error('Error setting up database:', error);
  }
};