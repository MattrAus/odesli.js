// Requires an allowlisted Songlink/Odesli API key (public API retired July 31, 2026).
// Set ODESLI_API_KEY in your environment before running.
const Odesli = require('odesli.js');
// For ESM (import)
// import { Odesli } from '../lib/index.mjs';

if (!process.env.ODESLI_API_KEY) {
  console.error(
    'Missing ODESLI_API_KEY. Set an allowlisted key, or use Odesli.getPageUrl(url) for song.link landing pages.'
  );
  process.exit(1);
}

const odesli = new Odesli({
  apiKey: process.env.ODESLI_API_KEY,
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

    songs.forEach((result, index) => {
      if (result.error) {
        console.log(`Song ${index + 1}: Error - ${result.error}`);
        return;
      }
      console.log(
        `Song ${index + 1}: ${result.title} by ${result.artist.join(', ')}`
      );
    });
    console.log();

    // Get links for specific platform
    console.log('3. Getting Apple Music link...');
    const appleMusicLink = song.linksByPlatform.appleMusic?.url;
    console.log(`Apple Music: ${appleMusicLink}\n`);

    // Platform detection (also available as Odesli.detectPlatform without a key)
    console.log('4. Platform detection...');
    const platform = Odesli.detectPlatform(
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
    );
    console.log(`Detected platform: ${platform}\n`);

    // Landing page helper (no API call)
    console.log('5. Song.link page URL helper...');
    console.log(
      Odesli.getPageUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh')
    );
  } catch (error) {
    console.error('Error:', error.code || error.name, error.message);
    if (
      error.message.includes('401') ||
      error.code === 'PUBLIC_API_ACCESS_DEPRECATED' ||
      error.code === 'INVALID_ACCESS_KEY' ||
      error.code === 'RATE_LIMITED'
    ) {
      console.error(
        'Check that ODESLI_API_KEY is allowlisted and you are within rate limits.'
      );
    }
  }
}

basicExample();
