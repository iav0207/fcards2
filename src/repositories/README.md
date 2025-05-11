# Database Repositories

This directory contains repository classes that handle database operations for specific entity types.

## Repository Pattern

The repository pattern is used to abstract the data access logic from the services. Each repository is responsible for a specific entity type and handles all CRUD operations for that entity.

## Repositories

- **FlashCardRepository**: Handles operations for FlashCard entities
- **SessionRepository**: Handles operations for Session entities
- **SettingsRepository**: Handles operations for Settings entities
- **TagRepository**: Handles operations for tag-related functionality

## Usage

Repositories are used by the DatabaseService as an implementation detail. Services should not directly use repositories but should instead go through the DatabaseService facade.