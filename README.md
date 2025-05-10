# FlashCards Desktop

A desktop application for language learning using a flashcard system. Built with Electron, React, TypeScript, and SQLite.

## Features

- Create and store words, phrases, and sentences in multiple languages
- Practice translations with AI-powered evaluation
- Persistent local database with import/export functionality
- Tag entries for better organization
- Modern, flat Material UI Dark Theme

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
```

## Tech Stack

- **Frontend**: React with Material UI
- **Backend**: Electron with SQLite
- **Language**: TypeScript
- **Translation API**: Gemini API (fallback to OpenAI)

## Project Structure

- `/src`: Application source code
  - `/components`: React components
  - `/services`: Core services (database, translation, etc.)
  - `/models`: Data models
  - `/utils`: Utility functions
- `/public`: Static assets

## License

MIT