/**
 * Represents a single flash card in the application
 */
export interface FlashCard {
  id: string;
  content: string;               // Word, phrase, or sentence
  sourceLanguage: string;        // ISO language code
  comment?: string;              // Optional user comment
  userTranslation?: string;      // Optional user-provided translation
  tags: string[];                // Array of tags for organization
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type guard for FlashCard
 */
export function isFlashCard(obj: any): obj is FlashCard {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.sourceLanguage === 'string' &&
    Array.isArray(obj.tags) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}