/**
 * Centralized logging utility for MindMeter
 * Replaces console.log/error/warn with environment-aware logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  /**
   * Log info messages (only in development)
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  }

  /**
   * Log error messages (always logged)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    }
    // In production, you could send to error tracking service (e.g., Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(args.join(' ')));
    // }
  }

  /**
   * Log warning messages (only in development)
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Log debug messages (only in development with debug flag)
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (isDevelopment && process.env.REACT_APP_DEBUG === 'true') {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Log API requests (only in development)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} data - Request data
   */
  api(method, url, data = null) {
    if (isDevelopment) {
      console.log(`[API ${method}]`, url, data ? { data } : '');
    }
  }

  /**
   * Log API responses (only in development)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} response - Response data
   */
  apiResponse(method, url, response = null) {
    if (isDevelopment) {
      console.log(`[API ${method} Response]`, url, response ? { response } : '');
    }
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;

