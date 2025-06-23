# odesli.js

[![npm version](https://badge.fury.io/js/odesli.js.svg)](https://badge.fury.io/js/odesli.js)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js CI](https://github.com/MattrAus/odesli.js/workflows/CI/badge.svg)](https://github.com/MattrAus/odesli.js/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/MattrAus/odesli.js)
[![Bundle Size](https://img.shields.io/bundlephobia/min/odesli.js)](https://bundlephobia.com/result?p=odesli.js)
[![Downloads](https://img.shields.io/npm/dm/odesli.js.svg)](https://www.npmjs.com/package/odesli.js)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A Node.js client for the [Odesli API](https://odesli.co/) (formerly song.link/album.link) that helps you find links to music across multiple streaming platforms.

## 📋 Table of Contents

- [odesli.js](#odeslijs)
  - [📋 Table of Contents](#-table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
    - [From npm (recommended)](#from-npm-recommended)
    - [From GitHub Packages](#from-github-packages)
  - [Quick Start](#quick-start)
  - [API Key](#api-key)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Advanced Usage](#advanced-usage)
    - [ESM (import)](#esm-import)
    - [CommonJS (require)](#commonjs-require)
  - [Response Format](#response-format)
  - [Supported Platforms](#supported-platforms)
  - [TypeScript Support](#typescript-support)
  - [Examples](#examples)
    - [Quick Examples](#quick-examples)
  - [API Documentation](#api-documentation)
  - [Contributing](#contributing)
  - [License](#license)
  - [Support](#support)
  - [Extensions: Advanced Features](#extensions-advanced-features)
    - [1. Rate Limiter](#1-rate-limiter)
    - [2. Metrics Collector](#2-metrics-collector)
    - [3. Plugin System](#3-plugin-system)

## Features

- 🔗 **Cross-platform links**: Get links for music across Spotify, Apple Music, YouTube Music, and more
- 🎵 **Song & Album support**: Works with both individual tracks and full albums
- 🌍 **Multi-country support**: Specify country codes for region-specific results
- 🔑 **API Key support**: Optional API key for higher rate limits
- 📦 **TypeScript support**: Full TypeScript definitions included
- ⚡ **Lightweight**: Minimal dependencies, fast performance
- 🛡️ **Robust error handling**: Comprehensive error messages and validation
- 🧪 **Fully tested**: 100% test coverage with comprehensive test suite

## Installation

### From npm (recommended)

```bash
npm install odesli.js
```

### From GitHub Packages

```bash
npm install @mattraus/odesli.js
```

**Note**: If you encounter authentication issues, you may need to set up a GitHub token. See [GitHub Packages documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for details.

## Quick Start

```javascript
const Odesli = require('odesli.js');

// Initialize without API key (10 requests/minute limit)
const odesli = new Odesli();

// Or with API key for higher limits
const odesli = new Odesli({
  apiKey: 'your-api-key-here',
  version: 'v1-alpha.1', // optional, defaults to v1-alpha.1
});

// You can also disable the metrics collector if you don't need it
const odesliLight = new Odesli({ metrics: false });
```

## API Key

An API key is **optional** but recommended for production use. Without an API key, you're limited to 10 requests per minute.

To get an API key, email `developers@song.link`.

## Usage

### Basic Usage

```javascript
const Odesli = require('odesli.js');

// Initialize without API key (10 requests/minute limit)
const odesli = new Odesli();

// Or with API key for higher limits
const odesli = new Odesli({
  apiKey: 'your-api-key-here',
});

// Fetch a song by URL
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`${song.title} by ${song.artist.join(', ')}`);

// Fetch multiple songs at once
const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
];
const songs = await odesli.fetch(urls);
songs.forEach(song => console.log(song.title));
```

### Advanced Usage

```javascript
// Initialize with custom options
const odesli = new Odesli({
  apiKey: 'your-api-key-here',
  version: 'v1-alpha.1',
  cache: true,
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  headers: { 'User-Agent': 'MyApp/1.0' },
  validateParams: true,
  logger: (message, level) => console.log(`[${level}] ${message}`),
});

// Fetch with options
const song = await odesli.fetch('https://open.spotify.com/track/123', {
  country: 'GB',
  skipCache: false,
  timeout: 5000,
});

// Batch fetch with concurrency control
const urls = [
  'https://open.spotify.com/track/123',
  'https://music.apple.com/us/album/test/456?i=789',
  'https://www.youtube.com/watch?v=abc123',
];

const songs = await odesli.fetch(urls, {
  country: 'US',
  concurrency: 3,
  skipCache: true,
});

// Handle errors in batch results
songs.forEach((song, index) => {
  if (song.error) {
    console.log(`Song ${index + 1}: Error - ${song.error}`);
  } else {
    console.log(`Song ${index + 1}: ${song.title}`);
  }
});
```

### ESM (import)

```js
import { Odesli } from '@mattraus/odesli.js';
import { RateLimiter } from '@mattraus/odesli.js/rate-limiter';
import { MetricsCollector } from '@mattraus/odesli.js/metrics';
import { PluginSystem } from '@mattraus/odesli.js/plugin-system';
```

### CommonJS (require)

```js
const { Odesli } = require('@mattraus/odesli.js');
const { RateLimiter } = require('@mattraus/odesli.js/rate-limiter');
const { MetricsCollector } = require('@mattraus/odesli.js/metrics');
const { PluginSystem } = require('@mattraus/odesli.js/plugin-system');
```

## Response Format

All methods return a response object with the following structure:

```javascript
{
  entityUniqueId: "SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR",
  title: "Bad and Boujee",
  artist: ["Migos"],
  type: "song",
  thumbnail: "https://i.scdn.co/image/...",
  userCountry: "US",
  pageUrl: "https://song.link/i/4Km5HrUvYTaSUfiSGPJeQR",
  linksByPlatform: {
    spotify: {
      entityUniqueId: "SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR",
      url: "https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR",
      nativeAppUriMobile: "spotify://track/4Km5HrUvYTaSUfiSGPJeQR",
      nativeAppUriDesktop: "spotify://track/4Km5HrUvYTaSUfiSGPJeQR"
    },
    appleMusic: {
      // ... similar structure
    }
    // ... other platforms
  },
  entitiesByUniqueId: {
    "SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR": {
      id: "4Km5HrUvYTaSUfiSGPJeQR",
      type: "song",
      title: "Bad and Boujee",
      artistName: ["Migos"],
      thumbnailUrl: "https://i.scdn.co/image/...",
      apiProvider: "spotify",
      platforms: ["spotify"]
    }
    // ... other entities
  }
}
```

## Supported Platforms

- Spotify
- Apple Music
- iTunes
- YouTube Music
- YouTube
- Google Play Music
- Pandora
- Deezer
- Tidal
- Amazon Music
- SoundCloud
- Napster
- Yandex Music
- Spinrilla

## TypeScript Support

This package includes full TypeScript definitions with strict country code validation:

```typescript
import Odesli, { CountryCode } from 'odesli.js';

const odesli = new Odesli({ apiKey: 'your-key' });

// TypeScript enforces valid country codes
const song = await odesli.fetch('https://open.spotify.com/track/...', {
  country: 'US', // ✅ Valid - TypeScript autocomplete shows all valid codes
  // country: 'INVALID' // ❌ TypeScript error - not a valid CountryCode
});

// Get all valid country codes and names for UI dropdowns
const countryOptions = Odesli.getCountryOptions();
// Returns: [{ code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, ...]
```

## Examples

Check out the [examples directory](./examples) for comprehensive usage examples:

- [Basic Usage](./examples/basic-usage.js) - Simple song fetching with country options
- [Advanced Features](./examples/advanced-features-example.js) - Rate limiting, metrics, and plugin system
- [User Agent Example](./examples/user-agent-example.js) - Custom headers and User-Agent usage

### Quick Examples

**Country-specific fetching:**

```javascript
// Get country options for UI dropdowns
const countries = Odesli.getCountryOptions();
console.log(`Available countries: ${countries.length}`);

// Fetch with specific country
const song = await odesli.fetch('https://spotify.com/track/123', {
  country: 'GB', // United Kingdom
});
```

**Batch fetching with error handling:**

```javascript
const urls = [
  'https://open.spotify.com/track/123',
  'https://music.apple.com/us/album/test/456?i=789',
];

const results = await odesli.fetch(urls, { country: 'US' });

results.forEach((result, index) => {
  if (result.error) {
    console.log(`Song ${index + 1}: Error - ${result.error}`);
  } else {
    console.log(`Song ${index + 1}: ${result.title}`);
  }
});
```

**Platform detection and ID extraction:**

```javascript
const platform = odesli.detectPlatform('https://open.spotify.com/track/123');
const id = odesli.extractId('https://open.spotify.com/track/123');
console.log(`Platform: ${platform}, ID: ${id}`);
```

## API Documentation

For more detailed information about the Odesli API, check the [official documentation](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: `developers@song.link` (for API key requests)
- 🐛 Issues: [GitHub Issues](https://github.com/MattrAus/odesli.js/issues)
- 📖 Documentation: [Odesli API Docs](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741)

## Extensions: Advanced Features

Odesli.js provides several advanced extensions to help you build robust, scalable, and customizable integrations:

### 1. Rate Limiter

**What:** Controls the number of API requests per time window using strategies like token bucket, leaky bucket, or sliding window.

**Why use it?**

- Prevents hitting Odesli/Songlink API rate limits
- Smooths out traffic spikes
- Ensures fair usage in multi-user or batch scenarios

**Example:**

```js
const RateLimiter = require('./lib/rate-limiter');
const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
await limiter.waitForSlot(); // Wait for a slot before making a request
```

### 2. Metrics Collector

**What:** Tracks requests, errors, cache hits, response times, and rate limit events.

**Why use it?**

- Monitor API usage and performance
- Debug slowdowns or error spikes
- Gather analytics for reporting or dashboards

**Example:**

```js
const MetricsCollector = require('./lib/metrics');
const metrics = new MetricsCollector({ enabled: true });
metrics.recordRequest({ url, startTime: Date.now(), success: true });
console.log(metrics.getSummary());
```

### 3. Plugin System

**What:** Extensible system for adding hooks, middleware, and data transformers to Odesli.js.

**Why use it?**

- Add custom logging, analytics, or caching
- Transform responses or inject custom logic
- Cleanly separate concerns and enable community plugins

**Example:**

```js
const PluginSystem = require('./lib/plugin-system');
const plugins = new PluginSystem();
plugins.registerPlugin('logger', {
  hooks: {
    'pre-request': ctx => console.log('Requesting:', ctx.url),
    'post-response': ctx => console.log('Response:', ctx.url),
  },
});
await plugins.executeHook('pre-request', { url: '...' });
```

See the `examples/advanced-features-example.js` for a full demonstration of these extensions in action.
