const Odesli = require('../lib/index.js');

async function basicExample() {
  // Initialize without API key (10 requests/minute limit)
  const odesli = new Odesli();

  try {
    // Fetch a song by Spotify URL
    console.log('🎵 Fetching song by URL...');
    const song = await odesli.fetch(
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
    );

    console.log(`Title: ${song.title}`);
    console.log(`Artist: ${song.artist.join(', ')}`);
    console.log(`Type: ${song.type}`);
    console.log(`Thumbnail: ${song.thumbnail}`);

    // Show available platforms
    console.log('\n📱 Available platforms:');
    Object.keys(song.linksByPlatform).forEach(platform => {
      const link = song.linksByPlatform[platform];
      console.log(`  ${platform}: ${link.url}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

basicExample();
