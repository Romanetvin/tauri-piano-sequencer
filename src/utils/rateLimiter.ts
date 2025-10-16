/**
 * Rate limiter for AI generation requests
 * Implements token bucket algorithm for client-side rate limiting
 */

export interface RateLimitConfig {
  maxRequests: number; // Max requests in time window
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number | null; // Timestamp when limit resets
  cooldownSeconds: number; // Seconds remaining in cooldown
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10, // 10 requests per minute
  windowMs: 60000, // 1 minute
};

class RateLimiter {
  private requests: number[] = []; // Timestamps of requests
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.loadState();
  }

  /**
   * Load rate limit state from localStorage
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem('ai_rate_limit_state');
      if (stored) {
        const { requests } = JSON.parse(stored);
        // Only keep requests within the time window
        const now = Date.now();
        this.requests = requests.filter(
          (timestamp: number) => now - timestamp < this.config.windowMs
        );
      }
    } catch (e) {
      console.error('Failed to load rate limit state:', e);
      this.requests = [];
    }
  }

  /**
   * Save rate limit state to localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(
        'ai_rate_limit_state',
        JSON.stringify({ requests: this.requests })
      );
    } catch (e) {
      console.error('Failed to save rate limit state:', e);
    }
  }

  /**
   * Clean up old requests outside the time window
   */
  private cleanup(): void {
    const now = Date.now();
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    this.cleanup();
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Record a new request
   */
  recordRequest(): void {
    this.cleanup();
    this.requests.push(Date.now());
    this.saveState();
  }

  /**
   * Get current rate limit state
   */
  getState(): RateLimitState {
    this.cleanup();

    const isLimited = this.requests.length >= this.config.maxRequests;
    const remainingRequests = Math.max(
      0,
      this.config.maxRequests - this.requests.length
    );

    let resetTime: number | null = null;
    let cooldownSeconds = 0;

    if (isLimited && this.requests.length > 0) {
      // Oldest request + window = reset time
      const oldestRequest = Math.min(...this.requests);
      resetTime = oldestRequest + this.config.windowMs;
      cooldownSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    }

    return {
      isLimited,
      remainingRequests,
      resetTime,
      cooldownSeconds,
    };
  }

  /**
   * Reset rate limiter (for testing or manual reset)
   */
  reset(): void {
    this.requests = [];
    this.saveState();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

export function resetRateLimiter(): void {
  if (rateLimiterInstance) {
    rateLimiterInstance.reset();
  }
}
