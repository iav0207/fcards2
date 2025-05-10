# FlashCards Desktop - Design Document

## Overview

FlashCards Desktop is a language learning application that allows users to create, store, and practice translations of words, phrases, and sentences. The application features a local database that persists across sessions, import/export functionality, and AI-powered translation evaluation.

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| UI Framework | React + Material UI | Modern component-based architecture, rich ecosystem, dark theme support |
| Desktop Framework | Electron | Cross-platform desktop app support with web technologies |
| Language | TypeScript | Type safety and better developer experience |
| Database | SQLite | Local persistence, lightweight, no external dependencies |
| Translation | Gemini API (OpenAI fallback) | AI-powered translation evaluation |
| Bundler | Vite | Fast development experience |

## Architecture

The application follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  - React Components                                         │
│  - Material UI                                              │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                   Application Service Layer                  │
│  - Session Management                                        │
│  - Translation Service                                       │
│  - Import/Export Service                                     │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                      Data Access Layer                       │
│  - Database Service                                          │
│  - Models                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Core Data Models

### FlashCard

```typescript
interface FlashCard {
  id: string;
  content: string;               // Word, phrase, or sentence
  sourceLanguage: string;        // ISO language code
  comment?: string;              // Optional user comment
  userTranslation?: string;      // Optional user-provided translation
  tags: string[];                // Array of tags for organization
  createdAt: Date;
  updatedAt: Date;
}
```

### Session

```typescript
interface Session {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  cardIds: string[];             // IDs of cards to practice
  currentCardIndex: number;
  responses: {
    cardId: string;
    userResponse: string;
    correct: boolean;
  }[];
  createdAt: Date;
  completedAt?: Date;
}
```

### Settings

```typescript
interface Settings {
  darkMode: boolean;
  apiKey?: string;               // For translation API
  apiProvider: 'gemini' | 'openai';
  maxCardsPerSession: number;    // Default: 20
}
```

## Application Flow

### Startup Flow

1. Application starts
2. Database is initialized/loaded
3. User is presented with language selection screen
4. User selects source and target languages
5. Practice session is created with up to 20 flashcards

### Practice Session Flow

1. Card is displayed with source content
2. User types translation
3. User submits answer
4. Application evaluates answer using translation API
5. Feedback is provided along with correct translation and user notes
6. User advances to next card
7. After all cards are processed, session summary is shown

### Card Management Flow

1. User navigates to card management screen
2. User can view all cards, filtered by language or tags
3. User can add, edit, or delete cards
4. User can import/export database

## Key Services

### Database Service

Responsible for:
- Creating and maintaining SQLite database
- CRUD operations for flashcards
- Managing tags
- Import/export functionality

### Translation Service

Responsible for:
- Connecting to Gemini API (with OpenAI fallback)
- Evaluating user translations
- Providing feedback on translation accuracy

### Session Service

Responsible for:
- Creating practice sessions
- Selecting appropriate cards for practice
- Tracking session progress
- Calculating results

## UI Components

### Main Screens

1. **Language Selection Screen**
   - Select source language
   - Select target language
   - Start session button

2. **Practice Screen**
   - Original text display
   - Translation input field
   - Submit button
   - Session progress indicator

3. **Feedback Screen**
   - Original text
   - User translation
   - Correct/incorrect indicator
   - User notes and translation display
   - Next button

4. **Card Management Screen**
   - List of all cards with filtering
   - Add/edit/delete card forms
   - Import/export buttons

5. **Settings Screen**
   - Theme toggle
   - API key configuration
   - Session size settings

## Implementation Plan

### Phase 1: MVP
- Basic UI with language selection and practice flow
- Local database setup with simple CRUD operations
- Simple translation evaluation using API
- Core user flow implementation

### Phase 2: Enhancements
- Tagging system
- Import/export functionality
- UI refinements with dark theme
- Advanced translation feedback

### Future Considerations
- Spaced repetition algorithm
- Performance statistics
- Multiple practice modes
- Cloud sync

## Performance Considerations

- Use efficient SQLite queries for database operations
- Implement lazy loading for large card collections
- Cache API responses when appropriate
- Optimize Electron configuration for minimal resource usage