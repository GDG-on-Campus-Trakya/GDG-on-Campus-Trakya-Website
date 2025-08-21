"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Calendar, User } from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";

export default function PostCard({ post, onPostClick, onDelete, showAdminActions = false }) {
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Initialize like state after user loads
  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user.uid));
    }
  }, [user, post.likes]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user || isLiking) return;

    setIsLiking(true);
    const result = await socialUtils.likePost(post.id, user.uid);

    if (result.success) {
      setIsLiked(result.action === "liked");
      setLikeCount(prev => result.action === "liked" ? prev + 1 : prev - 1);
    } else {
      toast.error("Beğeni işlemi başarısız!");
    }
    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!confirm("Bu postu silmek istediğinizden emin misiniz?")) return;

    const result = await socialUtils.deletePost(post.id);
    if (result.success) {
      toast.success("Post başarıyla silindi!");
      onDelete && onDelete(post.id);
    } else {
      toast.error("Post silinirken hata oluştu!");
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      toast.success(post.isHidden ? "Post gösterildi!" : "Post gizlendi!");
      onDelete && onDelete(post.id);
    } else {
      toast.error("İşlem başarısız!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
      {/* User Info Header - Instagram Style */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500">
            {post.userPhoto || (post.userId === user?.uid && user?.photoURL) ? (
              <Image
                src={post.userPhoto || user?.photoURL}
                alt={post.userName || post.userEmail}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-semibold text-sm">
                {post.userName || post.userEmail?.split('@')[0]}
              </h3>
              {post.eventName && (
                <span className="text-blue-400 text-xs">• {post.eventName}</span>
              )}
            </div>
            <p className="text-gray-400 text-xs">{formatDate(post.timestamp)}</p>
          </div>
        </div>

        {/* Admin Actions */}
        {showAdminActions && (
          <div className="flex space-x-1">
            <button
              onClick={handleHide}
              className={`px-3 py-1 rounded-full text-xs ${
                post.isHidden 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {post.isHidden ? "Göster" : "Gizle"}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-3 py-1 rounded-full text-xs hover:bg-red-700"
            >
              Sil
            </button>
          </div>
        )}
      </div>

      {/* Post Image */}
      <div 
        className="relative cursor-pointer"
        onClick={() => onPostClick && onPostClick(post)}
      >
        <Image
          src={post.imageUrl}
          alt={post.description || "Post image"}
          width={600}
          height={400}
          className="w-full h-64 sm:h-80 lg:h-96 object-cover hover:opacity-95 transition-opacity"
          priority={false}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        
        {/* Hidden overlay */}
        {post.isHidden && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <span className="text-white font-semibold">Bu post gizlenmiş</span>
          </div>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? "text-red-500" 
                  : "text-gray-400 hover:text-red-500"
              } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Heart 
                className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} 
              />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            <button 
              onClick={() => onPostClick && onPostClick(post)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </button>
          </div>

          {/* Admin Badge */}
          {post.isAdminPost && (
            <div className="bg-green-600 px-2 py-1 rounded-full">
              <span className="text-white text-xs font-medium">Admin</span>
            </div>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <div className="text-[#d1d1e0] text-sm leading-relaxed">
            <span className="font-semibold text-white">
              {post.userName || post.userEmail}
            </span>{" "}
            {post.description}
          </div>
        )}
      </div>
    </div>
  );
}