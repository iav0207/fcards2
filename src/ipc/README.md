# IPC Handlers

This directory contains modules for Inter-Process Communication (IPC) handlers used by the Electron main process.

## Organization

IPC handlers are organized by domain:

- **database-handlers.js**: Handlers for database operations
- **session-handlers.js**: Handlers for session operations
- **translation-handlers.js**: Handlers for translation operations
- **settings-handlers.js**: Handlers for settings operations

## Usage

These handler modules are imported by main.js and registered with the IPC system. They provide an abstraction layer for the renderer process to communicate with the main process services.

## Handler Structure

Each handler module follows a similar pattern:
1. Import necessary services
2. Export functions that register IPC handlers
3. Each handler function wraps service calls with proper error handling