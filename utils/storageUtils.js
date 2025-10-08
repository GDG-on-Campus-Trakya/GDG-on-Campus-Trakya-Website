import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebase";
import {
  compressImage,
  validateImageFile,
  generateFileName,
} from "./imageUtils";
import { logger } from "./logger";

export const uploadImage = async (file, folder = "images", prefix = "") => {
  try {
    // Import auth here to avoid circular dependency
    const { auth } = await import("../firebase");

    if (!auth.currentUser) {
      throw new Error("Resim yüklemek için oturum açmanız gerekiyor.");
    }

    validateImageFile(file);

    const compressedFile = await compressImage(file);
    const fileName = generateFileName(file.name, prefix);
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // Use uploadBytesResumable for better reliability
    const uploadTask = uploadBytesResumable(storageRef, compressedFile, {
      contentType: compressedFile.type,
      customMetadata: {
        uploadedBy: auth.currentUser.uid,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          logger.error("Upload error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              path: uploadTask.snapshot.ref.fullPath,
              fileName: fileName,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    logger.error("Resim yükleme hatası:", error);
    throw error;
  }
};

export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    logger.error("Resim silme hatası:", error);
    throw error;
  }
};

export const StoragePaths = {
  EVENTS: "events",
  PROFILES: "profiles",
  SPONSORS: "sponsors",
  PROJECTS: "projects",
  RAFFLE_ANNOUNCEMENTS: "announcements", // For raffle results (socialUtils)
  CLUB_ANNOUNCEMENTS: "club-announcements", // For general club announcements
};
