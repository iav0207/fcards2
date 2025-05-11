/**
 * Main entry point for UI initialization
 */

// Import UI modules
const { initializeHomeScreen } = require('./home');
// Future imports will go here:
// const { initializeSetupScreen } = require('./setup');
// const { initializePracticeScreen } = require('./practice');
// const { initializeResultsScreen } = require('./results');
// const { initializeImportExportScreen } = require('./import-export');

/**
 * Initialize the UI
 */
function initializeUI() {
  console.log('UI initialization');
  
  // Initialize the notification system
  const notificationContainer = document.getElementById('notification-container');
  const notificationSystem = createNotificationSystem(notificationContainer);
  
  // Create screen container references
  const screenContainer = document.querySelector('.container');
  
  // Initialize screen controllers
  const screens = {};
  
  // Initialize the home screen
  screens.home = initializeHomeScreen(screenContainer, {
    flashcards: window.flashcards,
    versions: window.versions,
    notificationSystem,
    onStartPractice: () => {
      // Will be implemented when setup screen is added
      console.log('Start practice requested');
      showScreen('setup');
    },
    onExportData: () => {
      // Will be implemented when export functionality is added
      console.log('Export data requested');
      exportData();
    },
    onImportData: () => {
      // Will be implemented when import functionality is added
      console.log('Import data requested');
      showScreen('import');
    }
  });
  
  // Screen navigation function
  function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
      if (screen && typeof screen.hide === 'function') {
        screen.hide();
      }
    });
    
    // Show the requested screen
    const screen = screens[screenName];
    if (screen && typeof screen.show === 'function') {
      screen.show();
    }
  }
  
  // Database export function (temporary implementation)
  async function exportData() {
    try {
      const result = await window.flashcards.exportDatabase();
      
      if (!result.success) {
        if (result.reason === 'canceled') {
          // User canceled, just go back to home
          showScreen('home');
          return;
        }
        
        // Show error message (temporary implementation)
        alert('Export failed: ' + (result.reason || 'Unknown error'));
        return;
      }
      
      // Show success message (temporary implementation)
      alert('Export successful! File saved to: ' + result.path);
      showScreen('home');
    } catch (error) {
      console.error('Error exporting data:', error);
      
      // Show error message (temporary implementation)
      alert('Export error: ' + error.message);
    }
  }
  
  // Show the home screen by default
  showScreen('home');
}

/**
 * Creates a simple notification system
 * This is a temporary implementation that will be replaced
 * with the NotificationComponent when fully implemented
 * @param {HTMLElement} container - Notification container
 * @returns {Object} Notification system interface
 */
function createNotificationSystem(container) {
  return {
    error: (title, message, details) => {
      console.error(`${title}: ${message}`, details);
      alert(`Error: ${title}\n${message}${details ? '\n\n' + details : ''}`);
    },
    warning: (title, message) => {
      console.warn(`${title}: ${message}`);
      alert(`Warning: ${title}\n${message}`);
    },
    info: (title, message) => {
      console.info(`${title}: ${message}`);
      alert(`Info: ${title}\n${message}`);
    },
    success: (title, message) => {
      console.log(`${title}: ${message}`);
      alert(`Success: ${title}\n${message}`);
    }
  };
}

console.log('UI module loaded (main.js)');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing UI (main.js)');
  initializeUI();
});

// Also handle window load event as a fallback
window.addEventListener('load', () => {
  console.log('Window loaded event in main.js');

  // Add a small delay to let everything initialize
  setTimeout(() => {
    console.log('Delayed initialization after window load');
    initializeUI();
  }, 500);
});

// Export for testing purposes
module.exports = {
  initializeUI
};