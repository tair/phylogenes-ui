import axios from 'axios'

/**
 * Centralized API service for Panther/Tomcat endpoints
 * Provides consistent error handling, loading states, and retry logic
 */
class ApiService {
  constructor() {
    this.baseURL = process.env.VUE_APP_TOMCAT_URL
    this.timeout = 200000 // 200 seconds
    this.defaultRetries = 2

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `API Request: ${
            config.method ? config.method.toUpperCase() : 'UNKNOWN'
          } ${config.url}`
        )
        return config
      },
      (error) => {
        console.error('Request Error:', error)
        return Promise.reject(this.handleError(error))
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('Response Error:', error)
        return Promise.reject(this.handleError(error))
      }
    )
  }

  /**
   * Standardized error handling
   * @param {Error} error - The error object
   * @returns {Object} Standardized error object
   */
  handleError(error) {
    const standardError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      originalError: error,
      timestamp: new Date().toISOString(),
    }

    if (error.response) {
      // Server responded with error status
      standardError.code = `HTTP_${error.response.status}`
      standardError.status = error.response.status
      standardError.data = error.response.data

      switch (error.response.status) {
        case 400:
          standardError.message =
            'Invalid request. Please check your input and try again.'
          break
        case 401:
          standardError.message = 'Authentication required. Please log in.'
          break
        case 403:
          standardError.message =
            'Access denied. You do not have permission to perform this action.'
          break
        case 404:
          standardError.message =
            'Resource not found. The requested data may no longer be available.'
          break
        case 408:
        case 504:
          standardError.message =
            'Request timeout. The server is taking too long to respond.'
          break
        case 500:
          standardError.message = 'Server error. Please try again later.'
          break
        case 502:
        case 503:
          standardError.message =
            'Service temporarily unavailable. Please try again later.'
          break
        default:
          standardError.message = `Server error (${error.response.status}). Please try again later.`
      }
    } else if (error.request) {
      // Network error
      standardError.code = 'NETWORK_ERROR'
      standardError.message =
        'Network error. Please check your connection and try again.'
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      standardError.code = 'TIMEOUT_ERROR'
      standardError.message =
        'Request timeout. The operation is taking longer than expected.'
    }

    return standardError
  }

  /**
   * Generic request method with retry logic
   * @param {Object} config - Axios request config
   * @param {number} retries - Number of retry attempts
   * @returns {Promise} API response
   */
  async request(config, retries = this.defaultRetries) {
    try {
      const response = await this.client.request(config)
      return response.data
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.log(`Retrying request. Attempts remaining: ${retries}`)
        await this.delay(1000) // Wait 1 second before retry
        return this.request(config, retries - 1)
      }
      throw error
    }
  }

  /**
   * Determine if request should be retried
   * @param {Error} error - The error object
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error) {
    if (!error.response) return true // Network errors

    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(error.response.status)
  }

  /**
   * Delay utility for retries
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // =============================================================================
  // PANTHER API ENDPOINTS
  // =============================================================================

  /**
   * Tree grafting - Add sequence to phylogenetic tree
   * @param {string} sequence - Protein sequence to graft
   * @returns {Promise} Grafted tree data
   */
  async graftTree(sequence) {
    return this.request({
      method: 'POST',
      url: '/panther/grafting',
      data: { sequence },
    })
  }

  /**
   * Regular tree pruning - Remove taxa from tree
   * @param {string} treeId - Tree identifier
   * @param {Array} taxonIdsToShow - Array of taxon IDs to keep
   * @returns {Promise} Pruned tree data
   */
  async pruneTree(treeId, taxonIdsToShow) {
    return this.request({
      method: 'POST',
      url: `/panther/pruning/${treeId}`,
      data: { taxonIdsToShow },
    })
  }

  /**
   * Grafted tree pruning - Prune a previously grafted tree
   * @param {string} sequence - Original grafted sequence
   * @param {Array} taxonIdsToShow - Array of taxon IDs to keep
   * @returns {Promise} Pruned grafted tree data
   */
  async pruneGraftedTree(sequence, taxonIdsToShow) {
    return this.request({
      method: 'POST',
      url: '/panther/grafting/prune',
      data: { sequence, taxonIdsToShow },
    })
  }

  /**
   * Download FASTA sequences for tree
   * @param {string} treeId - Tree identifier
   * @param {Array} taxonIdsToShow - Array of taxon IDs (optional)
   * @returns {Promise} FASTA text data
   */
  async downloadFasta(treeId, taxonIdsToShow = []) {
    const url =
      taxonIdsToShow.length > 0
        ? `/panther/pruning/fastadoc/${treeId}`
        : `/panther/fastadoc/${treeId}`

    return this.request({
      method: 'POST',
      url,
      data: { taxonIdsToShow },
    })
  }

  /**
   * Get ortholog mapping for a gene
   * @param {string} uniprotId - UniProt identifier
   * @param {string} queryOrganismId - Organism taxon ID
   * @returns {Promise} Ortholog data
   */
  async getOrthologMapping(uniprotId, queryOrganismId) {
    return this.request({
      method: 'POST',
      url: '/panther/orthomapping',
      data: { uniprotId, queryOrganismId },
    })
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Download text content as file
   * @param {string} content - Text content to download
   * @param {string} filename - Name for downloaded file
   * @param {string} mimeType - MIME type for file
   */
  downloadAsFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)
  }

  /**
   * Validate tree graft response
   * @param {Object} response - API response
   * @returns {Object} Validation result
   */
  validateGraftResponse(response) {
    if (!response || !response.search) {
      return {
        isValid: false,
        error: 'Invalid response format',
      }
    }

    if (response.search.error) {
      return {
        isValid: false,
        error:
          'Sorry, your sequence could not be grafted to a Phylogenes gene tree',
      }
    }

    if (!response.search.book) {
      return {
        isValid: false,
        error: 'Connection timed out',
      }
    }

    return { isValid: true }
  }

  /**
   * Validate ortholog response
   * @param {*} response - API response
   * @returns {Object} Validation result
   */
  validateOrthologResponse(response) {
    if (!Array.isArray(response)) {
      return {
        isValid: false,
        error: 'Invalid ortholog data format',
      }
    }

    return { isValid: true }
  }
}

// Create and export singleton instance
const apiService = new ApiService()
export default apiService

// Export specific methods for convenience with proper binding
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
