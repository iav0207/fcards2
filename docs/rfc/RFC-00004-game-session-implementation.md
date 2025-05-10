# RFC-00004: Game Session Implementation with Stub Translation Service

## Summary

This RFC outlines the implementation of a functional game session flow for the FlashCards Desktop application. It includes a stub TranslationService that will later be replaced with actual AI-powered translation evaluation, and a basic practice session UI that enables users to test their language knowledge with sample flashcards.

## Motivation

Before implementing the full AI-powered translation evaluation and card importing functionality, we need a working game loop that demonstrates the core user experience. This will:

1. Allow early testing of the session management logic
2. Provide a functional demo of the application
3. Enable incremental development of UI components
4. Create a foundation for future AI integration

The implementation will use stub components where necessary to simulate the full functionality.

## Detailed Design

### Components

#### 1. Stub TranslationService

The TranslationService will provide methods for evaluating translations, but initially with simplified logic that doesn't require external API calls:

```javascript
class TranslationService {
  constructor(options = {}) {
    this.apiProvider = options.apiProvider || 'stub';
    this.apiKey = options.apiKey || '';
  }

  async evaluateTranslation(data) {
    // Stub implementation that always returns "correct"
    return {
      correct: true,
      score: 1.0,
      feedback: "Great job! Your translation is correct.",
      // ... other evaluation data
    };
  }

  async generateTranslation(data) {
    // Stub implementation that returns predefined translations
    // for common words and phrases
    // ...
  }
}
```

#### 2. SessionService

The SessionService will manage the game session flow:

```javascript
class SessionService {
  constructor(options = {}) {
    this.db = options.db;
    this.translationService = options.translationService || new TranslationService();
  }

  async createSession(sourceLanguage, targetLanguage, options = {}) {
    // Create a new session with sample cards or from the database
    // ...
  }

  async getCurrentCard(sessionId) {
    // Get the current card in the session
    // ...
  }

  async submitAnswer(sessionId, answer) {
    // Process the user's answer and evaluate it
    // ...
  }

  async advanceSession(sessionId) {
    // Move to the next card or complete the session
    // ...
  }
}
```

#### 3. Sample Cards Generator

Until we implement card importing, we'll need a way to generate sample cards:

```javascript
function generateSampleCards(count = 10, sourceLanguage = 'en', targetLanguage = 'de') {
  // Generate an array of sample flashcards
  // ...
}
```

#### 4. Game Session UI Components

We'll need several UI components to implement the game flow:

- **SessionSetupScreen**: For configuring source/target languages
- **PracticeScreen**: For displaying the current card and accepting input
- **FeedbackScreen**: For showing translation feedback
- **ResultsScreen**: For displaying session summary

### Game Flow

1. **Setup Phase**
   - User selects source and target languages
   - System creates a new session with sample cards
   - Session is stored in the database

2. **Practice Phase**
   - User is presented with a card in the source language
   - User enters their translation
   - System evaluates the translation using the stub TranslationService
   - Feedback is displayed to the user
   - User advances to the next card

3. **Completion Phase**
   - After all cards are processed, session is marked as complete
   - Summary of results is displayed
   - User can start a new session or review their answers

### Database Interactions

The game session will interact with the DatabaseService for:
- Storing session data
- Retrieving current session state
- Recording user responses
- Updating session progress

This will use the existing IPC communication flow established in the DatabaseService.

## Implementation Strategy

1. **Phase 1: Stub Services**
   - Implement stub TranslationService
   - Create sample cards generator
   - Implement SessionService with database integration

2. **Phase 2: Basic UI**
   - Create simplified screens for the game flow
   - Implement navigation between screens
   - Add input handling for user translations

3. **Phase 3: Game Logic**
   - Connect UI components to services
   - Implement session flow from start to completion
   - Add stub evaluation and feedback display

4. **Phase 4: Polish**
   - Add basic styling and layout improvements
   - Implement session statistics and reporting
   - Add error handling and recovery options

## Test Plan

1. **Unit Tests**
   - Test SessionService methods
   - Test stub TranslationService
   - Test sample cards generation

2. **Integration Tests**
   - Test session creation and storage
   - Test session progression
   - Test session completion

3. **Manual Tests**
   - Verify the complete game flow works as expected
   - Test with different language pairs
   - Verify session state is properly persisted

## Future Work

This implementation will serve as a foundation for future enhancements:

1. **AI Integration**: Replace the stub TranslationService with actual AI-powered evaluation
2. **Card Import**: Add functionality to import existing flashcard collections
3. **Advanced UI**: Enhance the UI with animations, keyboard shortcuts, and accessibility features
4. **Statistics**: Add more detailed reporting and progress tracking

## Alternatives Considered

### Fully Stubbed Database
Considered skipping database integration altogether for the initial implementation, but decided against it to ensure realistic flow from the beginning.

### Delayed Implementation of Sample Cards
Considered waiting for the card import feature, but decided that having sample content would enable more effective testing and demonstration.

### Web-Based UI Framework
Considered using a more comprehensive UI framework like React, but opted to start with basic HTML/JS for simplicity, with plans to upgrade later.