import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "./logger";
import {
  ROLES,
  EVENT_MANAGER_PAGES,
  hasPermission,
  canAccessPage
} from "./roleConstants";

// Re-export shared constants and utilities
export { ROLES, EVENT_MANAGER_PAGES, hasPermission, canAccessPage };

// Client-side specific function
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