/**
 * Services index - Central export for all services
 * Provides convenient access to all application services
 */

import apiService from './api'
import loadingService, { LOADING_OPERATIONS } from './loadingService'
import notificationService from './notificationService'

// Export services
export { apiService, loadingService, notificationService, LOADING_OPERATIONS }

// Export API methods for convenience with proper binding
export const graftTree = (...args) => apiService.graftTree(...args)
export const pruneTree = (...args) => apiService.pruneTree(...args)
export const pruneGraftedTree = (...args) =>
  apiService.pruneGraftedTree(...args)
export const downloadFasta = (...args) => apiService.downloadFasta(...args)
export const getOrthologMapping = (...args) =>
  apiService.getOrthologMapping(...args)
export const downloadAsFile = (...args) => apiService.downloadAsFile(...args)
export const validateGraftResponse = (...args) =>
  apiService.validateGraftResponse(...args)
export const validateOrthologResponse = (...args) =>
  apiService.validateOrthologResponse(...args)

// Export notification methods for convenience with proper binding
export const success = (...args) => notificationService.success(...args)
export const error = (...args) => notificationService.error(...args)
export const warning = (...args) => notificationService.warning(...args)
export const info = (...args) => notificationService.info(...args)
export const handleApiError = (...args) =>
  notificationService.handleApiError(...args)
export const loading = (...args) => notificationService.loading(...args)

// Default export
export default {
  api: apiService,
  loading: loadingService,
  notifications: notificationService,
}
