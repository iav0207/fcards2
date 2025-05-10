import Database from 'better-sqlite3';
import { FlashCard } from '@/models';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Service for interacting with the SQLite database
 */
export class DatabaseService {
  private db: Database.Database;
  
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'flashcards.db');
    
    this.db = new Database(dbPath);
    this.initialize();
  }

  /**
   * Initialize the database with required tables
   */
  private initialize(): void {
    // Create flashcards table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        sourceLanguage TEXT NOT NULL,
        comment TEXT,
        userTranslation TEXT,
        tags TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        sourceLanguage TEXT NOT NULL,
        targetLanguage TEXT NOT NULL,
        cardIds TEXT NOT NULL,
        currentCardIndex INTEGER NOT NULL,
        responses TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      );
    `);
  }

  /**
   * Get all flash cards
   */
  getAllFlashCards(): FlashCard[] {
    const rows = this.db.prepare('SELECT * FROM flashcards ORDER BY updatedAt DESC').all();
    
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  /**
   * Get flash cards by source language
   */
  getFlashCardsByLanguage(language: string): FlashCard[] {
    const rows = this.db.prepare('SELECT * FROM flashcards WHERE sourceLanguage = ? ORDER BY updatedAt DESC')
      .all(language);
    
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  /**
   * Get flash cards by tag
   */
  getFlashCardsByTag(tag: string): FlashCard[] {
    // SQLite doesn't have JSON support, so we need to use LIKE for tag search
    const rows = this.db.prepare("SELECT * FROM flashcards WHERE tags LIKE ? ORDER BY updatedAt DESC")
      .all(`%"${tag}"%`);
    
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  /**
   * Create a new flash card
   */
  createFlashCard(card: Omit<FlashCard, 'id' | 'createdAt' | 'updatedAt'>): FlashCard {
    const now = new Date();
    const newCard: FlashCard = {
      ...card,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    this.db.prepare(`
      INSERT INTO flashcards (id, content, sourceLanguage, comment, userTranslation, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newCard.id,
      newCard.content,
      newCard.sourceLanguage,
      newCard.comment || null,
      newCard.userTranslation || null,
      JSON.stringify(newCard.tags),
      newCard.createdAt.toISOString(),
      newCard.updatedAt.toISOString()
    );
    
    return newCard;
  }

  /**
   * Update an existing flash card
   */
  updateFlashCard(card: FlashCard): FlashCard {
    const updatedCard = {
      ...card,
      updatedAt: new Date()
    };
    
    this.db.prepare(`
      UPDATE flashcards
      SET content = ?, sourceLanguage = ?, comment = ?, userTranslation = ?, 
          tags = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      updatedCard.content,
      updatedCard.sourceLanguage,
      updatedCard.comment || null,
      updatedCard.userTranslation || null,
      JSON.stringify(updatedCard.tags),
      updatedCard.updatedAt.toISOString(),
      updatedCard.id
    );
    
    return updatedCard;
  }

  /**
   * Delete a flash card
   */
  deleteFlashCard(id: string): boolean {
    const result = this.db.prepare('DELETE FROM flashcards WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Export database to a file
   */
  exportDatabase(filePath: string): boolean {
    try {
      const dbPath = this.db.name;
      fs.copyFileSync(dbPath, filePath);
      return true;
    } catch (error) {
      console.error('Error exporting database:', error);
      return false;
    }
  }

  /**
   * Import database from a file
   */
  importDatabase(filePath: string): boolean {
    try {
      // Close current DB connection
      this.db.close();
      
      // Copy the imported file to the app's data directory
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'flashcards.db');
      
      fs.copyFileSync(filePath, dbPath);
      
      // Reopen the database
      this.db = new Database(dbPath);
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}