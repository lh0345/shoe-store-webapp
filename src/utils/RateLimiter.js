/* RateLimiter.js - Rate limiting utility for login protection */
export class RateLimiter {
  constructor(brandSlug = 'store') {
    this.brandSlug = brandSlug;
    this.attemptsKey = `${brandSlug}_login_attempts`;
    this.lockoutsKey = `${brandSlug}_account_lockouts`;

    // Configuration
    this.maxAttempts = 5; // Max failed attempts before lockout
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.attemptWindow = 30 * 60 * 1000; // 30 minutes window for attempts

    // Progressive delays (in seconds)
    this.delays = [0, 5, 15, 60, 300]; // 0s, 5s, 15s, 1min, 5min
  }

  /**
   * Record a failed login attempt
   * @param {string} identifier - Username or IP
   */
  recordFailedAttempt(identifier) {
    const attempts = this.getAttempts(identifier);
    const now = Date.now();

    // Clean old attempts outside the window
    attempts.attempts = attempts.attempts.filter(
      (attempt) => now - attempt.timestamp < this.attemptWindow
    );

    // Add new attempt
    attempts.attempts.push({
      timestamp: now,
      identifier: identifier,
    });

    // Save updated attempts
    this.saveAttempts(identifier, attempts);
  }

  /**
   * Check if an identifier is currently rate limited
   * @param {string} identifier - Username or IP
   * @returns {Object} - {limited: boolean, waitTime: number, reason: string}
   */
  isRateLimited(identifier) {
    const attempts = this.getAttempts(identifier);
    const lockout = this.getLockout(identifier);
    const now = Date.now();

    // Check if account is locked out
    if (lockout && lockout.lockedUntil > now) {
      const waitTime = Math.ceil((lockout.lockedUntil - now) / 1000);
      return {
        limited: true,
        waitTime: waitTime,
        reason: 'Account temporarily locked due to too many failed attempts',
      };
    }

    // Clean old attempts
    attempts.attempts = attempts.attempts.filter(
      (attempt) => now - attempt.timestamp < this.attemptWindow
    );

    const attemptCount = attempts.attempts.length;

    // Check if we've exceeded max attempts
    if (attemptCount >= this.maxAttempts) {
      // Lock the account
      this.lockAccount(identifier);
      const waitTime = Math.ceil(this.lockoutDuration / 1000);
      return {
        limited: true,
        waitTime: waitTime,
        reason: 'Too many failed attempts. Account locked for security.',
      };
    }

    // Check progressive delay
    if (attemptCount > 0 && attemptCount < this.delays.length) {
      const delaySeconds = this.delays[attemptCount];
      if (delaySeconds > 0) {
        return {
          limited: true,
          waitTime: delaySeconds,
          reason: `Too many recent failed attempts. Please wait ${delaySeconds} seconds before trying again.`,
        };
      }
    }

    return { limited: false, waitTime: 0, reason: '' };
  }

  /**
   * Clear failed attempts for an identifier (on successful login)
   * @param {string} identifier - Username or IP
   */
  clearAttempts(identifier) {
    const attempts = this.getAttempts(identifier);
    attempts.attempts = [];
    this.saveAttempts(identifier, attempts);

    // Also clear any lockout
    this.clearLockout(identifier);
  }

  /**
   * Get attempts for an identifier
   * @param {string} identifier
   * @returns {Object} - {attempts: Array}
   */
  getAttempts(identifier) {
    try {
      const key = `${this.attemptsKey}_${identifier}`;
      const data = localStorage.getItem(key);
      const result = data ? JSON.parse(data) : { attempts: [] };
      return result;
    } catch (error) {
      console.error('Failed to load attempts:', error);
      return { attempts: [] };
    }
  }

  /**
   * Save attempts for an identifier
   * @param {string} identifier
   * @param {Object} attempts
   */
  saveAttempts(identifier, attempts) {
    try {
      const key = `${this.attemptsKey}_${identifier}`;
      localStorage.setItem(key, JSON.stringify(attempts));
    } catch (error) {
      console.error('Failed to save attempts:', error);
    }
  }

  /**
   * Lock an account
   * @param {string} identifier
   */
  lockAccount(identifier) {
    const lockout = {
      identifier: identifier,
      lockedUntil: Date.now() + this.lockoutDuration,
      lockedAt: Date.now(),
    };

    try {
      const key = `${this.lockoutsKey}_${identifier}`;
      localStorage.setItem(key, JSON.stringify(lockout));
    } catch (error) {
      console.error('Failed to save lockout:', error);
    }
  }

  /**
   * Get lockout status for an identifier
   * @param {string} identifier
   * @returns {Object|null}
   */
  getLockout(identifier) {
    try {
      const key = `${this.lockoutsKey}_${identifier}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load lockout:', error);
      return null;
    }
  }

  /**
   * Clear lockout for an identifier
   * @param {string} identifier
   */
  clearLockout(identifier) {
    try {
      const key = `${this.lockoutsKey}_${identifier}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear lockout:', error);
    }
  }

  /**
   * Clean up expired lockouts and old attempts
   */
  cleanup() {
    const now = Date.now();

    // Clean up expired lockouts
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.lockoutsKey)) {
          const lockout = this.getLockout(key.replace(`${this.lockoutsKey}_`, ''));
          if (lockout && lockout.lockedUntil <= now) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup lockouts:', error);
    }

    // Clean up old attempts (this is done per-identifier when accessed)
    // But we could add global cleanup here if needed
  }

  /**
   * Get statistics for monitoring
   * @returns {Object} - Statistics about rate limiting
   */
  getStats() {
    const stats = {
      totalLockouts: 0,
      activeLockouts: 0,
      totalAttempts: 0,
      recentAttempts: 0,
    };

    const now = Date.now();
    const recentWindow = 60 * 60 * 1000; // 1 hour

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.lockoutsKey)) {
          stats.totalLockouts++;
          const lockout = this.getLockout(key.replace(`${this.lockoutsKey}_`, ''));
          if (lockout && lockout.lockedUntil > now) {
            stats.activeLockouts++;
          }
        } else if (key.startsWith(this.attemptsKey)) {
          const attempts = this.getAttempts(key.replace(`${this.attemptsKey}_`, ''));
          stats.totalAttempts += attempts.attempts.length;
          stats.recentAttempts += attempts.attempts.filter(
            (a) => now - a.timestamp < recentWindow
          ).length;
        }
      });
    } catch (error) {
      console.error('Failed to get stats:', error);
    }

    return stats;
  }

  /**
   * Clear all rate limiting data (admin function)
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.attemptsKey) || key.startsWith(this.lockoutsKey)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear all rate limiting data:', error);
      return false;
    }
  }
}
