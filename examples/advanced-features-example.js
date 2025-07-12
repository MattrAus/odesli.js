// Advanced Features Example for Odesli.js
// This example demonstrates the use of extensions: Rate Limiter, Metrics Collector, and Plugin System.
//
// - Rate Limiter: Prevents hitting API rate limits and smooths out traffic spikes.
// - Metrics Collector: Tracks requests, errors, and performance for analytics and debugging.
// - Plugin System: Lets you add hooks, middleware, and transformers for custom logic (logging, analytics, etc).

const Odesli = require('odesli.js');
const { RateLimiter } = require('odesli.js/rate-limiter');
const { MetricsCollector } = require('odesli.js/metrics');
const { PluginSystem } = require('odesli.js/plugin-system');

async function advancedExample() {
  console.log('=== Advanced Features Example ===\n');

  // 1. Rate Limiting
  // Controls the number of API requests per time window.
  // Prevents hitting Odesli/Songlink API rate limits and smooths out spikes.
  console.log('1. Rate Limiting Setup...');
  const rateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    strategy: 'token-bucket',
  });

  // 2. Metrics Collection
  // Tracks requests, errors, cache hits, and response times for analytics and debugging.
  console.log('2. Metrics Collection Setup...');
  const metrics = new MetricsCollector({
    enabled: true,
    retentionMs: 3600000, // 1 hour
  });

  // 3. Plugin System
  // Lets you add hooks, middleware, and transformers for custom logic (logging, analytics, etc).
  console.log('3. Plugin System Setup...');
  const pluginSystem = new PluginSystem();

  // Register a logging plugin to log requests and responses
  pluginSystem.registerPlugin('logging', {
    name: 'logging',
    description: 'Logs all requests and responses',
    hooks: {
      'pre-request': context => {
        console.log(`🔄 Making request to: ${context.url}`);
      },
      'post-response': context => {
        console.log(`✅ Response received for: ${context.url}`);
      },
    },
  });

  // Register an analytics plugin to track request analytics
  pluginSystem.registerPlugin('analytics', {
    name: 'analytics',
    description: 'Tracks request analytics',
    hooks: {
      'post-response': context => {
        metrics.recordRequest({
          url: context.url,
          startTime: context.startTime,
          endTime: Date.now(),
          success: true,
          responseTime: Date.now() - context.startTime,
        });
      },
    },
  });

  // 4. Initialize Odesli with advanced features
  // You can pass a logger function for custom logging.
  const odesli = new Odesli({
    timeout: 15000,
    maxRetries: 3,
    retryDelay: 2000,
    cache: true,
    logger: (message, level) => {
      console.log(`[${level.toUpperCase()}] ${message}`);
    },
  });

  try {
    // 5. Execute hooks before requests (for logging, analytics, etc)
    await pluginSystem.executeHook('pre-request', {
      url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      startTime: Date.now(),
    });

    // 6. Wait for rate limiter slot (prevents exceeding API limits)
    await rateLimiter.waitForSlot();

    // 7. Make request with advanced options
    console.log('\n4. Making request with advanced features...');
    const song = await odesli.fetch(
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      {
        country: 'US',
        skipCache: false,
        timeout: 10000,
      }
    );

    // 8. Execute hooks after response (for logging, analytics, etc)
    await pluginSystem.executeHook('post-response', {
      url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      startTime: Date.now() - 1000,
    });

    console.log(`Title: ${song.title}`);
    console.log(`Artist: ${song.artist.join(', ')}`);

    // 9. Show metrics summary (API usage, performance, etc)
    console.log('\n5. Metrics Summary:');
    const summary = metrics.getSummary();
    console.log(`Total Requests: ${summary.counters.totalRequests}`);
    console.log(
      `Success Rate: ${(summary.rates.successRate * 100).toFixed(1)}%`
    );
    console.log(
      `Average Response Time: ${summary.recent.avgResponseTime.toFixed(0)}ms`
    );

    // 10. Show rate limiter status
    console.log('\n6. Rate Limiter Status:');
    const rateStatus = rateLimiter.getStatus();
    console.log(`Available slots: ${rateStatus.available}/${rateStatus.max}`);
    console.log(`Used in window: ${rateStatus.used}`);

    // 11. Show plugin information
    console.log('\n7. Active Plugins:');
    const plugins = pluginSystem.getPlugins();
    plugins.forEach(pluginName => {
      const info = pluginSystem.getPluginInfo(pluginName);
      console.log(`- ${info.name}: ${info.description}`);
    });

    // 12. Demonstrate country options
    console.log('\n8. Country Options:');
    const countryOptions = Odesli.getCountryOptions();
    console.log(`Available countries: ${countryOptions.length}`);
    const popularCountries = countryOptions.filter(c =>
      ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'].includes(c.code)
    );
    console.log('Popular countries:');
    popularCountries.forEach(c => {
      console.log(`  ${c.code}: ${c.name}`);
    });

    // 13. Demonstrate batch fetching with rate limiting
    console.log('\n9. Batch fetching with rate limiting...');
    const urls = [
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      'https://music.apple.com/us/album/blinding-lights/1493120897?i=1493120900',
    ];

    const batchResults = [];
    for (const url of urls) {
      await rateLimiter.waitForSlot();
      await pluginSystem.executeHook('pre-request', {
        url,
        startTime: Date.now(),
      });

      try {
        const result = await odesli.fetch(url, { country: 'US' });
        batchResults.push(result);
        await pluginSystem.executeHook('post-response', {
          url,
          startTime: Date.now() - 1000,
        });
        console.log(`✅ ${result.title}`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        metrics.recordError(error, { url });
      }
    }

    console.log(
      `Batch completed: ${batchResults.length}/${urls.length} successful`
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
    // Record error in metrics
    metrics.recordError(error, {
      url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    });
  }

  // 14. Cleanup
  console.log('\n10. Cleaning up...');
  metrics.cleanup();
  console.log('✅ Advanced features example completed!');
}

advancedExample();
