/**
 * Utility function to retry a function with exponential backoff
 * @param {Function} fn - Function to retry (should return a Promise)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry on 429)
 * @returns {Promise} - Promise that resolves/rejects based on fn result
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Default: retry on 429 (rate limit) or network errors
      return (
        error?.response?.status === 429 ||
        error?.code === "ECONNABORTED" ||
        error?.message?.includes("Network Error")
      );
    },
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exceeded max retries or error shouldn't be retried
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const retryAfter = error?.response?.headers?.["retry-after"];
      if (retryAfter) {
        delay = parseInt(retryAfter, 10) * 1000; // Convert seconds to milliseconds
      } else {
        delay = Math.min(delay * Math.pow(2, attempt), maxDelay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
