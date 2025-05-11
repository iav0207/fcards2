/**
 * Notification component for displaying system notifications
 */
class NotificationComponent {
  /**
   * Creates a new NotificationComponent
   * @param {HTMLElement} container - The container element for notifications
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      duration: 5000, // Default duration in ms
      maxNotifications: 3, // Maximum number of visible notifications
      ...options
    };
    this.notifications = [];
    this.idCounter = 0;
  }
  
  /**
   * Show a notification with the specified type
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} details - Optional details (shown in smaller text)
   * @param {string} type - The notification type (info, success, warning, error)
   * @param {Object} options - Additional options for this notification
   * @returns {string} The notification ID
   */
  _notify(title, message, details = '', type = 'info', options = {}) {
    const id = `notification-${Date.now()}-${this.idCounter++}`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification ${type}`;
    
    // Create the HTML structure
    notification.innerHTML = `
      <div class="notification-title">
        ${title}
        <span class="notification-close" aria-label="Close notification">&times;</span>
      </div>
      <div class="notification-content">${message}</div>
      ${details ? `<div class="notification-details">${details}</div>` : ''}
      ${options.actions ? `<div class="notification-actions"></div>` : ''}
    `;
    
    // Add actions if provided
    if (options.actions && options.actions.length > 0) {
      const actionsContainer = notification.querySelector('.notification-actions');
      
      options.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'notification-btn';
        button.textContent = action.label;
        button.addEventListener('click', () => {
          if (action.callback) action.callback();
          this.close(id);
        });
        
        actionsContainer.appendChild(button);
      });
    }
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.close(id);
    });
    
    // Add to the container
    this.container.appendChild(notification);
    
    // Add to tracking array
    const notificationData = {
      id,
      element: notification,
      timer: null,
      type
    };
    
    this.notifications.push(notificationData);
    
    // Set timer for automatic closing
    const duration = options.duration || this.options.duration;
    if (duration > 0) {
      notificationData.timer = setTimeout(() => {
        this.close(id);
      }, duration);
    }
    
    // Animate in after a short delay (for proper transition)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Limit the number of notifications
    this._enforceLimit();
    
    return id;
  }
  
  /**
   * Close a notification by ID
   * @param {string} id - The notification ID
   */
  close(id) {
    const index = this.notifications.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const notification = this.notifications[index];
      
      // Clear any existing timer
      if (notification.timer) {
        clearTimeout(notification.timer);
      }
      
      // Remove animation
      notification.element.classList.remove('show');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
      }, 300); // Match the CSS transition duration
      
      // Remove from tracking array
      this.notifications.splice(index, 1);
    }
  }
  
  /**
   * Close all notifications
   */
  closeAll() {
    // Create a copy of the array since we'll be modifying it
    const notifications = [...this.notifications];
    
    notifications.forEach(notification => {
      this.close(notification.id);
    });
  }
  
  /**
   * Enforce the maximum number of notifications
   * @private
   */
  _enforceLimit() {
    if (this.notifications.length > this.options.maxNotifications) {
      // Close the oldest notifications
      const toRemove = this.notifications.length - this.options.maxNotifications;
      
      for (let i = 0; i < toRemove; i++) {
        this.close(this.notifications[i].id);
      }
    }
  }
  
  /**
   * Show an info notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} details - Optional details (shown in smaller text)
   * @param {Object} options - Additional options for this notification
   * @returns {string} The notification ID
   */
  info(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'info', options);
  }
  
  /**
   * Show a success notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} details - Optional details (shown in smaller text)
   * @param {Object} options - Additional options for this notification
   * @returns {string} The notification ID
   */
  success(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'success', options);
  }
  
  /**
   * Show a warning notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} details - Optional details (shown in smaller text)
   * @param {Object} options - Additional options for this notification
   * @returns {string} The notification ID
   */
  warning(title, message, details = '', options = {}) {
    return this._notify(title, message, details, 'warning', options);
  }
  
  /**
   * Show an error notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} details - Optional details (shown in smaller text)
   * @param {Object} options - Additional options for this notification
   * @returns {string} The notification ID
   */
  error(title, message, details = '', options = {}) {
    // Errors are important, so keep them visible longer by default
    const errorOptions = {
      duration: 8000, // 8 seconds
      ...options
    };
    
    return this._notify(title, message, details, 'error', errorOptions);
  }
}

// Export the component for use in UI modules
module.exports = NotificationComponent;