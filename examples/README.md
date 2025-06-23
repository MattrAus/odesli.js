# Odesli.js Examples

This directory contains examples demonstrating how to use the Odesli.js library.

## Examples

### Basic Usage (`basic-usage.js`)

Demonstrates the fundamental usage of the library:

- Single URL fetching
- Batch URL fetching with the unified API
- Basic error handling

```bash
node examples/basic-usage.js
```

### Advanced Usage (`advanced-usage.js`)

Shows advanced features and configurations:

- Custom client configuration
- Platform detection and ID extraction
- Cache management
- Unified fetch API for both single and batch operations
- Error handling and recovery
- **NEW**: Rate limiting integration
- **NEW**: Metrics collection
- **NEW**: Plugin system demonstration

```bash
node examples/advanced-usage.js
```

### Advanced Features (`advanced-features-example.js`)

Comprehensive demonstration of enterprise-grade features:

- Rate limiting with multiple strategies
- Comprehensive metrics collection and analysis
- Plugin system with hooks and middleware
- Error handling with plugins
- Performance monitoring

```bash
node examples/advanced-features-example.js
```

### User-Agent Example (`user-agent-example.js`)

Shows how to work with User-Agent headers:

- Default User-Agent generation
- Custom header overrides
- Platform and version information

```bash
node examples/user-agent-example.js
```

## Key Features Demonstrated

### Unified Fetch API

The `fetch()` method now supports both single URLs and arrays of URLs:

```javascript
// Single fetch
const song = await odesli.fetch('https://open.spotify.com/track/123');

// Batch fetch
const songs = await odesli.fetch([
  'https://open.spotify.com/track/123',
  'https://open.spotify.com/track/456',
]);

// Batch fetch with options
const songs = await odesli.fetch(urls, {
  country: 'GB',
  concurrency: 3,
  skipCache: true,
});
```

### Rate Limiting

Built-in rate limiting with multiple strategies:

```javascript
const RateLimiter = require('../lib/rate-limiter.js');

const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  strategy: 'token-bucket', // or 'leaky-bucket', 'sliding-window'
});

// Wait for available slot
await rateLimiter.waitForSlot();
const song = await odesli.fetch(url);
```

### Metrics Collection

Comprehensive metrics tracking:

```javascript
const MetricsCollector = require('../lib/metrics.js');

const metrics = new MetricsCollector({
  enabled: true,
  retentionMs: 24 * 60 * 60 * 1000, // 24 hours
});

// Record request
metrics.recordRequest({
  url: 'https://example.com',
  startTime: Date.now(),
  success: true,
  platform: 'spotify',
  country: 'US',
});

// Get summary
const summary = metrics.getSummary();
console.log(`Success rate: ${summary.rates.successRate}%`);
```

### Plugin System

Extensible functionality through plugins:

```javascript
const { PluginSystem, loggingPlugin } = require('../lib/plugin-system.js');

const pluginSystem = new PluginSystem();
pluginSystem.registerPlugin('logging', loggingPlugin);

// Execute hooks
await pluginSystem.executeHook('beforeRequest', { url: 'https://example.com' });
```

### Error Handling

Batch operations gracefully handle errors:

```javascript
const results = await odesli.fetch(urls);
results.forEach((result, index) => {
  if (result.error) {
    console.log(`Song ${index + 1}: Error - ${result.error}`);
  } else {
    console.log(`Song ${index + 1}: ${result.title}`);
  }
});
```

### Platform Detection

Utility methods for working with URLs:

```javascript
const platform = odesli.detectPlatform('https://open.spotify.com/track/123');
const id = odesli.extractId('https://open.spotify.com/track/123');
```

## Advanced Features

### Rate Limiting Strategies

1. **Token Bucket** (default): Best for burst handling
2. **Leaky Bucket**: Smooths out traffic
3. **Sliding Window**: Most accurate rate limiting

### Metrics Analysis

- **Real-time counters**: Total requests, success/failure rates
- **Performance metrics**: Response times, throughput
- **Cache analytics**: Hit rates, cache efficiency
- **Platform analysis**: Usage by platform and country
- **Error tracking**: Error patterns and frequency

### Plugin System Features

- **Hooks**: Execute code at specific points (beforeRequest, afterRequest, onError, etc.)
- **Middleware**: Process requests through a chain
- **Transformers**: Modify response data
- **Built-in plugins**: Logging, caching, analytics, response transformation

## Running Examples

Make sure you have the library installed and configured before running examples:

```bash
npm install
node examples/basic-usage.js
```

### Environment Variables

Some examples use environment variables:

```bash
# Optional: Set API key for higher rate limits
export ODESLI_API_KEY=your-api-key-here

# Run advanced examples
node examples/advanced-features-example.js
```

### Testing Advanced Features

Run the comprehensive test suite:

```bash
npm test
npm test -- --testNamePattern="Advanced Features"
```

Note: Some examples make actual API calls and may be subject to rate limiting without an API key. The rate limiting examples demonstrate how to handle this gracefully.
