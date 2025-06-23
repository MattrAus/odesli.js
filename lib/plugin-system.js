/**
 * Plugin System for Odesli API
 * Allows extensible functionality through plugins
 */

class PluginSystem {
  constructor() {
    this.plugins = new Map()
    this.hooks = new Map()
    this.middleware = []
    this.transformers = []
    
    // Register built-in hooks
    this.registerHook('beforeRequest', [])
    this.registerHook('afterRequest', [])
    this.registerHook('beforeResponse', [])
    this.registerHook('afterResponse', [])
    this.registerHook('onError', [])
    this.registerHook('onRateLimit', [])
    this.registerHook('onCacheHit', [])
    this.registerHook('onCacheMiss', [])
  }

  /**
   * Register a plugin
   */
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`)
    }

    // Validate plugin structure
    if (typeof plugin !== 'object' || plugin === null) {
      throw new Error(`Plugin "${name}" must be an object`)
    }

    // Initialize plugin if it has an init method
    if (typeof plugin.init === 'function') {
      plugin.init()
    }

    this.plugins.set(name, plugin)

    // Register hooks if plugin provides them
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        this.registerHookHandler(hookName, handler)
      })
    }

    // Register middleware if plugin provides it
    if (plugin.middleware) {
      this.middleware.push({
        name,
        middleware: plugin.middleware
      })
    }

    // Register transformers if plugin provides them
    if (plugin.transformers) {
      this.transformers.push({
        name,
        transformers: plugin.transformers
      })
    }

    return this
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(name) {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`)
    }

    // Cleanup plugin if it has a cleanup method
    if (typeof plugin.cleanup === 'function') {
      plugin.cleanup()
    }

    // Remove middleware
    this.middleware = this.middleware.filter(m => m.name !== name)

    // Remove transformers
    this.transformers = this.transformers.filter(t => t.name !== name)

    // Remove hook handlers
    this.hooks.forEach((handlers, hookName) => {
      this.hooks.set(hookName, handlers.filter(h => h.pluginName !== name))
    })

    this.plugins.delete(name)
    return this
  }

  /**
   * Register a hook
   */
  registerHook(name, defaultHandlers = []) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, defaultHandlers)
    }
    return this
  }

  /**
   * Register a hook handler
   */
  registerHookHandler(hookName, handler, pluginName = null) {
    if (!this.hooks.has(hookName)) {
      this.registerHook(hookName)
    }

    const handlers = this.hooks.get(hookName)
    handlers.push({
      handler,
      pluginName,
      priority: handler.priority || 0
    })

    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority)
    
    return this
  }

  /**
   * Execute hook handlers
   */
  async executeHook(hookName, context = {}) {
    const handlers = this.hooks.get(hookName) || []
    
    for (const { handler } of handlers) {
      try {
        if (typeof handler === 'function') {
          await handler(context)
        }
      } catch (error) {
        // Prevent infinite recursion by only calling onError if it's not already an onError hook
        if (hookName !== 'onError') {
          try {
            await this.executeHook('onError', { error, hookName, context })
          } catch (errorHookError) {
            // If error hook fails, just log it to prevent infinite loops
            console.error('Error in onError hook:', errorHookError.message)
          }
        } else {
          // If we're already in an onError hook, just log the error
          console.error('Error in onError hook:', error.message)
        }
      }
    }
  }

  /**
   * Execute middleware chain
   */
  async executeMiddleware(context, next) {
    let index = 0

    const executeNext = async () => {
      if (index >= this.middleware.length) {
        return await next()
      }

      const { middleware } = this.middleware[index++]
      return await middleware(context, executeNext)
    }

    return await executeNext()
  }

  /**
   * Transform data through all transformers
   */
  async transformData(data, type, context = {}) {
    let transformedData = data

    for (const { transformers } of this.transformers) {
      if (transformers[type]) {
        try {
          transformedData = await transformers[type](transformedData, context)
        } catch (error) {
          await this.executeHook('onError', { error, type, context })
        }
      }
    }

    return transformedData
  }

  /**
   * Get plugin by name
   */
  getPlugin(name) {
    return this.plugins.get(name)
  }

  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.keys())
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(name) {
    return this.plugins.has(name)
  }

  /**
   * Get plugin info
   */
  getPluginInfo(name) {
    const plugin = this.plugins.get(name)
    if (!plugin) return null

    return {
      name,
      hooks: Object.keys(plugin.hooks || {}),
      hasMiddleware: !!plugin.middleware,
      hasTransformers: !!plugin.transformers,
      version: plugin.version,
      description: plugin.description
    }
  }
}

/**
 * Example plugins
 */

// Logging Plugin
const loggingPlugin = {
  name: 'logging',
  version: '1.0.0',
  description: 'Adds comprehensive logging to API requests',
  
  init() {
    console.log('Logging plugin initialized')
  },

  hooks: {
    beforeRequest: async (context) => {
      console.log(`[${new Date().toISOString()}] Request: ${context.url}`)
    },

    afterRequest: async (context) => {
      console.log(`[${new Date().toISOString()}] Response: ${context.statusCode} (${context.responseTime}ms)`)
    },

    onError: async (context) => {
      console.error(`[${new Date().toISOString()}] Error: ${context.error.message}`)
    }
  }
}

// Caching Plugin
const cachingPlugin = {
  name: 'caching',
  version: '1.0.0',
  description: 'Enhanced caching with TTL and invalidation',
  
  init() {
    this.cache = new Map()
    this.ttl = 5 * 60 * 1000 // 5 minutes
  },

  hooks: {
    beforeRequest: async (context) => {
      const cached = this.cache.get(context.url)
      if (cached && Date.now() - cached.timestamp < this.ttl) {
        context.cached = true
        context.response = cached.data
        return
      }
    },

    afterResponse: async (context) => {
      if (!context.cached && context.response) {
        this.cache.set(context.url, {
          data: context.response,
          timestamp: Date.now()
        })
      }
    }
  },

  cleanup() {
    this.cache.clear()
  }
}

// Analytics Plugin
const analyticsPlugin = {
  name: 'analytics',
  version: '1.0.0',
  description: 'Tracks usage analytics and metrics',
  
  init() {
    this.metrics = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      responseTimes: []
    }
  },

  hooks: {
    beforeRequest: async (context) => {
      context.startTime = Date.now()
      this.metrics.requests++
    },

    afterResponse: async (context) => {
      const responseTime = Date.now() - context.startTime
      this.metrics.responseTimes.push(responseTime)
      
      if (context.cached) {
        this.metrics.cacheHits++
      }
    },

    onError: async (context) => {
      this.metrics.errors++
    }
  },

  getMetrics() {
    return {
      ...this.metrics,
      avgResponseTime: this.metrics.responseTimes.length > 0
        ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
        : 0,
      cacheHitRate: this.metrics.requests > 0
        ? (this.metrics.cacheHits / this.metrics.requests) * 100
        : 0
    }
  }
}

// Response Transformer Plugin
const responseTransformerPlugin = {
  name: 'response-transformer',
  version: '1.0.0',
  description: 'Transforms API responses into different formats',
  
  transformers: {
    'song': async (data, context) => {
      // Transform song data
      return {
        ...data,
        formattedTitle: data.title?.toUpperCase(),
        artistCount: data.artist?.length || 0,
        hasThumbnail: !!data.thumbnail
      }
    },

    'album': async (data, context) => {
      // Transform album data
      return {
        ...data,
        formattedTitle: data.title?.toUpperCase(),
        artistCount: data.artist?.length || 0,
        hasThumbnail: !!data.thumbnail
      }
    }
  }
}

module.exports = {
  PluginSystem,
  loggingPlugin,
  cachingPlugin,
  analyticsPlugin,
  responseTransformerPlugin
} 