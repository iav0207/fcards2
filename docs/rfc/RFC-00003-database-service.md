# RFC-00003: SQLite Database Service Implementation

## Summary

This RFC outlines the implementation of the database service for the FlashCards Desktop application, which leverages SQLite for local data persistence via the better-sqlite3 package. The implementation includes CRUD operations for core models, along with IPC communication to safely expose database operations to the renderer process.

## Motivation

A persistent database is essential for the FlashCards Desktop application to store and retrieve flashcards, track practice sessions, and maintain user settings. SQLite provides a robust, lightweight solution for local database storage that works well with Electron's architecture.

The key requirements for the database implementation include:
1. Efficient storage and retrieval of application data
2. Proper separation between the renderer and main processes
3. Safe exposure of database operations via IPC
4. Support for import/export functionality

## Detailed Design

### Database Structure

The database consists of three main tables:

1. **flashcards**: Stores flashcard data
   ```sql
   CREATE TABLE IF NOT EXISTS flashcards (
     id TEXT PRIMARY KEY,
     content TEXT NOT NULL,
     sourceLanguage TEXT NOT NULL,
     comment TEXT,
     userTranslation TEXT,
     tags TEXT,
     createdAt TEXT NOT NULL,
     updatedAt TEXT NOT NULL
   )
   ```

2. **sessions**: Stores practice session data
   ```sql
   CREATE TABLE IF NOT EXISTS sessions (
     id TEXT PRIMARY KEY,
     sourceLanguage TEXT NOT NULL,
     targetLanguage TEXT NOT NULL,
     cardIds TEXT NOT NULL,
     currentCardIndex INTEGER NOT NULL,
     responses TEXT,
     createdAt TEXT NOT NULL,
     completedAt TEXT
   )
   ```

3. **settings**: Stores application settings
   ```sql
   CREATE TABLE IF NOT EXISTS settings (
     id TEXT PRIMARY KEY,
     settings TEXT NOT NULL
   )
   ```

### DatabaseService Class

The DatabaseService class provides a comprehensive API for interacting with the SQLite database:

#### Core Functionality
- **initialize()**: Creates database tables if they don't exist
- **close()**: Closes the database connection

#### FlashCard Operations
- **saveFlashCard(card)**: Saves a flashcard to the database
- **getFlashCard(id)**: Retrieves a flashcard by ID
- **getAllFlashCards(options)**: Retrieves flashcards with filtering options
- **deleteFlashCard(id)**: Deletes a flashcard

#### Session Operations
- **saveSession(session)**: Saves a session to the database
- **getSession(id)**: Retrieves a session by ID
- **getAllSessions(options)**: Retrieves sessions with filtering options
- **deleteSession(id)**: Deletes a session

#### Settings Operations
- **saveSettings(settings)**: Saves application settings
- **getSettings()**: Retrieves application settings

#### Utility Operations
- **getStats()**: Retrieves database statistics
- **importData(data)**: Imports data from a JSON object
- **exportData()**: Exports all data to a JSON object

### IPC Communication

The database service is exposed to the renderer process via IPC using a preload script:

1. **Main Process**: Sets up IPC handlers for each database operation
   ```javascript
   ipcMain.handle('flashcard:save', async (event, cardData) => {
     const card = new FlashCard(cardData);
     return db.saveFlashCard(card).toJSON();
   });
   ```

2. **Preload Script**: Exposes a safe API to the renderer process
   ```javascript
   contextBridge.exposeInMainWorld('flashcards', {
     saveFlashCard: (cardData) => ipcRenderer.invoke('flashcard:save', cardData),
     // other methods...
   });
   ```

3. **Renderer Process**: Uses the exposed API to interact with the database
   ```javascript
   const card = await window.flashcards.getFlashCard(id);
   ```

## Implementation Strategy

1. **Phase 1: Core Setup**
   - Install better-sqlite3 package
   - Create DatabaseService class
   - Implement basic table creation and initialization

2. **Phase 2: Model Operations**
   - Implement CRUD operations for FlashCard model
   - Implement CRUD operations for Session model
   - Implement operations for Settings model

3. **Phase 3: IPC Integration**
   - Set up IPC handlers in main process
   - Create preload script to expose safe API
   - Update main window configuration to use preload script

4. **Phase 4: Testing**
   - Write unit tests for DatabaseService
   - Write tests for IPC communication
   - Update main process tests

## Test Plan

1. **Unit Tests for DatabaseService**
   - Test initialization and table creation
   - Test CRUD operations for all models
   - Test filtering and query options
   - Test import/export functionality

2. **Integration Tests**
   - Test entire flow from renderer to database and back
   - Test error handling and edge cases

3. **Manual Testing**
   - Verify database persistence across app restarts
   - Test performance with larger datasets

## Alternatives Considered

### IndexedDB
Considered using IndexedDB for storage, but decided against it for the following reasons:
- SQLite provides better query capabilities
- Direct file access makes import/export simpler
- Better integration with the Electron main process

### ORM Libraries
Considered using an ORM library like Sequelize or TypeORM, but opted for a simpler approach:
- Reduced dependencies and smaller bundle size
- Better control over database operations
- Simpler implementation given our specific needs

### Multiple Database Files
Considered separate database files for different types of data but chose a single database for:
- Simplified backup and import/export
- Easier transaction management across related data
- Consistent access patterns