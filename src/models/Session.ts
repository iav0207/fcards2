/**
 * Represents a user's practice session
 */
export interface Session {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  cardIds: string[];             // IDs of cards to practice
  currentCardIndex: number;
  responses: SessionResponse[];
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Represents a single response in a session
 */
export interface SessionResponse {
  cardId: string;
  userResponse: string;
  correct: boolean;
}

/**
 * Type guard for Session
 */
export function isSession(obj: any): obj is Session {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.sourceLanguage === 'string' &&
    typeof obj.targetLanguage === 'string' &&
    Array.isArray(obj.cardIds) &&
    typeof obj.currentCardIndex === 'number' &&
    Array.isArray(obj.responses) &&
    obj.createdAt instanceof Date
  );
}