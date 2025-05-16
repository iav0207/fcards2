# RFC-00010: SQLite Migration and Testing Improvements

## Status

- [x] Proposed
- [x] Accepted
- [x] Implemented
- [ ] Obsolete

## Summary

This RFC documents the migration from better-sqlite3 to sqlite3 and the transition from mock-based database tests to real in-memory SQLite database testing.

## Motivation

The project experienced compatibility issues with better-sqlite3, particularly in relation to Electron and Node.js versions. The synchronous API provided by better-sqlite3, while convenient, also created challenges for proper error handling and testing. These issues necessitated a move to the more stable and widely supported sqlite3 package and an improved testing approach.

## Technical Details

### Migration from better-sqlite3 to sqlite3

The primary differences between the two packages:

1. **API Style**:
   - better-sqlite3: Synchronous API
   - sqlite3: Asynchronous, callback-based API (wrapped with Promises in our implementation)

2. **Performance**:
   - better-sqlite3: Generally faster due to its synchronous nature
   - sqlite3: Slightly slower but more compatible with Electron's architecture

3. **Compatibility**:
   - sqlite3: Better compatibility with Electron and various Node.js versions
   - better-sqlite3: More finicky with Node.js version changes and Electron

### Key Changes in DatabaseService

The DatabaseService was completely refactored to use a Promise-based API:

```javascript
// Before (better-sqlite3)
initialize() {
  if (this.initialized) {
    return true;
  }
  
  this.db = new Database(this.dbPath);
  // Synchronous table creation
  this.db.exec(`CREATE TABLE IF NOT EXISTS ...`);
  this.initialized = true;
  return true;
}

// After (sqlite3)
initialize() {
  if (this.initialized) {
    return Promise.resolve(true);
  }
  
  return new Promise((resolve, reject) => {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables using Promise chain
      this.createTables()
        .then(() => {
          this.initialized = true;
          resolve(true);
        })
        .catch(reject);
    });
  });
}
```

### Changes to Repository Layer

All repositories were updated to return Promises instead of direct values:

```javascript
// Before
getFlashCard(id) {
  const result = this.db.prepare('SELECT * FROM flashcards WHERE id = ?').get(id);
  return result ? FlashCard.fromDB(result) : null;
}

// After
getFlashCard(id) {
  return new Promise((resolve, reject) => {
    this.db.get('SELECT * FROM flashcards WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row ? FlashCard.fromDB(row) : null);
    });
  });
}
```

### Changes to IPC Handlers

All IPC handlers were updated to properly await database operations:

```javascript
// Before
ipcMain.handle('flashcard:get', (event, id) => {
  try {
    const card = db.getFlashCard(id);
    return card ? card.toJSON() : null;
  } catch (error) {
    // Error handling
  }
});

// After
ipcMain.handle('flashcard:get', async (event, id) => {
  try {
    const card = await db.getFlashCard(id);
    return card ? card.toJSON() : null;
  } catch (error) {
    // Error handling
  }
});
```

## Database Testing Improvements

### From Mocks to In-Memory SQLite

Previously, tests used mocks which didn't accurately represent database behavior:

```javascript
// Before - Using mocks
jest.mock('../../src/services/DatabaseService');
const mockDb = {
  getFlashCard: jest.fn(),
  // Other mocked methods
};
```

Now tests use real in-memory SQLite databases:

```javascript
// After - Using real in-memory database
beforeEach(async () => {
  // Create a new in-memory database for each test
  db = new sqlite3.Database(':memory:');
  
  // Initialize tables
  await new Promise((resolve, reject) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        frontText TEXT NOT NULL,
        backText TEXT NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
  });
  
  // Initialize repository with actual database
  repository = new FlashCardRepository(db, true);
});
```

### Benefits of the New Testing Approach

1. **More accurate testing**: Tests now exercise the actual database code, not just mocks
2. **Better error detection**: Real database errors are caught in tests
3. **Transaction testing**: Can properly test transaction behavior
4. **Isolated tests**: Each test gets a fresh in-memory database, ensuring test isolation
5. **No mock maintenance**: No need to keep mocks updated as database code changes

## Implementation Steps

1. Replace better-sqlite3 with sqlite3 in package.json
2. Update DatabaseService to use Promise-based API
3. Update all repositories to return Promises
4. Update IPC handlers to properly await database operations
5. Create new tests using in-memory SQLite databases
6. Update documentation to reflect new patterns

## Impact and Risks

### Positive Impact

1. **Better compatibility**: Fewer issues with Node.js versions and Electron
2. **More robust error handling**: Explicit Promise-based error handling
3. **Improved test coverage**: Tests that exercise actual database code
4. **Better reliability**: More stable database interactions

### Risks and Mitigations

1. **Performance impact**: sqlite3 may be slightly slower than better-sqlite3
   - Mitigation: Most operations are not performance-critical in this application
   
2. **API changes**: All code that interacts with database must be updated
   - Mitigation: Comprehensive test suite ensures correctness

3. **Learning curve**: Developers must understand Promise-based API
   - Mitigation: Updated documentation and consistent patterns

## Alternatives Considered

1. **Stay with better-sqlite3 and fix compatibility issues**:
   - Rejected due to ongoing compatibility challenges with Electron
   
2. **Use a higher-level ORM like Sequelize**:
   - Rejected due to added complexity and dependencies
   
3. **Use a different database entirely (e.g., IndexedDB)**:
   - Rejected due to significant rework required

## Dependencies

- sqlite3 v5.0.2
- electron-rebuild for native module compilation

## References

- [sqlite3 npm package](https://www.npmjs.com/package/sqlite3)
- [Electron documentation on using native modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)