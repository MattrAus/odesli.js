// Example: No API key is used. You are limited to 10 requests/minute. Some requests may return 401/429 if the rate limit is exceeded.
const Odesli = require('odesli.js');
// For ESM (import)
// import { Odesli } from '../lib/index.mjs';

// For advanced features, uncomment these lines:
// const { RateLimiter } = require('odesli.js/rate-limiter');
// const { MetricsCollector } = require('odesli.js/metrics');

// Initialize without API key (public usage, rate-limited)
const odesli = new Odesli({
  timeout: 10000,
  cache: true,
});

async function basicExample() {
  try {
    console.log('=== Basic Usage Examples ===\n');

    // Single URL fetch
    console.log('1. Fetching single song...');
    const song = await odesli.fetch(
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
    );
    console.log(`Title: ${song.title}`);
    console.log(`Artist: ${song.artist.join(', ')}`);
    console.log(`Platforms: ${Object.keys(song.linksByPlatform).join(', ')}\n`);

    // Batch fetch multiple URLs
    console.log('2. Fetching multiple songs...');
    const songs = await odesli.fetch([
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      'https://music.apple.com/us/album/blinding-lights/1493120897?i=1493120900',
    ]);

    songs.forEach((song, index) => {
      console.log(
        `Song ${index + 1}: ${song.title} by ${song.artist.join(', ')}`
      );
    });
    console.log();

    // Get links for specific platform
    console.log('3. Getting Apple Music link...');
    const appleMusicLink = song.linksByPlatform.appleMusic?.url;
    console.log(`Apple Music: ${appleMusicLink}\n`);

    // Platform detection
    console.log('4. Platform detection...');
    const platform = odesli.detectPlatform(
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
    );
    console.log(`Detected platform: ${platform}\n`);

    // Country-specific fetch
    console.log('5. Country-specific fetch...');
    const ukSong = await odesli.fetch(
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      { country: 'GB' }
    );
    console.log(`UK fetch successful: ${ukSong.title}\n`);

    // Get available country options
    console.log('6. Available country options...');
    const countryOptions = Odesli.getCountryOptions();
    console.log(`Total countries: ${countryOptions.length}`);
    console.log(
      `Sample countries: ${countryOptions
        .slice(0, 5)
        .map(c => `${c.code} (${c.name})`)
        .join(', ')}\n`
    );

    // Cache statistics
    console.log('7. Cache statistics...');
    const cacheStats = odesli.getCacheStats();
    console.log(`Cache hits: ${cacheStats.hitCount}`);
    console.log(`Cache misses: ${cacheStats.missCount}`);
    console.log(`Cache size: ${cacheStats.size}`);
    console.log(`Hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

    // User-Agent information
    console.log('\n8. User-Agent...');
    console.log(`Current User-Agent: ${odesli.getUserAgent()}`);
  } catch (error) {
    if (
      error.message &&
      (error.message.includes('401') || error.message.includes('429'))
    ) {
      console.error('Error:', error.message);
      console.error(
        'You may need an API key for higher limits. See https://odesli.co/'
      );
    } else {
      console.error('Error:', error.message);
    }
  }
}

basicExample();
