// Type definitions for odesli.js
// Project: https://github.com/MattrAus/odesli.js, https://www.npmjs.com/package/odesli.js
// Definitions by: Mattr <https://github.com/MattrAus>
// TypeScript Version: 2.7

// Export the CountryCode type with enhanced intellisense
type CountryCode =
  | "AF" // Afghanistan
  | "AX" // Aland Islands
  | "AL" // Albania
  | "DZ" // Algeria
  | "AS" // American Samoa
  | "AD" // Andorra
  | "AO" // Angola
  | "AI" // Anguilla
  | "AQ" // Antarctica
  | "AG" // Antigua and Barbuda
  | "AR" // Argentina
  | "AM" // Armenia
  | "AW" // Aruba
  | "AU" // Australia
  | "AT" // Austria
  | "AZ" // Azerbaijan
  | "BS" // Bahamas
  | "BH" // Bahrain
  | "BD" // Bangladesh
  | "BB" // Barbados
  | "BY" // Belarus
  | "BE" // Belgium
  | "BZ" // Belize
  | "BJ" // Benin
  | "BM" // Bermuda
  | "BT" // Bhutan
  | "BO" // Bolivia
  | "BQ" // Bonaire, Sint Eustatius and Saba
  | "BA" // Bosnia and Herzegovina
  | "BW" // Botswana
  | "BV" // Bouvet Island
  | "BR" // Brazil
  | "IO" // British Indian Ocean Territory
  | "BN" // Brunei Darussalam
  | "BG" // Bulgaria
  | "BF" // Burkina Faso
  | "BI" // Burundi
  | "KH" // Cambodia
  | "CM" // Cameroon
  | "CA" // Canada
  | "CV" // Cape Verde
  | "KY" // Cayman Islands
  | "CF" // Central African Republic
  | "TD" // Chad
  | "CL" // Chile
  | "CN" // China
  | "CX" // Christmas Island
  | "CC" // Cocos (Keeling) Islands
  | "CO" // Colombia
  | "KM" // Comoros
  | "CG" // Congo
  | "CD" // Congo, Democratic Republic
  | "CK" // Cook Islands
  | "CR" // Costa Rica
  | "CI" // Cote d'Ivoire
  | "HR" // Croatia
  | "CU" // Cuba
  | "CW" // Curaçao
  | "CY" // Cyprus
  | "CZ" // Czech Republic
  | "DK" // Denmark
  | "DJ" // Djibouti
  | "DM" // Dominica
  | "DO" // Dominican Republic
  | "EC" // Ecuador
  | "EG" // Egypt
  | "SV" // El Salvador
  | "GQ" // Equatorial Guinea
  | "ER" // Eritrea
  | "EE" // Estonia
  | "ET" // Ethiopia
  | "FK" // Falkland Islands
  | "FO" // Faroe Islands
  | "FJ" // Fiji
  | "FI" // Finland
  | "FR" // France
  | "GF" // French Guiana
  | "PF" // French Polynesia
  | "TF" // French Southern Territories
  | "GA" // Gabon
  | "GM" // Gambia
  | "GE" // Georgia
  | "DE" // Germany
  | "GH" // Ghana
  | "GI" // Gibraltar
  | "GR" // Greece
  | "GL" // Greenland
  | "GD" // Grenada
  | "GP" // Guadeloupe
  | "GU" // Guam
  | "GT" // Guatemala
  | "GG" // Guernsey
  | "GN" // Guinea
  | "GW" // Guinea-Bissau
  | "GY" // Guyana
  | "HT" // Haiti
  | "HM" // Heard Island and McDonald Islands
  | "VA" // Holy See (Vatican City State)
  | "HN" // Honduras
  | "HK" // Hong Kong
  | "HU" // Hungary
  | "IS" // Iceland
  | "IN" // India
  | "ID" // Indonesia
  | "IR" // Iran
  | "IQ" // Iraq
  | "IE" // Ireland
  | "IM" // Isle of Man
  | "IL" // Israel
  | "IT" // Italy
  | "JM" // Jamaica
  | "JP" // Japan
  | "JE" // Jersey
  | "JO" // Jordan
  | "KZ" // Kazakhstan
  | "KE" // Kenya
  | "KI" // Kiribati
  | "KR" // Korea
  | "KP" // Korea, Democratic People's Republic
  | "KW" // Kuwait
  | "KG" // Kyrgyzstan
  | "LA" // Lao People's Democratic Republic
  | "LV" // Latvia
  | "LB" // Lebanon
  | "LS" // Lesotho
  | "LR" // Liberia
  | "LY" // Libyan Arab Jamahiriya
  | "LI" // Liechtenstein
  | "LT" // Lithuania
  | "LU" // Luxembourg
  | "MO" // Macao
  | "MK" // Macedonia
  | "MG" // Madagascar
  | "MW" // Malawi
  | "MY" // Malaysia
  | "MV" // Maldives
  | "ML" // Mali
  | "MT" // Malta
  | "MH" // Marshall Islands
  | "MQ" // Martinique
  | "MR" // Mauritania
  | "MU" // Mauritius
  | "YT" // Mayotte
  | "MX" // Mexico
  | "FM" // Micronesia
  | "MD" // Moldova
  | "MC" // Monaco
  | "MN" // Mongolia
  | "ME" // Montenegro
  | "MS" // Montserrat
  | "MA" // Morocco
  | "MZ" // Mozambique
  | "MM" // Myanmar
  | "NA" // Namibia
  | "NR" // Nauru
  | "NP" // Nepal
  | "NL" // Netherlands
  | "NC" // New Caledonia
  | "NZ" // New Zealand
  | "NI" // Nicaragua
  | "NE" // Niger
  | "NG" // Nigeria
  | "NU" // Niue
  | "NF" // Norfolk Island
  | "MP" // Northern Mariana Islands
  | "NO" // Norway
  | "OM" // Oman
  | "PK" // Pakistan
  | "PW" // Palau
  | "PS" // Palestinian Territory
  | "PA" // Panama
  | "PG" // Papua New Guinea
  | "PY" // Paraguay
  | "PE" // Peru
  | "PH" // Philippines
  | "PN" // Pitcairn
  | "PL" // Poland
  | "PT" // Portugal
  | "PR" // Puerto Rico
  | "QA" // Qatar
  | "RE" // Reunion
  | "RO" // Romania
  | "RU" // Russian Federation
  | "RW" // Rwanda
  | "BL" // Saint Barthelemy
  | "SH" // Saint Helena
  | "KN" // Saint Kitts and Nevis
  | "LC" // Saint Lucia
  | "MF" // Saint Martin
  | "PM" // Saint Pierre and Miquelon
  | "VC" // Saint Vincent and Grenadines
  | "WS" // Samoa
  | "SM" // San Marino
  | "ST" // Sao Tome and Principe
  | "SA" // Saudi Arabia
  | "SN" // Senegal
  | "RS" // Serbia
  | "SC" // Seychelles
  | "SL" // Sierra Leone
  | "SG" // Singapore
  | "SX" // Sint Maarten
  | "SK" // Slovakia
  | "SI" // Slovenia
  | "SB" // Solomon Islands
  | "SO" // Somalia
  | "ZA" // South Africa
  | "GS" // South Georgia and the South Sandwich Islands
  | "SS" // South Sudan
  | "ES" // Spain
  | "LK" // Sri Lanka
  | "SD" // Sudan
  | "SR" // Suriname
  | "SJ" // Svalbard and Jan Mayen
  | "SZ" // Swaziland
  | "SE" // Sweden
  | "CH" // Switzerland
  | "SY" // Syrian Arab Republic
  | "TW" // Taiwan
  | "TJ" // Tajikistan
  | "TZ" // Tanzania
  | "TH" // Thailand
  | "TL" // Timor-Leste
  | "TG" // Togo
  | "TK" // Tokelau
  | "TO" // Tonga
  | "TT" // Trinidad and Tobago
  | "TN" // Tunisia
  | "TR" // Turkey
  | "TM" // Turkmenistan
  | "TC" // Turks and Caicos Islands
  | "TV" // Tuvalu
  | "UG" // Uganda
  | "UA" // Ukraine
  | "AE" // United Arab Emirates
  | "GB" // United Kingdom
  | "US" // United States
  | "UM" // United States Outlying Islands
  | "UY" // Uruguay
  | "UZ" // Uzbekistan
  | "VU" // Vanuatu
  | "VE" // Venezuela
  | "VN" // Vietnam
  | "VG" // Virgin Islands, British
  | "VI" // Virgin Islands, U.S.
  | "WF" // Wallis and Futuna
  | "EH" // Western Sahara
  | "YE" // Yemen
  | "ZM" // Zambia
  | "ZW"; // Zimbabwe

// Core Odesli class
declare class Odesli {
  constructor(options?: OdesliOptions);
  
  // Core methods
  fetch(urlOrUrls: string | string[], options?: FetchOptions): Promise<SongData | SongData[] | BatchResult>;
  getByParams(platform: string, type: string, id: string, options?: FetchOptions): Promise<SongData>;
  getById(id: string, options?: FetchOptions): Promise<SongData>;
  
  // Utility methods
  detectPlatform(url: string): string | null;
  extractId(url: string): string | null;
  getSupportedPlatforms(): string[];
  getUserAgent(): string;
  
  // Cache methods
  clearCache(): void;
  getCacheStats(): CacheStats;
  
  // Metrics methods
  getMetrics(): MetricsCollector;
  
  // Static methods
  static getCountryOptions(): Array<{ code: CountryCode; name: string }>;
}

// Configuration options for Odesli client
interface OdesliOptions {
  apiKey?: string; // Optional API key for higher rate limits (10+ requests/minute)
  version?: string; // API version to use (default: 'v1-alpha.1')
  cache?: boolean; // Enable response caching with 5-minute TTL (default: true)
  timeout?: number; // Request timeout in milliseconds (default: 10000)
  maxRetries?: number; // Maximum number of retry attempts for failed requests (default: 3)
  retryDelay?: number; // Base delay between retries in milliseconds, uses exponential backoff (default: 1000)
  headers?: Record<string, string>; // Additional headers to include in requests
  baseUrl?: string; // Base URL for API requests (default: 'https://api.song.link')
  validateParams?: boolean; // Enable parameter validation (default: true)
  logger?: (message: string, level: string) => void; // Optional logger function for debugging
  metrics?: MetricsCollector | boolean; // Optional metrics collector instance or `false` to disable
}

// Options for fetch operations
interface FetchOptions {
  country?: CountryCode; // ISO 3166-1 Alpha-2 country code for region-specific results (default: 'US')
  skipCache?: boolean; // Skip cache for this request (default: false)
  timeout?: number; // Override timeout for this request (default: uses instance timeout)
  concurrency?: number; // Maximum concurrent requests for batch operations (default: 5)
}

// Batch result type for array of URLs
type BatchResult = Array<SongData | BatchError>;

// Error result for batch operations
interface BatchError {
  success: false;
  url: string;
  error: string;
  platform: string | null;
  extractedId: string | null;
  timestamp: string;
  statusCode: number | null;
  retryable: boolean;
  errorType: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'NOT_FOUND' | 'TIMEOUT' | 'UNKNOWN';
  suggestion: string;
}

// Song/Album data structure returned by Odesli API
interface SongData {
  entityUniqueId: string; // Unique identifier for the main entity
  entitiesByUniqueId: Record<string, EntityData>; // Collection of all related entities
  linksByPlatform: Record<string, PlatformLink>; // Links to different streaming platforms
  id: string; // Platform-specific ID for the main entity
  title: string; // Title of the song or album
  artist: string[]; // Array of artist names
  type: string; // Type of content ('song' or 'album')
  thumbnail: string; // URL to the thumbnail/cover art
  success?: boolean; // Added for batch operations
}

interface EntityData {
  id: string; // Platform-specific entity ID
  title: string; // Entity title
  artistName: string[]; // Array of artist names
  type: string; // Entity type ('song' or 'album')
  thumbnailUrl: string; // URL to the thumbnail/cover art
  thumbnailWidth?: number; // Coverart's width
  thumbnailHeight?: number; // Coverart's height
  apiProvider: APIProvider; // The API provider that powered this match
  platforms: Platform[]; // Array of platforms "powered" by this entity
}

interface PlatformLink {
  url: string; // Web URL to the content on the platform
  nativeAppUriMobile?: string; // Deep link for mobile native app
  nativeAppUriDesktop?: string; // Deep link for desktop native app
  entityUniqueId: string; // Unique ID for this entity
}

// Cache statistics and performance metrics
interface CacheStats {
  size: number; // Current number of cached items
  ttl: number; // Time-to-live for cached items in milliseconds
  hitCount: number; // Number of cache hits
  missCount: number; // Number of cache misses
  hitRate: number; // Cache hit rate as a percentage (0-100)
  totalRequests: number; // Total number of requests made
}

// Rate Limiter
declare class RateLimiter {
  constructor(options?: RateLimiterOptions);
  waitForSlot(): Promise<void>;
  handleRateLimitResponse(retryAfterSeconds?: number): Promise<void>;
  getStatus(): RateLimiterStatus;
}

interface RateLimiterOptions {
  maxRequests?: number; // Maximum number of requests allowed in the time window
  windowMs?: number; // Time window in milliseconds for rate limiting
  strategy?: 'token-bucket' | 'leaky-bucket' | 'sliding-window'; // Rate limiting algorithm: token-bucket (default), leaky-bucket, or sliding-window
  retryAfterMs?: number; // Default retry delay in milliseconds when rate limited
}

interface RateLimiterStatus {
  available?: number; // Number of available request slots
  max?: number; // Maximum number of requests allowed
  refillRate?: number; // Rate at which tokens are refilled (tokens per second)
  used?: number; // Number of requests used in current window
  windowMs?: number; // Time window in milliseconds
  queued?: number; // Number of requests waiting in queue
  processing?: boolean; // Whether rate limiter is currently processing requests
}

// Metrics Collector
declare class MetricsCollector {
  constructor(options?: MetricsOptions);
  recordRequest(options: RequestMetrics): void;
  recordError(error: Error, context?: Record<string, any>): void;
  recordRateLimit(delayMs: number): void;
  updateCacheMetrics(size: number): void;
  getSummary(): MetricsSummary;
  getDetailedMetrics(options?: DetailedMetricsOptions): Record<string, any>;
  cleanup(): void;
  reset(): void;
  export(): {
    summary: MetricsSummary;
    detailed: Record<string, any>;
    raw: {
      metrics: any;
      counters: any;
    };
  };
}

interface MetricsOptions {
  enabled?: boolean; // Enable metrics collection (default: true)
  retentionMs?: number; // How long to retain metrics data in milliseconds (default: 24 hours)
  maxDataPoints?: number; // Maximum number of data points to store (default: 1000)
}

interface RequestMetrics {
  url: string; // Request URL
  method?: string; // HTTP method used (GET, POST, etc.)
  startTime: number; // Request start time (timestamp in milliseconds)
  endTime?: number; // Request end time (timestamp in milliseconds)
  success?: boolean; // Whether the request was successful
  statusCode?: number; // HTTP status code returned
  error?: string; // Error message if request failed
  responseTime?: number; // Response time in milliseconds
  platform?: string; // Platform being queried
  country?: string; // Country code used for the request
  cacheHit?: boolean; // Whether the response came from cache
}

interface MetricsSummary {
  counters: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cacheHits: number;
    cacheMisses: number;
    rateLimitHits: number;
  };
  recent: {
    requests: number;
    errors: number;
    avgResponseTime: number;
    requestsPerMinute: number;
  };
  rates: {
    successRate: number;
    cacheHitRate: number;
    errorRate: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
  rateLimits: {
    hits: number;
    avgDelay: number;
  };
}

interface DetailedMetricsOptions {
  startTime?: number; // Start time for metrics query (timestamp in milliseconds)
  endTime?: number; // End time for metrics query (timestamp in milliseconds)
  groupBy?: 'hour' | 'minute' | 'platform' | 'country'; // Group metrics by time (hour/minute) or by dimension (platform/country)
}

// Plugin System
declare class PluginSystem {
  constructor();
  registerPlugin(name: string, plugin: Plugin): PluginSystem;
  unregisterPlugin(name: string): PluginSystem;
  registerHook(name: string, defaultHandlers?: any[]): PluginSystem;
  registerHookHandler(hookName: string, handler: (context: any) => Promise<void> | void, pluginName?: string): PluginSystem;
  executeHook(hookName: string, context?: Record<string, any>): Promise<void>;
  executeMiddleware(context: any, next: () => Promise<any>): Promise<any>;
  transformData(data: any, type: string, context?: Record<string, any>): Promise<any>;
  getPlugin(name: string): Plugin | undefined;
  getPlugins(): string[];
  hasPlugin(name: string): boolean;
  getPluginInfo(name: string): PluginInfo | null;
}

interface Plugin {
  name?: string; // Plugin name for identification
  version?: string; // Plugin version
  description?: string; // Plugin description
  init?: () => void; // Initialization function called when plugin is registered
  cleanup?: () => void; // Cleanup function called when plugin is unregistered
  hooks?: Record<string, (context: any) => Promise<void> | void>; // Event hooks for plugin lifecycle
  middleware?: (context: any, next: () => Promise<any>) => Promise<any>; // Middleware function for request processing
  transformers?: Record<string, (data: any, context: any) => Promise<any> | any>; // Data transformation functions
}

interface PluginInfo {
  name: string; // Plugin name
  hooks: string[]; // List of registered hook names
  hasMiddleware: boolean; // Whether the plugin has middleware function
  hasTransformers: boolean; // Whether the plugin has transformer functions
  version?: string; // Plugin version
  description?: string; // Plugin description
}

// Built-in plugins
declare const loggingPlugin: Plugin;
declare const cachingPlugin: Plugin;
declare const analyticsPlugin: Plugin;
declare const responseTransformerPlugin: Plugin;

// Legacy Page namespace for backward compatibility
declare namespace Page {
    interface Response {
        /**
         * The unique ID for the input entity that was supplied in the request. 
         * 
         * The data for this entity, such as title, artistName, etc. will be found in an object at `entitiesByUniqueId[entityUniqueId]`
        */
        entityUniqueId: string,

        /**
         * Song/Album Title of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].title`
        */
        title: string,

        /**
         * Artist's Name of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].artistName`
        */
        artist: string,

        /**
         * Type (song or album) of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].type`
        */
        type: entityType,

        /**
         * Thumbnail of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].thumbnailUrl`
        */
        thumbnail: string,

        /**
         * The userCountry query param that was supplied in the request. It signals
         * the country/availability we use to query the streaming platforms. Defaults
         * to 'US' if no userCountry supplied in the request.
         * 
         * NOTE: As a fallback, our service may respond with matches that were found
         * in a locale other than the userCountry supplied
        */
        userCountry: CountryCode,

        /**
         * A URL that will render the Songlink page for this entity
        */
        pageUrl: string,

        /**
         * A collection of objects. Each key is a platform, and each value is an
         * object that contains data for linking to the match
        */
        linksByPlatform: {
            /**
             * Each key in `linksByPlatform` is a Platform. A Platform will exist here
            * only if there is a match found. E.g. if there is no YouTube match found,
            * then neither `youtube` or `youtubeMusic` properties will exist here
            */
            [key in Platform]: {
                /** 
                * The unique ID for this entity. Use it to look up data about this entity
                * at `entitiesByUniqueId[entityUniqueId]`
                */
                entityUniqueId: string,

                /** 
                 * The URL for this match
                 */
                url: string,

                /**
                 * The native app URI that can be used on mobile devices to open this
                * entity directly in the native app
                */
                nativeAppUriMobile?: string,

                /**
                 * The native app URI that can be used on desktop devices to open this
                * entity directly in the native app
                */
                nativeAppUriDesktop?: string,
            };
        },

        /**
         * A collection of objects. Each key is a unique identifier for a streaming
        * entity, and each value is an object that contains data for that entity,
        * such as `title`, `artistName`, `thumbnailUrl`, etc.
        */
        entitiesByUniqueId: {
            /**
             * The unique identifier key for a streaming entitiy
             */
            [entityUniqueId: string]: {
                /**
                 * This is the unique identifier on the streaming platform/API provider
                 */
                id: string,

                /**
                 * The type of media this entity is
                 */
                type: entityType,

                /**
                 * The title of the `song`/`album`
                 */
                title?: string,

                /**
                 * The artist/s of the `song`/`album`
                 */
                artistName?: [string],

                /**
                 * The coverart image URL of the `song`/`album`
                 */
                thumbnailUrl?: string,

                /**
                 * Coverart's width
                 */
                thumbnailWidth?: number,
                /**
                 * Coverart's height
                 */
                thumbnailHeight?: number,

                /**
                 * The API provider that powered this match. Useful if you'd like to use
                * this entity's data to query the API directly
                */
                apiProvider: APIProvider,

                /**
                 * An array of platforms that are "powered" by this entity. E.g. an entity
                * from Apple Music will generally have a `platforms` array of
                * `["appleMusic", "itunes"]` since both those platforms/links are derived
                * from this single entity
                */
                platforms: Platform[],
            },
        },
    }
}

type Platform =
    | 'spotify' // Spotify - Music streaming platform
    | 'itunes' // iTunes Store - Apple's digital media store
    | 'appleMusic' // Apple Music - Apple's music streaming service
    | 'youtube' // YouTube - Video platform with music content
    | 'youtubeMusic' // YouTube Music - YouTube's dedicated music service
    | 'google' // Google Play Music - Google's music service (discontinued)
    | 'googleStore' // Google Play Store - Android app store
    | 'pandora' // Pandora - Internet radio service
    | 'deezer' // Deezer - French music streaming service
    | 'tidal' // Tidal - High-fidelity music streaming service
    | 'amazonStore' // Amazon Music Store - Amazon's digital music store
    | 'amazonMusic' // Amazon Music - Amazon's music streaming service
    | 'soundcloud' // SoundCloud - Audio distribution platform
    | 'napster' // Napster - Music streaming service
    | 'yandex' // Yandex Music - Russian music streaming service
    | 'spinrilla'; // Spinrilla - Mixtape and hip-hop music platform

type APIProvider =
    | 'spotify' // Spotify Web API
    | 'itunes' // iTunes Search API
    | 'youtube' // YouTube Data API
    | 'google' // Google Play Music API (discontinued)
    | 'pandora' // Pandora API
    | 'deezer' // Deezer API
    | 'tidal' // Tidal API
    | 'amazon' // Amazon Music API
    | 'soundcloud' // SoundCloud API
    | 'napster' // Napster API
    | 'yandex' // Yandex Music API
    | 'spinrilla'; // Spinrilla API

type entityType =
    | 'song' // Individual track/song
    | 'album'; // Complete album or compilation

// Export the main class
export = Odesli;
