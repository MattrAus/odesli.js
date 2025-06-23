// Test Apple Music ID extraction improvements
const Odesli = require('../lib/index.js');

const odesli = new Odesli();

console.log('🍎 Testing Apple Music ID Extraction Improvements\n');

// Test various Apple Music URL formats
const testUrls = [
  // Album URLs with track IDs
  'https://music.apple.com/us/album/blinding-lights/1493120897?i=1493120900',
  'https://music.apple.com/gb/album/watermelon-sugar/1493120897?i=1493120901',
  'https://itunes.apple.com/us/album/bad-guy/1493120897?i=1493120902',

  // Direct track URLs
  'https://music.apple.com/us/album/blinding-lights/1493120897',
  'https://itunes.apple.com/us/album/watermelon-sugar/1493120898',

  // Other formats
  'https://music.apple.com/us/album/123456789',
  'https://itunes.apple.com/us/album/987654321?i=123456789',

  // Invalid URLs for comparison
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'invalid-url',
];

console.log('📋 Testing URL parsing:');
testUrls.forEach((url, index) => {
  const platform = odesli.detectPlatform(url);
  const extractedId = odesli.extractId(url);

  console.log(`${index + 1}. ${url}`);
  console.log(`   Platform: ${platform || 'Unknown'}`);
  console.log(`   Extracted ID: ${extractedId || 'Not found'}`);

  if (platform === 'appleMusic' && extractedId) {
    console.log(`   ✅ Successfully extracted Apple Music ID: ${extractedId}`);
  } else if (platform === 'appleMusic' && !extractedId) {
    console.log(`   ❌ Failed to extract Apple Music ID`);
  }
  console.log('');
});

console.log('🎯 Summary:');
const appleMusicUrls = testUrls.filter(
  url => odesli.detectPlatform(url) === 'appleMusic'
);
const successfulExtractions = appleMusicUrls.filter(url =>
  odesli.extractId(url)
);

console.log(`Total Apple Music URLs: ${appleMusicUrls.length}`);
console.log(`Successful ID extractions: ${successfulExtractions.length}`);
console.log(
  `Success rate: ${((successfulExtractions.length / appleMusicUrls.length) * 100).toFixed(1)}%`
);

console.log('\n✨ Apple Music ID extraction test completed!');
