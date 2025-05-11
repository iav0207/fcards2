# Screen Components

This directory contains screen components for different application views. Each screen is implemented as a self-contained module that manages its own DOM manipulation and event handling.

## Screens

- **HomeScreen.js**: Main application screen with database stats and navigation options
- **SetupScreen.js**: Practice session setup screen for configuring session parameters
- **PracticeScreen.js**: Interactive practice screen for answering flashcard prompts
- **FeedbackScreen.js**: Feedback screen for displaying evaluation results
- **ResultsScreen.js**: Session results screen showing performance statistics
- **ImportScreen.js**: Import configuration screen for database imports

## Usage

Screen components are designed to be instantiated with a container element and configuration options. They handle their own rendering and lifecycle management.

```javascript
const homeScreenContainer = document.querySelector('#screen-container');
const homeScreen = new HomeScreen(homeScreenContainer, {
  onStartPractice: () => {
    // Handle navigation to practice setup
  },
  onExportData: () => {
    // Handle data export
  }
});

// Show the screen
homeScreen.show();

// Hide the screen
homeScreen.hide();

// Update the screen with new data
homeScreen.update();
```

## Component API

Each screen follows a similar pattern:
1. Constructor that accepts a container element and options
2. Show/hide methods to control visibility
3. Update method to refresh data
4. Event callbacks for user interactions