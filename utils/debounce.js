/**
 * Debounce function - delays execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function - ensures function is called at most once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

/**
 * Promise timeout wrapper - rejects promise if it takes too long
 * @param {Promise} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} errorMessage - Custom error message
 * @returns {Promise} Promise that rejects on timeout
 */
export const withTimeout = (promise, ms = 10000, errorMessage = 'İşlem zaman aşımına uğradı') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
};

/**
 * Detect if browser is Safari
 * @returns {boolean} True if Safari browser
 */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
