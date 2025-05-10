/**
 * Application settings
 */
export interface Settings {
  darkMode: boolean;
  translationApiKey?: string;    // API key for translation service
  translationApiProvider: 'gemini' | 'openai';
  maxCardsPerSession: number;    // Default: 20
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  translationApiProvider: 'gemini',
  maxCardsPerSession: 20
}