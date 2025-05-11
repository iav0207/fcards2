/**
 * Home screen UI module
 * Coordinates the HomeScreen component and related functionality
 */

const HomeScreen = require('../components/screens/HomeScreen');

/**
 * Initializes the home screen
 * @param {HTMLElement} container - Container element for the home screen
 * @param {Object} options - Configuration options
 * @returns {Object} Home screen controller
 */
function initializeHomeScreen(container, options = {}) {
  const {
    flashcards,
    versions,
    notificationSystem,
    onStartPractice,
    onExportData,
    onImportData
  } = options;

  // Create the home screen component
  const homeScreen = new HomeScreen(container, {
    flashcards,
    versions,
    notificationSystem,
    onStartPractice,
    onExportData,
    onImportData
  });

  // Home screen interface
  const homeController = {
    /**
     * Show the home screen
     */
    show() {
      homeScreen.show();
      homeScreen.update(); // Refresh data when shown
    },

    /**
     * Hide the home screen
     */
    hide() {
      homeScreen.hide();
    },

    /**
     * Update home screen data
     */
    update() {
      homeScreen.loadDatabaseStats();
    }
  };

  return homeController;
}

module.exports = {
  initializeHomeScreen
};