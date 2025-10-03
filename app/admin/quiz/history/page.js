"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "../../../../utils/roleUtils";
import Link from "next/link";

export default function GameHistoryPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [gameResults, setGameResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [filterHost, setFilterHost] = useState("all");
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
      fetchGameResults();
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const fetchGameResults = async () => {
    try {
      setLoadingResults(true);
      const resultsRef = collection(db, "gameResults");
      const q = query(resultsRef, orderBy("finishedAt", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setGameResults(results);
    } catch (error) {
      console.error("Error fetching game results:", error);
      toast.error("Oyun geçmişi yüklenirken hata oluştu!");
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}dk ${seconds}sn`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Bilinmiyor";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredResults = gameResults.filter((result) => {
    if (filterHost === "all") return true;
    if (filterHost === "me") return result.hostId === user?.email;
    return true;
  });

  // Calculate overall stats
  const totalGames = gameResults.length;
  const totalPlayers = gameResults.reduce((sum, g) => sum + (g.stats?.totalPlayers || 0), 0);
  const averagePlayersPerGame = totalGames > 0 ? Math.round(totalPlayers / totalGames) : 0;
  const myGames = gameResults.filter((g) => g.hostId === user?.email).length;

  if (loading || loadingResults) {
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Oyun Geçmişi</h1>
            <p className="text-sm sm:text-base text-gray-300">Tamamlanan Quiz oyunlarının detaylı sonuçları</p>
          </div>
          <Link
            href="/admin/quiz/manage"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center text-sm sm:text-base"
          >
            ← Quiz Yönetimine Dön
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Toplam Oyun</div>
            <div className="text-xl sm:text-3xl font-bold text-white">{totalGames}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Toplam Oyuncu</div>
            <div className="text-xl sm:text-3xl font-bold text-purple-400">{totalPlayers}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Ort. Oyuncu</div>
            <div className="text-xl sm:text-3xl font-bold text-blue-400">{averagePlayersPerGame}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Benim Oyunlarım</div>
            <div className="text-xl sm:text-3xl font-bold text-green-400">{myGames}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setFilterHost("all")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                filterHost === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Tüm Oyunlar
            </button>
            <button
              onClick={() => setFilterHost("me")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                filterHost === "me"
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Benim Oyunlarım
            </button>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
            <p className="text-gray-400 text-base sm:text-lg">Henüz tamamlanmış oyun yok</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setSelectedGame(selectedGame?.id === result.id ? null : result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-2xl font-bold text-white">{result.quizTitle}</h3>
                      <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold">
                        {result.gameCode}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                      <span>🎮 {result.stats?.totalPlayers || 0}</span>
                      <span>📝 {result.totalQuestions}</span>
                      <span>⏱ {formatDuration(result.duration)}</span>
                      <span className="hidden sm:inline">👤 {result.hostName}</span>
                      <span className="hidden sm:inline">📅 {formatDate(result.finishedAt)}</span>
                    </div>

                    {/* Winner */}
                    {result.winner && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg inline-flex">
                        <span className="text-xl sm:text-2xl">🏆</span>
                        <div>
                          <div className="text-yellow-400 font-bold text-sm sm:text-base">{result.winner.name}</div>
                          <div className="text-yellow-200 text-xs sm:text-sm">
                            {result.winner.score} puan • {result.winner.correctAnswers} doğru
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="text-white hover:text-purple-400 transition-colors ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGame(selectedGame?.id === result.id ? null : result);
                    }}
                  >
                    {selectedGame?.id === result.id ? "▲" : "▼"}
                  </button>
                </div>

                {/* Detailed Stats */}
                {selectedGame?.id === result.id && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
                    {/* Top 3 */}
                    {result.topThree && result.topThree.length > 0 && (
                      <div className="mb-4 sm:mb-6">
                        <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">🏅 İlk 3</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          {result.topThree.map((player, index) => (
                            <div
                              key={player.userId}
                              className={`p-3 sm:p-4 rounded-lg ${
                                index === 0
                                  ? "bg-yellow-500/20 border-2 border-yellow-500"
                                  : index === 1
                                  ? "bg-gray-400/20 border-2 border-gray-400"
                                  : "bg-orange-500/20 border-2 border-orange-500"
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-3xl sm:text-4xl mb-2">
                                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                </div>
                                <div className="text-white font-bold text-sm sm:text-lg truncate">{player.name}</div>
                                <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                                  {player.score}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Players */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                        👥 Tüm Oyuncular ({result.players?.length || 0})
                      </h4>
                      <div className="bg-white/5 rounded-xl overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-300 text-xs sm:text-sm">Sıra</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-300 text-xs sm:text-sm">İsim</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-300 text-xs sm:text-sm hidden sm:table-cell">Bölüm</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-300 text-xs sm:text-sm">Doğru</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-300 text-xs sm:text-sm hidden sm:table-cell">Ort. Süre</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-300 text-xs sm:text-sm">Puan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.players?.map((player, index) => (
                              <tr
                                key={player.userId}
                                className={`border-t border-white/10 ${
                                  index < 3 ? "bg-purple-500/10" : ""
                                }`}
                              >
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-white font-bold text-xs sm:text-base">#{player.rank}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-base truncate max-w-[120px]">{player.name}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm hidden sm:table-cell">
                                  {player.department || "-"}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-green-400 text-xs sm:text-base">
                                  {player.correctAnswers}/{player.totalAnswers}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-400 text-xs sm:text-base hidden sm:table-cell">
                                  {player.averageTimeSpent}s
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-white font-bold text-xs sm:text-base">
                                  {player.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">En Yüksek</div>
                        <div className="text-lg sm:text-2xl font-bold text-white">
                          {result.stats?.highestScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">En Düşük</div>
                        <div className="text-lg sm:text-2xl font-bold text-white">
                          {result.stats?.lowestScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">Ortalama</div>
                        <div className="text-lg sm:text-2xl font-bold text-white">
                          {result.stats?.averageScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">Ort. Doğru</div>
                        <div className="text-lg sm:text-2xl font-bold text-white">
                          {result.stats?.averageCorrectAnswers || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
