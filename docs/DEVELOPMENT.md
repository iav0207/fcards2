# Development Guidelines

This document outlines the development approach and guidelines for the FlashCards Desktop application.

## Core Principles

1. **Iterative Development**: Build incrementally, with each step producing a working application.
2. **Test-Driven Development**: All changes should come with tests unless infeasible.
3. **RFC-First Approach**: New features are specified before implementation.
4. **Simple and Maintainable**: Keep code simple, well-documented, and maintainable.

## Development Workflow

### 1. Feature Planning (RFC Process)

All significant features should start with a Request for Comments (RFC) document:

1. Create a new document under `docs/rfc/RFC-00001-feature-name.md` where 00001 is a five-digit sequential number
2. Include the following sections:
   - **Summary**: One-paragraph explanation of the feature
   - **Motivation**: Why are we doing this? What use cases does it support?
   - **Detailed Design**: Technical details, API changes, component design, etc.
   - **Implementation Strategy**: Step-by-step approach to implementing the feature
   - **Test Plan**: How will this feature be tested?
   - **Alternatives Considered**: What other approaches were considered and why were they rejected?

3. Commit the RFC before implementation begins
4. Reference the RFC in implementation commits

### 2. Implementation Guidelines

1. **Always maintain a working app**:
   - The application should launch successfully after every commit
   - Breaking changes should be fixed immediately

2. **Test coverage**:
   - Write tests for all new code
   - Unit tests for models and services
   - Integration tests for critical workflows
   - Update tests when modifying existing code

3. **Commit strategy**:
   - Make small, focused commits
   - Each commit should be a logical unit of work
   - Commit messages should clearly explain what and why
   - Reference the RFC number in commit messages

### 3. Code Organization

- `/src/models/` - Data models and interfaces
- `/src/services/` - Core services for data management, translation, etc.
- `/src/components/` - UI components
- `/src/utils/` - Helper functions and utilities

### 4. Testing Strategy

#### Unit Tests

- Test all models thoroughly
- Test service methods in isolation
- Test utility functions

#### Integration Tests

- Test the main application flow
- Test interaction between services
- Use real in-memory databases for testing database interactions
- Avoid mocking database operations when possible

#### Database Testing

- Use real in-memory SQLite databases for testing, not mocks
- Only mock database operations when absolutely necessary
- Ensure proper handling of async database operations with await/Promises
- Test error conditions and edge cases with real database instances

#### E2E Tests

- Test critical user journeys through the entire application
- Use Playwright for automated end-to-end testing
- Implement tests following the Page Object Model pattern
- Test in both headless (CI) and headed (development) modes
- Verify core functionality like:
  - Application startup and initialization
  - Navigation between screens
  - Flashcard management
  - Practice session flows
  - Settings and configuration

### 5. Documentation

- Update DESIGN.md when architecture changes
- Document all models and services with JSDoc comments
- Keep README.md up to date with setup and usage instructions
- Document any non-obvious implementation details

## Project Evolution Documentation

The evolution of the project is tracked through:

1. Numbered RFCs in the `docs/rfc/` directory
2. Commit history with references to RFCs
3. Major version changes documented in CHANGELOG.md

This documentation helps future developers (including AI assistants) understand the reasoning behind implementation choices and the overall project structure.

## Development Environment

1. Always test on all supported platforms before merging significant changes
2. Use the linting and formatting tools provided in the project
3. Follow the testing guidelines specified in this document