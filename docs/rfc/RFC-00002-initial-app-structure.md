# RFC-00002: Initial Application Structure

## Summary

This RFC defines the initial structure and foundation of the FlashCards Desktop application, establishing the core architecture, code organization, and basic models needed to support the application's functionality.

## Motivation

Building on the technology choices outlined in RFC-00001, we need to establish a clear structure for the application code that supports:
1. Well-organized code with clear separation of concerns
2. Testable components and services
3. Scalable architecture for future feature additions
4. Strong foundation for the core entities (FlashCard, Session)

## Detailed Design

### Directory Structure

```
/src
  /components       # React UI components
    /context        # React context providers
    /layout         # Layout components (Header, etc.)
    /screens        # Main application screens
  /models           # Data models
  /services         # Core application services
  /utils            # Utility functions
  /main             # Electron main process code
  /preload          # Electron preload script
/public             # Static assets
/__tests__          # Test files
```

### Core Data Models

#### FlashCard Model

The FlashCard model represents a single flashcard in the application:

```javascript
class FlashCard {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.content = data.content || '';
    this.sourceLanguage = data.sourceLanguage || 'en';
    this.comment = data.comment || '';
    this.userTranslation = data.userTranslation || '';
    this.tags = data.tags || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }
  
  // Methods for updating, converting to JSON, etc.
}
```

#### Session Model

The Session model represents a practice session:

```javascript
class Session {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.sourceLanguage = data.sourceLanguage || 'en';
    this.targetLanguage = data.targetLanguage || 'en';
    this.cardIds = data.cardIds || [];
    this.currentCardIndex = data.currentCardIndex || 0;
    this.responses = data.responses || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
  }
  
  // Methods for managing session state
}
```

#### Settings Model

The Settings model represents application settings:

```javascript
class Settings {
  constructor(data = {}) {
    this.darkMode = data.darkMode ?? true;
    this.apiKey = data.apiKey || '';
    this.apiProvider = data.apiProvider || 'gemini';
    this.maxCardsPerSession = data.maxCardsPerSession || 20;
  }
  
  // Methods for managing settings
}
```

### Core Services

#### Database Service

The DatabaseService is responsible for:
- Creating and initializing the SQLite database
- CRUD operations for flashcards and sessions
- Handling import/export operations

#### Translation Service

The TranslationService is responsible for:
- Connecting to Gemini/OpenAI APIs
- Evaluating user translations
- Providing feedback on translation accuracy

#### Session Service

The SessionService is responsible for:
- Creating practice sessions
- Tracking session progress
- Evaluating and recording responses

### Main Process Structure

The Electron main process handles:
- Application lifecycle
- Window management
- IPC communication with renderer
- Database operations (via DatabaseService)

### Preload Script

The preload script exposes a secure API to the renderer:
- Database operations
- Translation services
- Application settings

### Tests Structure

```
/__tests__
  /models            # Tests for data models
  /services          # Tests for services
  /utils             # Tests for utility functions
  /integration       # Integration tests
```

## Implementation Strategy

### Phase 1: Initial Setup
1. Set up Electron project structure
2. Create basic main.js that launches a window
3. Set up testing framework and initial tests
4. Implement utility functions

### Phase 2: Core Models
1. Implement FlashCard model
2. Implement Session model
3. Implement Settings model
4. Create tests for all models

### Phase 3: Services Layer
1. Implement DatabaseService
2. Implement TranslationService
3. Implement SessionService
4. Create tests for all services

### Phase 4: UI Components
1. Implement layout components
2. Create screen components
3. Build context providers
4. Connect UI to services via IPC

## Test Plan

1. **Unit Tests**
   - All model methods
   - Service methods in isolation
   - Utility functions

2. **Integration Tests**
   - Database operations with real SQLite
   - Service interactions
   - IPC communications

3. **E2E Tests**
   - Basic application flow
   - Data persistence

## Alternatives Considered

### MVC vs. Layered Architecture
We considered using a traditional MVC pattern but opted for a layered architecture with clear separation between:
- UI layer (React components)
- Service layer (core business logic)
- Data layer (models and database)

This approach maps better to Electron's main/renderer process separation.

### Class-based vs. Functional Models
We chose class-based models for:
- Encapsulation of behavior
- More intuitive serialization/deserialization
- Clearer representation of entity relationships

Functional/immutable models were considered but would introduce more complexity without significant benefits for this application.