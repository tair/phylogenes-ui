/**
 * Notification service for user-friendly messages
 * Provides centralized notification management
 */
class NotificationService {
  constructor() {
    this.notifications = []
    this.nextId = 1
    this.listeners = []
  }

  /**
   * Add a notification
   * @param {Object} notification - Notification object
   * @param {string} notification.type - Type: 'success', 'error', 'warning', 'info'
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {number} notification.duration - Auto-dismiss duration (ms), 0 for persistent
   * @returns {number} Notification ID
   */
  add({ type = 'info', title, message, duration = 5000 }) {
    const notification = {
      id: this.nextId++,
      type,
      title,
      message,
      timestamp: new Date(),
      duration,
    }

    this.notifications.push(notification)
    this.notifyListeners()

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id)
      }, duration)
    }

    return notification.id
  }

  /**
   * Remove a notification
   * @param {number} id - Notification ID
   */
  remove(id) {
    const index = this.notifications.findIndex((n) => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.notifyListeners()
    }
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications = []
    this.notifyListeners()
  }

  /**
   * Get all notifications
   * @returns {Array} All notifications
   */
  getAll() {
    return [...this.notifications]
  }

  /**
   * Subscribe to notification changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      callback([...this.notifications])
    })
  }

  // =============================================================================
  // CONVENIENCE METHODS
  // =============================================================================

  /**
   * Show success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration
   * @returns {number} Notification ID
   */
  success(title, message, duration = 5000) {
    return this.add({ type: 'success', title, message, duration })
  }

  /**
   * Show error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration (0 for persistent)
   * @returns {number} Notification ID
   */
  error(title, message, duration = 0) {
    return this.add({ type: 'error', title, message, duration })
  }

  /**
   * Show warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration
   * @returns {number} Notification ID
   */
  warning(title, message, duration = 8000) {
    return this.add({ type: 'warning', title, message, duration })
  }

  /**
   * Show info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration
   * @returns {number} Notification ID
   */
  info(title, message, duration = 5000) {
    return this.add({ type: 'info', title, message, duration })
  }

  /**
   * Handle API error and show appropriate notification
   * @param {Object} error - Standardized error object from API service
   * @param {string} context - Context for the error (e.g., "tree grafting")
   * @returns {number} Notification ID
   */
  handleApiError(error, context = 'operation') {
    const title = `${context.charAt(0).toUpperCase() + context.slice(1)} Failed`

    // Safely extract error message
    let message = 'An unexpected error occurred'
    if (error) {
      if (typeof error === 'string') {
        message = error
      } else if (error.message) {
        message = error.message
      } else if (error.toString && typeof error.toString === 'function') {
        message = error.toString()
      }
    }

    return this.error(title, message, 0)
  }

  /**
   * Show loading notification (typically used with progress indicators)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {number} Notification ID
   */
  loading(title, message) {
    return this.add({
      type: 'info',
      title,
      message,
      duration: 0, // Persistent until manually removed
    })
  }
}

// Create and export singleton instance
const notificationService = new NotificationService()
export default notificationService

// Export convenience methods
export const {
  success,
  error,
  warning,
  info,
  handleApiError,
  loading,
} = notificationService
