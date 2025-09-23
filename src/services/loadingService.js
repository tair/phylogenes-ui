/**
 * Loading state management service
 * Provides centralized loading state management for API operations
 */
class LoadingService {
  constructor() {
    this.loadingStates = new Map()
    this.listeners = new Map()
  }

  /**
   * Set loading state for an operation
   * @param {string} operation - Operation identifier
   * @param {boolean} isLoading - Loading state
   * @param {Object} context - Vue component context (for reactive updates)
   */
  setLoading(operation, isLoading, context = null) {
    this.loadingStates.set(operation, isLoading)

    // Update context if provided (for Vue reactivity)
    if (context && context.hasOwnProperty('isLoading')) {
      context.isLoading = isLoading
    }

    // Notify listeners
    const listeners = this.listeners.get(operation) || []
    listeners.forEach((callback) => callback(isLoading))
  }

  /**
   * Get loading state for an operation
   * @param {string} operation - Operation identifier
   * @returns {boolean} Loading state
   */
  isLoading(operation) {
    return this.loadingStates.get(operation) || false
  }

  /**
   * Subscribe to loading state changes
   * @param {string} operation - Operation identifier
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(operation, callback) {
    if (!this.listeners.has(operation)) {
      this.listeners.set(operation, [])
    }

    this.listeners.get(operation).push(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(operation) || []
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear all loading states
   */
  clearAll() {
    this.loadingStates.clear()
  }

  /**
   * Get all current loading states
   * @returns {Object} All loading states
   */
  getAllStates() {
    return Object.fromEntries(this.loadingStates)
  }
}

// Create and export singleton instance
const loadingService = new LoadingService()
export default loadingService

// Predefined operation keys for consistency
export const LOADING_OPERATIONS = {
  TREE_GRAFTING: 'tree_grafting',
  TREE_PRUNING: 'tree_pruning',
  GRAFTED_PRUNING: 'grafted_pruning',
  FASTA_DOWNLOAD: 'fasta_download',
  ORTHOLOG_DOWNLOAD: 'ortholog_download',
}
