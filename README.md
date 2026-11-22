# odesli.js

[![npm version](https://img.shields.io/npm/v/odesli.js.svg)](https://www.npmjs.com/package/odesli.js)
[![npm license](https://img.shields.io/npm/l/odesli.js)](https://github.com/MattrAus/odesli.js/blob/master/LICENSE)
[![CI](https://github.com/MattrAus/odesli.js/actions/workflows/ci.yml/badge.svg)](https://github.com/MattrAus/odesli.js/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/MattrAus/odesli.js)
[![Bundle Size](https://img.shields.io/bundlephobia/min/odesli.js)](https://bundlephobia.com/result?p=odesli.js)
[![Downloads](https://img.shields.io/npm/dm/odesli.js.svg)](https://www.npmjs.com/package/odesli.js)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A Node.js/TypeScript client for the [Songlink/Odesli API](https://odesli.co/) that helps you find links to music across multiple streaming platforms.

> [!IMPORTANT]
> Linktree retired the **unauthenticated** Songlink/Odesli public API on **July 31, 2026**.
> `odesli.js` v2 requires an **allowlisted API key** (`apiKey` option or `ODESLI_API_KEY`).
> This package does **not** issue or bundle API keys.
> If you only need a shareable landing page, use `Odesli.getPageUrl(url)` or open `https://song.link/<your-url>` directly.
> Official announcement: [Sunsetting the Songlink (Odesli) public API](https://linktr.ee/help/articles/15201827-sunsetting-the-songlink-odesli-public-api).

## 📋 Table of Contents

- [odesli.js](#odeslijs)
  - [📋 Table of Contents](#-table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
    - [From npm](#from-npm)
  - [Migrating from v1 to v2](#migrating-from-v1-to-v2)
  - [Quick Start](#quick-start)
  - [API Key](#api-key)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Advanced Usage](#advanced-usage)
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
      - [Example: With vs Without RateLimiter](#example-with-vs-without-ratelimiter)
      - [Example: Using RateLimiter with Multiple Fetches](#example-using-ratelimiter-with-multiple-fetches)
    - [2. Metrics Collector](#2-metrics-collector)
    - [3. Plugin System](#3-plugin-system)

## Features

- 🔗 **Cross-platform links**: Get links for music across Spotify, Apple Music, YouTube Music, and more
- 🎵 **Song & Album support**: Works with both individual tracks and full albums
- 🌍 **Multi-country support**: Specify country codes for region-specific results
- 🔑 **Allowlisted API key required**: Pass `{ apiKey }` or set `ODESLI_API_KEY`
- 🧭 **Zero-key helpers**: `Odesli.detectPlatform`, `Odesli.extractId`, and `Odesli.getPageUrl` work without credentials
- 📦 **TypeScript support**: Full TypeScript definitions included
- ⚡ **Lightweight**: Minimal dependencies, fast performance
- 🛡️ **Structured errors**: `OdesliError` with sunset/auth codes and non-retryable 401/410 handling
- 🧪 **Fully tested**: High coverage unit suite plus optional live API smoke tests

## Installation

### From npm

```bash
npm install odesli.js
```

## Migrating from v1 to v2

1. **Provide an allowlisted API key** via `new Odesli({ apiKey })` or `ODESLI_API_KEY`.
2. Catch `Odesli.OdesliError` and inspect `error.code` (`MISSING_API_KEY`, `PUBLIC_API_ACCESS_DEPRECATED`, `INVALID_ACCESS_KEY`, `API_SUNSET_GONE`, `RATE_LIMITED`, …).
3. If you no longer have API access, use `Odesli.getPageUrl(url)` to build `https://song.link/...` landing links without calling the API.
4. Request partner access from Linktree if you need programmatic lookups: [Songlink/Odesli API sunset article](https://linktr.ee/help/articles/15201827-sunsetting-the-songlink-odesli-public-api).

## Quick Start

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

// Prefer environment configuration in production:
// export ODESLI_API_KEY=your-allowlisted-key
const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
});

(async () => {
  try {
    const song = await odesli.fetch(
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
    );
    console.log(`${song.title} by ${song.artist.join(', ')}`);
    console.log(`Song.link: ${song.pageUrl}`);
  } catch (error) {
    console.error(error.code || 'ERROR', error.message);
  }
})();
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
});

try {
  const song = await odesli.fetch(
    'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
  );
  console.log(`${song.title} by ${song.artist.join(', ')}`);
  console.log(`Song.link: ${song.pageUrl}`);
} catch (error) {
  console.error(error.code || 'ERROR', error.message);
}
```

**No API key (landing page only):**

```js
const { Odesli } = require('odesli.js');
const pageUrl = Odesli.getPageUrl(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
// => https://song.link/https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR
```

## API Key

An allowlisted API key is **required** for all API requests in v2.

Set it via environment variable (recommended):

```bash
export ODESLI_API_KEY=your-allowlisted-key
```

Or pass it explicitly:

```js
const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });
```

`odesli.js` does not provide or redistribute API keys. Request access through Linktree’s Songlink/Odesli API allowlist process described in their [sunset announcement](https://linktr.ee/help/articles/15201827-sunsetting-the-songlink-odesli-public-api).

## Usage

### Basic Usage

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
});

(async () => {
  const song = await odesli.fetch(
    'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
  );
  console.log(`${song.title} by ${song.artist.join(', ')}`);

  const urls = [
    'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
    'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
  ];
  const songs = await odesli.fetch(urls);
  songs.forEach(song => console.log(song.title));
})();
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
});

const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`${song.title} by ${song.artist.join(', ')}`);

const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
];
const songs = await odesli.fetch(urls);
songs.forEach(song => console.log(song.title));
```

### Advanced Usage

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

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

(async () => {
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
})();
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

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
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  {
    country: 'GB',
    skipCache: false,
    timeout: 5000,
  }
);

// Batch fetch with concurrency control
const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
  'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
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

## Response Format

All methods return a response object with the following structure:

```js
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
- Audiomack
- Anghami
- Boomplay
- Audius

## TypeScript Support

This package includes full TypeScript definitions with strict country code validation:

**CommonJS (require):**

```typescript
const Odesli = require('odesli.js');

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

(async () => {
  // Get all valid country codes and names for UI dropdowns
  const countryOptions = Odesli.getCountryOptions();
  console.log('Top 3 countries:', countryOptions.slice(0, 3));
  // Output: [
  //   { code: 'US', name: 'United States' },
  //   { code: 'GB', name: 'United Kingdom' },
  //   { code: 'CA', name: 'Canada' }
  // ]

  // TypeScript enforces valid country codes
  const song = await odesli.fetch(
    'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
    {
      country: 'US', // ✅ Valid - TypeScript autocomplete shows all valid codes
      // country: 'INVALID' // ❌ TypeScript error - not a valid CountryCode
    }
  );
  console.log(`Fetched: ${song.title}`);
})();
```

**ESM (import):**

```typescript
import Odesli, { CountryCode } from 'odesli.js';

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

// Get all valid country codes and names for UI dropdowns
const countryOptions = Odesli.getCountryOptions();
console.log('Top 3 countries:', countryOptions.slice(0, 3));
// Output: [
//   { code: 'US', name: 'United States' },
//   { code: 'GB', name: 'United Kingdom' },
//   { code: 'CA', name: 'Canada' }
// ]

// TypeScript enforces valid country codes
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  {
    country: 'US', // ✅ Valid - TypeScript autocomplete shows all valid codes
    // country: 'INVALID' // ❌ TypeScript error - not a valid CountryCode
  }
);
console.log(`Fetched: ${song.title}`);
```

## Examples

Check out the [examples directory](./examples) for comprehensive usage examples:

- [Basic Usage](./examples/basic-usage.js) - Simple song fetching with country options
- [Advanced Features](./examples/advanced-features-example.js) - Rate limiting, metrics, and plugin system
- [User Agent Example](./examples/user-agent-example.js) - Custom headers and User-Agent usage

### Quick Examples

**Country-specific fetching:**

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

// Get country options for UI dropdowns
const countries = Odesli.getCountryOptions();
console.log(`Available countries: ${countries.length}`);

(async () => {
  // Fetch with specific country
  const song = await odesli.fetch(
    'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
    {
      country: 'GB', // United Kingdom
    }
  );
  console.log(`Fetched: ${song.title}`);
})();
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

// Get country options for UI dropdowns
const countries = Odesli.getCountryOptions();
console.log(`Available countries: ${countries.length}`);

// Fetch with specific country
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  {
    country: 'GB', // United Kingdom
  }
);
console.log(`Fetched: ${song.title}`);
```

**Batch fetching with error handling:**

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
];

(async () => {
  const results = await odesli.fetch(urls, { country: 'US' });

  results.forEach((result, index) => {
    if (result.error) {
      console.log(`Song ${index + 1}: Error - ${result.error}`);
    } else {
      console.log(`Song ${index + 1}: ${result.title}`);
    }
  });
})();
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
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

**Platform detection and ID extraction (no API key required):**

**CommonJS (require):**

```js
const Odesli = require('odesli.js');

// Static helpers work without constructing a client / API key
const platform = Odesli.detectPlatform(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
const id = Odesli.extractId(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`Platform: ${platform}, ID: ${id}`);
```

**ESM (import):**

```js
import Odesli from 'odesli.js';

const platform = Odesli.detectPlatform(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
const id = Odesli.extractId(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`Platform: ${platform}, ID: ${id}`);
```

## API Documentation

For more detailed information about the Odesli API, check the [official documentation](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Resources for Contributors:**

- 📝 [Contributing Guide](CONTRIBUTING.md) - Guidelines for contributing
- 🔒 [Security Policy](SECURITY.md) - Security reporting guidelines
- 📋 [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- 🔑 API access: [Songlink/Odesli public API sunset / allowlist info](https://linktr.ee/help/articles/15201827-sunsetting-the-songlink-odesli-public-api)
- 🐛 Issues: [GitHub Issues](https://github.com/MattrAus/odesli.js/issues)
- 📖 [Odesli API Docs](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741) - Official Odesli API documentation (historical / partner reference)
- 🔒 [Security Issues](SECURITY.md) - Report security vulnerabilities
- 📋 [Changelog](CHANGELOG.md) - See what's new in each version

## Extensions: Advanced Features

Odesli.js provides several advanced extensions to help you build robust, scalable, and customizable integrations:

### 1. Rate Limiter

**What:** Controls the number of API requests per time window using strategies like token bucket, leaky bucket, or sliding window.

**Default Rate Limiting Behavior:**

The main Odesli client does **not** include built-in rate limiting. Rate limits are enforced by the Songlink/Odesli API for your allowlisted key. Exceeding them returns a `429` `OdesliError` with `code: 'RATE_LIMITED'`.

**Why use the RateLimiter extension?**

- **Prevent API errors**: Proactively limit requests before hitting API rate limits
- **Smooth traffic**: Spread requests evenly across time windows
- **Handle bursts**: Manage sudden spikes in request volume
- **Better UX**: Avoid 429 errors by staying under limits
- **Predictable behavior**: Ensure consistent request patterns

**Available Strategies:**

- **🎯 Token Bucket**: Handles bursts well, efficient memory usage
- **🔄 Sliding Window**: Most accurate, precise timing (recommended)
- **💧 Leaky Bucket**: Smooths traffic, predictable output rate

**Strategy Options:**

```js
// Token Bucket Strategy
const tokenBucketLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  strategy: 'token-bucket',
  // Optional: burst capacity (defaults to maxRequests)
  burstCapacity: 15,
});

// Sliding Window Strategy (recommended)
const slidingWindowLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 10000, // 10 seconds
  strategy: 'sliding-window',
  // No additional options needed
});

// Leaky Bucket Strategy
const leakyBucketLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 5000, // 5 seconds
  strategy: 'leaky-bucket',
  // Optional: queue size limit (defaults to maxRequests * 2)
  queueSize: 10,
});
```

**Strategy Comparison:**

| Strategy           | Pros                             | Cons                | Best For                          | Configuration          |
| ------------------ | -------------------------------- | ------------------- | --------------------------------- | ---------------------- |
| **Token Bucket**   | Handles bursts, efficient memory | Less precise timing | Allowing some burst traffic       | `burstCapacity` option |
| **Sliding Window** | Most accurate, no overages       | More memory usage   | Exact rate limiting (recommended) | No additional options  |
| **Leaky Bucket**   | Smooths traffic, predictable     | Can delay requests  | Smoothing traffic spikes          | `queueSize` option     |

**When to Use Each Strategy:**

- **🎯 Token Bucket**: Use when you want to allow some burst traffic while maintaining overall limits. Good for user-facing applications where occasional bursts are acceptable.

- **🔄 Sliding Window**: Use when you need precise rate limiting with no overages. Best for API integrations where you must stay strictly within limits.

- **💧 Leaky Bucket**: Use when you want to smooth out traffic spikes and maintain a steady, predictable output rate. Good for background processing or batch operations.

#### Example: With vs Without RateLimiter

```js
const Odesli = require('odesli.js');

// Without RateLimiter - relies on API rate limiting for your allowlisted key
const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });

const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
];
const songs = await odesli.fetch(urls); // May hit API rate limit

// With RateLimiter - proactive client-side limiting
const { RateLimiter } = require('odesli.js/rate-limiter');
const limiter = new RateLimiter({
  maxRequests: 8,
  windowMs: 60000,
  strategy: 'sliding-window',
});

// This prevents hitting API rate limits
async function safeFetch(url) {
  await limiter.waitForSlot();
  return await odesli.fetch(url);
}
```

#### Example: Using RateLimiter with Multiple Fetches

**CommonJS (require):**

```js
const Odesli = require('odesli.js');
const { RateLimiter } = require('odesli.js/rate-limiter');

const odesli = new Odesli({ apiKey: process.env.ODESLI_API_KEY });
const limiter = new RateLimiter({
  maxRequests: 2,
  windowMs: 3000, // 2 requests per 3 seconds
  strategy: 'sliding-window', // More reliable strategy
});

const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
  'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
];

// Function to fetch with rate limiting
async function fetchWithRateLimit(url, index) {
  console.log(`⏳ Request ${index + 1}: Waiting for slot...`);
  await limiter.waitForSlot();
  console.log(`✅ Request ${index + 1}: Got slot, fetching...`);

  const song = await odesli.fetch(url);
  console.log(`🎵 Request ${index + 1}: ${song.title}`);
  return song;
}

// Submit all requests at once - they'll be processed automatically
(async () => {
  console.log('🚀 Auto-Queue Rate Limiter Demo');
  console.log(
    `📊 Limit: ${limiter.maxRequests} requests per ${limiter.windowMs / 1000}s`
  );
  console.log(`🔗 Submitting ${urls.length} requests...\n`);

  // Submit all requests - they'll be processed as slots become available
  const promises = urls.map((url, index) => fetchWithRateLimit(url, index));

  // Wait for all to complete
  const results = await Promise.all(promises);

  console.log('\n🎉 All requests completed!');
  console.log(`📊 Total songs fetched: ${results.length}`);
})();
```

### 2. Metrics Collector

**What:** Tracks requests, errors, cache hits, response times, and rate limit events.

**Why use it?**

- Monitor API usage and performance
- Debug slowdowns or error spikes
- Gather analytics for reporting or dashboards

**CommonJS (require):**

```js
const { MetricsCollector } = require('odesli.js/metrics');
```

**ESM (import):**

```js
import { MetricsCollector } from 'odesli.js/metrics';
```

### 3. Plugin System

**What:** Extensible system for adding hooks, middleware, and data transformers to Odesli.js.

**Why use it?**

- Add custom logging, analytics, or caching
- Transform responses or inject custom logic
- Cleanly separate concerns and enable community plugins

**CommonJS (require):**

```js
const { PluginSystem } = require('odesli.js/plugin-system');
```

**ESM (import):**

```js
import { PluginSystem } from 'odesli.js/plugin-system';
```

See the [`examples/advanced-features-example.js`](./examples/advanced-features-example.js) for a full demonstration of these extensions in action.
