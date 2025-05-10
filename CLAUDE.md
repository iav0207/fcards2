# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlashCards Desktop is a language learning application built with Electron, React, TypeScript, and SQLite. It allows users to create, store, and practice translations of words, phrases, and sentences with AI-powered translation evaluation.

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the application
npm run build

# Package the application for distribution
npm run package

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

- `/src`: Application source code
  - `/components`: React components for the UI
    - `/context`: React context providers
    - `/layout`: Layout components (Header)
    - `/screens`: Main application screens
  - `/models`: TypeScript interfaces for data models
  - `/services`: Core application services
  - `/utils`: Utility functions
  - `/main`: Electron main process code
  - `/preload`: Electron preload script
- `/public`: Static assets

## Core Components

- **Database Service**: Manages SQLite database operations
- **Translation Service**: Handles translation evaluation using Gemini or OpenAI
- **Session Service**: Manages practice sessions
- **Settings Service**: Handles application settings

## Key Data Models

- **FlashCard**: Represents a word, phrase, or sentence to learn
- **Session**: Represents a practice session
- **Settings**: Application settings including API keys and preferences

## Architecture

The application follows a layered architecture:

1. **UI Layer**: React components with Material UI
2. **Service Layer**: Core services for business logic
3. **Data Layer**: SQLite database for persistence

## Electron Structure

- **Main Process**: Handles database operations and IPC
- **Renderer Process**: React application for the UI
- **Preload Script**: Exposes API to renderer process

## Features

- Create and store words, phrases, and sentences in multiple languages
- Practice translations with AI-powered evaluation
- Persistent local database with import/export functionality
- Tag entries for better organization
- Dark/light theme support