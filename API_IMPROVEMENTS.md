# Odesli.js API Improvements

This document outlines the comprehensive improvements made to the Odesli API client to enhance functionality, reliability, and developer experience.

## 🚀 New Constructor Parameters

### Enhanced Configuration Options

The constructor now accepts a comprehensive options object with the following parameters:

```javascript
const odesli = new Odesli({
  // Core options
  apiKey: 'your-api-key', // Optional API key for higher rate limits
  version: 'v1-alpha.1', // API version (defaults to 'v1-alpha.1')

  // Caching and performance
  cache: true, // Enable response caching (defaults to true)
  timeout: 10000, // Request timeout in milliseconds (defaults to 10000)

  // Retry logic
  maxRetries: 3, // Maximum retry attempts (defaults to 3)
  retryDelay: 1000, // Base delay between retries (defaults to 1000)

  // Customization
  headers: { 'User-Agent': 'MyApp/1.0' }, // Additional request headers
  baseUrl: 'https://api.song.link', // Custom base URL
  validateParams: true, // Enable parameter validation (defaults to true)
  logger: (message, level) => console.log(`[${level}] ${message}`), // Custom logger
});
```

## 🔧 Enhanced Method Parameters

### Options Object Support

All methods now support both backward-compatible string parameters and new options objects:

#### `fetch(url, options)`

```javascript
// Backward compatible
const song = await odesli.fetch(url, 'GB');

// New options object
const song = await odesli.fetch(url, {
  country: 'GB',
  skipCache: true,
  timeout: 5000,
});
```

#### `getByParams(platform, type, id, options)`

```javascript
// Backward compatible
const song = await odesli.getByParams('spotify', 'song', '123', 'GB');

// New options object
const song = await odesli.getByParams('spotify', 'song', '123', {
  country: 'GB',
  skipCache: false,
  timeout: 8000,
});
```

#### `getById(id, options)`

```javascript
// Backward compatible
const song = await odesli.getById('SPOTIFY_SONG::123', 'GB');

// New options object
const song = await odesli.getById('SPOTIFY_SONG::123', {
  country: 'GB',
  skipCache: true,
  timeout: 6000,
});
```

## 🆕 New Utility Methods

### Batch Operations

```javascript
// Fetch multiple songs with concurrency control
const urls = [
  'https://open.spotify.com/track/123',
  'https://open.spotify.com/track/456',
  'https://open.spotify.com/track/789',
];

const results = await odesli.fetchBatch(urls, {
  country: 'US',
  concurrency: 3,
  skipCache: false,
});
```

### Platform Detection

```javascript
// Detect platform from URL
const platform = odesli.detectPlatform('https://open.spotify.com/track/123');
console.log(platform); // 'spotify'

// Extract ID from platform URL
const id = odesli.extractId(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(id); // '4Km5HrUvYTaSUfiSGPJeQR'
```

### Platform Information

```javascript
// Get list of supported platforms
const platforms = odesli.getSupportedPlatforms();
console.log(platforms); // ['spotify', 'appleMusic', 'youtube', ...]
```

### Enhanced Cache Statistics

```javascript
// Get detailed cache statistics
const stats = odesli.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Total requests: ${stats.totalRequests}`);
```

## 🛡️ Improved Error Handling & Validation

### Parameter Validation

- **URL validation**: Ensures valid URL format
- **Country code validation**: Validates ISO 3166-1 Alpha-2 format
- **Platform validation**: Ensures platform is supported
- **Type validation**: Validates 'song' or 'album' types

### Retry Logic

- **Exponential backoff**: Intelligent retry delays
- **Non-retryable errors**: Skips retries for 4xx/5xx errors
- **Configurable retries**: Customizable retry attempts and delays

### Enhanced Error Messages

```javascript
// Clear, descriptive error messages
try {
  await odesli.fetch('invalid-url');
} catch (error) {
  console.log(error.message); // "Invalid URL format provided to odesli.fetch()"
}

try {
  await odesli.getByParams('invalid-platform', 'song', '123');
} catch (error) {
  console.log(error.message); // "Invalid platform 'invalid-platform'. Must be one of: spotify, itunes, ..."
}
```

## 🔄 Backward Compatibility

All existing code continues to work without modification:

```javascript
// These all still work exactly as before
const song1 = await odesli.fetch('https://open.spotify.com/track/123');
const song2 = await odesli.fetch('https://open.spotify.com/track/123', 'GB');
const song3 = await odesli.getByParams('spotify', 'song', '123');
const song4 = await odesli.getByParams('spotify', 'song', '123', 'GB');
const song5 = await odesli.getById('SPOTIFY_SONG::123');
const song6 = await odesli.getById('SPOTIFY_SONG::123', 'GB');
```

## 📊 Performance Improvements

### Intelligent Caching

- **Configurable TTL**: 5-minute default cache duration
- **Per-request cache control**: Skip cache for specific requests
- **Cache statistics**: Monitor cache performance

### Request Optimization

- **Custom headers**: Add application-specific headers
- **Configurable timeouts**: Per-request timeout overrides
- **Base URL customization**: Support for different API endpoints

### Concurrency Control

- **Batch processing**: Efficient parallel requests
- **Configurable concurrency**: Control request rate
- **Error resilience**: Graceful handling of failed requests

## 🧪 Enhanced Testing & Debugging

### Logging Support

```javascript
const odesli = new Odesli({
  logger: (message, level) => {
    console.log(`[${level.toUpperCase()}] ${message}`);
  },
});
```

### Validation Control

```javascript
// Disable validation for performance
const odesli = new Odesli({
  validateParams: false,
});
```

## 📈 TypeScript Improvements

### Enhanced Type Definitions

- **Comprehensive options types**: Full type safety for all parameters
- **Union types**: Support for both string and object parameters
- **Detailed return types**: Complete response object definitions

## 🎯 Use Cases

### Production Applications

```javascript
const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000,
  validateParams: true,
  logger: (message, level) => {
    if (level === 'error') {
      console.error(`[ODESLI] ${message}`);
    }
  },
});
```

### Development & Testing

```javascript
const odesli = new Odesli({
  cache: false,
  validateParams: true,
  timeout: 5000,
  logger: console.log,
});
```

### High-Volume Processing

```javascript
const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
  maxRetries: 5,
  retryDelay: 500,
  timeout: 10000,
});

// Process large batches efficiently
const results = await odesli.fetchBatch(largeUrlArray, {
  concurrency: 10,
  skipCache: true,
});
```

## 🔮 Future Considerations

These improvements provide a solid foundation for future enhancements:

- **Rate limiting**: Built-in rate limit handling
- **Webhook support**: Real-time updates
- **Advanced caching**: Redis/Memcached integration
- **Metrics collection**: Request/response analytics
- **Plugin system**: Extensible functionality

## 📝 Migration Guide

### For Existing Users

No migration required! All existing code continues to work unchanged.

### For New Features

Use the new options objects for enhanced functionality:

```javascript
// Old way (still works)
const song = await odesli.fetch(url, 'GB');

// New way (recommended)
const song = await odesli.fetch(url, {
  country: 'GB',
  skipCache: false,
  timeout: 8000,
});
```

## 🎉 Summary

The improved Odesli API client now provides:

- ✅ **Enhanced configuration** with comprehensive options
- ✅ **Better error handling** with validation and retry logic
- ✅ **New utility methods** for common operations
- ✅ **Improved performance** with intelligent caching
- ✅ **Full backward compatibility** with existing code
- ✅ **Enhanced TypeScript support** with complete type definitions
- ✅ **Production-ready features** for enterprise use cases

These improvements make the Odesli client more robust, flexible, and developer-friendly while maintaining full compatibility with existing implementations.
