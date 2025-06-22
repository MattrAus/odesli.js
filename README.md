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
  - [Quick Start](#quick-start)
  - [API Key](#api-key)
  - [Usage](#usage)
    - [Fetch by URL](#fetch-by-url)
    - [Fetch by Parameters](#fetch-by-parameters)
    - [Fetch by Entity ID](#fetch-by-entity-id)
    - [Country-Specific Results](#country-specific-results)
    - [Error Handling](#error-handling)
    - [Advanced Usage](#advanced-usage)
      - [Batch Processing](#batch-processing)
      - [Working with Different Platforms](#working-with-different-platforms)
      - [Error Recovery](#error-recovery)
  - [Response Format](#response-format)
  - [Supported Platforms](#supported-platforms)
  - [TypeScript Support](#typescript-support)
  - [Examples](#examples)
  - [API Documentation](#api-documentation)
  - [Contributing](#contributing)
  - [License](#license)
  - [Support](#support)

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

**Note**: To install from GitHub Packages, you may need to authenticate. Create a `.npmrc` file in your project root:

```
@mattraus:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_github_token_here
# or on Windows:
# set GITHUB_TOKEN=your_github_token_here
```

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
```

## API Key

An API key is **optional** but recommended for production use. Without an API key, you're limited to 10 requests per minute.

To get an API key, email `developers@song.link`.

## Usage

### Fetch by URL

Get links for a song using any streaming service URL:

```javascript
// Using async/await
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`${song.title} by ${song.artist[0]}`);
// Output: Bad and Boujee by Migos

// Using promises
odesli
  .fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR')
  .then(song => {
    console.log(`${song.title} by ${song.artist[0]}`);
  });
```

### Fetch by Parameters

Get links using platform, type, and ID:

```javascript
// Using async/await
const song = await odesli.getByParams(
  'spotify',
  'song',
  '4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(song.artist[0]); // Output: Migos

// Using promises
odesli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR').then(song => {
  console.log(song.artist[0]);
});
```

### Fetch by Entity ID

Get links using the full entity ID:

```javascript
// Using async/await
const song = await odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
console.log(song.title); // Output: Bad and Boujee

// Using promises
odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR').then(song => {
  console.log(song.title);
});
```

### Country-Specific Results

All methods accept an optional country parameter (ISO 3166-1 Alpha-2 code):

```javascript
// Get results for the United Kingdom
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'GB'
);

// Get results for Japan
const song = await odesli.getByParams(
  'spotify',
  'song',
  '4Km5HrUvYTaSUfiSGPJeQR',
  'JP'
);
```

### Error Handling

The library throws descriptive errors for various scenarios:

```javascript
try {
  const song = await odesli.fetch('invalid-url');
} catch (error) {
  console.error(error.message);
  // Examples:
  // "No URL was provided to odesli.fetch()"
  // "429: RATE_LIMITED, You are being rate limited, No API Key is 10 Requests / Minute."
  // "API returned an unexpected result."
}
```

### Advanced Usage

#### Batch Processing

```javascript
// Process multiple songs efficiently
const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
  'https://open.spotify.com/track/1z6WtY7X4HQJvzxC4UgkS1',
];

const songs = await Promise.allSettled(urls.map(url => odesli.fetch(url)));

songs.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`Song ${index + 1}: ${result.value.title}`);
  } else {
    console.log(`Song ${index + 1}: Error - ${result.reason.message}`);
  }
});
```

#### Working with Different Platforms

```javascript
// Get all available platform links
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);

// Extract all platform URLs
const platformUrls = Object.entries(song.linksByPlatform).map(
  ([platform, data]) => ({
    platform,
    url: data.url,
    mobileUri: data.nativeAppUriMobile,
    desktopUri: data.nativeAppUriDesktop,
  })
);

console.log('Available platforms:', platformUrls);
```

#### Error Recovery

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await odesli.fetch(url);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      console.log(`Retry attempt ${attempt} for ${url}`);
    }
  }
}

// Usage
const song = await fetchWithRetry(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
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

This package includes full TypeScript definitions:

```typescript
import Odesli from 'odesli.js';

const odesli = new Odesli({ apiKey: 'your-key' });
const song = await odesli.fetch('https://open.spotify.com/track/...');
// song is fully typed with all properties
```

## Examples

Check out the [examples directory](./examples) for more detailed usage examples:

- [Basic Usage](./examples/basic-usage.js) - Simple song fetching
- [Advanced Usage](./examples/advanced-usage.js) - Complex scenarios and error handling

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
