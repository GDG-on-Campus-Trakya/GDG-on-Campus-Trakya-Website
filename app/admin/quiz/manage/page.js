"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "../../../../utils/roleUtils";
import { createGame } from "../../../../utils/quizUtils";
import Link from "next/link";

export default function ManageQuizzesPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      const role = await checkUserRole(user.email);
      if (role !== ROLES.ADMIN) {
        toast.error("Bu sayfaya erişim yetkiniz yok!");
        router.push("/admin");
        return;
      }

      setUserRole(role);
      fetchQuizzes();
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const quizzesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setQuizzes(quizzesData);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Quiz'ler yüklenirken hata oluştu!");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleStartGame = async (quiz) => {
    try {
      const gameData = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        hostId: user.email,
        hostName: user.displayName || user.email,
        totalQuestions: quiz.questionCount,
        questions: quiz.questions
      };

      const gameId = await createGame(gameData);

      // Update quiz play count
      const quizRef = doc(db, "quizzes", quiz.id);
      await updateDoc(quizRef, {
        playCount: (quiz.playCount || 0) + 1,
        lastPlayedAt: new Date()
      });

      toast.success("Oyun başlatıldı!");
      router.push(`/admin/quiz/host/${gameId}`);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Oyun başlatılırken hata oluştu!");
    }
  };

  const handleToggleActive = async (quizId, currentStatus) => {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, {
        isActive: !currentStatus
      });

      setQuizzes(
        quizzes.map((q) =>
          q.id === quizId ? { ...q, isActive: !currentStatus } : q
        )
      );

      toast.success(
        !currentStatus ? "Quiz aktif edildi!" : "Quiz pasif edildi!"
      );
    } catch (error) {
      console.error("Error toggling quiz status:", error);
      toast.error("Durum değiştirilirken hata oluştu!");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Bu quiz'i silmek istediğinize emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      toast.success("Quiz silindi!");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Quiz silinirken hata oluştu!");
    }
  };

  if (loading || loadingQuizzes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Quiz Yönetimi</h1>
            <p className="text-sm sm:text-base text-gray-300">canlı quiz'lerinizi yönetin ve oyun başlatın</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/admin/quiz/history"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold text-center text-sm sm:text-base"
            >
              📊 Oyun Geçmişi
            </Link>
            <Link
              href="/admin/quiz/create"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-semibold text-center text-sm sm:text-base"
            >
              + Yeni Quiz
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Toplam Quiz</div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{quizzes.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Aktif Quiz</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {quizzes.filter((q) => q.isActive).length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Toplam Oynama</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
              {quizzes.reduce((sum, q) => sum + (q.playCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
            <p className="text-gray-400 text-base sm:text-lg mb-4">Henüz quiz oluşturulmamış</p>
            <Link
              href="/admin/quiz/create"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              İlk Quiz'i Oluştur
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{quiz.title}</h3>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {quiz.isActive ? "Aktif" : "Pasif"}
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        {quiz.category}
                      </span>
                    </div>

                    {quiz.description && (
                      <p className="text-gray-400 text-xs sm:text-sm mb-3">{quiz.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <span>📝 {quiz.questionCount} Soru</span>
                      <span>🎮 {quiz.playCount || 0} Kez</span>
                      <span className="hidden sm:inline">👤 {quiz.createdByName || quiz.createdBy}</span>
                      {quiz.lastPlayedAt && (
                        <span className="hidden sm:inline">
                          🕐 {new Date(quiz.lastPlayedAt.seconds * 1000).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      onClick={() => handleStartGame(quiz)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-semibold text-sm"
                      disabled={!quiz.isActive}
                    >
                      🎮 Oyun Başlat
                    </button>

                    <button
                      onClick={() => handleToggleActive(quiz.id, quiz.isActive)}
                      className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                        quiz.isActive
                          ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                          : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                      }`}
                    >
                      {quiz.isActive ? "⏸ Pasifleştir" : "▶ Aktifleştir"}
                    </button>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                      🗑 Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Admin */}
        <div className="mt-6 sm:mt-8">
          <Link
            href="/admin"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            ← Admin Paneline Dön
          </Link>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
      />
    </div>
  );
}
