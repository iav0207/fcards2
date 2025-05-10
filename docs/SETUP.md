# Setup Guide

This document provides instructions for setting up the development environment and configuring the application.

## Development Environment

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fcardsweb2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## API Keys Configuration

The application uses Gemini API (with OpenAI as fallback) for translation evaluation. You'll need to set up API keys to use these features.

### Gemini API

1. Get a Gemini API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

2. Add the key to your environment:

   **macOS/Linux:**
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export GEMINI_API_KEY="your-api-key-here"
   ```

   Then source your shell configuration:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

   **Windows:**
   ```cmd
   set GEMINI_API_KEY=your-api-key-here
   ```

3. Verify the key is set:
   ```bash
   echo $GEMINI_API_KEY  # macOS/Linux
   echo %GEMINI_API_KEY% # Windows
   ```

### OpenAI API (Fallback)

1. Get an OpenAI API key from the [OpenAI Platform](https://platform.openai.com/api-keys).

2. Add the key to your environment:

   **macOS/Linux:**
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export OPENAI_API_KEY="your-api-key-here"
   ```

   **Windows:**
   ```cmd
   set OPENAI_API_KEY=your-api-key-here
   ```

## Development Workflow

1. Make sure you've set up the environment variables.
2. Run the tests to ensure everything is working:
   ```bash
   npm test
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### API Key Issues

If you're having trouble with API keys:

1. Verify the key is set in your environment:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. Make sure you've sourced your shell configuration:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

3. If running in a new terminal window, remember that you'll need to set the environment variables again or source your shell configuration.

### Application Issues

1. Check the console for error messages.
2. Verify that all dependencies are installed:
   ```bash
   npm install
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```