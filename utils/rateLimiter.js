// Advanced rate limiting with multiple strategies

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.adminAttempts = new Map();
    this.loginAttempts = new Map();
    
    // Cleanup old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    
    [this.attempts, this.adminAttempts, this.loginAttempts].forEach(store => {
      for (const [key, data] of store.entries()) {
        if (now > data.resetTime) {
          store.delete(key);
        }
      }
    });
  }

  // Genel API rate limiting
  checkApiRate(identifier, maxAttempts = 100, windowMs = 15 * 60 * 1000) {
    return this._checkRate(this.attempts, identifier, maxAttempts, windowMs);
  }

  // Admin işlemleri için daha sıkı rate limiting
  checkAdminRate(email, maxAttempts = 20, windowMs = 15 * 60 * 1000) {
    return this._checkRate(this.adminAttempts, email, maxAttempts, windowMs);
  }

  // Login denemelerini izleme
  checkLoginRate(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return this._checkRate(this.loginAttempts, identifier, maxAttempts, windowMs);
  }

  // Başarısız login sonrası progressive delay
  getLoginDelay(identifier) {
    const data = this.loginAttempts.get(identifier);
    if (!data || data.count <= 3) return 0;
    
    // Exponential backoff: 2^(attempts-3) seconds
    const delay = Math.min(Math.pow(2, data.count - 3), 300); // Max 5 minutes
    return delay * 1000; // milliseconds
  }

  // Suspicious activity detection
  detectSuspiciousActivity(identifier) {
    const data = this.attempts.get(identifier);
    if (!data) return false;
    
    // 1 dakikada 50'den fazla istek = suspicious
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = data.timestamps?.filter(t => t > oneMinuteAgo).length || 0;
    
    return recentRequests > 50;
  }

  // Internal rate check method
  _checkRate(store, identifier, maxAttempts, windowMs) {
    const now = Date.now();
    const userData = store.get(identifier) || { 
      count: 0, 
      resetTime: now + windowMs,
      timestamps: []
    };
    
    // Reset if window expired
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
      userData.timestamps = [];
    }
    
    userData.count++;
    userData.timestamps = userData.timestamps || [];
    userData.timestamps.push(now);
    
    // Keep only recent timestamps (last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    userData.timestamps = userData.timestamps.filter(t => t > oneHourAgo);
    
    store.set(identifier, userData);
    
    return {
      allowed: userData.count <= maxAttempts,
      count: userData.count,
      maxAttempts,
      resetTime: userData.resetTime,
      retryAfter: Math.ceil((userData.resetTime - now) / 1000),
      suspicious: this.detectSuspiciousActivity(identifier)
    };
  }

  // Block/unblock functionality
  block(identifier, durationMs = 24 * 60 * 60 * 1000) {
    const blockData = {
      count: 999999,
      resetTime: Date.now() + durationMs,
      blocked: true,
      timestamps: []
    };
    
    this.attempts.set(`blocked_${identifier}`, blockData);
  }

  unblock(identifier) {
    this.attempts.delete(`blocked_${identifier}`);
    this.adminAttempts.delete(identifier);
    this.loginAttempts.delete(identifier);
  }

  isBlocked(identifier) {
    const blockData = this.attempts.get(`blocked_${identifier}`);
    if (!blockData) return false;
    
    if (Date.now() > blockData.resetTime) {
      this.attempts.delete(`blocked_${identifier}`);
      return false;
    }
    
    return true;
  }

  // Get rate limit status
  getStatus(identifier) {
    const general = this.attempts.get(identifier);
    const admin = this.adminAttempts.get(identifier);
    const login = this.loginAttempts.get(identifier);
    
    return {
      general: general ? {
        count: general.count,
        resetTime: general.resetTime,
        retryAfter: Math.ceil((general.resetTime - Date.now()) / 1000)
      } : null,
      admin: admin ? {
        count: admin.count,
        resetTime: admin.resetTime,
        retryAfter: Math.ceil((admin.resetTime - Date.now()) / 1000)
      } : null,
      login: login ? {
        count: login.count,
        resetTime: login.resetTime,
        retryAfter: Math.ceil((login.resetTime - Date.now()) / 1000)
      } : null,
      blocked: this.isBlocked(identifier),
      suspicious: this.detectSuspiciousActivity(identifier)
    };
  }
}

// Global instance
const rateLimiter = new RateLimiter();

// Express middleware factory
export const createRateLimitMiddleware = (options = {}) => {
  const {
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    type = 'api',
    maxAttempts,
    windowMs,
    skipSuccessfulRequests = false,
    onLimitReached = (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    
    if (rateLimiter.isBlocked(key)) {
      return res.status(429).json({
        error: 'You have been temporarily blocked',
        code: 'TEMPORARILY_BLOCKED'
      });
    }

    let result;
    switch (type) {
      case 'admin':
        result = rateLimiter.checkAdminRate(key, maxAttempts, windowMs);
        break;
      case 'login':
        result = rateLimiter.checkLoginRate(key, maxAttempts, windowMs);
        break;
      default:
        result = rateLimiter.checkApiRate(key, maxAttempts, windowMs);
    }

    // Add headers
    res.set({
      'X-RateLimit-Limit': result.maxAttempts,
      'X-RateLimit-Remaining': Math.max(0, result.maxAttempts - result.count),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'X-RateLimit-RetryAfter': result.retryAfter
    });

    if (result.suspicious) {
      res.set('X-RateLimit-Suspicious', 'true');
    }

    if (!result.allowed) {
      return onLimitReached(req, res);
    }

    // Skip counting successful requests if configured
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Decrease count for successful requests
          const userData = rateLimiter.attempts.get(key);
          if (userData && userData.count > 0) {
            userData.count--;
          }
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
};

// Helper functions
export const rateLimit = rateLimiter.checkApiRate.bind(rateLimiter);
export const adminRateLimit = rateLimiter.checkAdminRate.bind(rateLimiter);
export const loginRateLimit = rateLimiter.checkLoginRate.bind(rateLimiter);
export const blockUser = rateLimiter.block.bind(rateLimiter);
export const unblockUser = rateLimiter.unblock.bind(rateLimiter);
export const isUserBlocked = rateLimiter.isBlocked.bind(rateLimiter);
export const getRateLimitStatus = rateLimiter.getStatus.bind(rateLimiter);

export default rateLimiter;