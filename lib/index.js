const fetch = require('node-fetch')
const { MetricsCollector } = require('./metrics')

// Read package version for User-Agent
const packageJson = require('../package.json')
const PACKAGE_VERSION = packageJson.version
const PACKAGE_NAME = packageJson.name

// Get Node.js version and platform for User-Agent
const NODE_VERSION = process.version
const PLATFORM = process.platform

const SUNSET_DOCS_URL =
  'https://linktr.ee/help/articles/15201827-sunsetting-the-songlink-odesli-public-api'

const SUPPORTED_PLATFORMS = [
  'spotify',
  'itunes',
  'appleMusic',
  'youtube',
  'youtubeMusic',
  'google',
  'googleStore',
  'pandora',
  'deezer',
  'tidal',
  'amazonStore',
  'amazonMusic',
  'soundcloud',
  'napster',
  'yandex',
  'spinrilla',
  'audiomack',
  'anghami',
  'boomplay',
  'audius'
]

const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 410])
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

/**
 * Structured error for Odesli/Songlink API failures.
 *
 * @extends Error
 * @since 2.0.0
 */
class OdesliError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {Object} [options={}] - Error metadata
   * @param {string} [options.code] - Machine-readable error code
   * @param {number|null} [options.statusCode=null] - HTTP status code when applicable
   * @param {boolean} [options.retryable=false] - Whether the request is safe to retry
   * @param {string} [options.docsUrl] - Documentation URL for remediation
   * @param {Error} [options.cause] - Underlying cause
   */
  constructor (message, options = {}) {
    super(message)
    this.name = 'OdesliError'
    this.code = options.code || 'ODESLI_ERROR'
    this.statusCode =
      typeof options.statusCode === 'number' ? options.statusCode : null
    this.retryable = Boolean(options.retryable)
    this.docsUrl = options.docsUrl || undefined
    if (options.cause) {
      this.cause = options.cause
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OdesliError)
    }
  }
}

/**
 * Generate User-Agent string for API requests.
 *
 * Creates a User-Agent string in the format:
 * `{packageName}/{version} (Node.js {nodeVersion}; {platform})`
 *
 * @returns {string} User-Agent string (e.g., 'odesli.js/2.0.0 (Node.js v18.0.0; win32)')
 * @private
 * @since 1.1.0
 */
function generateUserAgent () {
  return `${PACKAGE_NAME}/${PACKAGE_VERSION} (Node.js ${NODE_VERSION}; ${PLATFORM})`
}

/**
 * Build a Songlink API request URL and a secret-free cache key.
 *
 * @param {string} baseUrl - API base URL
 * @param {string} version - API version segment
 * @param {string} path - Path and query string without leading slash
 * @param {string} apiKey - Allowlisted Songlink API key
 * @returns {{ requestUrl: string, cacheKey: string }}
 * @private
 */
function buildRequestUrls (baseUrl, version, path, apiKey) {
  const normalizedBase = `${String(baseUrl || '').replace(/\/$/, '')}/`
  const normalizedVersion = String(version || '').replace(/^\/|\/$/g, '')
  const normalizedPath = String(path || '').replace(/^\//, '')
  const requestUrl = new URL(
    `${normalizedVersion}/${normalizedPath}`,
    normalizedBase
  )
  const cacheKey = requestUrl.toString()
  requestUrl.searchParams.set('key', apiKey)
  return {
    requestUrl: requestUrl.toString(),
    cacheKey
  }
}

/**
 * Parse response body text as JSON when possible.
 *
 * @param {string} bodyText - Raw response body
 * @returns {Object|null}
 * @private
 */
function parseJsonBody (bodyText) {
  if (!bodyText) return null
  try {
    return JSON.parse(bodyText)
  } catch {
    return null
  }
}

/**
 * Create an OdesliError from an API HTTP response.
 *
 * @param {number} statusCode - HTTP status code
 * @param {Object|null} payload - Parsed JSON payload when available
 * @param {string} [statusText] - HTTP status text
 * @param {Headers|Object} [headers] - Response headers
 * @returns {OdesliError}
 * @private
 */
function createApiError (statusCode, payload, statusText, headers) {
  const apiCode =
    payload && typeof payload.code === 'string' ? payload.code : undefined
  const effectiveStatus =
    (payload && typeof payload.statusCode === 'number'
      ? payload.statusCode
      : statusCode) || statusCode

  if (
    effectiveStatus === 401 &&
    apiCode === 'PUBLIC_API_ACCESS_DEPRECATED'
  ) {
    return new OdesliError(
      'Songlink/Odesli public API access is deprecated. An allowlisted API key is required.',
      {
        code: 'PUBLIC_API_ACCESS_DEPRECATED',
        statusCode: 401,
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  if (effectiveStatus === 401 && apiCode === 'INVALID_ACCESS_KEY') {
    return new OdesliError(
      'The provided Songlink/Odesli API key was rejected (INVALID_ACCESS_KEY).',
      {
        code: 'INVALID_ACCESS_KEY',
        statusCode: 401,
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  if (effectiveStatus === 401) {
    return new OdesliError(
      'Unauthorized Songlink/Odesli API request. Check that your allowlisted API key is valid.',
      {
        code: apiCode || 'UNAUTHORIZED',
        statusCode: 401,
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  if (effectiveStatus === 410) {
    return new OdesliError(
      'Songlink/Odesli API endpoint returned 410 Gone. The public API was retired on July 31, 2026.',
      {
        code: 'API_SUNSET_GONE',
        statusCode: 410,
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  if (effectiveStatus === 429) {
    const retryAfterHeader =
      headers && typeof headers.get === 'function'
        ? headers.get('retry-after')
        : headers && headers['retry-after']
    const retryAfterSeconds = Number(retryAfterHeader)
    const error = new OdesliError(
      `${effectiveStatus}: ${apiCode || 'RATE_LIMITED'}, You are being rate limited. Retry later.`,
      {
        code: apiCode || 'RATE_LIMITED',
        statusCode: 429,
        retryable: true,
        docsUrl: SUNSET_DOCS_URL
      }
    )
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      error.retryAfterMs = retryAfterSeconds * 1000
    }
    return error
  }

  if (String(effectiveStatus).startsWith('4')) {
    return new OdesliError(
      `${effectiveStatus}: ${apiCode || statusText || 'CLIENT_ERROR'}, Codes in the 4xx range indicate an error that failed given the information provided.`,
      {
        code: apiCode || 'CLIENT_ERROR',
        statusCode: effectiveStatus,
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  if (String(effectiveStatus).startsWith('5')) {
    return new OdesliError(
      `${effectiveStatus}: ${apiCode || statusText || 'SERVER_ERROR'}, Codes in the 5xx range indicate an error with Songlink's servers.`,
      {
        code: apiCode || 'SERVER_ERROR',
        statusCode: effectiveStatus,
        retryable: true,
        docsUrl: SUNSET_DOCS_URL
      }
    )
  }

  return new OdesliError(
    `${effectiveStatus}: ${apiCode || statusText || 'ODESLI_ERROR'}`,
    {
      code: apiCode || 'ODESLI_ERROR',
      statusCode: effectiveStatus,
      retryable: RETRYABLE_STATUS_CODES.has(effectiveStatus),
      docsUrl: SUNSET_DOCS_URL
    }
  )
}

// Global cache storage
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Clear expired entries from the cache.
 * 
 * Removes cache entries that have exceeded the TTL (Time To Live).
 * Called automatically before cache lookups.
 *
 * @private
 * @since 1.1.0
 */
function clearExpiredCache () {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

/**
 * Get cached response if available and not expired.
 * 
 * Checks the cache for a valid (non-expired) response and records
 * cache hit/miss metrics if a metrics collector is provided.
 *
 * @param {string} key - Cache key (typically the full API URL)
 * @param {MetricsCollector} [metrics] - Optional metrics collector instance
 * @returns {Object|null} Cached response data or null if not found/expired
 * @private
 * @since 1.1.0
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
 * Cache a response with timestamp for TTL management.
 * 
 * Stores response data in the cache with a timestamp. The cache entry
 * will be automatically expired after CACHE_TTL milliseconds.
 *
 * @param {string} key - Cache key (typically the full API URL)
 * @param {Object} data - Response data to cache
 * @private
 * @since 1.1.0
 */
function cacheResponse (key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * @module odesli
 * @description A Node.js client for the Odesli API (formerly song.link/album.link) that helps you find links to music across multiple streaming platforms.
 * @author Mattr <me@mtr.gg>
 * @version 2.0.0
 * @license ISC
 * @see {@link https://github.com/MattrAus/odesli.js|GitHub Repository}
 * @see {@link https://www.npmjs.com/package/odesli.js|NPM Package}
 */

/**
 * Odesli API Client
 *
 * @summary A Node.js client for the Songlink/Odesli API that helps you find links to music across multiple streaming platforms.
 * @class
 * @memberof module:odesli
 * @version 2.0.0
 * @tutorial getting-started
 * @tutorial advanced-usage
 * @example
 * ```javascript
 * const Odesli = require('odesli.js');
 *
 * // Prefer environment configuration in production
 * // process.env.ODESLI_API_KEY = 'your-allowlisted-key'
 * const odesli = new Odesli({
 *   apiKey: process.env.ODESLI_API_KEY
 * });
 *
 * // Fetch a song by URL
 * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
 * console.log(`${song.title} by ${song.artist[0]}`);
 * ```
 */
class Odesli {
  /**
   * Create a new Odesli instance
   *
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.apiKey] - Allowlisted Songlink/Odesli API key. Falls back to `process.env.ODESLI_API_KEY`. Required as of v2.0.0.
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
   * // From environment variable
   * const odesli = new Odesli(); // uses process.env.ODESLI_API_KEY
   *
   * // Explicit API key
   * const odesli = new Odesli({
   *   apiKey: process.env.ODESLI_API_KEY,
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
   * const odesli = new Odesli({
   *   apiKey: process.env.ODESLI_API_KEY,
   *   metrics: false
   * });
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

    const resolvedKey = String(
      apiKey ?? process.env.ODESLI_API_KEY ?? ''
    ).trim()

    if (!resolvedKey) {
      throw new OdesliError(
        'Songlink/Odesli retired its unauthenticated public API on July 31, 2026. Pass { apiKey } or set ODESLI_API_KEY with an allowlisted key.',
        {
          code: 'MISSING_API_KEY',
          retryable: false,
          docsUrl: SUNSET_DOCS_URL
        }
      )
    }

    this.apiKey = resolvedKey
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
    return SUPPORTED_PLATFORMS.map((p) => p.toLowerCase()).includes(
      String(platform || '').toLowerCase()
    )
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
   * Make a request to the Odesli API with caching, timeout, and retry support.
   *
   * This method handles:
   * - Cache checking and storage (keyed without the API key)
   * - Request timeouts
   * - Automatic retries with exponential backoff for retryable failures
   * - Structured error handling for sunset / auth / rate-limit responses
   *
   * @param {string} path - API endpoint path (e.g., 'links?url=...')
   * @returns {Promise<Object>} API response object
   * @throws {OdesliError} When the request fails
   * @private
   * @since 1.1.0
   */
  async _request (path) {
    const { requestUrl, cacheKey } = buildRequestUrls(
      this.baseUrl,
      this.version,
      path,
      this.apiKey
    )

    // Check cache first if enabled (secret-free cache key)
    if (this.cacheEnabled) {
      const cached = getCachedResponse(cacheKey, this.metrics)
      if (cached) {
        this._log(`Cache hit for ${path}`, 'debug')
        return cached
      }
    }

    let lastError
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._log(
          `Request attempt ${attempt}/${this.maxRetries} for ${path}`,
          'debug'
        )

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        let response
        try {
          response = await fetch(requestUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': generateUserAgent(),
              ...this.customHeaders,
              Accept: 'application/json'
            }
          })
        } finally {
          clearTimeout(timeoutId)
        }

        if (!response) {
          throw new OdesliError('API returned an unexpected result.', {
            code: 'UNEXPECTED_RESPONSE',
            retryable: true,
            docsUrl: SUNSET_DOCS_URL
          })
        }

        const bodyText = await response.text()
        const result = parseJsonBody(bodyText)

        const payloadStatus =
          result && typeof result.statusCode === 'number'
            ? result.statusCode
            : null
        const effectiveStatus = payloadStatus || response.status

        if (!response.ok || (payloadStatus && payloadStatus !== 200)) {
          throw createApiError(
            effectiveStatus,
            result,
            response.statusText,
            response.headers
          )
        }

        if (bodyText && result === null) {
          throw new OdesliError('API returned an unexpected result.', {
            code: 'UNEXPECTED_RESPONSE',
            statusCode: response.status,
            retryable: true,
            docsUrl: SUNSET_DOCS_URL
          })
        }

        if (this.cacheEnabled && result) {
          cacheResponse(cacheKey, result)
        }

        this._log(`Request successful for ${path}`, 'debug')
        return result
      } catch (err) {
        if (err && err.name === 'AbortError') {
          lastError = new OdesliError(
            `Request timeout after ${this.timeout}ms`,
            {
              code: 'TIMEOUT',
              retryable: true,
              docsUrl: SUNSET_DOCS_URL,
              cause: err
            }
          )
        } else if (err instanceof OdesliError) {
          lastError = err
        } else {
          lastError = new OdesliError(err.message || 'Request failed', {
            code: 'NETWORK_ERROR',
            retryable: true,
            docsUrl: SUNSET_DOCS_URL,
            cause: err
          })
        }

        const shouldRetry =
          lastError.retryable === true &&
          !NON_RETRYABLE_STATUS_CODES.has(lastError.statusCode) &&
          attempt < this.maxRetries

        if (!shouldRetry) {
          this._log(`Non-retryable error: ${lastError.message}`, 'error')
          break
        }

        const delay =
          typeof lastError.retryAfterMs === 'number'
            ? lastError.retryAfterMs
            : this.retryDelay * Math.pow(2, attempt - 1)
        this._log(
          `Request failed, retrying in ${delay}ms: ${lastError.message}`,
          'warn'
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Clear the response cache and reset cache-related metrics.
   * 
   * This removes all cached API responses. Useful when you need fresh data
   * or want to free up memory. Cache statistics are also reset.
   *
   * @example
   * ```javascript
   * const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });
   *
   * // Fetch and cache a song
   * await odesli.fetch('https://open.spotify.com/track/123');
   *
   * // Later, clear cache to get fresh data
   * odesli.clearCache();
   *
   * // Next fetch will make a new API request
   * await odesli.fetch('https://open.spotify.com/track/123');
   * ```
   *
   * @see {@link Odesli#getCacheStats} To check cache statistics before clearing
   * @since 1.1.0
   */
  clearCache () {
    cache.clear()
    this.metrics.reset() // Also reset metrics related to cache
    this._log('Cache cleared', 'info')
  }

  /**
   * Get cache statistics including hit rate, size, and performance metrics.
   *
   * @summary Retrieve cache performance statistics including hit rate and size.
   *
   * @returns {Object} Cache statistics object
   * @returns {number} returns.hitCount - Number of cache hits
   * @returns {number} returns.missCount - Number of cache misses
   * @returns {number} returns.hitRate - Cache hit rate (0-1, where 1 is 100%)
   * @returns {number} returns.size - Current number of cached items
   *
   * @example
   * ```javascript
   * const stats = odesli.getCacheStats();
   * console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
   * console.log(`Cached items: ${stats.size}`);
   * ```
   *
   * @see {@link Odesli#clearCache} To clear the cache
   * @see {@link Odesli#getMetrics} For more detailed metrics
   * @since 1.1.0
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
   * Get the metrics collector instance for detailed performance and usage statistics.
   * 
   * The metrics collector tracks:
   * - Request counts (total, successful, failed)
   * - Cache performance (hits, misses, hit rate)
   * - Response times (average, min, max)
   * - Error rates and types
   * - Rate limit events
   *
   * @returns {MetricsCollector} The metrics collector instance with detailed statistics
   *
   * @example
   * ```javascript
   * const metrics = odesli.getMetrics();
   * const summary = metrics.getSummary();
   * console.log(`Total requests: ${summary.counters.totalRequests}`);
   * console.log(`Average response time: ${summary.timing.averageResponseTime}ms`);
   * console.log(`Error rate: ${summary.rates.errorRate * 100}%`);
   * ```
   *
   * @see {@link module:odesli/metrics.MetricsCollector} For MetricsCollector API
   * @since 1.1.0
   */
  getMetrics () {
    return this.metrics
  }

  /**
   * Fetch song/album information by URL(s) from any supported streaming platform.
   * 
   * @summary Primary method for retrieving music links with support for single URLs and batch processing.
   * 
   * This is the primary method for retrieving music links. It supports both single URLs
   * and batch processing of multiple URLs with automatic error handling.
   *
   * @async
   * @param {string|Array<string>} urlOrUrls - URL or array of URLs from any supported streaming platform (Spotify, Apple Music, YouTube, etc.)
   * @param {Object|string} [options] - Options object or country code string (for backward compatibility)
   * @param {string} [options.country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results. Use {@link Odesli.getCountryOptions} to get valid codes.
   * @param {boolean} [options.skipCache=false] - Skip cache for this request (useful for getting fresh data)
   * @param {number} [options.timeout] - Override timeout for this request in milliseconds
   * @param {number} [options.concurrency=5] - Maximum concurrent requests when processing arrays (batch only)
   * @returns {Promise<Object>|Promise<Array<Object>>} Song/album information or array of results. Each result includes:
   *   - `title` - Song/album title
   *   - `artist` - Array of artist names
   *   - `type` - Content type ('song' or 'album')
   *   - `thumbnail` - Thumbnail image URL
   *   - `pageUrl` - Song.link page URL
   *   - `linksByPlatform` - Object with platform-specific links
   *   - `entitiesByUniqueId` - Detailed entity information
   *
   * @example
   * ```javascript
   * // Single fetch
   * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(`${song.title} by ${song.artist.join(', ')}`);
   *
   * // Batch fetch with options
   * const songs = await odesli.fetch([
   *   'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
   *   'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu'
   * ], {
   *   country: 'GB',
   *   concurrency: 3,
   *   skipCache: true
   * });
   *
   * // Handle batch results with errors
   * songs.forEach((result, index) => {
   *   if (result.error) {
   *     console.error(`Song ${index + 1} failed: ${result.error}`);
   *   } else {
   *     console.log(`Song ${index + 1}: ${result.title}`);
   *   }
   * });
   * ```
   *
   * @throws {Error} When URL format is invalid
   * @throws {Error} When country code format is invalid (must be ISO 3166-1 Alpha-2)
   * @throws {Error} When API returns an error (4xx/5xx status codes)
   * @throws {Error} When request times out
   * @throws {Error} When rate limit is exceeded (429 status)
   *
   * @see {@link Odesli#getByParams} For fetching by platform, type, and ID
   * @see {@link Odesli#getById} For fetching by entity ID
   * @see {@link Odesli#detectPlatform} To detect platform from URL
   * @see {@link Odesli.getCountryOptions} To get valid country codes
   * @since 1.1.0
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
            const statusCode =
              typeof error.statusCode === 'number'
                ? error.statusCode
                : this._extractStatusCode(error.message)
            const errorCode =
              typeof error.code === 'string' ? error.code : undefined
            const retryable =
              typeof error.retryable === 'boolean'
                ? error.retryable
                : this._isRetryableError(error.message)

            const errorInfo = {
              success: false,
              url,
              error: error.message,
              platform: this.detectPlatform(url),
              extractedId: this.extractId(url),
              timestamp: new Date().toISOString(),
              statusCode,
              retryable,
              code: errorCode
            }

            if (errorCode === 'PUBLIC_API_ACCESS_DEPRECATED') {
              errorInfo.errorType = 'PUBLIC_API_ACCESS_DEPRECATED'
              errorInfo.suggestion =
                'Provide an allowlisted API key. See the Songlink/Odesli sunset docs.'
            } else if (errorCode === 'INVALID_ACCESS_KEY') {
              errorInfo.errorType = 'INVALID_ACCESS_KEY'
              errorInfo.suggestion =
                'The provided API key was rejected. Request allowlisted access from Linktree.'
            } else if (errorCode === 'API_SUNSET_GONE' || statusCode === 410) {
              errorInfo.errorType = 'API_SUNSET_GONE'
              errorInfo.suggestion =
                'This API endpoint is gone. Use an allowlisted key or link to https://song.link/ directly.'
            } else if (statusCode === 400) {
              errorInfo.errorType = 'BAD_REQUEST'
              errorInfo.suggestion = 'Check if the URL is valid and accessible'
            } else if (statusCode === 401) {
              errorInfo.errorType = 'UNAUTHORIZED'
              errorInfo.suggestion =
                'API key is missing, invalid, or not allowlisted'
            } else if (statusCode === 429) {
              errorInfo.errorType = 'RATE_LIMITED'
              errorInfo.suggestion = 'Rate limit exceeded, try again later'
            } else if (statusCode === 404) {
              errorInfo.errorType = 'NOT_FOUND'
              errorInfo.suggestion =
                'Content may not be available in the specified region'
            } else if (
              errorCode === 'TIMEOUT' ||
              String(error.message || '')
                .toLowerCase()
                .includes('timeout')
            ) {
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
   * Fetch song/album information by platform, type, and ID.
   * 
   * @summary Fetch music information using platform, type, and ID without requiring a full URL.
   * 
   * This method allows you to fetch music information when you already know the
   * platform, content type, and ID, without needing the full URL. Useful for
   * applications that store platform-specific IDs.
   *
   * @async
   * @param {string} platform - Platform name (spotify, appleMusic, youtube, youtubeMusic, etc.). Use {@link Odesli#getSupportedPlatforms} to get valid platforms.
   * @param {string} type - Content type ('song' or 'album')
   * @param {string} id - Platform-specific ID. Can be just the ID (e.g., '4Km5HrUvYTaSUfiSGPJeQR') or full format (e.g., 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR')
   * @param {Object|string} [options] - Options object or country code string (for backward compatibility)
   * @param {string} [options.country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results. Use {@link Odesli.getCountryOptions} to get valid codes.
   * @param {boolean} [options.skipCache=false] - Skip cache for this request
   * @param {number} [options.timeout] - Override timeout for this request in milliseconds
   * @returns {Promise<Object>} Song/album information with links to all available platforms. Same structure as {@link Odesli#fetch}
   *
   * @example
   * ```javascript
   * // Get song by Spotify ID (simple format)
   * const song = await odesli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(`${song.title} by ${song.artist.join(', ')}`);
   *
   * // Get album by Apple Music ID with country (backward compatible string format)
   * const album = await odesli.getByParams('appleMusic', 'album', '123456789', 'GB');
   *
   * // Using full ID format with options object
   * const song = await odesli.getByParams('spotify', 'song', 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR', {
   *   country: 'GB',
   *   skipCache: true,
   *   timeout: 5000
   * });
   * 
   * // Extract ID from URL and use with getByParams
   * const url = 'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR';
   * const platform = odesli.detectPlatform(url);
   * const id = odesli.extractId(url);
   * if (platform && id) {
   *   const song = await odesli.getByParams(platform, 'song', id);
   * }
   * 
   * // Country-specific fetching
   * const song = await odesli.getByParams('spotify', 'song', '123', {
   *   country: 'GB' // United Kingdom
   * });
   * 
   * // Get country options for UI dropdowns
   * const countries = Odesli.getCountryOptions();
   * const uk = countries.find(c => c.code === 'GB');
   * console.log(uk); // { code: 'GB', name: 'United Kingdom' }
   * ```
   *
   * @throws {Error} When platform, type, or ID is not provided
   * @throws {Error} When platform name is invalid (not in supported platforms list)
   * @throws {Error} When type is invalid (must be 'song' or 'album')
   * @throws {Error} When country code format is invalid (must be ISO 3166-1 Alpha-2)
   * @throws {Error} When API returns an error (4xx/5xx status codes)
   * @throws {Error} When request times out
   *
   * @see {@link Odesli#fetch} For fetching by URL instead
   * @see {@link Odesli#getById} For fetching by entity ID
   * @see {@link Odesli#detectPlatform} To detect platform from URL
   * @see {@link Odesli#extractId} To extract ID from URL
   * @see {@link Odesli#getSupportedPlatforms} To get valid platform names
   * @since 1.1.0
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
      throw new Error(
        `Invalid platform "${platform}". Must be one of: ${SUPPORTED_PLATFORMS.join(', ')}`
      )
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
   * Extract status code from error message.
   * 
   * Parses HTTP status codes from error messages in the format "XXX: ..."
   *
   * @param {string} errorMessage - Error message that may contain a status code
   * @returns {number|null} Extracted status code or null if not found
   * @private
   * @since 1.1.0
   */
  _extractStatusCode (errorMessage) {
    const match = String(errorMessage || '').match(/\b(\d{3})\b/)
    return match ? parseInt(match[1], 10) : null
  }

  /**
   * Determine if an error is retryable based on status code.
   *
   * Retryable status codes: 408 (Request Timeout), 429 (Too Many Requests),
   * 500 (Internal Server Error), 502 (Bad Gateway), 503 (Service Unavailable),
   * 504 (Gateway Timeout).
   *
   * @param {string} errorMessage - Error message to check
   * @returns {boolean} True if the error is retryable
   * @private
   * @since 1.1.0
   */
  _isRetryableError (errorMessage) {
    const statusCode = this._extractStatusCode(errorMessage)
    return statusCode ? RETRYABLE_STATUS_CODES.has(statusCode) : false
  }

  /**
   * Detect platform from a streaming service URL.
   * 
   * Supported platforms: Spotify, Apple Music, YouTube, YouTube Music, Tidal,
   * Deezer, SoundCloud, Pandora, Napster, Yandex Music, Spinrilla, Amazon Music.
   *
   * @param {string} url - URL to analyze (must be a valid URL from a supported platform)
   * @returns {string|null} Platform name (e.g., 'spotify', 'appleMusic', 'youtube') or null if not recognized
   *
   * @example
   * ```javascript
   * // Detect platform from various URLs
   * odesli.detectPlatform('https://open.spotify.com/track/123'); // 'spotify'
   * odesli.detectPlatform('https://music.apple.com/us/album/123'); // 'appleMusic'
   * odesli.detectPlatform('https://www.youtube.com/watch?v=abc'); // 'youtube'
   * odesli.detectPlatform('https://invalid-url.com'); // null
   * 
   * // Use with fetch
   * const url = 'https://open.spotify.com/track/123';
   * const platform = odesli.detectPlatform(url);
   * if (platform) {
   *   console.log(`Detected platform: ${platform}`);
   *   const song = await odesli.fetch(url);
   * }
   * ```
   *
   * @see {@link Odesli#extractId} To extract the ID from a URL
   * @see {@link Odesli#getSupportedPlatforms} To get list of all supported platforms
   * @since 1.1.0
   */
  /**
   * Detect platform from a streaming service URL without requiring an API key.
   *
   * @param {string} url - URL to analyze
   * @returns {string|null} Platform name or null if not recognized
   * @since 2.0.0
   */
  static detectPlatform (url) {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      const pathname = urlObj.pathname.toLowerCase()

      if (
        ['music.youtube.com'].includes(hostname) ||
        (['youtube.com', 'www.youtube.com'].includes(hostname) &&
          pathname.startsWith('/music'))
      ) {
        return 'youtubeMusic'
      }
      if (['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) {
        return 'youtube'
      }
      if (
        ['music.amazon.com'].includes(hostname) ||
        (['amazon.com', 'www.amazon.com'].includes(hostname) &&
          pathname.startsWith('/music'))
      ) {
        return 'amazonMusic'
      }
      if (
        ['music.yandex.ru'].includes(hostname) ||
        (['yandex.ru'].includes(hostname) && pathname.startsWith('/music'))
      ) {
        return 'yandex'
      }
      if (['open.spotify.com', 'spotify.com'].includes(hostname)) {
        return 'spotify'
      }
      if (['music.apple.com', 'itunes.apple.com'].includes(hostname)) {
        return 'appleMusic'
      }
      if (['tidal.com', 'listen.tidal.com'].includes(hostname)) return 'tidal'
      if (['deezer.com', 'www.deezer.com'].includes(hostname)) return 'deezer'
      if (['soundcloud.com', 'www.soundcloud.com'].includes(hostname)) {
        return 'soundcloud'
      }
      if (['pandora.com', 'www.pandora.com'].includes(hostname)) return 'pandora'
      if (['napster.com', 'us.napster.com'].includes(hostname)) return 'napster'
      if (['spinrilla.com', 'www.spinrilla.com'].includes(hostname)) {
        return 'spinrilla'
      }
      if (['audiomack.com', 'www.audiomack.com'].includes(hostname)) {
        return 'audiomack'
      }
      if (['play.anghami.com', 'anghami.com', 'www.anghami.com'].includes(hostname)) {
        return 'anghami'
      }
      if (['boomplay.com', 'www.boomplay.com'].includes(hostname)) {
        return 'boomplay'
      }
      if (['audius.co', 'www.audius.co'].includes(hostname)) return 'audius'
    } catch {
      // Malformed URL, just ignore.
    }

    return null
  }

  detectPlatform (url) {
    return Odesli.detectPlatform(url)
  }

  /**
   * Extract platform-specific ID from a streaming service URL.
   * 
   * This method parses URLs from various platforms and extracts the unique
   * identifier used by that platform. Useful for building entity IDs or
   * working with platform-specific APIs.
   *
   * @param {string} url - URL to extract ID from (must be a valid URL from a supported platform)
   * @returns {string|null} Platform-specific ID (e.g., track ID, album ID) or null if not found/invalid
   *
   * @example
   * ```javascript
   * // Extract IDs from various platforms
   * odesli.extractId('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
   * // Returns: '4Km5HrUvYTaSUfiSGPJeQR'
   * 
   * odesli.extractId('https://music.apple.com/us/album/test/123456789?i=987654321');
   * // Returns: '987654321' (song ID) or '123456789' (album ID)
   * 
   * odesli.extractId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
   * // Returns: 'dQw4w9WgXcQ'
   * 
   * // Use with getByParams
   * const url = 'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR';
   * const platform = odesli.detectPlatform(url);
   * const id = odesli.extractId(url);
   * if (platform && id) {
   *   const song = await odesli.getByParams(platform, 'song', id);
   * }
   * ```
   *
   * @see {@link Odesli#detectPlatform} To detect the platform from a URL
   * @see {@link Odesli#getByParams} To fetch using platform, type, and ID
   * @since 1.1.0
   */
  /**
   * Extract platform-specific ID from a streaming service URL without an API key.
   *
   * @param {string} url - URL to extract ID from
   * @returns {string|null} Platform-specific ID or null if not found/invalid
   * @since 2.0.0
   */
  static extractId (url) {
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
        const trackIdMatch = url.match(/[?&]i=(\d+)/)
        if (trackIdMatch) {
          return trackIdMatch[1]
        }

        const idMatch = url.match(/\/id(\d+)/)
        if (idMatch) {
          return idMatch[1]
        }

        const lastPart = pathParts[pathParts.length - 1]
        if (/^\d+$/.test(lastPart)) {
          return lastPart
        }

        return null
      }

      // YouTube
      if (
        [
          'youtube.com',
          'www.youtube.com',
          'music.youtube.com',
          'youtu.be'
        ].includes(hostname)
      ) {
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
      if (
        ['music.amazon.com'].includes(hostname) ||
        (['amazon.com', 'www.amazon.com'].includes(hostname) &&
          urlObj.pathname.toLowerCase().startsWith('/music'))
      ) {
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

  extractId (url) {
    return Odesli.extractId(url)
  }

  /**
   * Get list of all supported streaming platforms without an API key.
   *
   * @returns {Array<string>} Array of supported platform names
   * @since 2.0.0
   */
  static getSupportedPlatforms () {
    return [...SUPPORTED_PLATFORMS]
  }

  getSupportedPlatforms () {
    return Odesli.getSupportedPlatforms()
  }

  /**
   * Build a Songlink landing-page URL for a track/album URL without calling the API.
   *
   * Useful when you do not have an allowlisted API key and only need a shareable
   * `https://song.link/...` page.
   *
   * @param {string} url - Streaming platform URL
   * @returns {string} Songlink page URL
   * @throws {OdesliError} When the URL is missing or invalid
   * @since 2.0.0
   */
  static getPageUrl (url) {
    if (!url || typeof url !== 'string') {
      throw new OdesliError('A valid URL is required to build a Songlink page URL.', {
        code: 'INVALID_URL',
        retryable: false,
        docsUrl: SUNSET_DOCS_URL
      })
    }

    try {
      // Validate URL format
      // eslint-disable-next-line no-new
      new URL(url)
    } catch (err) {
      throw new OdesliError('A valid URL is required to build a Songlink page URL.', {
        code: 'INVALID_URL',
        retryable: false,
        docsUrl: SUNSET_DOCS_URL,
        cause: err
      })
    }

    return `https://song.link/${url}`
  }

  getPageUrl (url) {
    return Odesli.getPageUrl(url)
  }

  /**
   * Get the current User-Agent string used for API requests.
   * 
   * The User-Agent includes package name, version, Node.js version, and platform.
   * This is automatically generated and used in all API requests.
   *
   * @returns {string} Current User-Agent string (e.g., 'odesli.js/2.0.0 (Node.js v18.0.0; win32)')
   *
   * @example
   * ```javascript
   * const ua = odesli.getUserAgent();
   * console.log(ua);
   * // Output: 'odesli.js/2.0.0 (Node.js v18.0.0; win32)'
   * 
   * // Use for debugging or logging
   * console.log(`Making request with User-Agent: ${odesli.getUserAgent()}`);
   * ```
   *
   * @since 1.1.0
   */
  getUserAgent () {
    return generateUserAgent()
  }

  /**
   * Get all available country codes with their full names for use in UI dropdowns or validation.
   * 
   * @summary Retrieve all valid ISO 3166-1 Alpha-2 country codes with full names for UI components.
   * 
   * Returns an array of objects containing ISO 3166-1 Alpha-2 country codes and their
   * corresponding full country names. Useful for building country selection UI components
   * or validating country codes.
   *
   * @static
   * @readonly
   * @returns {Array<{ code: string, name: string }>} Array of country code/name pairs, sorted alphabetically by name
   * @returns {string} returns[].code - ISO 3166-1 Alpha-2 country code (e.g., 'US', 'GB', 'CA')
   * @returns {string} returns[].name - Full country name (e.g., 'United States', 'United Kingdom', 'Canada')
   *
   * @example
   * ```javascript
   * // Get all country options
   * const countries = Odesli.getCountryOptions();
   * console.log(`Total countries: ${countries.length}`); // 249
   * 
   * // Use in a dropdown
   * countries.forEach(country => {
   *   console.log(`${country.code}: ${country.name}`);
   * });
   * 
   * // Find a specific country
   * const uk = countries.find(c => c.code === 'GB');
   * console.log(uk); // { code: 'GB', name: 'United Kingdom' }
   * 
   * // Get top 10 countries
   * const topCountries = countries.slice(0, 10);
   * ```
   *
   * @see {@link Odesli#fetch} For using country codes in fetch operations
   * @see {@link Odesli#getByParams} For using country codes in getByParams
   * @see {@link Odesli#getById} For using country codes in getById
   * @since 1.2.0
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

Odesli.Odesli = Odesli
Odesli.default = Odesli
Odesli.OdesliError = OdesliError
Odesli.SUNSET_DOCS_URL = SUNSET_DOCS_URL

module.exports = Odesli
module.exports.Odesli = Odesli
module.exports.default = Odesli
module.exports.OdesliError = OdesliError
module.exports.SUNSET_DOCS_URL = SUNSET_DOCS_URL
