# FlashCards Desktop Refactoring Plan

This document outlines the detailed implementation plan for refactoring the FlashCards Desktop application according to RFC-00009. The plan is divided into phases, with each phase focusing on a specific area of the codebase.

## Goal

Transform the codebase into a more maintainable, testable, and extensible structure while preserving all existing functionality and ensuring no regressions.

## Implementation Phases

### Phase 0: Preparation

- **Task**: Create initial folder structure for refactored modules
  - Create `/src/repositories` directory for database repositories
  - Create `/src/ui` directory for frontend modules
  - Create `/src/components` directory for UI components
  - Create `/src/ipc` directory for IPC handlers
  - Update build process to handle new structure

### Phase 1: Service Layer Refactoring

#### Database Refactoring

1. **Create FlashCardRepository**
   - Extract FlashCard-related methods from DatabaseService
   - Move saveFlashCard, getFlashCard, getAllFlashCards, deleteFlashCard to new class
   - Update imports and references
   - Ensure backward compatibility through DatabaseService delegation

2. **Create SessionRepository**
   - Extract Session-related methods from DatabaseService
   - Move saveSession, getSession, getAllSessions, deleteSession to new class
   - Update imports and references
   - Ensure backward compatibility through DatabaseService delegation

3. **Create SettingsRepository**
   - Extract Settings-related methods from DatabaseService
   - Move saveSettings, getSettings to new class
   - Update imports and references
   - Ensure backward compatibility through DatabaseService delegation

4. **Create TagRepository**
   - Extract Tag-related methods from DatabaseService
   - Move getAvailableTags and tag filtering logic to new class
   - Update imports and references
   - Ensure backward compatibility through DatabaseService delegation

5. **Refactor core DatabaseService**
   - Convert to facade that delegates to repositories
   - Keep initialization, import/export, and stats methods
   - Update to use repositories for data operations
   - Ensure all existing tests pass

6. **Write tests for repositories**
   - Create test files for each repository
   - Ensure high test coverage for repository methods
   - Verify behavior matches original DatabaseService

#### Translation Service Refactoring

7. **Create TranslationEvaluator**
   - Extract evaluation-related methods from TranslationService
   - Move evaluateTranslation and baseline evaluation to new class
   - Ensure backward compatibility through TranslationService delegation

8. **Create TranslationGenerator**
   - Extract generation-related methods from TranslationService
   - Move generateTranslation and baseline generation to new class
   - Ensure backward compatibility through TranslationService delegation

9. **Enhance Provider Pattern**
   - Refine the provider implementations for better modularity
   - Extract common provider functionality to a base class
   - Update tests for translation services

#### Session Service Refactoring

10. **Create SessionCreator**
    - Extract session creation logic from SessionService
    - Move createSession and related methods to new class
    - Ensure backward compatibility through SessionService delegation

11. **Create SessionRunner**
    - Extract session running logic from SessionService
    - Move getCurrentCard, advanceSession methods to new class
    - Ensure backward compatibility through SessionService delegation

12. **Create SessionEvaluator**
    - Extract answer evaluation logic from SessionService
    - Move submitAnswer and related evaluation methods to new class
    - Ensure backward compatibility through SessionService delegation

### Phase 2: Frontend Refactoring

1. **Define UI Module Structure**
   - Create skeleton files for each UI module
   - Define interfaces for UI components
   - Establish communication patterns between components

2. **Extract Home Screen Logic**
   - Move home screen JavaScript from index.html to `/src/ui/home.js`
   - Update index.html to reference the external script
   - Ensure functionality remains intact

3. **Extract Setup Screen Logic**
   - Move setup screen JavaScript from index.html to `/src/ui/setup.js`
   - Update index.html to reference the external script
   - Ensure functionality remains intact

4. **Extract Practice Screen Logic**
   - Move practice screen JavaScript from index.html to `/src/ui/practice.js`
   - Update index.html to reference the external script
   - Ensure functionality remains intact

5. **Extract Results Screen Logic**
   - Move results screen JavaScript from index.html to `/src/ui/results.js`
   - Update index.html to reference the external script
   - Ensure functionality remains intact

6. **Extract Import/Export Logic**
   - Move import/export JavaScript from index.html to `/src/ui/import-export.js`
   - Update index.html to reference the external script
   - Ensure functionality remains intact

7. **Create NotificationComponent**
   - Extract notification system to `/src/components/Notification.js`
   - Create a reusable component with a clean API
   - Update references in UI modules

8. **Create TagSelectionComponent**
   - Extract tag selection logic to `/src/components/TagSelection.js`
   - Create a reusable component with a clean API
   - Update references in UI modules

9. **Create Main Frontend Module**
   - Create `/src/ui/main.js` to initialize frontend modules
   - Coordinate component communication
   - Handle shared state and common functionality

10. **Update HTML Structure**
    - Clean up index.html after extracting JavaScript
    - Add proper script imports
    - Ensure HTML structure is semantic and accessible

### Phase 3: Main Process Refactoring

1. **Extract Database IPC Handlers**
   - Move database-related IPC handlers to `/src/ipc/database-handlers.js`
   - Update main.js to use imported handlers
   - Ensure all handlers work as before

2. **Extract Session IPC Handlers**
   - Move session-related IPC handlers to `/src/ipc/session-handlers.js`
   - Update main.js to use imported handlers
   - Ensure all handlers work as before

3. **Extract Translation IPC Handlers**
   - Move translation-related IPC handlers to `/src/ipc/translation-handlers.js`
   - Update main.js to use imported handlers
   - Ensure all handlers work as before

4. **Extract Settings IPC Handlers**
   - Move settings-related IPC handlers to `/src/ipc/settings-handlers.js`
   - Update main.js to use imported handlers
   - Ensure all handlers work as before

5. **Refactor Startup Sequence**
   - Improve application initialization in main.js
   - Add better error handling and recovery
   - Create a cleaner main.js structure

### Phase 4: Documentation and Cleanup

1. **Update Architecture Documentation**
   - Update `DESIGN.md` with new architecture overview
   - Document component interactions and data flow
   - Include diagrams for visual clarity

2. **Update Project Structure Documentation**
   - Update `DEVELOPMENT.md` with new project structure
   - Include folder organization and purpose
   - Add guide for where to add new features

3. **Add Module Documentation**
   - Add JSDoc comments to new modules
   - Document component APIs
   - Add examples for module usage

4. **Remove Debug Code**
   - Clean up console.log statements
   - Remove development scaffolding
   - Clean up commented-out code

5. **Final Testing and QA**
   - Run comprehensive test suite
   - Perform manual testing of all features
   - Ensure no regressions in functionality

## Implementation Approach

### Incremental Changes

Each task will be implemented incrementally, following these steps:

1. Create new module file(s)
2. Extract functionality from existing code
3. Add tests for the new module
4. Update original code to delegate to new module
5. Verify existing tests still pass
6. Test the application manually to ensure no regressions

### Testing Strategy

For each refactoring task:

1. Run existing tests before making changes to verify current functionality
2. Create new tests for extracted functionality
3. Run all tests after changes to ensure no regressions
4. Add edge case tests for better coverage

### Commit Strategy

- Make small, focused commits for each refactoring task
- Include detailed commit messages explaining what was refactored and why
- Reference the RFC and relevant task number in commit messages
- Run tests before each commit to ensure code is always in a working state

## Success Criteria

The refactoring will be considered successful when:

1. All existing functionality works as before
2. All tests pass
3. No single file exceeds 300 lines of code
4. Test coverage is maintained or improved
5. Code follows consistent patterns and naming conventions
6. Documentation is up-to-date with the new structure

## Timeline

- **Phase 0**: 1 day
- **Phase 1**: 5-7 days
- **Phase 2**: 3-5 days
- **Phase 3**: 2-3 days
- **Phase 4**: 1-2 days

Total estimated time: 2-3 weeks of development effort