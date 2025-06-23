/**
 * Metrics Collection System for Odesli API
 * Tracks performance, usage, and error metrics
 */

class MetricsCollector {
  constructor(options = {}) {
    this.enabled = options.enabled !== false
    this.retentionMs = options.retentionMs || 24 * 60 * 60 * 1000 // 24 hours
    this.maxDataPoints = options.maxDataPoints || 10000
    
    // Metrics storage
    this.metrics = {
      requests: [],
      errors: [],
      cache: {
        hits: 0,
        misses: 0,
        size: 0
      },
      performance: {
        responseTimes: [],
        throughput: []
      },
      rateLimits: {
        hits: 0,
        delays: []
      }
    }
    
    // Real-time counters
    this.counters = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0
    }
    
    // Cleanup interval
    if (this.enabled) {
      const interval = setInterval(() => this.cleanup(), 60000); // Clean up every minute
      interval.unref();
    }
  }

  /**
   * Record a request
   */
  recordRequest(options = {}) {
    if (!this.enabled) return
    
    const {
      url,
      method = 'GET',
      startTime = Date.now(),
      endTime,
      success = true,
      statusCode,
      error,
      responseTime,
      platform,
      country,
      cacheHit = false
    } = options

    const request = {
      timestamp: startTime,
      url,
      method,
      success,
      statusCode,
      error: error?.message,
      responseTime: endTime ? endTime - startTime : responseTime,
      platform,
      country,
      cacheHit
    }

    this.metrics.requests.push(request)
    this.counters.totalRequests++
    
    if (success) {
      this.counters.successfulRequests++
    } else {
      this.counters.failedRequests++
    }

    if (cacheHit) {
      this.counters.cacheHits++
      this.metrics.cache.hits++
    } else {
      this.counters.cacheMisses++
      this.metrics.cache.misses++
    }

    // Record performance metrics
    if (request.responseTime) {
      this.metrics.performance.responseTimes.push({
        timestamp: startTime,
        responseTime: request.responseTime
      })
    }
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    if (!this.enabled) return
    
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      ...context
    }

    this.metrics.errors.push(errorRecord)
  }

  /**
   * Record rate limit hit
   */
  recordRateLimit(delayMs) {
    if (!this.enabled) return
    
    this.counters.rateLimitHits++
    this.metrics.rateLimits.hits++
    this.metrics.rateLimits.delays.push({
      timestamp: Date.now(),
      delayMs
    })
  }

  /**
   * Update cache metrics
   */
  updateCacheMetrics(size) {
    if (!this.enabled) return
    
    this.metrics.cache.size = size
  }

  /**
   * Get current metrics summary
   */
  getSummary() {
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour window
    const recentRequests = this.metrics.requests.filter(
      req => now - req.timestamp < windowMs
    )

    const recentErrors = this.metrics.errors.filter(
      err => now - err.timestamp < windowMs
    )

    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / recentRequests.length
      : 0

    const successRate = this.counters.totalRequests > 0
      ? this.counters.successfulRequests / this.counters.totalRequests
      : 1

    const cacheHitRate = (this.counters.cacheHits + this.counters.cacheMisses) > 0
      ? this.counters.cacheHits / (this.counters.cacheHits + this.counters.cacheMisses)
      : 0

    return {
      counters: { ...this.counters },
      recent: {
        requests: recentRequests.length,
        errors: recentErrors.length,
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerMinute: Math.round(recentRequests.length / 60)
      },
      rates: {
        successRate: Math.round(successRate * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        errorRate: Math.round((1 - successRate) * 100) / 100
      },
      cache: { ...this.metrics.cache },
      rateLimits: {
        hits: this.counters.rateLimitHits,
        avgDelay: this.metrics.rateLimits.delays.length > 0
          ? Math.round(this.metrics.rateLimits.delays.reduce((sum, d) => sum + d.delayMs, 0) / this.metrics.rateLimits.delays.length)
          : 0
      }
    }
  }

  /**
   * Get detailed metrics for analysis
   */
  getDetailedMetrics(options = {}) {
    const {
      startTime = Date.now() - this.retentionMs,
      endTime = Date.now(),
      groupBy = 'hour' // hour, minute, platform, country
    } = options

    const filteredRequests = this.metrics.requests.filter(
      req => req.timestamp >= startTime && req.timestamp <= endTime
    )

    switch (groupBy) {
      case 'hour':
        return this.groupByHour(filteredRequests)
      case 'minute':
        return this.groupByMinute(filteredRequests)
      case 'platform':
        return this.groupByPlatform(filteredRequests)
      case 'country':
        return this.groupByCountry(filteredRequests)
      default:
        return filteredRequests
    }
  }

  /**
   * Group requests by hour
   */
  groupByHour(requests) {
    const groups = {}
    
    requests.forEach(req => {
      const hour = new Date(req.timestamp).toISOString().slice(0, 13) + ':00:00.000Z'
      if (!groups[hour]) {
        groups[hour] = {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        }
      }
      
      groups[hour].requests++
      if (!req.success) groups[hour].errors++
      if (req.responseTime) {
        groups[hour].totalResponseTime += req.responseTime
        groups[hour].avgResponseTime = groups[hour].totalResponseTime / groups[hour].requests
      }
    })
    
    return groups
  }

  /**
   * Group requests by platform
   */
  groupByPlatform(requests) {
    const groups = {}
    
    requests.forEach(req => {
      const platform = req.platform || 'unknown'
      if (!groups[platform]) {
        groups[platform] = {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        }
      }
      
      groups[platform].requests++
      if (!req.success) groups[platform].errors++
      if (req.responseTime) {
        groups[platform].totalResponseTime += req.responseTime
        groups[platform].avgResponseTime = groups[platform].totalResponseTime / groups[platform].requests
      }
    })
    
    return groups
  }

  groupByMinute(requests) {
    const groups = {}
    
    requests.forEach(req => {
      const minute = new Date(req.timestamp).toISOString().slice(0, 16) + ':00.000Z'
      if (!groups[minute]) {
        groups[minute] = {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        }
      }
      
      groups[minute].requests++
      if (!req.success) groups[minute].errors++
      if (req.responseTime) {
        groups[minute].totalResponseTime += req.responseTime
        groups[minute].avgResponseTime = groups[minute].totalResponseTime / groups[minute].requests
      }
    })
    
    return groups
  }

  groupByCountry(requests) {
    const groups = {}
    
    requests.forEach(req => {
      const country = req.country || 'unknown'
      if (!groups[country]) {
        groups[country] = {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        }
      }
      
      groups[country].requests++
      if (!req.success) groups[country].errors++
      if (req.responseTime) {
        groups[country].totalResponseTime += req.responseTime
        groups[country].avgResponseTime = groups[country].totalResponseTime / groups[country].requests
      }
    })
    
    return groups
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const cutoff = Date.now() - this.retentionMs
    
    this.metrics.requests = this.metrics.requests.filter(req => req.timestamp > cutoff)
    this.metrics.errors = this.metrics.errors.filter(err => err.timestamp > cutoff)
    this.metrics.performance.responseTimes = this.metrics.performance.responseTimes.filter(
      perf => perf.timestamp > cutoff
    )
    this.metrics.rateLimits.delays = this.metrics.rateLimits.delays.filter(
      delay => delay.timestamp > cutoff
    )

    // Limit data points
    if (this.metrics.requests.length > this.maxDataPoints) {
      this.metrics.requests = this.metrics.requests.slice(-this.maxDataPoints)
    }
    if (this.metrics.errors.length > this.maxDataPoints) {
      this.metrics.errors = this.metrics.errors.slice(-this.maxDataPoints)
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      requests: [],
      errors: [],
      cache: { hits: 0, misses: 0, size: 0 },
      performance: { responseTimes: [], throughput: [] },
      rateLimits: { hits: 0, delays: [] }
    }
    this.counters = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0
    }
  }

  /**
   * Export metrics for external systems
   */
  export() {
    return {
      summary: this.getSummary(),
      detailed: this.getDetailedMetrics(),
      raw: {
        metrics: this.metrics,
        counters: this.counters
      }
    }
  }
}

module.exports = { MetricsCollector } 