// Type definitions for odesli.js
// Project: https://github.com/MattrAus/odesli.js, https://www.npmjs.com/package/odesli.js
// Definitions by: Mattr <https://github.com/MattrAus>
// TypeScript Version: 2.7

// Export the CountryCode type
type CountryCode =
  | "AF"
  | "AX"
  | "AL"
  | "DZ"
  | "AS"
  | "AD"
  | "AO"
  | "AI"
  | "AQ"
  | "AG"
  | "AR"
  | "AM"
  | "AW"
  | "AU"
  | "AT"
  | "AZ"
  | "BS"
  | "BH"
  | "BD"
  | "BB"
  | "BY"
  | "BE"
  | "BZ"
  | "BJ"
  | "BM"
  | "BT"
  | "BO"
  | "BQ"
  | "BA"
  | "BW"
  | "BV"
  | "BR"
  | "IO"
  | "BN"
  | "BG"
  | "BF"
  | "BI"
  | "KH"
  | "CM"
  | "CA"
  | "CV"
  | "KY"
  | "CF"
  | "TD"
  | "CL"
  | "CN"
  | "CX"
  | "CC"
  | "CO"
  | "KM"
  | "CG"
  | "CD"
  | "CK"
  | "CR"
  | "CI"
  | "HR"
  | "CU"
  | "CW"
  | "CY"
  | "CZ"
  | "DK"
  | "DJ"
  | "DM"
  | "DO"
  | "EC"
  | "EG"
  | "SV"
  | "GQ"
  | "ER"
  | "EE"
  | "ET"
  | "FK"
  | "FO"
  | "FJ"
  | "FI"
  | "FR"
  | "GF"
  | "PF"
  | "TF"
  | "GA"
  | "GM"
  | "GE"
  | "DE"
  | "GH"
  | "GI"
  | "GR"
  | "GL"
  | "GD"
  | "GP"
  | "GU"
  | "GT"
  | "GG"
  | "GN"
  | "GW"
  | "GY"
  | "HT"
  | "HM"
  | "VA"
  | "HN"
  | "HK"
  | "HU"
  | "IS"
  | "IN"
  | "ID"
  | "IR"
  | "IQ"
  | "IE"
  | "IM"
  | "IL"
  | "IT"
  | "JM"
  | "JP"
  | "JE"
  | "JO"
  | "KZ"
  | "KE"
  | "KI"
  | "KR"
  | "KP"
  | "KW"
  | "KG"
  | "LA"
  | "LV"
  | "LB"
  | "LS"
  | "LR"
  | "LY"
  | "LI"
  | "LT"
  | "LU"
  | "MO"
  | "MK"
  | "MG"
  | "MW"
  | "MY"
  | "MV"
  | "ML"
  | "MT"
  | "MH"
  | "MQ"
  | "MR"
  | "MU"
  | "YT"
  | "MX"
  | "FM"
  | "MD"
  | "MC"
  | "MN"
  | "ME"
  | "MS"
  | "MA"
  | "MZ"
  | "MM"
  | "NA"
  | "NR"
  | "NP"
  | "NL"
  | "NC"
  | "NZ"
  | "NI"
  | "NE"
  | "NG"
  | "NU"
  | "NF"
  | "MP"
  | "NO"
  | "OM"
  | "PK"
  | "PW"
  | "PS"
  | "PA"
  | "PG"
  | "PY"
  | "PE"
  | "PH"
  | "PN"
  | "PL"
  | "PT"
  | "PR"
  | "QA"
  | "RE"
  | "RO"
  | "RU"
  | "RW"
  | "BL"
  | "SH"
  | "KN"
  | "LC"
  | "MF"
  | "PM"
  | "VC"
  | "WS"
  | "SM"
  | "ST"
  | "SA"
  | "SN"
  | "RS"
  | "SC"
  | "SL"
  | "SG"
  | "SX"
  | "SK"
  | "SI"
  | "SB"
  | "SO"
  | "ZA"
  | "GS"
  | "SS"
  | "ES"
  | "LK"
  | "SD"
  | "SR"
  | "SJ"
  | "SZ"
  | "SE"
  | "CH"
  | "SY"
  | "TW"
  | "TJ"
  | "TZ"
  | "TH"
  | "TL"
  | "TG"
  | "TK"
  | "TO"
  | "TT"
  | "TN"
  | "TR"
  | "TM"
  | "TC"
  | "TV"
  | "UG"
  | "UA"
  | "AE"
  | "GB"
  | "US"
  | "UM"
  | "UY"
  | "UZ"
  | "VU"
  | "VE"
  | "VN"
  | "VG"
  | "VI"
  | "WF"
  | "EH"
  | "YE"
  | "ZM"
  | "ZW";

// Core Odesli class
declare class Odesli {
  constructor(options?: OdesliOptions);
  
  // Core methods
  fetch(urlOrUrls: string | string[], options?: FetchOptions): Promise<SongData | SongData[]>;
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
  
  // Static methods
  static getCountryOptions(): Array<{ code: CountryCode; name: string }>;
}

// Configuration options
interface OdesliOptions {
  apiKey?: string;
  version?: string;
  cache?: boolean;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  baseUrl?: string;
  validateParams?: boolean;
  logger?: (message: string, level: string) => void;
}

// Fetch options
interface FetchOptions {
  country?: CountryCode;
  skipCache?: boolean;
  timeout?: number;
  concurrency?: number;
}

// Song/Album data structure
interface SongData {
  entityUniqueId: string;
  entitiesByUniqueId: Record<string, EntityData>;
  linksByPlatform: Record<string, PlatformLink>;
  id: string;
  title: string;
  artist: string[];
  type: string;
  thumbnail: string;
}

interface EntityData {
  id: string;
  title: string;
  artistName: string[];
  type: string;
  thumbnailUrl: string;
}

interface PlatformLink {
  url: string;
  nativeAppUriMobile?: string;
  nativeAppUriDesktop?: string;
}

// Cache statistics
interface CacheStats {
  size: number;
  ttl: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalRequests: number;
}

// Rate Limiter
declare class RateLimiter {
  constructor(options?: RateLimiterOptions);
  waitForSlot(): Promise<void>;
  handleRateLimitResponse(retryAfterSeconds?: number): Promise<void>;
  getStatus(): RateLimiterStatus;
}

interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  strategy?: 'token-bucket' | 'leaky-bucket' | 'sliding-window';
  retryAfterMs?: number;
}

interface RateLimiterStatus {
  available?: number;
  max?: number;
  refillRate?: number;
  used?: number;
  windowMs?: number;
  queued?: number;
  processing?: boolean;
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
  enabled?: boolean;
  retentionMs?: number;
  maxDataPoints?: number;
}

interface RequestMetrics {
  url: string;
  method?: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
  platform?: string;
  country?: string;
  cacheHit?: boolean;
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
  startTime?: number;
  endTime?: number;
  groupBy?: 'hour' | 'minute' | 'platform' | 'country';
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
  name?: string;
  version?: string;
  description?: string;
  init?: () => void;
  cleanup?: () => void;
  hooks?: Record<string, (context: any) => Promise<void> | void>;
  middleware?: (context: any, next: () => Promise<any>) => Promise<any>;
  transformers?: Record<string, (data: any, context: any) => Promise<any> | any>;
}

interface PluginInfo {
  name: string;
  hooks: string[];
  hasMiddleware: boolean;
  hasTransformers: boolean;
  version?: string;
  description?: string;
}

// Built-in plugins
declare const loggingPlugin: Plugin;
declare const cachingPlugin: Plugin;
declare const analyticsPlugin: Plugin;
declare const responseTransformerPlugin: Plugin;

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
    | 'spotify'
    | 'itunes'
    | 'appleMusic'
    | 'youtube'
    | 'youtubeMusic'
    | 'google'
    | 'googleStore'
    | 'pandora'
    | 'deezer'
    | 'tidal'
    | 'amazonStore'
    | 'amazonMusic'
    | 'soundcloud'
    | 'napster'
    | 'yandex'
    | 'spinrilla';

type APIProvider =
    | 'spotify'
    | 'itunes'
    | 'youtube'
    | 'google'
    | 'pandora'
    | 'deezer'
    | 'tidal'
    | 'amazon'
    | 'soundcloud'
    | 'napster'
    | 'yandex'
    | 'spinrilla';

type entityType =
    | 'song'
    | 'album'

// Export the main class
export = Odesli;
