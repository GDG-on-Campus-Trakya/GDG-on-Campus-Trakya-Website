import 'server-only';
import { getFirestore } from './firebaseAdmin';
import { logger } from './logger';
import {
  ROLES,
  EVENT_MANAGER_PAGES,
  hasPermission,
  canAccessPage
} from './roleConstants';

// Re-export shared constants and utilities
export { ROLES, EVENT_MANAGER_PAGES, hasPermission, canAccessPage };

// Server-side specific function
export const checkUserRoleServer = async (userEmail) => {
  if (!userEmail) return null;

  try {
    const db = getFirestore();
    if (!db) {
      logger.error('Firebase Admin not initialized');
      return null;
    }

    const adminRef = db.collection('admins').doc(userEmail);
    const adminSnap = await adminRef.get();

    if (adminSnap.exists) {
      const data = adminSnap.data();
      return data.role || ROLES.ADMIN;
    }

    return null;
  } catch (error) {
    logger.error("Error checking user role (server):", error);
    return null;
  }
};