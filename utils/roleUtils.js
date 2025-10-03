import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "./logger";

export const ROLES = {
  ADMIN: "admin",
  EVENT_MANAGER: "event_manager"
};

export const checkUserRole = async (userEmail) => {
  if (!userEmail) return null;
  
  try {
    const adminRef = doc(db, "admins", userEmail);
    const adminSnap = await getDoc(adminRef);
    
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      return data.role || ROLES.ADMIN;
    }
    
    return null;
  } catch (error) {
    logger.error("Error checking user role:", error);
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
  "/admin/event-stats",
  "/admin/quiz/host"
];

export const canAccessPage = (userRole, pagePath) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.EVENT_MANAGER) {
    return EVENT_MANAGER_PAGES.includes(pagePath);
  }
  return false;
};