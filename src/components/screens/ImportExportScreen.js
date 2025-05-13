/**
 * Import/Export Screen component
 * Handles database import and export functionality
 */
class ImportExportScreen {
  /**
   * Creates a new ImportExportScreen component
   * @param {HTMLElement} container - The container element for the import/export screen
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onBackToHome: () => {},
      onProceedImport: () => {},
      onBackFromResult: () => {},
      ...options
    };

    this.flashcards = options.flashcards || window.flashcards;
    this.notificationSystem = options.notificationSystem || null;
    this.importMode = 'merge'; // Default import mode (merge or replace)

    this.elements = {};
    this._findElements();
    this._attachEventListeners();
  }

  /**
   * Find elements in the DOM
   * @private
   */
  _findElements() {
    // Find the import screen elements from the index.html
    const importScreen = document.getElementById('import-screen');
    const operationResultScreen = document.getElementById('operation-result-screen');
    
    if (!importScreen) {
      console.error('Import screen element not found in HTML');
      return;
    }
    
    if (!operationResultScreen) {
      console.error('Operation result screen element not found in HTML');
    }
    
    // Store references to elements we'll need to access
    this.elements = {
      importScreen,
      operationResultScreen,
      importMode: document.getElementById('import-mode'),
      proceedImportBtn: document.getElementById('proceed-import-btn'),
      backFromImportBtn: document.getElementById('back-from-import-btn'),
      backToHomeFromResultBtn: document.getElementById('back-to-home-from-result-btn'),
      operationResultTitle: document.getElementById('operation-result-title'),
      operationResultContent: document.getElementById('operation-result-content'),
      operationResultStats: document.getElementById('operation-result-stats'),
      operationResultPath: document.getElementById('operation-result-path'),
      operationResultPathContainer: document.getElementById('operation-result-path-container')
    };
  }

  /**
   * Attach event listeners to interactive elements
   * @private
   */
  _attachEventListeners() {
    // Import screen buttons
    if (this.elements.backFromImportBtn && !this.elements.backFromImportBtn._hasImportListener) {
      this.elements.backFromImportBtn.addEventListener('click', () => {
        this.options.onBackToHome();
      });
      this.elements.backFromImportBtn._hasImportListener = true;
    }

    if (this.elements.proceedImportBtn && !this.elements.proceedImportBtn._hasImportListener) {
      this.elements.proceedImportBtn.addEventListener('click', () => {
        this._proceedWithImport();
      });
      this.elements.proceedImportBtn._hasImportListener = true;
    }

    // Import mode selection
    if (this.elements.importMode && !this.elements.importMode._hasImportListener) {
      this.elements.importMode.addEventListener('change', (e) => {
        this.importMode = e.target.value;
      });
      this.elements.importMode._hasImportListener = true;
    }

    // Result screen back button
    if (this.elements.backToHomeFromResultBtn && !this.elements.backToHomeFromResultBtn._hasImportListener) {
      this.elements.backToHomeFromResultBtn.addEventListener('click', () => {
        this.options.onBackFromResult();
      });
      this.elements.backToHomeFromResultBtn._hasImportListener = true;
    }
  }

  /**
   * Proceed with database import
   * @private
   */
  async _proceedWithImport() {
    try {
      if (!this.elements.importMode) {
        console.error('Import mode element not found');
        return;
      }
      
      const importMode = this.elements.importMode.value;
      
      // Disable the proceed button to prevent multiple clicks
      if (this.elements.proceedImportBtn) {
        this.elements.proceedImportBtn.disabled = true;
        this.elements.proceedImportBtn.textContent = 'Importing...';
      }
      
      // Call the import handler
      await this.options.onProceedImport(importMode);
      
      // Re-enable the button in case of error
      if (this.elements.proceedImportBtn) {
        this.elements.proceedImportBtn.disabled = false;
        this.elements.proceedImportBtn.textContent = 'Proceed with Import';
      }
    } catch (error) {
      console.error('Error importing data:', error);
      
      // Re-enable the button
      if (this.elements.proceedImportBtn) {
        this.elements.proceedImportBtn.disabled = false;
        this.elements.proceedImportBtn.textContent = 'Proceed with Import';
      }
      
      if (this.notificationSystem) {
        this.notificationSystem.error(
          'Import Error',
          'An error occurred during import',
          error.message
        );
      }
      
      // Show error in result screen
      this.showOperationResult(
        'Import Error',
        'An error occurred: ' + error.message,
        [],
        'incorrect'
      );
    }
  }

  /**
   * Show the operation result screen
   * @param {string} title - Result title
   * @param {string} message - Result message
   * @param {Array} stats - Statistics to display
   * @param {string} resultClass - CSS class for the result (correct or incorrect)
   * @param {string} [path] - File path (for export operations)
   */
  showOperationResult(title, message, stats, resultClass, path = null) {
    if (!this.elements.operationResultScreen) {
      console.error('Operation result screen element not found');
      return;
    }
    
    // Set the title
    if (this.elements.operationResultTitle) {
      this.elements.operationResultTitle.textContent = title;
    }
    
    // Set the message with appropriate styling
    if (this.elements.operationResultContent) {
      const resultContent = this.elements.operationResultContent;
      resultContent.textContent = message;
      resultContent.className = 'feedback';
      if (resultClass) {
        resultContent.classList.add(resultClass);
      }
    }
    
    // Create stats items
    if (this.elements.operationResultStats) {
      const statsContainer = this.elements.operationResultStats;
      statsContainer.innerHTML = '';
      
      stats.forEach(stat => {
        const item = document.createElement('div');
        item.className = 'stats-item';
        
        const value = document.createElement('div');
        value.className = 'stats-value';
        value.textContent = stat.value;
        
        const label = document.createElement('div');
        label.className = 'stats-label';
        label.textContent = stat.label;
        
        item.appendChild(value);
        item.appendChild(label);
        statsContainer.appendChild(item);
      });
    }
    
    // Show/hide path container and set path text
    if (this.elements.operationResultPathContainer) {
      this.elements.operationResultPathContainer.style.display = path ? 'block' : 'none';
      
      if (path && this.elements.operationResultPath) {
        this.elements.operationResultPath.textContent = path;
      }
    }
    
    // Show the operation result screen
    this.showScreen('operationResult');
  }

  /**
   * Show a specific screen
   * @param {string} screenName - The screen to show ('import' or 'operationResult')
   */
  showScreen(screenName) {
    // Hide all screens first
    if (this.elements.importScreen) {
      this.elements.importScreen.classList.remove('active');
    }
    
    if (this.elements.operationResultScreen) {
      this.elements.operationResultScreen.classList.remove('active');
    }
    
    // Show the requested screen
    if (screenName === 'import' && this.elements.importScreen) {
      this.elements.importScreen.classList.add('active');
      
      // Focus the proceed button
      if (this.elements.proceedImportBtn) {
        setTimeout(() => {
          this.elements.proceedImportBtn.focus();
        }, 100);
      }
    } else if (screenName === 'operationResult' && this.elements.operationResultScreen) {
      this.elements.operationResultScreen.classList.add('active');
      
      // Focus the back button
      if (this.elements.backToHomeFromResultBtn) {
        setTimeout(() => {
          this.elements.backToHomeFromResultBtn.focus();
        }, 100);
      }
    }
  }

  /**
   * Show the import screen
   */
  show() {
    this.showScreen('import');
  }

  /**
   * Hide all import-related screens
   */
  hide() {
    if (this.elements.importScreen) {
      this.elements.importScreen.classList.remove('active');
    }
    
    if (this.elements.operationResultScreen) {
      this.elements.operationResultScreen.classList.remove('active');
    }
  }

  /**
   * Reset the import screen to its initial state
   */
  reset() {
    // Reset import mode to default
    if (this.elements.importMode) {
      this.elements.importMode.value = 'merge';
      this.importMode = 'merge';
    }
    
    // Clear the operation result
    if (this.elements.operationResultStats) {
      this.elements.operationResultStats.innerHTML = '';
    }
    
    if (this.elements.operationResultTitle) {
      this.elements.operationResultTitle.textContent = '';
    }
    
    if (this.elements.operationResultContent) {
      this.elements.operationResultContent.textContent = '';
      this.elements.operationResultContent.className = 'feedback';
    }
    
    if (this.elements.operationResultPathContainer) {
      this.elements.operationResultPathContainer.style.display = 'none';
    }
    
    if (this.elements.operationResultPath) {
      this.elements.operationResultPath.textContent = '';
    }
  }
}

// Export the component for use in UI modules
module.exports = ImportExportScreen;