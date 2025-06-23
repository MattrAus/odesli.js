// Cache Test Example
// This example demonstrates how caching works by making the same request multiple times
const Odesli = require('../lib/index.js');

async function cacheTest() {
  console.log('🧪 Testing Cache Functionality\n');

  // Initialize with caching enabled
  const odesli = new Odesli({
    cache: true,
    timeout: 10000,
  });

  const testUrl = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';

  try {
    // First request - should be a cache miss
    console.log('1. First request (should be cache miss)...');
    const start1 = Date.now();
    const song1 = await odesli.fetch(testUrl);
    const time1 = Date.now() - start1;
    console.log(`✅ Got: ${song1.title} (took ${time1}ms)`);

    // Check cache stats after first request
    const stats1 = odesli.getCacheStats();
    console.log(
      `   Cache hits: ${stats1.hitCount}, misses: ${stats1.missCount}, hit rate: ${(stats1.hitRate * 100).toFixed(1)}%\n`
    );

    // Second request - should be a cache hit
    console.log('2. Second request (should be cache hit)...');
    const start2 = Date.now();
    const song2 = await odesli.fetch(testUrl);
    const time2 = Date.now() - start2;
    console.log(`✅ Got: ${song2.title} (took ${time2}ms)`);

    // Check cache stats after second request
    const stats2 = odesli.getCacheStats();
    console.log(
      `   Cache hits: ${stats2.hitCount}, misses: ${stats2.missCount}, hit rate: ${(stats2.hitRate * 100).toFixed(1)}%\n`
    );

    // Third request - should also be a cache hit
    console.log('3. Third request (should be cache hit)...');
    const start3 = Date.now();
    const song3 = await odesli.fetch(testUrl);
    const time3 = Date.now() - start3;
    console.log(`✅ Got: ${song3.title} (took ${time3}ms)`);

    // Check final cache stats
    const stats3 = odesli.getCacheStats();
    console.log(
      `   Cache hits: ${stats3.hitCount}, misses: ${stats3.missCount}, hit rate: ${(stats3.hitRate * 100).toFixed(1)}%\n`
    );

    // Test with skipCache option
    console.log('4. Request with skipCache=true (should be cache miss)...');
    const start4 = Date.now();
    const song4 = await odesli.fetch(testUrl, { skipCache: true });
    const time4 = Date.now() - start4;
    console.log(`✅ Got: ${song4.title} (took ${time4}ms)`);

    const stats4 = odesli.getCacheStats();
    console.log(
      `   Cache hits: ${stats4.hitCount}, misses: ${stats4.missCount}, hit rate: ${(stats4.hitRate * 100).toFixed(1)}%\n`
    );

    // Performance comparison
    console.log('📊 Performance Summary:');
    console.log(`   First request (miss): ${time1}ms`);
    console.log(`   Second request (hit): ${time2}ms`);
    console.log(`   Third request (hit): ${time3}ms`);
    console.log(`   Skip cache request: ${time4}ms`);

    if (time2 < time1) {
      console.log(
        `   ✅ Cache is working! Hit was ${Math.round(time1 / time2)}x faster than miss`
      );
    } else {
      console.log(
        `   ⚠️  Cache hit wasn't faster (network might be very fast)`
      );
    }

    // Clear cache and test again
    console.log('\n5. Clearing cache...');
    odesli.clearCache();
    const statsAfterClear = odesli.getCacheStats();
    console.log(
      `   After clear: hits: ${statsAfterClear.hitCount}, misses: ${statsAfterClear.missCount}\n`
    );

    // Test after clearing cache
    console.log('6. Request after clearing cache (should be cache miss)...');
    const start5 = Date.now();
    const song5 = await odesli.fetch(testUrl);
    const time5 = Date.now() - start5;
    console.log(`✅ Got: ${song5.title} (took ${time5}ms)`);

    const finalStats = odesli.getCacheStats();
    console.log(
      `   Final stats: hits: ${finalStats.hitCount}, misses: ${finalStats.missCount}, hit rate: ${(finalStats.hitRate * 100).toFixed(1)}%`
    );
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

cacheTest();
