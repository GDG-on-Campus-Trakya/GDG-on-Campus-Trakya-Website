"use client";
import { useState, useRef } from "react";
import { uploadImage } from "../utils/storageUtils";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";

const ProfileImageUpload = ({
  onImageUpload,
  currentImageUrl = "",
  folder = "profiles",
  prefix = "",
  isEditing = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // Validate file size and type before upload
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Dosya boyutu 10MB'dan küçük olmalıdır.");
      }

      if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
        throw new Error("Sadece JPEG, PNG, WebP ve HEIC formatları desteklenir.");
      }

      const result = await uploadImage(file, folder, prefix);
      onImageUpload(result);
      toast.success("Profil fotoğrafı başarıyla güncellendi!");
    } catch (error) {
      logger.error("Profil fotoğrafı yükleme hatası:", error);

      // More specific error messages
      if (error.code === "storage/unauthorized") {
        toast.error(
          "Firebase Storage izin hatası. Lütfen yöneticiye başvurun."
        );
      } else if (error.code === "storage/unknown") {
        toast.error("Firebase Storage bağlantı hatası. Lütfen tekrar deneyin.");
      } else {
        toast.error(
          error.message || "Profil fotoğrafı yüklenirken hata oluştu"
        );
      }
    } finally {
      setUploading(false);
      // Clear file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleClick = () => {
    if (isEditing && !uploading) {
      fileInputRef.current?.click();
    }
  };

  if (!isEditing) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center text-sm transition-colors shadow-lg"
        title="Profil fotoğrafını değiştir"
      >
        {uploading ? "⏳" : "📷"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default ProfileImageUpload;
