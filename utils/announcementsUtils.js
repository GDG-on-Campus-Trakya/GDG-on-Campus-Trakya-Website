import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "./logger";
import { uploadImage, deleteImage } from "./storageUtils";

const ANNOUNCEMENTS_COLLECTION = "clubAnnouncements";

export const announcementsUtils = {
  /**
   * Create a new announcement
   */
  async createAnnouncement(announcementData) {
    try {
      const docRef = await addDoc(
        collection(db, ANNOUNCEMENTS_COLLECTION),
        {
          ...announcementData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPublished: announcementData.isPublished ?? true,
        }
      );

      logger.log("Announcement created with ID:", docRef.id);
      return {
        success: true,
        id: docRef.id,
        message: "Duyuru başarıyla oluşturuldu!",
      };
    } catch (error) {
      logger.error("Error creating announcement:", error);
      return {
        success: false,
        error: error.message,
        message: "Duyuru oluşturulurken hata oluştu!",
      };
    }
  },

  /**
   * Get announcements with optional filters
   */
  async getAnnouncements(filters = {}, options = {}) {
    try {
      const {
        isPublished = true,
        type = null,
      } = filters;

      const {
        limitCount = 20,
        startAfterDoc = null,
      } = options;

      let q = collection(db, ANNOUNCEMENTS_COLLECTION);
      
      // Fetch all announcements without any ordering to avoid index requirements
      const querySnapshot = await getDocs(q);

      // Apply filters and sorting in-memory to avoid composite index requirements
      let announcements = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Filter by published status
        if (isPublished !== null && data.isPublished !== isPublished) {
          return; // Skip this document
        }

        // Filter by type if specified
        if (type && data.type !== type) {
          return; // Skip this document
        }

        announcements.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        });
      });

      // Sort by createdAt descending (newest first) in-memory
      announcements.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      // Apply pagination in-memory
      let startIndex = 0;
      if (startAfterDoc) {
        const lastDocId = startAfterDoc.id;
        startIndex = announcements.findIndex(a => a.id === lastDocId) + 1;
      }
      
      const paginatedAnnouncements = announcements.slice(startIndex, startIndex + limitCount);
      const hasMore = startIndex + limitCount < announcements.length;

      // Create a pseudo last doc for pagination
      const lastDoc = paginatedAnnouncements.length > 0 
        ? { id: paginatedAnnouncements[paginatedAnnouncements.length - 1].id }
        : null;

      return {
        success: true,
        announcements: paginatedAnnouncements,
        lastDoc,
        hasMore,
      };
    } catch (error) {
      logger.error("Error fetching announcements:", error);
      return {
        success: false,
        announcements: [],
        error: error.message,
      };
    }
  },

  /**
   * Get a single announcement by ID
   */
  async getAnnouncementById(announcementId) {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Duyuru bulunamadı!",
        };
      }

      const announcement = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || null,
      };

      return {
        success: true,
        announcement,
      };
    } catch (error) {
      logger.error("Error fetching announcement:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update an announcement
   */
  async updateAnnouncement(announcementId, updateData) {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      logger.log("Announcement updated:", announcementId);
      return {
        success: true,
        message: "Duyuru başarıyla güncellendi!",
      };
    } catch (error) {
      logger.error("Error updating announcement:", error);
      return {
        success: false,
        error: error.message,
        message: "Duyuru güncellenirken hata oluştu!",
      };
    }
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId) {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

      // Get the announcement first to delete associated images
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Delete main image if exists
        if (data.imageUrl && data.imagePath) {
          try {
            await deleteImage(data.imagePath);
          } catch (imgError) {
            logger.error("Error deleting announcement image:", imgError);
            // Continue with announcement deletion even if image deletion fails
          }
        }
      }

      await deleteDoc(docRef);

      logger.log("Announcement deleted:", announcementId);
      return {
        success: true,
        message: "Duyuru başarıyla silindi!",
      };
    } catch (error) {
      logger.error("Error deleting announcement:", error);
      return {
        success: false,
        error: error.message,
        message: "Duyuru silinirken hata oluştu!",
      };
    }
  },

  /**
   * Toggle announcement publish status
   */
  async togglePublishStatus(announcementId, isPublished) {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

      await updateDoc(docRef, {
        isPublished: isPublished,
        updatedAt: serverTimestamp(),
      });

      logger.log("Announcement publish status updated:", announcementId);
      return {
        success: true,
        message: isPublished
          ? "Duyuru yayınlandı!"
          : "Duyuru taslağa alındı!",
      };
    } catch (error) {
      logger.error("Error toggling publish status:", error);
      return {
        success: false,
        error: error.message,
        message: "Durum güncellenirken hata oluştu!",
      };
    }
  },

  /**
   * Upload announcement image
   */
  async uploadAnnouncementImage(file, prefix = "") {
    try {
      const result = await uploadImage(file, "club-announcements", prefix);
      return {
        success: true,
        url: result.url,
        path: result.path,
        fileName: result.fileName,
      };
    } catch (error) {
      logger.error("Error uploading announcement image:", error);
      return {
        success: false,
        error: error.message,
        message: "Resim yüklenirken hata oluştu!",
      };
    }
  },

  /**
   * Get announcements stats
   */
  async getAnnouncementsStats() {
    try {
      const allAnnouncementsQuery = query(
        collection(db, ANNOUNCEMENTS_COLLECTION)
      );
      const allSnapshot = await getDocs(allAnnouncementsQuery);

      let totalAnnouncements = 0;
      let publishedAnnouncements = 0;
      let draftAnnouncements = 0;

      allSnapshot.forEach((doc) => {
        totalAnnouncements++;
        const data = doc.data();
        if (data.isPublished) {
          publishedAnnouncements++;
        } else {
          draftAnnouncements++;
        }
      });

      return {
        success: true,
        stats: {
          totalAnnouncements,
          publishedAnnouncements,
          draftAnnouncements,
        },
      };
    } catch (error) {
      logger.error("Error fetching announcements stats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
