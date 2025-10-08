"use client";
import { useState } from "react";
import Image from "next/image";
import { Calendar, User, Eye, EyeOff, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AnnouncementPostCard({ announcement, onEdit, onDelete, showAdminActions = false }) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "Tarih yok";
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy, HH:mm");
    } catch (error) {
      return "Tarih yok";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
    >
      {/* Image Section */}
      {announcement.imageUrl && !imageError && (
        <div className="relative w-full h-48 sm:h-64 bg-gray-900">
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
          {!announcement.isPublished && showAdminActions && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold">
              Taslak
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 sm:p-6">
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">
          {announcement.title}
        </h3>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(announcement.createdAt)}</span>
          </div>
          {announcement.authorName && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{announcement.authorName}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {announcement.description && (
          <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3">
            {announcement.description}
          </p>
        )}

        {/* Content Preview */}
        {announcement.content && (
          <div className="text-gray-400 text-sm line-clamp-4 mb-4 whitespace-pre-wrap">
            {announcement.content}
          </div>
        )}

        {/* Admin Actions */}
        {showAdminActions && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => onEdit && onEdit(announcement)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Düzenle
            </button>
            <button
              onClick={() => onDelete && onDelete(announcement.id)}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
