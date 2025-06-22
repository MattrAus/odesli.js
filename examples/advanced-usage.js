const Odesli = require('../lib/index.js');

async function advancedExample() {
  // API key is optional. Only needed for more than 10 requests/minute.
  const apiKey = process.env.ODESLI_API_KEY;
  const odesli = apiKey
    ? new Odesli({ apiKey, version: 'v1-alpha.1' })
    : new Odesli();

  if (!apiKey) {
    console.log(
      'ℹ️  No API key set. You are limited to 10 requests per minute. Set ODESLI_API_KEY for higher limits.'
    );
  }

  try {
    // Example 1: Fetch by URL with custom country
    console.log('🌍 Fetching song for UK market...');
    const ukSong = await odesli.fetch(
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
      'GB'
    );
    console.log(`UK Title: ${ukSong.title}`);

    // Example 2: Fetch by parameters
    console.log('\n🎯 Fetching by parameters...');
    const paramSong = await odesli.getByParams(
      'spotify',
      'song',
      '4Km5HrUvYTaSUfiSGPJeQR'
    );
    console.log(`Param Title: ${paramSong.title}`);

    // Example 3: Fetch by entity ID
    console.log('\n🆔 Fetching by entity ID...');
    const idSong = await odesli.getById('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
    console.log(`ID Title: ${idSong.title}`);

    // Example 4: Process multiple songs
    console.log('\n📊 Processing multiple songs...');
    const urls = [
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
      'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
    ];

    const songs = await Promise.all(
      urls.map(url =>
        odesli.fetch(url).catch(err => ({ error: err.message, url }))
      )
    );

    songs.forEach((song, index) => {
      if (song.error) {
        console.log(`Song ${index + 1}: Error - ${song.error}`);
      } else {
        console.log(
          `Song ${index + 1}: ${song.title} by ${song.artist.join(', ')}`
        );
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

advancedExample();
