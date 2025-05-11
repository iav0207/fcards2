# UI Components

This directory contains reusable UI components for the application.

## Components

- **Notification.js**: Notification system component
- **TagSelection.js**: Tag selection component
- **Card.js**: Flashcard display component
- **ProgressBar.js**: Progress bar component

## Usage

Components are designed to be instantiated and used by UI modules. Each component encapsulates its own DOM manipulation and logic, exposing a simple API for the rest of the application.

## Component API

Each component follows a similar pattern:
1. Constructor that accepts a container element and options
2. Methods to manipulate the component state
3. Events to notify users of state changes