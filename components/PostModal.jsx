"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Heart,
  MessageCircle,
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function PostModal({
  post,
  isOpen,
  onClose,
  onDelete,
  showAdminActions = false,
}) {
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(
    post?.likes?.includes(user?.uid) || false
  );
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [postAuthorProfile, setPostAuthorProfile] = useState(null);

  useEffect(() => {
    if (post) {
      setIsLiked(post.likes?.includes(user?.uid) || false);
      setLikeCount(post.likeCount || 0);
      loadComments();
      loadPostAuthorProfile();
    }
    if (user) {
      loadUserProfile();
    }
  }, [post, user?.uid]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfileData(userDoc.data());
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
  };

  const loadPostAuthorProfile = async () => {
    if (post?.userId) {
      try {
        const userDoc = await getDoc(doc(db, "users", post.userId));
        if (userDoc.exists()) {
          setPostAuthorProfile(userDoc.data());
        } else {
          setPostAuthorProfile(null);
        }
      } catch (error) {
        console.error("Error loading post author profile:", error);
      }
    }
  };

  const loadComments = async () => {
    if (!post?.id) return;

    setIsLoadingComments(true);
    const result = await socialUtils.getComments(post.id);

    if (result.success) {
      setComments(result.comments);
    } else {
      toast.error("Yorumlar yüklenirken hata oluştu!");
    }
    setIsLoadingComments(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    const result = await socialUtils.likePost(post.id, user.uid);

    if (result.success) {
      setIsLiked(result.action === "liked");
      setLikeCount((prev) => (result.action === "liked" ? prev + 1 : prev - 1));
    } else {
      toast.error("Beğeni işlemi başarısız!");
    }
    setIsLiking(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isAddingComment) return;

    setIsAddingComment(true);
    const result = await socialUtils.addComment(
      post.id,
      user.uid,
      user.email,
      userProfileData?.name || user.displayName || user.email,
      userProfileData?.photoURL || user.photoURL,
      newComment
    );

    if (result.success) {
      const newCommentData = { 
        ...result.comment, 
        timestamp: new Date(),
        userName: userProfileData?.name || user.displayName || user.email,
        userPhoto: userProfileData?.photoURL || user.photoURL,
      };
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
      toast.success("Yorum eklendi!");
    } else {
      toast.error("Yorum eklenirken hata oluştu!");
    }
    setIsAddingComment(false);
  };

  const handleDelete = async () => {
    if (!confirm("Bu postu silmek istediğinizden emin misiniz?")) return;

    const result = await socialUtils.deletePost(post.id);
    if (result.success) {
      toast.success("Post başarıyla silindi!");
      onDelete && onDelete(post.id);
      onClose();
    } else {
      toast.error("Post silinirken hata oluştu!");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;

    const result = await socialUtils.deleteComment(commentId, post.id);
    if (result.success) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Yorum başarıyla silindi!");
    } else {
      toast.error("Yorum silinirken hata oluştu!");
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      toast.success(post.isHidden ? "Post gösterildi!" : "Post gizlendi!");
      onDelete && onDelete(post.id);
      onClose();
    } else {
      toast.error("İşlem başarısız!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Mobile Layout - Instagram Style */}
      <div className="md:hidden w-full h-full flex flex-col">
        {/* Header - Mobile */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
              {(() => {
                const profilePhoto =
                  postAuthorProfile?.photoURL || post.userPhoto;
                if (profilePhoto) {
                  return (
                    <Image
                      src={profilePhoto}
                      alt={
                        postAuthorProfile?.name ||
                        post.userName ||
                        post.userEmail
                      }
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return <User className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {postAuthorProfile?.name || post.userName || post.userEmail}
              </h3>
              {post.eventName && (
                <div className="flex items-center space-x-1 text-blue-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{post.eventName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Admin/User Menu */}
            {(showAdminActions || post.userId === user?.uid) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 min-w-[120px] z-10">
                    {showAdminActions && (
                      <button
                        key="hide-button"
                        onClick={handleHide}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                      >
                        {post.isHidden ? "Göster" : "Gizle"}
                      </button>
                    )}
                    {(showAdminActions || post.userId === user?.uid) && (
                      <button
                        key="delete-button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={onClose} className="text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image Section - Mobile Full Screen */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <Image
            src={post.imageUrl}
            alt={post.description || "Post image"}
            width={800}
            height={800}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Bottom Actions - Mobile */}
        <div className="bg-black/80 backdrop-blur-sm p-4">
          {/* Engagement */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!user || isLiking}
                className={`transition-colors ${
                  isLiked ? "text-red-500" : "text-white hover:text-red-500"
                } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <Heart className={`w-7 h-7 ${isLiked ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={() => setShowCommentsDrawer(true)}
                className="text-white"
              >
                <MessageCircle className="w-7 h-7" />
              </button>
            </div>
          </div>

          <div className="text-white font-semibold text-sm mb-2">
            {likeCount} beğeni
          </div>

          {/* Description */}
          {post.description && (
            <div className="text-white text-sm mb-2">
              <span className="font-semibold">
                {post.userName || post.userEmail}
              </span>{" "}
              {post.description}
            </div>
          )}

          <div className="text-gray-400 text-xs mb-3">
            {formatDate(post.timestamp)}
          </div>

          {/* Comments Preview - Mobile Instagram Style */}
          {comments.length > 0 && (
            <button
              onClick={() => setShowCommentsDrawer(true)}
              className="text-gray-400 text-sm mb-3 text-left"
            >
              {comments.length} yorumu gör
            </button>
          )}

          {/* Comment Input */}
          <form
            onSubmit={handleAddComment}
            className="flex items-center space-x-3 border-t border-gray-700 pt-3"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorum ekle..."
              disabled={!user || isAddingComment}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim() || isAddingComment}
              className="text-blue-500 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isAddingComment ? "..." : "Paylaş"}
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Layout - Keep original */}
      <div className="hidden md:block">
        <div className="relative rounded-xl bg-gray-800/50 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden flex shadow-xl border border-gray-700/50">
          {/* Image Section - Desktop */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <Image
              src={post.imageUrl}
              alt={post.description || "Post image"}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              priority
            />
          </div>

          {/* Details Section - Desktop */}
          <div className="w-96 flex flex-col bg-gray-800/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  {(() => {
                    const profilePhoto =
                      postAuthorProfile?.photoURL || post.userPhoto;
                    if (profilePhoto) {
                      return (
                        <Image
                          src={profilePhoto}
                          alt={
                            postAuthorProfile?.name ||
                            post.userName ||
                            post.userEmail
                          }
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    return <User className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {postAuthorProfile?.name || post.userName || post.userEmail}
                  </h3>
                  {post.eventName && (
                    <div className="flex items-center space-x-1 text-blue-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{post.eventName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Admin/User Menu */}
                {(showAdminActions || post.userId === user?.uid) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 min-w-[120px] z-10">
                        {showAdminActions && (
                          <button
                            key="desktop-hide-button"
                            onClick={handleHide}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                          >
                            {post.isHidden ? "Göster" : "Gizle"}
                          </button>
                        )}
                        {(showAdminActions || post.userId === user?.uid) && (
                          <button
                            key="desktop-delete-button"
                            onClick={handleDelete}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{ 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Description */}
              {post.description && (
                <div className="mb-4 pb-3 border-b border-gray-700">
                  <div className="text-[#d1d1e0] text-sm leading-relaxed">
                    <span className="font-semibold text-white">
                      {post.userName || post.userEmail}
                    </span>{" "}
                    {post.description}
                  </div>
                  <div className="text-gray-500 text-xs mt-2">
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              )}

              {/* Comments Preview - Desktop */}
              <div className="flex-1 py-4">
                {comments.length > 0 ? (
                  <button
                    onClick={() => setShowCommentsDrawer(true)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {comments.length} yorumu gör
                  </button>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Henüz yorum yok. İlk yorumu sen yap!
                  </div>
                )}
              </div>

              {/* Post Info */}
              <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Etkinlik: {post.eventName}</span>
                </div>

                {post.isAdminPost && (
                  <div className="bg-green-600 px-2 py-1 rounded-full inline-block">
                    <span className="text-white text-xs font-medium">
                      Admin
                    </span>
                  </div>
                )}

                {post.isHidden && (
                  <div className="bg-yellow-600 px-2 py-1 rounded-full inline-block">
                    <span className="text-white text-xs font-medium">
                      Gizli
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Engagement Bar */}
            <div className="p-4 border-t border-gray-700">
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
                  </button>

                  <button
                    onClick={() => setShowCommentsDrawer(true)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="text-white font-semibold text-sm space-y-1">
                <div>{likeCount} beğeni</div>
                <div>{comments.length} yorum</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Drawer - Instagram Style */}
      {showCommentsDrawer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-end md:items-center justify-center"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div 
            className="bg-gray-900 w-full md:w-96 md:max-w-lg md:rounded-t-2xl rounded-t-2xl md:rounded-2xl max-h-[80vh] md:max-h-[70vh] flex flex-col border border-gray-700"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Yorumlar</h3>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Comments List */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {isLoadingComments ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                  Yorumlar yükleniyor...
                </div>
              ) : (
                <>
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={`drawer-${comment.id}`}
                        className="flex space-x-3"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {comment.userPhoto ? (
                            <Image
                              src={comment.userPhoto}
                              alt={comment.userName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm">
                            <span className="font-semibold">
                              {comment.userName}
                            </span>{" "}
                            <span className="text-gray-200">
                              {comment.text}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1 flex items-center justify-between">
                            <span>{formatDate(comment.timestamp)}</span>
                            {showAdminActions && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-400 ml-2"
                                title="Yorumu Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium mb-1">
                        Henüz yorum yok
                      </p>
                      <p className="text-sm">İlk yorumu sen yap!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-700 p-4">
              <form
                onSubmit={handleAddComment}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {(() => {
                    const profilePhoto =
                      userProfileData?.photoURL || user?.photoURL;
                    return profilePhoto ? (
                      <Image
                        src={profilePhoto}
                        alt="Your profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    );
                  })()}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorum ekle..."
                  disabled={!user || isAddingComment}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none border-none"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!user || !newComment.trim() || isAddingComment}
                  className="text-blue-500 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isAddingComment ? "..." : "Paylaş"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
