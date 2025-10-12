/**
 * Shared role constants and permission utilities
 * Used by both client-side (roleUtils.js) and server-side (roleUtilsServer.js)
 */

export const ROLES = {
  ADMIN: "admin",
  EVENT_MANAGER: "event_manager"
};

export const EVENT_MANAGER_PAGES = [
  "/admin/users",
  "/admin/registrations",
  "/admin/qr-verification",
  "/admin/raffles",
  "/admin/social",
  "/admin/event-stats",
  "/admin/quiz/host",
  "/admin/table-assignment"
];

/**
 * Check if user has required permission
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role for action
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (userRole, requiredRole) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.EVENT_MANAGER && requiredRole === ROLES.EVENT_MANAGER) return true;
  return false;
};

/**
 * Check if user can access a specific page
 * @param {string} userRole - User's role
 * @param {string} pagePath - Page path to check
 * @returns {boolean} True if user can access the page
 */
export const canAccessPage = (userRole, pagePath) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.EVENT_MANAGER) {
    return EVENT_MANAGER_PAGES.includes(pagePath);
  }
  return false;
};
