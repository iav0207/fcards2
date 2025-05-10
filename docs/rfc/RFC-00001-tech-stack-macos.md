# RFC-00001: Technology Stack and macOS Platform Support

## Summary

This RFC defines the initial technology stack for the FlashCards Desktop application and specifies macOS as the first supported platform. It outlines the core technologies, rationale behind each choice, and development approach for the project.

## Motivation

Building a language learning application with flashcards requires a robust technology stack that supports:
1. Cross-platform development (starting with macOS)
2. Local data storage for offline usage
3. Modern, responsive UI
4. AI-powered translation evaluation
5. Developer productivity and maintainability

The choices in this RFC aim to balance development speed, user experience, and long-term maintainability.

## Detailed Design

### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| UI Framework | React + Material UI | Modern component-based architecture, rich ecosystem, dark theme support |
| Desktop Framework | Electron | Cross-platform desktop app support with web technologies |
| Language | JavaScript/TypeScript | Type safety and better developer experience |
| Database | SQLite | Local persistence, lightweight, no external dependencies |
| Translation | Gemini API (OpenAI fallback) | AI-powered translation evaluation |
| Bundler | Vite | Fast development experience |
| Testing | Jest | Comprehensive testing solution with good developer experience |

### Platform Support

The initial version will target **macOS** as the primary platform:
- macOS 13+ (Ventura and later)
- Intel and Apple Silicon support

Future platforms to be added in subsequent RFCs:
- Windows 10/11
- Linux (Ubuntu, Debian)

### Development Environment

- Node.js v18+
- npm for package management
- Jest for testing
- ESLint for code quality
- Standard project structure following React best practices

### Application Architecture

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

## Implementation Strategy

1. **Phase 1: Foundation**
   - Set up Electron with React
   - Establish project structure
   - Implement basic UI shell
   - Set up testing framework

2. **Phase 2: Core Components**
   - Implement data models
   - Create database service
   - Build basic UI components
   - Establish main/renderer process communication

3. **Phase 3: Features**
   - Build translation service
   - Implement practice session flow
   - Create card management
   - Add settings

4. **Phase 4: Polish**
   - Refine UI/UX
   - Optimize performance
   - Add platform-specific enhancements for macOS

## Test Plan

1. **Unit Testing**
   - All data models and their methods
   - Service layer functions
   - Utility functions

2. **Integration Testing**
   - Database operations
   - Service interactions
   - Main/renderer process communication

3. **Application Testing**
   - Basic workflow testing
   - Core functionality validation
   - macOS-specific features

## Alternatives Considered

### Web Application vs. Desktop Application
We considered building a web application, but chose desktop for:
- Offline usage capabilities
- Better performance for local operations
- Native platform integration
- Future ability to incorporate native features 

### React Native vs. Electron
React Native was considered, but Electron was chosen because:
- Better developer experience with web technologies
- More straightforward access to file system
- Simpler database integration
- More mature ecosystem for desktop applications

### Database Choices
We evaluated several options:
- **SQLite** (chosen): Robust, well-supported, excellent performance
- IndexedDB: Limited query capabilities
- LevelDB: Good performance but less familiar API
- Local JSON files: Simplicity but poor scalability