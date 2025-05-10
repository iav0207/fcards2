# FlashCards Desktop

A desktop application for language learning using a flashcard system. Built with Electron, React, TypeScript, and SQLite.

## Features

- Create and store words, phrases, and sentences in multiple languages.
- Practice translations with AI-powered evaluation.
- Persistent local database with import/export functionality.
- Tag entries for better organization.
- Modern, flat Material UI Dark Theme.

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Package the app
npm run package

# Run tests
npm test
```

## Development Approach

This project follows an iterative, RFC-driven development approach:

1. All significant features begin with an RFC document in `docs/rfc/`.
2. Changes are made incrementally, with tests.
3. The application must launch successfully after every change.

For detailed development guidelines, see [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Tech Stack

- **Frontend**: React with Material UI
- **Backend**: Electron with SQLite
- **Language**: JavaScript/TypeScript
- **Translation API**: Gemini API (fallback to OpenAI)
- **Testing**: Jest

## Project Structure

- `/src`: Application source code
  - `/components`: React components
  - `/services`: Core services (database, translation, etc.)
  - `/models`: Data models
  - `/utils`: Utility functions
- `/public`: Static assets
- `/docs`: Documentation
  - `/rfc`: Feature specifications and RFCs
- `/__tests__`: Test files

## Documentation

- [DESIGN.md](docs/DESIGN.md): Application design document
- [DEVELOPMENT.md](docs/DEVELOPMENT.md): Development guidelines
- [RFCs](docs/rfc/): Feature specifications and implementation plans

## License

MIT