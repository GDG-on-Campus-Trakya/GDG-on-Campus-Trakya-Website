"use client";
import { useState, useEffect } from "react";
import { Plus, Filter, Heart, Calendar } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { socialUtils } from "../../utils/socialUtils";
import PostCard from "../../components/PostCard";
import PostModal from "../../components/PostModal";
import PostUpload from "../../components/PostUpload";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SocialPage() {
  const [user, loading] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "by-event"
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadPosts();
    loadActiveEvents();
  }, []);

  const loadActiveEvents = async () => {
    setLoadingEvents(true);
    const result = await socialUtils.getActiveEventsForPosting();
    if (result.success) {
      setActiveEvents(result.events.filter(event => event.canPost));
    }
    setLoadingEvents(false);
  };

  useEffect(() => {
    applyFilter();
  }, [posts, filter]);

  const loadPosts = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true);

    const result = await socialUtils.getPosts(
      { isHidden: false },
      { limit: 10, startAfter: loadMore ? lastDoc : null }
    );

    if (result.success) {
      if (loadMore) {
        setPosts(prev => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === 10);
    } else {
      toast.error("Postlar yüklenirken hata oluştu!");
    }

    setIsLoading(false);
  };

  const applyFilter = () => {
    let filtered = posts;
    
    // All posts are event posts now, so filter by specific event or show all
    if (filter !== "all") {
      filtered = posts.filter(post => post.eventId === filter);
    }
    
    setFilteredPosts(filtered);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadPosts(); // Reload posts
    toast.success("Post başarıyla paylaşıldı!");
  };

  const getFilterStats = () => {
    const total = posts.length;
    // Group posts by event
    const eventGroups = {};
    posts.forEach(post => {
      if (post.eventId) {
        eventGroups[post.eventId] = eventGroups[post.eventId] || {
          count: 0,
          name: post.eventName
        };
        eventGroups[post.eventId].count++;
      }
    });
    
    return { total, eventGroups };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Giriş yapmanız gerekiyor...</div>
      </div>
    );
  }

  const stats = getFilterStats();

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">GDG Social</h1>
            
            {loadingEvents ? (
              <div className="bg-gray-600 p-2 sm:p-3 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
              </div>
            ) : activeEvents.length > 0 ? (
              <button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                title={`${activeEvents.length} aktif etkinlik mevcut`}
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : (
              <div className="bg-gray-600/50 p-2 sm:p-3 rounded-lg cursor-not-allowed" title="Aktif etkinlik yok">
                <Plus className="w-5 h-5 sm:w-6 sm:w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Filter Tabs - Event Based */}
          <div className="flex flex-wrap gap-2 bg-gray-700 rounded-lg p-2">
            <button
              onClick={() => setFilter("all")}
              className={`py-2 px-4 rounded text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Tüm Etkinlikler ({stats.total})</span>
              </div>
            </button>
            
            {Object.entries(stats.eventGroups).map(([eventId, eventData]) => (
              <button
                key={eventId}
                onClick={() => setFilter(eventId)}
                className={`py-2 px-4 rounded text-sm font-medium transition-all ${
                  filter === eventId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {eventData.name} ({eventData.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-[#d1d1e0] text-sm">Postlar yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Posts Feed - Instagram Style Single Column */}
            {filteredPosts.length > 0 ? (
              <div className="space-y-8">
                {filteredPosts.map((post) => (
                  <ErrorBoundary key={post.id}>
                    <PostCard
                      post={post}
                      onPostClick={handlePostClick}
                      onDelete={handlePostDelete}
                    />
                  </ErrorBoundary>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto rounded-xl bg-gray-800/50 backdrop-blur-sm p-8 shadow-xl max-w-md">
                  {activeEvents.length > 0 ? (
                    <>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {filter === "all" 
                          ? "Henüz etkinlik fotoğrafı yok" 
                          : "Bu etkinlikten henüz fotoğraf yok"
                        }
                      </h3>
                      <p className="text-[#d1d1e0] mb-4">
                        İlk etkinlik fotoğrafını sen paylaş ve çekilişe katıl!
                      </p>
                      <button
                        onClick={() => setShowUpload(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                      >
                        Etkinlik Fotoğrafı Paylaş
                      </button>
                      <div className="mt-4 text-sm text-gray-400">
                        🎯 {activeEvents.length} aktif etkinlik mevcut
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Şu anda aktif etkinlik yok
                      </h3>
                      <p className="text-[#d1d1e0] mb-4">
                        Yeni etkinlikler başladığında burada fotoğraflarını paylaşabilirsin!
                      </p>
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mt-4">
                        <p className="text-blue-300 text-sm">
                          💡 Etkinlikler genellikle başladıktan sonra 3 gün boyunca fotoğraf paylaşımına açık kalır
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Load More Button */}
            {filteredPosts.length > 0 && hasMore && (
              <div className="flex justify-center py-6 mt-6">
                <button
                  onClick={() => loadPosts(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                >
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && activeEvents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <PostUpload 
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={handlePostDelete}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}