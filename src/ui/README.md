# UI Modules

This directory contains JavaScript modules for the application's user interface.

## Organization

The UI is organized by screens and functionality:

- **home.js**: Logic for the home screen
- **setup.js**: Logic for session setup screen
- **practice.js**: Logic for practice session screen
- **results.js**: Logic for session results screen
- **import-export.js**: Logic for database import/export functionality
- **main.js**: Main entry point for UI initialization and coordination

## Architecture

These modules follow a simple event-based architecture:
1. Each module is responsible for a specific part of the UI
2. Modules communicate through events and direct function calls
3. DOM manipulation is handled within each module for its own elements