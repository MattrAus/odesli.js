/**
 * Rate Limiter for Odesli API
 * Implements various rate limiting strategies
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10 // Default: 10 requests per window
    this.windowMs = options.windowMs || 60000 // Default: 1 minute window
    this.strategy = options.strategy || 'token-bucket' // token-bucket, leaky-bucket, sliding-window
    this.retryAfterMs = options.retryAfterMs || 1000 // Default retry delay
    
    // Token bucket specific
    this.tokens = this.maxRequests
    this.lastRefill = Date.now()
    
    // Sliding window specific
    this.requests = []
    
    // Leaky bucket specific
    this.queue = []
    this.processing = false
  }

  /**
   * Token Bucket Algorithm
   * Most efficient for burst handling
   */
  async tokenBucket() {
    while (true) {
      const now = Date.now()
      const timePassed = now - this.lastRefill
      const tokensToAdd = Math.floor(timePassed / this.windowMs) * this.maxRequests
      
      this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd)
      this.lastRefill = now
      
      if (this.tokens >= 1) {
        this.tokens--
        return true
      }
      
      // Calculate wait time
      const waitTime = this.windowMs - (timePassed % this.windowMs)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  /**
   * Leaky Bucket Algorithm
   * Good for smoothing out traffic
   */
  async leakyBucket() {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const resolve = this.queue.shift()
      resolve()
      await new Promise(resolve => setTimeout(resolve, this.windowMs / this.maxRequests))
    }
    
    this.processing = false
  }

  /**
   * Sliding Window Algorithm
   * Most accurate for rate limiting
   */
  async slidingWindow() {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart)
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    // Calculate wait time until next slot opens
    const oldestRequest = this.requests[0]
    const waitTime = oldestRequest + this.windowMs - now
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return this.slidingWindow()
  }

  /**
   * Main rate limit method
   */
  async waitForSlot() {
    switch (this.strategy) {
      case 'token-bucket':
        return this.tokenBucket()
      case 'leaky-bucket':
        return this.leakyBucket()
      case 'sliding-window':
        return this.slidingWindow()
      default:
        return this.tokenBucket()
    }
  }

  /**
   * Handle rate limit response from API
   */
  async handleRateLimitResponse(retryAfterSeconds) {
    const waitTime = (retryAfterSeconds || 60) * 1000
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    switch (this.strategy) {
      case 'token-bucket':
        return {
          available: this.tokens,
          max: this.maxRequests,
          used: this.maxRequests - this.tokens,
          refillRate: this.maxRequests / (this.windowMs / 1000)
        }
      case 'sliding-window':
        return {
          used: this.requests.length,
          max: this.maxRequests,
          windowMs: this.windowMs
        }
      case 'leaky-bucket':
        return {
          queued: this.queue.length,
          processing: this.processing,
          max: this.maxRequests
        }
    }
  }
}

module.exports = { RateLimiter } 