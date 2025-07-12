# Odesli.js Examples

This directory contains comprehensive examples demonstrating how to use the Odesli.js library and its advanced features.

## Examples Overview

### Basic Usage (`basic-usage.js`)

Demonstrates fundamental usage patterns for both CommonJS and ESM:

- Single URL fetching
- Batch URL fetching with the unified API
- Basic error handling
- Country-specific requests
- Platform detection utilities

```bash
node examples/basic-usage.js
```

### Advanced Usage (`advanced-usage.js`)

Shows advanced features and configurations:

- Custom client configuration with all options
- Platform detection and ID extraction
- Cache management and statistics
- Unified fetch API for both single and batch operations
- Error handling and recovery strategies
- Performance optimization techniques

```bash
node examples/advanced-usage.js
```

### Advanced Features (`advanced-features-example.js`)

Comprehensive demonstration of enterprise-grade features:

- Rate limiting with all three strategies (token bucket, sliding window, leaky bucket)
- Comprehensive metrics collection and analysis
- Plugin system with hooks, middleware, and transformers
- Error handling with plugins
- Performance monitoring and optimization

```bash
node examples/advanced-features-example.js
```

### Rate Limiter Strategies (`rate-limiter-strategies.js`)

Detailed comparison and usage of all rate limiting strategies:

- Token Bucket: Burst handling with configurable capacity
- Sliding Window: Precise timing with no overages
- Leaky Bucket: Traffic smoothing with queue management
- Performance comparisons and timing demonstrations

```bash
node examples/rate-limiter-strategies.js
```

### User-Agent Example (`user-agent-example.js`)

Shows how to work with User-Agent headers and custom configurations:

- Default User-Agent generation
- Custom header overrides
- Platform and version information
- Browser-like User-Agent strings

```bash
node examples/user-agent-example.js
```

## Import Examples

### CommonJS (require)

```js
// Main library
const Odesli = require('odesli.js');

// Extensions
const { RateLimiter } = require('odesli.js/rate-limiter');
const { MetricsCollector } = require('odesli.js/metrics');
const { PluginSystem } = require('odesli.js/plugin-system');
```

### ESM (import)

```js
// Main library
import Odesli from 'odesli.js';

// Extensions
import { RateLimiter } from 'odesli.js/rate-limiter';
import { MetricsCollector } from 'odesli.js/metrics';
import { PluginSystem } from 'odesli.js/plugin-system';
```

## Key Features Demonstrated

### Unified Fetch API

The `fetch()` method supports both single URLs and arrays of URLs with comprehensive options:

```js
// Single fetch
const song = await odesli.fetch('https://open.spotify.com/track/123');

// Batch fetch
const songs = await odesli.fetch([
  'https://open.spotify.com/track/123',
  'https://open.spotify.com/track/456',
]);

// Batch fetch with advanced options
const songs = await odesli.fetch(urls, {
  country: 'GB',
  concurrency: 3,
  skipCache: true,
  timeout: 5000,
});
```

### Rate Limiting

Built-in rate limiting with three strategies and auto-queue functionality:

```js
const { RateLimiter } = require('odesli.js/rate-limiter');

// Sliding Window (recommended for API compliance)
const limiter = new RateLimiter({
  maxRequests: 8, // Stay under the 10/minute API limit
  windowMs: 60000, // 1 minute
  strategy: 'sliding-window',
});

// Auto-queue all requests
async function fetchWithRateLimit(url, index) {
  await limiter.waitForSlot();
  return await odesli.fetch(url);
}

// Submit all requests at once - they'll be processed automatically
const promises = urls.map((url, index) => fetchWithRateLimit(url, index));
const results = await Promise.all(promises);
```

### Metrics Collection

Comprehensive metrics tracking with real-time analysis:

```js
const { MetricsCollector } = require('odesli.js/metrics');

const metrics = new MetricsCollector({
  enabled: true,
  retentionMs: 24 * 60 * 60 * 1000, // 24 hours
  maxDataPoints: 10000,
});

// Record request with full context
metrics.recordRequest({
  url: 'https://api.song.link/v1-alpha.1/links',
  method: 'GET',
  startTime: Date.now(),
  endTime: Date.now() + 150,
  success: true,
  statusCode: 200,
  responseTime: 150,
  platform: 'spotify',
  country: 'US',
  cacheHit: false,
});

// Get comprehensive summary
const summary = metrics.getSummary();
console.log(
  'Success Rate:',
  (summary.rates.successRate * 100).toFixed(1) + '%'
);
console.log(
  'Cache Hit Rate:',
  (summary.rates.cacheHitRate * 100).toFixed(1) + '%'
);
console.log('Average Response Time:', summary.recent.avgResponseTime + 'ms');
```

### Plugin System

Extensible functionality through hooks, middleware, and transformers:

```js
const { PluginSystem } = require('odesli.js/plugin-system');

const plugins = new PluginSystem();

// Register a logging plugin
plugins.registerPlugin('logger', {
  hooks: {
    beforeRequest: context => {
      console.log(`🔍 Requesting: ${context.url}`);
    },
    afterRequest: context => {
      console.log(`✅ Completed: ${context.url} (${context.responseTime}ms)`);
    },
    onError: context => {
      console.log(`❌ Error: ${context.error.message}`);
    },
  },
});

// Register middleware for authentication
plugins.registerPlugin('auth', {
  middleware: async (context, next) => {
    context.headers = context.headers || {};
    context.headers['Authorization'] = 'Bearer your-api-key';
    return await next();
  },
});

// Execute hooks and middleware
await plugins.executeHook('beforeRequest', {
  url: 'https://api.song.link/test',
});
```

### Error Handling

Robust error handling for both single and batch operations:

```js
// Single request with error handling
try {
  const song = await odesli.fetch('https://open.spotify.com/track/123');
  console.log(`Success: ${song.title}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// Batch requests with graceful error handling
const results = await odesli.fetch(urls);
results.forEach((result, index) => {
  if (result.error) {
    console.log(`Song ${index + 1}: Error - ${result.error}`);
    console.log(`  Platform: ${result.platform}`);
    console.log(`  Status: ${result.statusCode}`);
    console.log(`  Suggestion: ${result.suggestion}`);
  } else {
    console.log(`Song ${index + 1}: ${result.title}`);
  }
});
```

### Platform Detection and Utilities

Utility methods for working with URLs and platforms:

```js
// Detect platform from URL
const platform = odesli.detectPlatform('https://open.spotify.com/track/123');
console.log('Platform:', platform); // 'spotify'

// Extract ID from URL
const id = odesli.extractId('https://open.spotify.com/track/123');
console.log('ID:', id); // '123'

// Get supported platforms
const platforms = odesli.getSupportedPlatforms();
console.log('Supported platforms:', platforms);

// Get country options for UI dropdowns
const countries = Odesli.getCountryOptions();
console.log('Available countries:', countries.length);
```

## Advanced Features

### Rate Limiting Strategies

1. **Token Bucket** (Burst Handling):

   ```js
   const limiter = new RateLimiter({
     maxRequests: 10,
     windowMs: 60000,
     strategy: 'token-bucket',
     burstCapacity: 15, // Allow bursts up to 15 requests
   });
   ```

2. **Sliding Window** (Precise Timing - Recommended):

   ```js
   const limiter = new RateLimiter({
     maxRequests: 8,
     windowMs: 60000,
     strategy: 'sliding-window',
   });
   ```

3. **Leaky Bucket** (Traffic Smoothing):

   ```js
   const limiter = new RateLimiter({
     maxRequests: 3,
     windowMs: 5000,
     strategy: 'leaky-bucket',
     queueSize: 10, // Limit queue to 10 pending requests
   });
   ```

### Metrics Analysis

- **Real-time counters**: Total requests, success/failure rates, cache hits/misses
- **Performance metrics**: Response times, throughput, requests per minute
- **Cache analytics**: Hit rates, cache efficiency, cache size
- **Platform analysis**: Usage by platform and country
- **Error tracking**: Error patterns, frequency, and suggestions
- **Rate limit monitoring**: Rate limit hits and average delays

### Plugin System Features

- **Hooks**: Execute code at specific points (beforeRequest, afterRequest, onError, onRateLimit, etc.)
- **Middleware**: Process requests through a chain with context modification
- **Transformers**: Modify response data for different formats
- **Built-in plugins**: Logging, caching, analytics, response transformation
- **Priority system**: Control execution order of hooks
- **Error isolation**: Prevent plugin errors from breaking the system

## Running Examples

### Prerequisites

```bash
npm install
```

### Basic Examples

```bash
# Basic usage
node examples/basic-usage.js

# Advanced usage
node examples/advanced-usage.js

# User agent examples
node examples/user-agent-example.js
```

### Running Advanced Examples

```bash
# Comprehensive advanced features
node examples/advanced-features-example.js

# Rate limiter strategy comparison
node examples/rate-limiter-strategies.js
```

### Environment Variables

Some examples use environment variables for API keys:

```bash
# Optional: Set API key for higher rate limits
export ODESLI_API_KEY=your-api-key-here

# Run examples with API key
node examples/advanced-features-example.js
```

### Testing

Run the comprehensive test suite:

```bash
npm test
npm test -- --testNamePattern="Advanced Features"
```

## Example Output

### Rate Limiter Demo

```js
🚀 Auto-Queue Rate Limiter Demo
📊 Limit: 2 requests per 3s
🔗 Submitting 3 requests...

⏳ Request 1: Waiting for slot...
✅ Request 1: Got slot, fetching...
🎵 Request 1: Bad and Boujee

⏳ Request 2: Waiting for slot...
✅ Request 2: Got slot, fetching...
🎵 Request 2: Rockstar

⏳ Request 3: Waiting for slot...
✅ Request 3: Got slot, fetching...
🎵 Request 3: Congratulations

🎉 All requests completed!
📊 Total songs fetched: 3
```

### Metrics Summary

```js
📊 Metrics Summary:
Counters: {
  totalRequests: 15,
  successfulRequests: 14,
  failedRequests: 1,
  cacheHits: 3,
  cacheMisses: 12,
  rateLimitHits: 2
}
Recent Activity: {
  requests: 15,
  errors: 1,
  avgResponseTime: '245ms',
  requestsPerMinute: 0.25
}
Rates: {
  successRate: '93.3%',
  cacheHitRate: '20.0%',
  errorRate: '6.7%'
}
```

## Notes

- Examples make actual API calls and may be subject to rate limiting without an API key
- Rate limiting examples demonstrate how to handle API limits gracefully
- All examples include comprehensive error handling
- Examples are designed to be copy-paste ready for production use
- Performance metrics are real and reflect actual API response times
