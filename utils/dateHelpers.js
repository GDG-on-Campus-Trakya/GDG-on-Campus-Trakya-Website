/**
 * Date and timestamp utility functions
 */

/**
 * Convert Firestore timestamp to JavaScript Date
 * @param {*} timestamp - Firestore Timestamp or Date object
 * @returns {Date} JavaScript Date object
 */
export const toDate = (timestamp) => {
  if (!timestamp) return new Date(0);

  // If it has toDate() method (Firestore Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // If it's already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a string or number, try to parse
  return new Date(timestamp);
};

/**
 * Sort array of items by timestamp field
 * @param {Array} items - Array of objects to sort
 * @param {string} field - Field name containing timestamp (default: 'timestamp')
 * @param {string} order - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted array
 */
export const sortByTimestamp = (items, field = 'timestamp', order = 'desc') => {
  return [...items].sort((a, b) => {
    const aTime = toDate(a[field]);
    const bTime = toDate(b[field]);

    return order === 'desc' ? bTime - aTime : aTime - bTime;
  });
};

/**
 * Compare two timestamps
 * @param {*} timestamp1 - First timestamp
 * @param {*} timestamp2 - Second timestamp
 * @returns {number} Negative if timestamp1 < timestamp2, positive if timestamp1 > timestamp2, 0 if equal
 */
export const compareTimestamps = (timestamp1, timestamp2) => {
  const date1 = toDate(timestamp1);
  const date2 = toDate(timestamp2);
  return date1 - date2;
};

/**
 * Format timestamp to readable string
 * @param {*} timestamp - Timestamp to format
 * @param {string} locale - Locale string (default: 'tr-TR')
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, locale = 'tr-TR') => {
  const date = toDate(timestamp);
  return date.toLocaleString(locale);
};
