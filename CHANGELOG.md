# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

## [0.2.0] - 2025-05-11

### Added
- RFC-00007: Error Notification System implementation for user-friendly error handling
  - Added toast notification UI with animations and styling
  - Added different notification types (error, warning, info, success)
  - Added support for action buttons in notifications
  - Created errorHandler utility for consistent error handling
  - Added comprehensive tests for notification system
- Translation API integration with Gemini and OpenAI providers
- API key management from environment variables
- Improved UI layout for better user experience
- Comprehensive tests for translation providers and API selection
- Enhanced API documentation in SETUP.md

### Changed
- Updated application startup to properly detect and use available translation APIs
- Made the main practice button more prominent
- Improved translation evaluation with stricter criteria
- Moved database management section to the bottom of the home screen
- Enhanced error handling in TranslationService with better context
- Improved SessionService error recovery for API failures

### Fixed
- Translation evaluation to accurately catch semantic differences
- Environment variable handling for API keys
- Graceful handling of API failures during practice sessions

## [0.1.0] - 2025-05-10

### Added
- Initial application structure with Electron and SQLite
- Basic flashcard management
- Practice session flow
- Database import/export functionality
- Translation service with stub implementation
- Core data models: FlashCard, Session, Settings
- Basic UI with dark theme
- RFCs 00001-00006 for core functionality