const fetch = require('node-fetch')

/**
 * Simple in-memory cache for API responses
 * @private
 */
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Clear expired cache entries
 * @private
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
 * Get cached response if available and not expired
 * @param {string} key - Cache key
 * @returns {Object|null} Cached response or null if not found/expired
 * @private
 */
function getCachedResponse (key) {
  clearExpiredCache()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
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
   *   timeout: 10000
   * });
   * ```
   */
  constructor (options = {}) {
    const { apiKey = undefined, version = 'v1-alpha.1', cache = true, timeout = 10000 } = options || {}
    this.apiKey = apiKey || undefined
    this.version = version || 'v1-alpha.1'
    this.cacheEnabled = cache
    this.timeout = timeout
  }

  /**
   * Make a request to the Odesli API with caching and timeout support
   *
   * @param {string} path - API endpoint path
   * @returns {Promise<Object>} API response
   * @private
   */
  async _request (path) {
    const url = `https://api.song.link/${this.version}/${path}${this.apiKey !== undefined ? `&key=${this.apiKey}` : ''}`

    // Check cache first if enabled
    if (this.cacheEnabled) {
      const cached = getCachedResponse(url)
      if (cached) {
        return cached
      }
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'odesli.js/1.0.3',
          Accept: 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
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

      return result
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      if (err.message === 'Unexpected token < in JSON at position 0') {
        throw new Error('API returned an unexpected result.')
      }
      throw err
    }
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
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   * @example
   * ```javascript
   * const odesli = new Odesli();
   * const stats = odesli.getCacheStats();
   * console.log(`Cache size: ${stats.size}, Hit rate: ${stats.hitRate}%`);
   * ```
   */
  getCacheStats () {
    clearExpiredCache()
    return {
      size: cache.size,
      ttl: CACHE_TTL
    }
  }

  /**
   * Fetch song/album information by URL from any supported streaming platform
   *
   * @param {string} url - URL from any supported streaming platform (Spotify, Apple Music, YouTube, etc.)
   * @param {string} [country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @returns {Promise<Object>} Song/album information with links to all available platforms
   *
   * @example
   * ```javascript
   * // Fetch a song by Spotify URL
   * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(`${song.title} by ${song.artist[0]}`);
   *
   * // Fetch with custom country
   * const song = await odesli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR', 'GB');
   *
   * // Get all available platform links
   * Object.keys(song.linksByPlatform).forEach(platform => {
   *   console.log(`${platform}: ${song.linksByPlatform[platform].url}`);
   * });
   * ```
   *
   * @throws {Error} When no URL is provided
   * @throws {Error} When API returns an error (rate limiting, invalid URL, etc.)
   */
  async fetch (url, country = 'US') {
    if (!url) throw new Error('No URL was provided to odesli.fetch()')
    const path = `links?url=${encodeURIComponent(url)}&userCountry=${country}`
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
  }

  /**
   * Fetch song/album information by platform, type, and ID
   *
   * @param {string} platform - Platform name (spotify, appleMusic, youtube, etc.)
   * @param {string} type - Content type ('song' or 'album')
   * @param {string} id - Platform-specific ID (can be full format like 'SPOTIFY_SONG::123' or just '123')
   * @param {string} [country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @returns {Promise<Object>} Song/album information with links to all available platforms
   *
   * @example
   * ```javascript
   * // Get song by Spotify ID
   * const song = await odesli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(song.title);
   *
   * // Get album by Apple Music ID
   * const album = await odesli.getByParams('appleMusic', 'album', '123456789');
   * console.log(album.title);
   *
   * // Using full ID format
   * const song = await odesli.getByParams('spotify', 'song', 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
   * ```
   *
   * @throws {Error} When platform, type, or ID is not provided
   * @throws {Error} When API returns an error
   */
  async getByParams (platform, type, id, country = 'US') {
    if (!platform) throw new Error('No `platform` was provided to odesli.getByParams()')
    if (!type) throw new Error('No `type` was provided to odesli.getByParams()')
    if (!id) throw new Error('No `id` was provided to odesli.getByParams()')

    // if they happen to input the full id (PLATFORM_SONG::UNIQUEID), just get the UNIQUEID
    id = id.replace(/[^::]+::/g, '')
    const path = `links?platform=${platform}&type=${type}&id=${id}&userCountry=${country}`
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
  }

  /**
   * Fetch song/album information by entity ID
   *
   * @param {string} id - Full entity ID in format 'PLATFORM_TYPE::UNIQUEID' (e.g., 'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR')
   * @param {string} [country='US'] - ISO 3166-1 Alpha-2 country code for region-specific results
   * @returns {Promise<Object>} Song/album information with links to all available platforms
   *
   * @example
   * ```javascript
   * // Get song by entity ID
   * const song = await odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
   * console.log(song.title);
   *
   * // Get album by entity ID
   * const album = await odesli.getById('APPLEMUSIC_ALBUM::123456789');
   * console.log(album.title);
   * ```
   *
   * @throws {Error} When ID is not provided
   * @throws {Error} When ID format is invalid (must match 'PLATFORM_TYPE::UNIQUEID')
   * @throws {Error} When API returns an error
   */
  async getById (id, country = 'US') {
    if (!id) throw new Error('No `id` was provided to odesli.getById()')
    if (!id.match(/\w+_\w+::\w+/g)) throw new Error('Provided Entity ID Does not match format. `<PLATFORM>_<SONG|ALBUM>::<UNIQUEID>`')

    // Convert string into seperate params
    const platform = id.replace(/_\w+::\w+/g, '').toLowerCase()
    const type = id.replace(/\w+_/g, '').replace(/::\w+/g, '').toLowerCase()
    const unique = id.replace(/\w+::/g, '')

    const path = `links?platform=${platform}&type=${type}&id=${unique}&userCountry=${country}`
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
  }
}
