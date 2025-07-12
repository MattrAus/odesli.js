// Example: No API key is used. You are limited to 10 requests/minute. Some requests may return 401/429 if the rate limit is exceeded.
const Odesli = require('odesli.js');
const { RateLimiter } = require('odesli.js/rate-limiter');

async function advancedExample() {
  console.log('🚀 Advanced Odesli.js Usage Example\n');

  // Initialize advanced features
  const rateLimiter = new RateLimiter({
    maxRequests: 8,
    windowMs: 60000,
    strategy: 'token-bucket',
  });

  // Initialize Odesli with advanced configuration (no API key)
  const odesli = new Odesli({
    apiKey: process.env.ODESLI_API_KEY,
    version: 'v1-alpha.1',
    validateParams: true,
    logger: (message, level) => {
      if (level === 'error' || level === 'warn') {
        console.log(`[${level.toUpperCase()}]`, message);
      } else {
        console.log(`[${level.toUpperCase()}]`, message);
      }
    },
  });

  // Get the integrated metrics collector
  const metrics = odesli.getMetrics();

  if (!process.env.ODESLI_API_KEY) {
    console.log(
      'ℹ️  No API key set in environment. You are limited to 10 requests per minute. Set ODESLI_API_KEY for higher limits.'
    );
  }

  try {
    // Example 1: Advanced parameter fetching with metrics
    console.log('🌍 Fetching song for UK market with custom options...');

    const startTime = Date.now();
    metrics.recordRequest({
      url: 'param-based-request',
      startTime,
      platform: 'spotify',
      country: 'GB',
    });

    const paramSong = await odesli.getByParams(
      'spotify',
      'song',
      '4Km5HrUvYTaSUfiSGPJeQR',
      {
        country: 'GB',
        skipCache: false,
        timeout: 5000,
      }
    );

    metrics.recordRequest({
      url: 'param-based-request',
      startTime,
      endTime: Date.now(),
      success: true,
      statusCode: 200,
      platform: 'spotify',
      country: 'GB',
    });

    console.log(`Param Title: ${paramSong.title}`);
    console.log();

    // Example 2: Entity ID fetching with rate limiting
    console.log('🆔 Fetching by entity ID with rate limiting...');

    await rateLimiter.waitForSlot();

    const idSong = await odesli.getById(
      'SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR',
      {
        country: 'US',
        skipCache: true,
      }
    );

    console.log(`ID Title: ${idSong.title}`);
    console.log();

    // Example 3: Enhanced batch fetching with error handling (see below)
    console.log('📊 Enhanced batch fetching with detailed error handling...');

    // Example 4: Platform detection and ID extraction
    console.log('🔍 Platform detection and ID extraction...');

    const testUrls = [
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
      'https://music.apple.com/us/album/bad-and-boujee/1440811686?i=1440811687',
      'https://www.youtube.com/watch?v=S-sJp1FfG7Q',
    ];

    testUrls.forEach(url => {
      const platform = odesli.detectPlatform(url);
      const id = odesli.extractId(url);
      console.log(`URL: ${url}`);
      console.log(`  Platform: ${platform}`);
      console.log(`  ID: ${id}`);
    });
    console.log();

    // Example 5: Supported platforms
    console.log('📱 Supported platforms:');
    const platforms = odesli.getSupportedPlatforms();
    console.log(platforms.join(', '));
    console.log();

    // Example 6: Cache statistics with metrics
    console.log('📊 Cache and metrics statistics:');
    const cacheStats = odesli.getCacheStats();
    console.log(`Cache hits: ${cacheStats.hitCount}`);
    console.log(`Cache misses: ${cacheStats.missCount}`);
    console.log(`Cache size: ${cacheStats.size}`);
    console.log(`Hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

    const metricsSummary = metrics.getSummary();
    console.log(`\n📈 Metrics Summary (from MetricsCollector):`);
    console.log(`  Total requests: ${metricsSummary.counters.totalRequests}`);
    console.log(
      `  Success rate: ${(metricsSummary.rates.successRate * 100).toFixed(1)}%`
    );
    console.log(
      `  Average response time: ${metricsSummary.recent.avgResponseTime}ms`
    );
    console.log(
      `  Requests per minute: ${metricsSummary.recent.requestsPerMinute}`
    );
    console.log();

    // Example 7: User-Agent information
    console.log('🌐 User-Agent information:');
    const userAgent = odesli.getUserAgent();
    console.log(`User-Agent: ${userAgent}`);
    console.log();

    // Example 8: Plugin system demonstration - requires separate plugin system initialization
    console.log('🔌 Plugin system demonstration:');
    // For this example, we'll create a separate PluginSystem.
    // In a real app, you might integrate it into the Odesli class similarly to MetricsCollector.
    const {
      PluginSystem,
      loggingPlugin,
      analyticsPlugin,
    } = require('odesli.js/plugin-system');
    const pluginSystem = new PluginSystem();
    pluginSystem.registerPlugin('logging', loggingPlugin);
    pluginSystem.registerPlugin('analytics', analyticsPlugin);
    console.log('Registered plugins:', pluginSystem.getPlugins());

    pluginSystem.getPlugins().forEach(pluginName => {
      const info = pluginSystem.getPluginInfo(pluginName);
      console.log(`  ${pluginName}: ${info.description}`);
    });
    console.log();

    // Example 9: Error handling with validation
    console.log('⚠️  Testing parameter validation...');

    try {
      await odesli.fetch('invalid-url');
    } catch (error) {
      console.log(`Validation error: ${error.message}`);
    }

    try {
      await odesli.getByParams('invalid-platform', 'song', '123');
    } catch (error) {
      console.log(`Platform validation error: ${error.message}`);
    }

    try {
      await odesli.fetch('https://open.spotify.com/track/123', 'INVALID');
    } catch (error) {
      console.log(`Country validation error: ${error.message}`);
    }

    // Batch fetch with enhanced error handling
    console.log(
      '\n📊 Rate-limited batch fetching with enhanced error handling...'
    );
    const batchUrls = [
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR',
      'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
      'https://open.spotify.com/track/1z6WtY7X4HQJvzxC4UgkS1', // Invalid track
      'https://open.spotify.com/track/2CIMQHirSU0MQqyYHq0eOx', // Invalid track
      'https://open.spotify.com/track/3Wrjm47oTz2sjIgck11l5e',
      'https://music.apple.com/us/album/blinding-lights/1493120897?i=1493120900', // Apple Music with track ID
    ];

    const batchResults = await odesli.fetchBatch(batchUrls, {
      country: 'US',
      concurrency: 3,
    });

    console.log('\n📋 Batch Results Summary:');
    let successCount = 0;
    let errorCount = 0;

    batchResults.forEach((result, index) => {
      if (result.success) {
        successCount++;
        console.log(
          `✅ Song ${index + 1}: ${result.title} by ${result.artist.join(', ')}`
        );
      } else {
        errorCount++;
        console.log(`❌ Song ${index + 1}: ${result.error}`);
        console.log(`   Platform: ${result.platform || 'Unknown'}`);
        console.log(`   Extracted ID: ${result.extractedId || 'Not found'}`);
        console.log(`   Error Type: ${result.errorType}`);
        console.log(`   Suggestion: ${result.suggestion}`);
        console.log(`   Retryable: ${result.retryable ? 'Yes' : 'No'}`);
        console.log('');
      }
    });

    console.log(
      `📊 Batch Summary: ${successCount} successful, ${errorCount} failed`
    );

    console.log('\n🎉 Advanced usage example completed successfully!');
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
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the example
advancedExample().catch(console.error);
