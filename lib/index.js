const fetch = require('node-fetch')
const { MetricsCollector } = require('./metrics')

// Read package version for User-Agent
const packageJson = require('../package.json')
const PACKAGE_VERSION = packageJson.version
const PACKAGE_NAME = packageJson.name

// Get Node.js version and platform for User-Agent
const NODE_VERSION = process.version
const PLATFORM = process.platform

/**
 * Generate User-Agent string
 * @returns {string} User-Agent string
 * @private
 */
function generateUserAgent () {
  return `${PACKAGE_NAME}/${PACKAGE_VERSION} (Node.js ${NODE_VERSION}; ${PLATFORM})`
}

// Global cache storage
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function clearExpiredCache () {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

/**
 * Get cached response if available and not expired
 * @param {string} key - Cache key
 * @param {MetricsCollector} metrics - Metrics collector instance
 * @returns {Object|null} Cached response or null if not found/expired
 * @private
 */
function getCachedResponse (key, metrics) {
  clearExpiredCache()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (metrics) metrics.recordRequest({ cacheHit: true })
    return cached.data
  }
  if (metrics) metrics.recordRequest({ cacheHit: false })
  return null
}

/**
 * Cache a response
 * @param {string} key - Cache key
 * @param {Object} data - Response data to cache
 * @private
 */
function cacheResponse (key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * Odesli API Client
 *
 * A Node.js client for the Odesli API (formerly song.link/album.link) that helps you find links to music across multiple streaming platforms.
 *
 * @example
 * ```javascript
 * const Odesli = require('odesli.js');
 *
 * // Initialize without API key (10 requests/minute limit)
 * const odesli = new Odesli();
 *
 * // Or with API key for higher limits
 * const odesli = new Odesli({
 *   apiKey: 'your-api-key-here',
 *   version: 'v1-alpha.1'
 * });
 *
 * // Fetch a song by URL
 * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
 * console.log(`${song.title} by ${song.artist[0]}`);
 * ```
 */
module.exports = class Odesli {
  /**
   * Create a new Odesli instance
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.apiKey] - Optional API key for higher rate limits (10+ requests/minute). Without an API key, you're limited to 10 requests per minute.
   * @param {string} [options.version='v1-alpha.1'] - API version to use
   * @param {boolean} [options.cache=true] - Enable response caching (5 minute TTL)
   * @param {number} [options.timeout=10000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Maximum number of retry attempts for failed requests
   * @param {number} [options.retryDelay=1000] - Base delay between retries in milliseconds (uses exponential backoff)
   * @param {Object} [options.headers={}] - Additional headers to include in requests
   * @param {string} [options.baseUrl='https://api.song.link'] - Base URL for API requests
   * @param {boolean} [options.validateParams=true] - Enable parameter validation
   * @param {Function} [options.logger] - Optional logger function for debugging
   * @param {MetricsCollector|boolean} [options.metrics] - Optional metrics collector instance or `false` to disable
   *
   * @example
   * ```javascript
   * // Basic usage without API key
   * const odesli = new Odesli();
   *
   * // With API key for higher limits
   * const odesli = new Odesli({
   *   apiKey: 'your-api-key-here',
   *   version: 'v1-alpha.1',
   *   cache: true,
   *   timeout: 10000,
   *   maxRetries: 3,
   *   retryDelay: 1000,
   *   headers: { 'User-Agent': 'MyApp/1.0' },
   *   validateParams: true
   * });
   *
   * // Disable metrics
   * const odesli = new Odesli({ metrics: false });
   * ```
   */
  constructor (options = {}) {
    const {
      apiKey = undefined,
      version = 'v1-alpha.1',
      cache = true,
      timeout = 10000,
      maxRetries = 3,
      retryDelay = 1000,
      headers = {},
      baseUrl = 'https://api.song.link',
      validateParams = true,
      logger = null,
      metrics
    } = options || {}

    this.apiKey = apiKey || undefined
    this.version = version || 'v1-alpha.1'
    this.cacheEnabled = cache
    this.timeout = timeout
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
    this.customHeaders = headers
    this.baseUrl = baseUrl
    this.validateParams = validateParams
    this.logger = logger

    if (metrics === false) {
      this.metrics = new MetricsCollector({ enabled: false })
    } else {
      this.metrics = metrics || new MetricsCollector()
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   * @private
   */
  _validateUrl (url) {
    if (!this.validateParams) return true
    try {
      const urlObj = new URL(url)
      return urlObj.href.length > 0
    } catch {
      return false
    }
  }

  /**
   * Validate country code format
   * @param {string} country - Country code to validate
   * @returns {boolean} True if valid ISO 3166-1 Alpha-2 code
   * @private
   */
  _validateCountry (country) {
    if (!this.validateParams) return true
    return /^[A-Z]{2}$/.test(country)
  }

  /**
   * Validate platform name
   * @param {string} platform - Platform to validate
   * @returns {boolean} True if valid platform
   * @private
   */
  _validatePlatform (platform) {
    if (!this.validateParams) return true
    const validPlatforms = [
      'spotify', 'itunes', 'appleMusic', 'youtube', 'youtubeMusic',
      'google', 'googleStore', 'pandora', 'deezer', 'tidal',
      'amazonStore', 'amazonMusic', 'soundcloud', 'napster', 'yandex', 'spinrilla'
    ]
    return validPlatforms.includes(platform.toLowerCase())
  }

  /**
   * Validate entity type
   * @param {string} type - Type to validate
   * @returns {boolean} True if valid type
   * @private
   */
  _validateType (type) {
    if (!this.validateParams) return true
    return ['song', 'album'].includes(type.toLowerCase())
  }

  /**
   * Log message if logger is configured
   * @param {string} message - Message to log
   * @param {string} level - Log level (debug, info, warn, error)
   * @private
   */
  _log (message, level = 'info') {
    if (this.logger && typeof this.logger === 'function') {
      this.logger(message, level)
    }
  }

  /**
   * Make a request to the Odesli API with caching, timeout, and retry support
   *
   * @param {string} path - API endpoint path
   * @returns {Promise<Object>} API response
   * @private
   */
  async _request (path) {
    const url = `${this.baseUrl}/${this.version}/${path}${this.apiKey !== undefined ? `&key=${this.apiKey}` : ''}`

    // Check cache first if enabled
    if (this.cacheEnabled) {
      const cached = getCachedResponse(url, this.metrics)
      if (cached) {
        this._log(`Cache hit for ${path}`, 'debug')
        return cached
      }
    }

    let lastError
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._log(`Request attempt ${attempt}/${this.maxRetries} for ${path}`, 'debug')
        
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': generateUserAgent(),
            ...this.customHeaders,
            Accept: 'application/json'
          }
        })

        clearTimeout(timeoutId)

        if (!response || !response.ok) {
          if (!response) {
            if (lastError) throw lastError
            throw new Error('API returned an unexpected result.')
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        // Handle errors
        if (result.statusCode) {
          // Codes in the `4xx` range indicate an error that failed given the information provided
          if (result.statusCode === 429) throw new Error(`${result.statusCode}: ${result.code}, You are being rate limited, No API Key is 10 Requests / Minute.`)
          // Codes in the `4xx` range indicate an error that failed given the information provided
          if (result.statusCode.toString().startsWith(4)) throw new Error(`${result.statusCode}: ${result.code}, Codes in the 4xx range indicate an error that failed given the information provided.`)
          // Codes in the 5xx range indicate an error with Songlink's servers.
          if (result.statusCode.toString().startsWith(5)) throw new Error(`${result.statusCode}: ${result.code}, Codes in the 5xx range indicate an error with Songlink's servers.`)
          // Otherwise if the code is not 200 (Success), throw a generic error.
          if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.code}`)
          // return undefined as we didn't find anything.
          return undefined
        }

        // Cache successful responses
        if (this.cacheEnabled && result) {
          cacheResponse(url, result)
        }

        this._log(`Request successful for ${path}`, 'debug')
        return result
      } catch (err) {
        lastError = err
        
        // Don't retry on certain errors
        if (err.message.includes('429') || err.message.includes('4xx') || err.message.includes('5xx')) {
          this._log(`Non-retryable error: ${err.message}`, 'error')
          break
        }
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
          this._log(`Request failed, retrying in ${delay}ms: ${err.message}`, 'warn')
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If we get here, all retries failed
    if (lastError.name === 'AbortError') {
      throw new Error(`Request timeout after ${this.timeout}ms`)
    }
    if (lastError.message === 'Unexpected token < in JSON at position 0') {
      throw new Error('API returned an unexpected result.')
    }
    // Preserve original error message for network errors
    throw lastError
  }

  /**
   * Clear the response cache
   *
   * @example
   * ```javascript
   * const odesli = new Odesli();
   * odesli.clearCache(); // Clear all cached responses
   * ```
   */
  clearCache () {
    cache.clear()
    this.metrics.reset() // Also reset metrics related to cache
    this._log('Cache cleared', 'info')
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   */
  getCacheStats () {
    const summary = this.metrics.getSummary()
    return {
      hitCount: summary.counters.cacheHits,
      missCount: summary.counters.cacheMisses,
      hitRate: summary.rates.cacheHitRate,
      size: cache.size,
    }
  }

  /**
   * Get the metrics collector instance for more detailed statistics.
   *
   * @returns {MetricsCollector} The metrics collector instance.
   */
  getMetrics () {
    return this.metrics
  }

  /**
   * Fetch song/album information by URL(s) from any supported streaming platform
   *
   * @param {string|Array<string>} urlOrUrls - URL or array of URLs from any supported streaming platform (Spotify, Apple Music, YouTube, etc.)
   * @param {Object|string} [options] - Options object or country code string (for backward compatibility)
   * @param {string} [options.country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @param {boolean} [options.skipCache=false] - Skip cache for this request
   * @param {number} [options.timeout] - Override timeout for this request
   * @param {number} [options.concurrency=5] - Maximum concurrent requests (batch only)
   * @returns {Promise<Object>|Promise<Array<Object>>} Song/album information or array of results
   *
   * @example
   * // Single fetch
   * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
   *
   * // Batch fetch
   * const songs = await odesli.fetch([
   *   'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
   *   'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu'
   * ]);
   */
  async fetch (urlOrUrls, options = {}) {
    if (Array.isArray(urlOrUrls)) {
      // Batch mode
      const urls = urlOrUrls
      if (urls.length === 0) {
        return []
      }
      
      const { concurrency = 5, ...requestOptions } = options
      
      const results = []
      const chunks = []
      
      // Split URLs into chunks for concurrency control
      for (let i = 0; i < urls.length; i += concurrency) {
        chunks.push(urls.slice(i, i + concurrency))
      }
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (url, _index) => {
          try {
            const result = await this.fetch(url, requestOptions)
            // Add success property to successful responses
            return { ...result, success: true }
          } catch (error) {
            // Enhanced error object with more context
            const errorInfo = {
              success: false,
              url,
              error: error.message,
              platform: this.detectPlatform(url),
              extractedId: this.extractId(url),
              timestamp: new Date().toISOString(),
              statusCode: this._extractStatusCode(error.message),
              retryable: this._isRetryableError(error.message)
            }
            
            // Add additional context based on error type
            if (error.message.includes('400')) {
              errorInfo.errorType = 'BAD_REQUEST'
              errorInfo.suggestion = 'Check if the URL is valid and accessible'
            } else if (error.message.includes('401')) {
              errorInfo.errorType = 'UNAUTHORIZED'
              errorInfo.suggestion = 'API key may be required or invalid'
            } else if (error.message.includes('429')) {
              errorInfo.errorType = 'RATE_LIMITED'
              errorInfo.suggestion = 'Rate limit exceeded, try again later'
            } else if (error.message.includes('404')) {
              errorInfo.errorType = 'NOT_FOUND'
              errorInfo.suggestion = 'Content may not be available in the specified region'
            } else if (error.message.includes('timeout')) {
              errorInfo.errorType = 'TIMEOUT'
              errorInfo.suggestion = 'Request timed out, try again'
            } else {
              errorInfo.errorType = 'UNKNOWN'
              errorInfo.suggestion = 'An unexpected error occurred'
            }
            
            return errorInfo
          }
        })
        
        const chunkResults = await Promise.all(chunkPromises)
        results.push(...chunkResults)
      }
      
      return results
    }
    const url = urlOrUrls
    if (!url) throw new Error('No URL was provided to odesli.fetch()')
    
    // Handle backward compatibility: if second parameter is a string, treat it as country
    let country = 'US'
    let skipCache = false
    let timeout = this.timeout
    
    if (typeof options === 'string') {
      country = options
    } else {
      country = options.country || 'US'
      skipCache = options.skipCache || false
      timeout = options.timeout || this.timeout
    }
    
    // Validate parameters
    if (!this._validateUrl(url)) {
      throw new Error('Invalid URL format provided to odesli.fetch()')
    }
    
    if (!this._validateCountry(country)) {
      throw new Error('Invalid country code format. Must be ISO 3166-1 Alpha-2 (e.g., "US", "GB")')
    }
    
    const path = `links?url=${encodeURIComponent(url)}&userCountry=${country}`
    
    // Temporarily override timeout and cache settings if specified
    const originalTimeout = this.timeout
    const originalCacheEnabled = this.cacheEnabled
    
    if (timeout !== this.timeout) {
      this.timeout = timeout
    }
    
    if (skipCache) {
      this.cacheEnabled = false
    }
    
    try {
      const song = await this._request(path)
      
      // Handle edge cases where response is malformed
      if (!song || !song.entityUniqueId || !song.entitiesByUniqueId || !song.entitiesByUniqueId[song.entityUniqueId]) {
        return song || {}
      }

      const id = song.entitiesByUniqueId[song.entityUniqueId].id
      const title = song.entitiesByUniqueId[song.entityUniqueId].title

      //  Convert Artist into Array for easier extraction of features
      Object.values(song.entitiesByUniqueId).forEach(function (values) {
        if (values.artistName && typeof values.artistName === 'string') {
          values.artistName = values.artistName.split(', ')
        }
      })

      const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName
      const type = song.entitiesByUniqueId[song.entityUniqueId].type
      const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl

      return {
        ...song,
        id,
        title,
        artist,
        type,
        thumbnail
      }
    } finally {
      // Restore original settings
      this.timeout = originalTimeout
      this.cacheEnabled = originalCacheEnabled
    }
  }

  /**
   * Fetch song/album information by platform, type, and ID
   *
   * @param {string} platform - Platform name (spotify, appleMusic, youtube, etc.)
   * @param {string} type - Content type ('song' or 'album')
   * @param {string} id - Platform-specific ID (can be full format like 'SPOTIFY_SONG::123' or just '123')
   * @param {Object|string} [options] - Options object or country code string (for backward compatibility)
   * @param {string} [options.country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @param {boolean} [options.skipCache=false] - Skip cache for this request
   * @param {number} [options.timeout] - Override timeout for this request
   * @returns {Promise<Object>} Song/album information with links to all available platforms
   *
   * @example
   * ```javascript
   * // Get song by Spotify ID
   * const song = await odesli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(song.title);
   *
   * // Get album by Apple Music ID (backward compatible)
   * const album = await odesli.getByParams('appleMusic', 'album', '123456789', 'GB');
   *
   * // Using full ID format with options
   * const song = await odesli.getByParams('spotify', 'song', 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR', {
   *   country: 'GB',
   *   skipCache: true,
   *   timeout: 5000
   * });
   * ```
   *
   * @throws {Error} When platform, type, or ID is not provided
   * @throws {Error} When platform name is invalid
   * @throws {Error} When type is invalid
   * @throws {Error} When country code format is invalid
   * @throws {Error} When API returns an error
   */
  async getByParams (platform, type, id, options = {}) {
    if (!platform) throw new Error('No `platform` was provided to odesli.getByParams()')
    if (!type) throw new Error('No `type` was provided to odesli.getByParams()')
    if (!id) throw new Error('No `id` was provided to odesli.getByParams()')

    // Handle backward compatibility: if fourth parameter is a string, treat it as country
    let country = 'US'
    let skipCache = false
    let timeout = this.timeout
    
    if (typeof options === 'string') {
      country = options
    } else {
      country = options.country || 'US'
      skipCache = options.skipCache || false
      timeout = options.timeout || this.timeout
    }

    // Validate parameters
    if (!this._validatePlatform(platform)) {
      throw new Error(`Invalid platform "${platform}". Must be one of: spotify, itunes, appleMusic, youtube, youtubeMusic, google, googleStore, pandora, deezer, tidal, amazonStore, amazonMusic, soundcloud, napster, yandex, spinrilla`)
    }
    
    if (!this._validateType(type)) {
      throw new Error(`Invalid type "${type}". Must be "song" or "album"`)
    }
    
    if (!this._validateCountry(country)) {
      throw new Error('Invalid country code format. Must be ISO 3166-1 Alpha-2 (e.g., "US", "GB")')
    }

    // if they happen to input the full id (PLATFORM_SONG::UNIQUEID), just get the UNIQUEID
    const idParts = id.split('::')
    const path = `links?platform=${platform}&type=${type}&id=${idParts.length > 1 ? idParts[1] : id}&userCountry=${country}`
    
    // Temporarily override timeout and cache settings if specified
    const originalTimeout = this.timeout
    const originalCacheEnabled = this.cacheEnabled
    
    if (timeout !== this.timeout) {
      this.timeout = timeout
    }
    
    if (skipCache) {
      this.cacheEnabled = false
    }
    
    try {
      const song = await this._request(path)

      // Handle edge cases where response is malformed
      if (!song || !song.entityUniqueId || !song.entitiesByUniqueId || !song.entitiesByUniqueId[song.entityUniqueId]) {
        return song || {}
      }

      //  Convert Artist into Array for easier extraction of features
      Object.values(song.entitiesByUniqueId).forEach(function (values) {
        if (values.artistName && typeof values.artistName === 'string') {
          values.artistName = values.artistName.split(', ')
        }
      })

      // Easier extraction of page's title, album, and thumbnail
      const title = song.entitiesByUniqueId[song.entityUniqueId].title
      const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName
      const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl
      const entityType = song.entitiesByUniqueId[song.entityUniqueId].type

      return {
        ...song,
        title,
        artist,
        thumbnail,
        type: entityType
      }
    } finally {
      // Restore original settings
      this.timeout = originalTimeout
      this.cacheEnabled = originalCacheEnabled
    }
  }

  /**
   * Fetch song/album information by entity ID
   *
   * @param {string} id - Full entity ID in format 'PLATFORM_TYPE::UNIQUEID' (e.g., 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR')
   * @param {Object|string} [options] - Options object or country code string (for backward compatibility)
   * @param {string} [options.country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @param {boolean} [options.skipCache=false] - Skip cache for this request
   * @param {number} [options.timeout] - Override timeout for this request
   * @returns {Promise<Object>} Song/album information with links to all available platforms
   *
   * @example
   * ```javascript
   * // Get song by entity ID
   * const song = await odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(song.title);
   *
   * // Get album by entity ID (backward compatible)
   * const album = await odesli.getById('APPLEMUSIC_ALBUM::123456789', 'GB');
   *
   * // Get song by entity ID with options
   * const song = await odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR', {
   *   country: 'GB',
   *   skipCache: true,
   *   timeout: 5000
   * });
   * ```
   *
   * @throws {Error} When ID is not provided
   * @throws {Error} When ID format is invalid (must match 'PLATFORM_TYPE::UNIQUEID')
   * @throws {Error} When country code format is invalid
   * @throws {Error} When API returns an error
   */
  async getById(id, options = {}) {
    if (!id) throw new Error('No `id` was provided to odesli.getById()')

    const idParts = id.split('::');
    if (idParts.length !== 2 || !idParts[0] || !idParts[1] || !idParts[0].includes('_')) {
      throw new Error('Provided Entity ID Does not match format. `<PLATFORM>_<SONG|ALBUM>::<UNIQUEID>`')
    }

    // Handle backward compatibility: if second parameter is a string, treat it as country
    let country = 'US'
    let skipCache = false
    let timeout = this.timeout

    if (typeof options === 'string') {
      country = options
    } else {
      country = options.country || 'US'
      skipCache = options.skipCache || false
      timeout = options.timeout || this.timeout
    }

    // Validate country code
    if (!this._validateCountry(country)) {
      throw new Error('Invalid country code format. Must be ISO 3166-1 Alpha-2 (e.g., "US", "GB")')
    }

    // Convert string into seperate params
    const parts = id.split('::')
    const unique = parts[1] || ''
    const platformAndType = (parts[0] || '').split('_')
    const type = platformAndType.pop() || ''
    const platform = platformAndType.join('_')

    const path = `links?platform=${platform.toLowerCase()}&type=${type.toLowerCase()}&id=${unique}&userCountry=${country}`

    // Temporarily override timeout and cache settings if specified
    const originalTimeout = this.timeout
    const originalCacheEnabled = this.cacheEnabled

    if (timeout !== this.timeout) {
      this.timeout = timeout
    }

    if (skipCache) {
      this.cacheEnabled = false
    }

    try {
      const song = await this._request(path)

      // Handle edge cases where response is malformed
      if (!song || !song.entityUniqueId || !song.entitiesByUniqueId || !song.entitiesByUniqueId[song.entityUniqueId]) {
        return song || {}
      }

      //  Convert Artist into Array for easier extraction of features
      Object.values(song.entitiesByUniqueId).forEach(function (values) {
        if (values.artistName && typeof values.artistName === 'string') {
          values.artistName = values.artistName.split(', ')
        }
      })

      // Easier extraction of page's title, album, and thumbnail
      const title = song.entitiesByUniqueId[song.entityUniqueId].title
      const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName
      const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl
      const entityType = song.entitiesByUniqueId[song.entityUniqueId].type

      return {
        ...song,
        title,
        artist,
        thumbnail,
        type: entityType
      }
    } finally {
      // Restore original settings
      this.timeout = originalTimeout
      this.cacheEnabled = originalCacheEnabled
    }
  }

  /**
   * Detect platform from URL
   *
   * @param {string} url - URL to analyze
   * @returns {string|null} Platform name or null if not recognized
   *
   * @example
   * ```javascript
   * const platform = odesli.detectPlatform('https://open.spotify.com/track/123');
   * console.log(platform); // 'spotify'
   * ```
   */
  detectPlatform (url) {
    if (!url) return null
    
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      const pathname = urlObj.pathname.toLowerCase()

      if (['music.youtube.com'].includes(hostname) || (['youtube.com', 'www.youtube.com'].includes(hostname) && pathname.startsWith('/music'))) return 'youtubeMusic'
      if (['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) return 'youtube'
      if (['music.amazon.com'].includes(hostname) || (['amazon.com', 'www.amazon.com'].includes(hostname) && pathname.startsWith('/music'))) return 'amazonMusic'
      if (['music.yandex.ru'].includes(hostname) || (['yandex.ru'].includes(hostname) && pathname.startsWith('/music'))) return 'yandex'
      if (['open.spotify.com', 'spotify.com'].includes(hostname)) return 'spotify'
      if (['music.apple.com', 'itunes.apple.com'].includes(hostname)) return 'appleMusic'
      if (['tidal.com', 'listen.tidal.com'].includes(hostname)) return 'tidal'
      if (['deezer.com', 'www.deezer.com'].includes(hostname)) return 'deezer'
      if (['soundcloud.com', 'www.soundcloud.com'].includes(hostname)) return 'soundcloud'
      if (['pandora.com', 'www.pandora.com'].includes(hostname)) return 'pandora'
      if (['napster.com', 'us.napster.com'].includes(hostname)) return 'napster'
      if (['spinrilla.com', 'www.spinrilla.com'].includes(hostname)) return 'spinrilla'
    } catch {
      // Malformed URL, just ignore.
    }
    
    return null
  }

  /**
   * Extract platform-specific ID from a URL
   *
   * @param {string} url - URL to extract ID from
   * @returns {string|null} Platform-specific ID or null if not found
   *
   * @example
   * ```javascript
   * const id = odesli.extractId('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(id); // '4Km5HrUvYTaSUfiSGPJeQR'
   * ```
   */
  extractId (url) {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      const hostname = urlObj.hostname.toLowerCase()
      
      // Spotify
      if (hostname === 'open.spotify.com') {
        return pathParts[pathParts.length - 1]
      }
      
      // Apple Music - improved to handle various URL formats
      if (['music.apple.com', 'itunes.apple.com'].includes(hostname)) {
        // Handle album URLs with track IDs: /album/name/id?i=trackId
        const trackIdMatch = url.match(/[?&]i=(\d+)/)
        if (trackIdMatch) {
          return trackIdMatch[1]
        }
        
        // Handle direct track URLs: /album/name/id
        const idMatch = url.match(/\/id(\d+)/)
        if (idMatch) {
          return idMatch[1]
        }
        
        // Handle other Apple Music URL formats
        const lastPart = pathParts[pathParts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          return lastPart;
        }
        
        return null
      }
      
      // YouTube
      if (['youtube.com', 'www.youtube.com', 'music.youtube.com', 'youtu.be'].includes(hostname)) {
        const videoMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)
        return videoMatch ? videoMatch[1] : null
      }
      
      // Tidal
      if (['tidal.com', 'listen.tidal.com'].includes(hostname)) {
        return pathParts[pathParts.length - 1]
      }
      
      // Deezer
      if (['deezer.com', 'www.deezer.com'].includes(hostname)) {
        return pathParts[pathParts.length - 1]
      }
      
      // Amazon Music
      if (['music.amazon.com'].includes(hostname) || (['amazon.com', 'www.amazon.com'].includes(hostname) && urlObj.pathname.toLowerCase().startsWith('/music'))) {
        const idMatch = url.match(/\/albums\/([^/]+)/)
        return idMatch ? idMatch[1] : null
      }
      
      // SoundCloud
      if (['soundcloud.com', 'www.soundcloud.com'].includes(hostname)) {
        return pathParts[pathParts.length - 1]
      }
      
      return null
    } catch {
      return null
    }
  }

  /**
   * Get supported platforms list
   *
   * @returns {Array<string>} Array of supported platform names
   *
   * @example
   * ```javascript
   * const platforms = odesli.getSupportedPlatforms();
   * console.log(platforms); // ['spotify', 'appleMusic', 'youtube', ...]
   * ```
   */
  getSupportedPlatforms () {
    return [
      'spotify', 'itunes', 'appleMusic', 'youtube', 'youtubeMusic',
      'google', 'googleStore', 'pandora', 'deezer', 'tidal',
      'amazonStore', 'amazonMusic', 'soundcloud', 'napster', 'yandex', 'spinrilla'
    ]
  }

  /**
   * Get the current User-Agent string used for requests
   *
   * @returns {string} Current User-Agent string
   * @example
   * ```javascript
   * const odesli = new Odesli();
   * console.log(odesli.getUserAgent());
   * // Output: "@mattraus/odesli.js/1.1.2 (Node.js v18.17.0; win32)"
   * ```
   */
  getUserAgent () {
    return generateUserAgent()
  }

  /**
   * Get all valid ISO 3166-1 alpha-2 country codes and names
   * @returns {Array<{ code: string, name: string }>} Array of country code/name pairs
   */
  static getCountryOptions() {
    // List from the CountryCode enum
    return [
      { code: 'AF', name: 'Afghanistan' },
      { code: 'AX', name: 'Aland Islands' },
      { code: 'AL', name: 'Albania' },
      { code: 'DZ', name: 'Algeria' },
      { code: 'AS', name: 'American Samoa' },
      { code: 'AD', name: 'Andorra' },
      { code: 'AO', name: 'Angola' },
      { code: 'AI', name: 'Anguilla' },
      { code: 'AQ', name: 'Antarctica' },
      { code: 'AG', name: 'Antigua and Barbuda' },
      { code: 'AR', name: 'Argentina' },
      { code: 'AM', name: 'Armenia' },
      { code: 'AW', name: 'Aruba' },
      { code: 'AU', name: 'Australia' },
      { code: 'AT', name: 'Austria' },
      { code: 'AZ', name: 'Azerbaijan' },
      { code: 'BS', name: 'Bahamas' },
      { code: 'BH', name: 'Bahrain' },
      { code: 'BD', name: 'Bangladesh' },
      { code: 'BB', name: 'Barbados' },
      { code: 'BY', name: 'Belarus' },
      { code: 'BE', name: 'Belgium' },
      { code: 'BZ', name: 'Belize' },
      { code: 'BJ', name: 'Benin' },
      { code: 'BM', name: 'Bermuda' },
      { code: 'BT', name: 'Bhutan' },
      { code: 'BO', name: 'Bolivia' },
      { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba' },
      { code: 'BA', name: 'Bosnia and Herzegovina' },
      { code: 'BW', name: 'Botswana' },
      { code: 'BV', name: 'Bouvet Island' },
      { code: 'BR', name: 'Brazil' },
      { code: 'IO', name: 'British Indian Ocean Territory' },
      { code: 'BN', name: 'Brunei Darussalam' },
      { code: 'BG', name: 'Bulgaria' },
      { code: 'BF', name: 'Burkina Faso' },
      { code: 'BI', name: 'Burundi' },
      { code: 'KH', name: 'Cambodia' },
      { code: 'CM', name: 'Cameroon' },
      { code: 'CA', name: 'Canada' },
      { code: 'CV', name: 'Cape Verde' },
      { code: 'KY', name: 'Cayman Islands' },
      { code: 'CF', name: 'Central African Republic' },
      { code: 'TD', name: 'Chad' },
      { code: 'CL', name: 'Chile' },
      { code: 'CN', name: 'China' },
      { code: 'CX', name: 'Christmas Island' },
      { code: 'CC', name: 'Cocos (Keeling) Islands' },
      { code: 'CO', name: 'Colombia' },
      { code: 'KM', name: 'Comoros' },
      { code: 'CG', name: 'Congo' },
      { code: 'CD', name: 'Congo, Democratic Republic' },
      { code: 'CK', name: 'Cook Islands' },
      { code: 'CR', name: 'Costa Rica' },
      { code: 'CI', name: "Cote d'Ivoire" },
      { code: 'HR', name: 'Croatia' },
      { code: 'CU', name: 'Cuba' },
      { code: 'CW', name: 'Curaçao' },
      { code: 'CY', name: 'Cyprus' },
      { code: 'CZ', name: 'Czech Republic' },
      { code: 'DK', name: 'Denmark' },
      { code: 'DJ', name: 'Djibouti' },
      { code: 'DM', name: 'Dominica' },
      { code: 'DO', name: 'Dominican Republic' },
      { code: 'EC', name: 'Ecuador' },
      { code: 'EG', name: 'Egypt' },
      { code: 'SV', name: 'El Salvador' },
      { code: 'GQ', name: 'Equatorial Guinea' },
      { code: 'ER', name: 'Eritrea' },
      { code: 'EE', name: 'Estonia' },
      { code: 'ET', name: 'Ethiopia' },
      { code: 'FK', name: 'Falkland Islands' },
      { code: 'FO', name: 'Faroe Islands' },
      { code: 'FJ', name: 'Fiji' },
      { code: 'FI', name: 'Finland' },
      { code: 'FR', name: 'France' },
      { code: 'GF', name: 'French Guiana' },
      { code: 'PF', name: 'French Polynesia' },
      { code: 'TF', name: 'French Southern Territories' },
      { code: 'GA', name: 'Gabon' },
      { code: 'GM', name: 'Gambia' },
      { code: 'GE', name: 'Georgia' },
      { code: 'DE', name: 'Germany' },
      { code: 'GH', name: 'Ghana' },
      { code: 'GI', name: 'Gibraltar' },
      { code: 'GR', name: 'Greece' },
      { code: 'GL', name: 'Greenland' },
      { code: 'GD', name: 'Grenada' },
      { code: 'GP', name: 'Guadeloupe' },
      { code: 'GU', name: 'Guam' },
      { code: 'GT', name: 'Guatemala' },
      { code: 'GG', name: 'Guernsey' },
      { code: 'GN', name: 'Guinea' },
      { code: 'GW', name: 'Guinea-Bissau' },
      { code: 'GY', name: 'Guyana' },
      { code: 'HT', name: 'Haiti' },
      { code: 'HM', name: 'Heard Island and McDonald Islands' },
      { code: 'VA', name: 'Holy See (Vatican City State)' },
      { code: 'HN', name: 'Honduras' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'HU', name: 'Hungary' },
      { code: 'IS', name: 'Iceland' },
      { code: 'IN', name: 'India' },
      { code: 'ID', name: 'Indonesia' },
      { code: 'IR', name: 'Iran' },
      { code: 'IQ', name: 'Iraq' },
      { code: 'IE', name: 'Ireland' },
      { code: 'IM', name: 'Isle of Man' },
      { code: 'IL', name: 'Israel' },
      { code: 'IT', name: 'Italy' },
      { code: 'JM', name: 'Jamaica' },
      { code: 'JP', name: 'Japan' },
      { code: 'JE', name: 'Jersey' },
      { code: 'JO', name: 'Jordan' },
      { code: 'KZ', name: 'Kazakhstan' },
      { code: 'KE', name: 'Kenya' },
      { code: 'KI', name: 'Kiribati' },
      { code: 'KR', name: 'Korea' },
      { code: 'KP', name: 'Korea, Democratic People\'s Republic' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'KG', name: 'Kyrgyzstan' },
      { code: 'LA', name: 'Lao People\'s Democratic Republic' },
      { code: 'LV', name: 'Latvia' },
      { code: 'LB', name: 'Lebanon' },
      { code: 'LS', name: 'Lesotho' },
      { code: 'LR', name: 'Liberia' },
      { code: 'LY', name: 'Libyan Arab Jamahiriya' },
      { code: 'LI', name: 'Liechtenstein' },
      { code: 'LT', name: 'Lithuania' },
      { code: 'LU', name: 'Luxembourg' },
      { code: 'MO', name: 'Macao' },
      { code: 'MK', name: 'Macedonia' },
      { code: 'MG', name: 'Madagascar' },
      { code: 'MW', name: 'Malawi' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'MV', name: 'Maldives' },
      { code: 'ML', name: 'Mali' },
      { code: 'MT', name: 'Malta' },
      { code: 'MH', name: 'Marshall Islands' },
      { code: 'MQ', name: 'Martinique' },
      { code: 'MR', name: 'Mauritania' },
      { code: 'MU', name: 'Mauritius' },
      { code: 'YT', name: 'Mayotte' },
      { code: 'MX', name: 'Mexico' },
      { code: 'FM', name: 'Micronesia' },
      { code: 'MD', name: 'Moldova' },
      { code: 'MC', name: 'Monaco' },
      { code: 'MN', name: 'Mongolia' },
      { code: 'ME', name: 'Montenegro' },
      { code: 'MS', name: 'Montserrat' },
      { code: 'MA', name: 'Morocco' },
      { code: 'MZ', name: 'Mozambique' },
      { code: 'MM', name: 'Myanmar' },
      { code: 'NA', name: 'Namibia' },
      { code: 'NR', name: 'Nauru' },
      { code: 'NP', name: 'Nepal' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'NC', name: 'New Caledonia' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'NI', name: 'Nicaragua' },
      { code: 'NE', name: 'Niger' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'NU', name: 'Niue' },
      { code: 'NF', name: 'Norfolk Island' },
      { code: 'MP', name: 'Northern Mariana Islands' },
      { code: 'NO', name: 'Norway' },
      { code: 'OM', name: 'Oman' },
      { code: 'PK', name: 'Pakistan' },
      { code: 'PW', name: 'Palau' },
      { code: 'PS', name: 'Palestinian Territory' },
      { code: 'PA', name: 'Panama' },
      { code: 'PG', name: 'Papua New Guinea' },
      { code: 'PY', name: 'Paraguay' },
      { code: 'PE', name: 'Peru' },
      { code: 'PH', name: 'Philippines' },
      { code: 'PN', name: 'Pitcairn' },
      { code: 'PL', name: 'Poland' },
      { code: 'PT', name: 'Portugal' },
      { code: 'PR', name: 'Puerto Rico' },
      { code: 'QA', name: 'Qatar' },
      { code: 'RE', name: 'Reunion' },
      { code: 'RO', name: 'Romania' },
      { code: 'RU', name: 'Russian Federation' },
      { code: 'RW', name: 'Rwanda' },
      { code: 'BL', name: 'Saint Barthelemy' },
      { code: 'SH', name: 'Saint Helena' },
      { code: 'KN', name: 'Saint Kitts and Nevis' },
      { code: 'LC', name: 'Saint Lucia' },
      { code: 'MF', name: 'Saint Martin' },
      { code: 'PM', name: 'Saint Pierre and Miquelon' },
      { code: 'VC', name: 'Saint Vincent and Grenadines' },
      { code: 'WS', name: 'Samoa' },
      { code: 'SM', name: 'San Marino' },
      { code: 'ST', name: 'Sao Tome and Principe' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'SN', name: 'Senegal' },
      { code: 'RS', name: 'Serbia' },
      { code: 'SC', name: 'Seychelles' },
      { code: 'SL', name: 'Sierra Leone' },
      { code: 'SG', name: 'Singapore' },
      { code: 'SX', name: 'Sint Maarten' },
      { code: 'SK', name: 'Slovakia' },
      { code: 'SI', name: 'Slovenia' },
      { code: 'SB', name: 'Solomon Islands' },
      { code: 'SO', name: 'Somalia' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'GS', name: 'South Georgia and the South Sandwich Islands' },
      { code: 'SS', name: 'South Sudan' },
      { code: 'ES', name: 'Spain' },
      { code: 'LK', name: 'Sri Lanka' },
      { code: 'SD', name: 'Sudan' },
      { code: 'SR', name: 'Suriname' },
      { code: 'SJ', name: 'Svalbard and Jan Mayen' },
      { code: 'SZ', name: 'Swaziland' },
      { code: 'SE', name: 'Sweden' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'SY', name: 'Syrian Arab Republic' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'TJ', name: 'Tajikistan' },
      { code: 'TZ', name: 'Tanzania' },
      { code: 'TH', name: 'Thailand' },
      { code: 'TL', name: 'Timor-Leste' },
      { code: 'TG', name: 'Togo' },
      { code: 'TK', name: 'Tokelau' },
      { code: 'TO', name: 'Tonga' },
      { code: 'TT', name: 'Trinidad and Tobago' },
      { code: 'TN', name: 'Tunisia' },
      { code: 'TR', name: 'Turkey' },
      { code: 'TM', name: 'Turkmenistan' },
      { code: 'TC', name: 'Turks and Caicos Islands' },
      { code: 'TV', name: 'Tuvalu' },
      { code: 'UG', name: 'Uganda' },
      { code: 'UA', name: 'Ukraine' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'US', name: 'United States' },
      { code: 'UM', name: 'United States Outlying Islands' },
      { code: 'UY', name: 'Uruguay' },
      { code: 'UZ', name: 'Uzbekistan' },
      { code: 'VU', name: 'Vanuatu' },
      { code: 'VE', name: 'Venezuela' },
      { code: 'VN', name: 'Vietnam' },
      { code: 'VG', name: 'Virgin Islands, British' },
      { code: 'VI', name: 'Virgin Islands, U.S.' },
      { code: 'WF', name: 'Wallis and Futuna' },
      { code: 'EH', name: 'Western Sahara' },
      { code: 'YE', name: 'Yemen' },
      { code: 'ZM', name: 'Zambia' },
      { code: 'ZW', name: 'Zimbabwe' },
    ]
  }
}
