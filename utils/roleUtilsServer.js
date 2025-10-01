import 'server-only';
import { getFirestore } from './firebaseAdmin';

export const ROLES = {
  ADMIN: "admin",
  EVENT_MANAGER: "event_manager"
};

export const checkUserRoleServer = async (userEmail) => {
  if (!userEmail) return null;

  try {
    const db = getFirestore();
    if (!db) {
      console.error('Firebase Admin not initialized');
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
    console.error("Error checking user role (server):", error);
    return null;
  }
};

export const hasPermission = (userRole, requiredRole) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.EVENT_MANAGER && requiredRole === ROLES.EVENT_MANAGER) return true;
  return false;
};

export const EVENT_MANAGER_PAGES = [
  "/admin/users",
  "/admin/registrations",
  "/admin/qr-verification",
  "/admin/raffles",
  "/admin/social",
  "/admin/event-stats"
];

export const canAccessPage = (userRole, pagePath) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.EVENT_MANAGER) {
    return EVENT_MANAGER_PAGES.includes(pagePath);
  }
  return false;
};