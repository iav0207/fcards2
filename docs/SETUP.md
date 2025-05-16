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

The application uses Gemini API (with OpenAI as fallback) for translation evaluation. **This functionality is required for accurate translation assessment.**

> ⚠️ **Important**: Without API keys, the application will fall back to a basic translation evaluation that may not be as accurate.

### Gemini API (Primary Provider)

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

### OpenAI API (Fallback Provider)

1. Get an OpenAI API key from the [OpenAI Platform](https://platform.openai.com/api-keys).

2. Add the key to your environment:

   **macOS/Linux:**
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export OPENAI_API_KEY="your-api-key-here"
   ```

   Then source your shell configuration:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

   **Windows:**
   ```cmd
   set OPENAI_API_KEY=your-api-key-here
   ```

3. Verify the key is set:
   ```bash
   echo $OPENAI_API_KEY  # macOS/Linux
   echo %OPENAI_API_KEY% # Windows
   ```

### API Key for Development

If you're developing the application, make sure to restart your terminal or source your shell configuration file before starting the development server to ensure the environment variables are loaded:

```bash
# Source your configuration
source ~/.zshrc  # or ~/.bashrc for Linux

# Verify API keys are set
echo $GEMINI_API_KEY
echo $OPENAI_API_KEY

# Then start the development server
npm run dev
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

1. Verify the keys are set in your environment:
   ```bash
   echo $GEMINI_API_KEY
   echo $OPENAI_API_KEY
   ```

2. Make sure you've sourced your shell configuration after adding the keys:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

3. If running in a new terminal window, remember that you'll need to source your shell configuration file to load the environment variables.

4. Check the application logs for warnings like "No translation providers initialized. Using stub implementation" which indicates it couldn't find valid API keys.

5. For testing purposes, you can temporarily set the keys directly in your terminal session:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   export OPENAI_API_KEY="your-key-here"
   npm run dev
   ```

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

### Native Module Issues

If you encounter errors related to native modules (like sqlite3) when running the application, you might see an error message about NODE_MODULE_VERSION mismatch:

```
Error: The module was compiled against a different Node.js version using
NODE_MODULE_VERSION X. This version of Node.js requires NODE_MODULE_VERSION Y.
```

This happens because native modules need to be rebuilt for your specific Node.js version. To fix this:

1. Use the rebuild script in package.json:
   ```bash
   npm run rebuild
   ```

2. For manual rebuilding of specific modules:
   ```bash
   npx electron-rebuild --force -w sqlite3
   ```

This issue commonly occurs after Node.js or Electron version updates, or when switching between running tests and development mode.