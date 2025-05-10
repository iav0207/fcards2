import { FlashCard, Session, SessionResponse } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './DatabaseService';

/**
 * Service for managing practice sessions
 */
export class SessionService {
  private databaseService: DatabaseService;
  private maxCardsPerSession: number;
  
  constructor(databaseService: DatabaseService, maxCardsPerSession: number = 20) {
    this.databaseService = databaseService;
    this.maxCardsPerSession = maxCardsPerSession;
  }

  /**
   * Create a new practice session
   */
  createSession(sourceLanguage: string, targetLanguage: string): Session {
    // Get cards for the specified source language
    const availableCards = this.databaseService.getFlashCardsByLanguage(sourceLanguage);
    
    if (availableCards.length === 0) {
      throw new Error(`No flash cards found for language: ${sourceLanguage}`);
    }
    
    // Select up to maxCardsPerSession cards randomly
    const selectedCards = this.selectRandomCards(availableCards, this.maxCardsPerSession);
    
    // Create and return the new session
    const session: Session = {
      id: uuidv4(),
      sourceLanguage,
      targetLanguage,
      cardIds: selectedCards.map(card => card.id),
      currentCardIndex: 0,
      responses: [],
      createdAt: new Date()
    };
    
    return session;
  }

  /**
   * Record a user response in the session
   */
  recordResponse(session: Session, cardId: string, userResponse: string, correct: boolean): Session {
    const response: SessionResponse = {
      cardId,
      userResponse,
      correct
    };
    
    const updatedSession = {
      ...session,
      responses: [...session.responses, response],
      currentCardIndex: session.currentCardIndex + 1
    };
    
    // If this was the last card, mark the session as completed
    if (updatedSession.currentCardIndex >= updatedSession.cardIds.length) {
      updatedSession.completedAt = new Date();
    }
    
    return updatedSession;
  }

  /**
   * Get the current flash card for a session
   */
  getCurrentCard(session: Session): FlashCard | null {
    if (session.currentCardIndex >= session.cardIds.length) {
      return null; // Session is complete
    }
    
    const currentCardId = session.cardIds[session.currentCardIndex];
    const allCards = this.databaseService.getAllFlashCards();
    
    return allCards.find(card => card.id === currentCardId) || null;
  }

  /**
   * Calculate session statistics
   */
  getSessionStats(session: Session): { total: number; correct: number; accuracy: number } {
    const total = session.responses.length;
    const correct = session.responses.filter(response => response.correct).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    
    return { total, correct, accuracy };
  }

  /**
   * Select random cards from a list
   */
  private selectRandomCards(cards: FlashCard[], count: number): FlashCard[] {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, cards.length));
  }
}