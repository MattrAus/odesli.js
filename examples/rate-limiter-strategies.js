const Odesli = require('odesli.js');
const { RateLimiter } = require('odesli.js/rate-limiter');
const odesli = new Odesli();

// Test URLs
const urls = [
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
  'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
  'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
  'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6',
];

// Function to test a strategy
async function testStrategy(strategy, maxRequests, windowMs) {
  console.log(`\n🔧 Testing ${strategy.toUpperCase()} Strategy`);
  console.log(`📊 Config: ${maxRequests} requests per ${windowMs / 1000}s`);
  console.log('─'.repeat(50));

  const limiter = new RateLimiter({
    maxRequests,
    windowMs,
    strategy,
  });

  const startTime = Date.now();

  // Submit all requests at once
  const promises = urls.map(async (url, index) => {
    const requestStart = Date.now();
    console.log(`⏳ Request ${index + 1}: Waiting for slot...`);

    await limiter.waitForSlot();
    const waitTime = Date.now() - requestStart;

    console.log(`✅ Request ${index + 1}: Got slot (waited ${waitTime}ms)`);
    const song = await odesli.fetch(url);
    console.log(`🎵 Request ${index + 1}: ${song.title}`);

    return { song, waitTime };
  });

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  console.log(`\n📈 Results for ${strategy}:`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(
    `📊 Average wait: ${Math.round(results.reduce((sum, r) => sum + r.waitTime, 0) / results.length)}ms`
  );
  console.log(`🎯 Strategy status:`, limiter.getStatus());
}

// Test all strategies
(async () => {
  console.log('🚀 Rate Limiter Strategy Comparison');
  console.log('='.repeat(60));

  // 1. TOKEN BUCKET - Good for burst handling
  await testStrategy('token-bucket', 2, 3000);

  // 2. SLIDING WINDOW - Most accurate rate limiting
  await testStrategy('sliding-window', 2, 3000);

  // 3. LEAKY BUCKET - Good for smoothing traffic
  await testStrategy('leaky-bucket', 2, 3000);

  console.log('\n📚 Strategy Guide:');
  console.log('='.repeat(60));
  console.log('🎯 TOKEN BUCKET:');
  console.log('   ✅ Pros: Handles bursts well, efficient memory usage');
  console.log('   ❌ Cons: Less precise timing, can allow slight overages');
  console.log('   🎯 Use when: You want to allow some burst traffic');
  console.log('');
  console.log('🔄 SLIDING WINDOW:');
  console.log('   ✅ Pros: Most accurate, precise timing, no overages');
  console.log('   ❌ Cons: More memory usage, slightly more complex');
  console.log('   🎯 Use when: You need exact rate limiting (recommended)');
  console.log('');
  console.log('💧 LEAKY BUCKET:');
  console.log('   ✅ Pros: Smooths traffic, predictable output rate');
  console.log('   ❌ Cons: Can delay requests, less responsive to bursts');
  console.log('   🎯 Use when: You want to smooth out traffic spikes');
})();
