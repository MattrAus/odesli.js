const { RateLimiter } = require('../lib/rate-limiter.js');
const { MetricsCollector } = require('../lib/metrics.js');
const {
  PluginSystem,
  loggingPlugin,
  analyticsPlugin,
} = require('../lib/plugin-system.js');

describe('Advanced Features', () => {
  describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000, // 1 second for faster tests
        strategy: 'token-bucket',
      });
    });

    test('should initialize with correct settings', () => {
      expect(rateLimiter.maxRequests).toBe(5);
      expect(rateLimiter.windowMs).toBe(1000);
      expect(rateLimiter.strategy).toBe('token-bucket');
    });

    test('should allow requests within limit', async () => {
      const startTime = Date.now();

      // Should allow 5 requests immediately
      for (let i = 0; i < 5; i++) {
        await rateLimiter.waitForSlot();
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('should throttle requests beyond limit', async () => {
      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.waitForSlot();
      }

      const startTime = Date.now();
      await rateLimiter.waitForSlot(); // This should wait
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(800); // Should wait close to window time
    });

    test('should handle rate limit responses', async () => {
      const startTime = Date.now();
      await rateLimiter.handleRateLimitResponse(2); // 2 seconds
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(1900); // Should wait ~2 seconds
    });

    test('should provide status information', () => {
      const status = rateLimiter.getStatus();
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('max');
      expect(status).toHaveProperty('refillRate');
    });

    test('should work with different strategies', async () => {
      const slidingWindowLimiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        await slidingWindowLimiter.waitForSlot();
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('MetricsCollector', () => {
    let metrics;

    beforeEach(() => {
      metrics = new MetricsCollector({
        enabled: true,
        retentionMs: 1000, // 1 second for faster tests
        maxDataPoints: 10,
      });
    });

    test('should initialize with correct settings', () => {
      expect(metrics.enabled).toBe(true);
      expect(metrics.retentionMs).toBe(1000);
      expect(metrics.maxDataPoints).toBe(10);
    });

    test('should record successful requests', () => {
      const startTime = Date.now();
      metrics.recordRequest({
        url: 'https://example.com',
        startTime,
        endTime: startTime + 100,
        success: true,
        statusCode: 200,
        platform: 'spotify',
        country: 'US',
      });

      const summary = metrics.getSummary();
      expect(summary.counters.totalRequests).toBe(1);
      expect(summary.counters.successfulRequests).toBe(1);
      expect(summary.counters.failedRequests).toBe(0);
      expect(summary.rates.successRate).toBe(1);
    });

    test('should record failed requests', () => {
      const startTime = Date.now();
      metrics.recordRequest({
        url: 'https://example.com',
        startTime,
        endTime: startTime + 100,
        success: false,
        error: new Error('Network error'),
        platform: 'spotify',
        country: 'US',
      });

      const summary = metrics.getSummary();
      expect(summary.counters.totalRequests).toBe(1);
      expect(summary.counters.successfulRequests).toBe(0);
      expect(summary.counters.failedRequests).toBe(1);
      expect(summary.rates.successRate).toBe(0);
    });

    test('should record cache hits and misses', () => {
      metrics.recordRequest({ cacheHit: true });
      metrics.recordRequest({ cacheHit: false });
      metrics.recordRequest({ cacheHit: true });

      const summary = metrics.getSummary();
      expect(summary.counters.cacheHits).toBe(2);
      expect(summary.counters.cacheMisses).toBe(1);
      expect(summary.rates.cacheHitRate).toBeCloseTo(0.67, 2);
    });

    test('should record rate limit hits', () => {
      metrics.recordRateLimit(1000);
      metrics.recordRateLimit(2000);

      const summary = metrics.getSummary();
      expect(summary.counters.rateLimitHits).toBe(2);
      expect(summary.rateLimits.hits).toBe(2);
    });

    test('should record errors', () => {
      const error = new Error('Test error');
      metrics.recordError(error, { url: 'https://example.com' });

      const detailed = metrics.getDetailedMetrics();
      expect(detailed).toBeDefined();
      expect(typeof detailed).toBe('object');
    });

    test('should group metrics by platform', () => {
      metrics.recordRequest({
        url: 'https://spotify.com/track/123',
        platform: 'spotify',
        success: true,
      });
      metrics.recordRequest({
        url: 'https://youtube.com/watch?v=abc',
        platform: 'youtube',
        success: true,
      });

      const platformMetrics = metrics.getDetailedMetrics({
        groupBy: 'platform',
      });
      expect(platformMetrics.spotify.requests).toBe(1);
      expect(platformMetrics.youtube.requests).toBe(1);
    });

    test('should clean up old data', () => {
      // Add some old data
      metrics.metrics.requests.push({
        timestamp: Date.now() - 2000, // 2 seconds ago
        url: 'old-request',
      });

      metrics.cleanup();
      expect(metrics.metrics.requests).toHaveLength(0);
    });

    test('should export metrics', () => {
      metrics.recordRequest({ success: true });

      const exported = metrics.export();
      expect(exported).toHaveProperty('summary');
      expect(exported).toHaveProperty('detailed');
      expect(exported).toHaveProperty('raw');
    });

    test('should reset metrics', () => {
      metrics.recordRequest({ success: true });
      expect(metrics.counters.totalRequests).toBe(1);

      metrics.reset();
      expect(metrics.counters.totalRequests).toBe(0);
    });
  });

  describe('PluginSystem', () => {
    let pluginSystem;

    beforeEach(() => {
      pluginSystem = new PluginSystem();
    });

    test('should initialize with built-in hooks', () => {
      const hooks = Array.from(pluginSystem.hooks.keys());
      expect(hooks).toContain('beforeRequest');
      expect(hooks).toContain('afterRequest');
      expect(hooks).toContain('onError');
      expect(hooks).toContain('onRateLimit');
    });

    test('should register plugins', () => {
      pluginSystem.registerPlugin('test', {
        name: 'test',
        version: '1.0.0',
        description: 'Test plugin',
      });

      expect(pluginSystem.hasPlugin('test')).toBe(true);
      expect(pluginSystem.getPlugins()).toContain('test');
    });

    test('should not register duplicate plugins', () => {
      pluginSystem.registerPlugin('test', { name: 'test' });

      expect(() => {
        pluginSystem.registerPlugin('test', { name: 'test' });
      }).toThrow('Plugin "test" is already registered');
    });

    test('should unregister plugins', () => {
      pluginSystem.registerPlugin('test', { name: 'test' });
      expect(pluginSystem.hasPlugin('test')).toBe(true);

      pluginSystem.unregisterPlugin('test');
      expect(pluginSystem.hasPlugin('test')).toBe(false);
    });

    test('should execute hooks', async () => {
      let executed = false;

      pluginSystem.registerHookHandler('beforeRequest', async context => {
        executed = true;
        expect(context.url).toBe('https://example.com');
      });

      await pluginSystem.executeHook('beforeRequest', {
        url: 'https://example.com',
      });
      expect(executed).toBe(true);
    });

    test('should handle hook errors gracefully', async () => {
      pluginSystem.registerHookHandler('beforeRequest', async () => {
        throw new Error('Hook error');
      });

      let errorExecuted = false;
      pluginSystem.registerHookHandler('onError', async context => {
        errorExecuted = true;
        expect(context.error.message).toBe('Hook error');
      });

      await pluginSystem.executeHook('beforeRequest', {});
      expect(errorExecuted).toBe(true);
    });

    test('should execute middleware chain', async () => {
      const middleware1 = async (context, next) => {
        context.value = (context.value || 0) + 1;
        return await next();
      };

      const middleware2 = async (context, next) => {
        context.value = context.value * 2;
        return await next();
      };

      pluginSystem.middleware.push({ name: 'test1', middleware: middleware1 });
      pluginSystem.middleware.push({ name: 'test2', middleware: middleware2 });

      const context = { value: 0 };
      const result = await pluginSystem.executeMiddleware(context, async () => {
        return context.value + 10;
      });

      expect(result).toBe(12); // (0 + 1) * 2 + 10
    });

    test('should transform data', async () => {
      const transformer = async (data, _context) => {
        data.transformed = true;
        return data;
      };

      pluginSystem.transformers.push({
        name: 'test',
        transformers: { song: transformer },
      });

      const originalData = { title: 'Test Song' };
      const transformed = await pluginSystem.transformData(
        originalData,
        'song'
      );

      expect(transformed.transformed).toBe(true);
      expect(transformed.title).toBe('Test Song');
    });

    test('should provide plugin information', () => {
      const plugin = {
        name: 'test',
        version: '1.0.0',
        description: 'Test plugin',
        hooks: { beforeRequest: () => {} },
        middleware: async () => {},
        transformers: { song: async () => {} },
      };

      pluginSystem.registerPlugin('test', plugin);
      const info = pluginSystem.getPluginInfo('test');

      expect(info.name).toBe('test');
      expect(info.version).toBe('1.0.0');
      expect(info.description).toBe('Test plugin');
      expect(info.hooks).toContain('beforeRequest');
      expect(info.hasMiddleware).toBe(true);
      expect(info.hasTransformers).toBe(true);
    });

    test('should work with built-in plugins', () => {
      pluginSystem.registerPlugin('logging', loggingPlugin);
      pluginSystem.registerPlugin('analytics', analyticsPlugin);

      expect(pluginSystem.hasPlugin('logging')).toBe(true);
      expect(pluginSystem.hasPlugin('analytics')).toBe(true);
      expect(pluginSystem.getPlugins()).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    test('should work together - rate limiting with metrics', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 100,
        strategy: 'token-bucket',
      });
      const metrics = new MetricsCollector({ enabled: true });

      for (let i = 0; i < 5; i++) {
        await rateLimiter.waitForSlot();
        const startTime = Date.now();
        metrics.recordRequest({
          url: `https://example.com/test${i}`,
          startTime,
          endTime: Date.now(),
          success: true,
        });
      }

      const summary = metrics.getSummary();
      expect(summary.counters.totalRequests).toBe(5);
    });

    test('should work together - plugins with metrics', async () => {
      const pluginSystem = new PluginSystem();
      const metrics = new MetricsCollector({ enabled: true });

      // Create a custom plugin that records metrics
      const metricsPlugin = {
        name: 'metrics-plugin',
        hooks: {
          beforeRequest: async context => {
            context.startTime = Date.now();
          },
          afterRequest: async context => {
            metrics.recordRequest({
              url: context.url,
              startTime: context.startTime,
              endTime: Date.now(),
              success: context.success || true,
            });
          },
        },
      };

      pluginSystem.registerPlugin('metrics', metricsPlugin);

      await pluginSystem.executeHook('beforeRequest', {
        url: 'https://example.com',
      });
      await pluginSystem.executeHook('afterRequest', {
        url: 'https://example.com',
        success: true,
      });

      const summary = metrics.getSummary();
      expect(summary.counters.totalRequests).toBe(1);
      expect(summary.counters.successfulRequests).toBe(1);
    });
  });
});
