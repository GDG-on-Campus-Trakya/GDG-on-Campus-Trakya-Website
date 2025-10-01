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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Oyun Geçmişi</h1>
            <p className="text-gray-300">Tamamlanan Quiz oyunlarının detaylı sonuçları</p>
          </div>
          <Link
            href="/admin/quiz/manage"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            ← Quiz Yönetimine Dön
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Toplam Oyun</div>
            <div className="text-3xl font-bold text-white">{totalGames}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Toplam Oyuncu</div>
            <div className="text-3xl font-bold text-purple-400">{totalPlayers}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Ortalama Oyuncu</div>
            <div className="text-3xl font-bold text-blue-400">{averagePlayersPerGame}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Benim Oyunlarım</div>
            <div className="text-3xl font-bold text-green-400">{myGames}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilterHost("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterHost === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Tüm Oyunlar
            </button>
            <button
              onClick={() => setFilterHost("me")}
              className={`px-4 py-2 rounded-lg transition-colors ${
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
            <p className="text-gray-400 text-lg">Henüz tamamlanmış oyun yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setSelectedGame(selectedGame?.id === result.id ? null : result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{result.quizTitle}</h3>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                        {result.gameCode}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                      <span>🎮 {result.stats?.totalPlayers || 0} Oyuncu</span>
                      <span>📝 {result.totalQuestions} Soru</span>
                      <span>⏱ {formatDuration(result.duration)}</span>
                      <span>👤 Host: {result.hostName}</span>
                      <span>📅 {formatDate(result.finishedAt)}</span>
                    </div>

                    {/* Winner */}
                    {result.winner && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg inline-flex">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <div className="text-yellow-400 font-bold">{result.winner.name}</div>
                          <div className="text-yellow-200 text-sm">
                            {result.winner.score} puan • {result.winner.correctAnswers} doğru
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="text-white hover:text-purple-400 transition-colors"
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
                  <div className="mt-6 pt-6 border-t border-white/20">
                    {/* Top 3 */}
                    {result.topThree && result.topThree.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xl font-bold text-white mb-4">🏅 İlk 3</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {result.topThree.map((player, index) => (
                            <div
                              key={player.userId}
                              className={`p-4 rounded-lg ${
                                index === 0
                                  ? "bg-yellow-500/20 border-2 border-yellow-500"
                                  : index === 1
                                  ? "bg-gray-400/20 border-2 border-gray-400"
                                  : "bg-orange-500/20 border-2 border-orange-500"
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-4xl mb-2">
                                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                </div>
                                <div className="text-white font-bold text-lg">{player.name}</div>
                                <div className="text-2xl font-bold text-white mt-1">
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
                      <h4 className="text-xl font-bold text-white mb-4">
                        👥 Tüm Oyuncular ({result.players?.length || 0})
                      </h4>
                      <div className="bg-white/5 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-gray-300 text-sm">Sıra</th>
                              <th className="px-4 py-3 text-left text-gray-300 text-sm">İsim</th>
                              <th className="px-4 py-3 text-left text-gray-300 text-sm">Bölüm</th>
                              <th className="px-4 py-3 text-center text-gray-300 text-sm">Doğru</th>
                              <th className="px-4 py-3 text-center text-gray-300 text-sm">Ort. Süre</th>
                              <th className="px-4 py-3 text-right text-gray-300 text-sm">Puan</th>
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
                                <td className="px-4 py-3 text-white font-bold">#{player.rank}</td>
                                <td className="px-4 py-3 text-white">{player.name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                  {player.department || "-"}
                                </td>
                                <td className="px-4 py-3 text-center text-green-400">
                                  {player.correctAnswers}/{player.totalAnswers}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400">
                                  {player.averageTimeSpent}s
                                </td>
                                <td className="px-4 py-3 text-right text-white font-bold">
                                  {player.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">En Yüksek Skor</div>
                        <div className="text-2xl font-bold text-white">
                          {result.stats?.highestScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">En Düşük Skor</div>
                        <div className="text-2xl font-bold text-white">
                          {result.stats?.lowestScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">Ortalama Skor</div>
                        <div className="text-2xl font-bold text-white">
                          {result.stats?.averageScore || 0}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">Ort. Doğru Cevap</div>
                        <div className="text-2xl font-bold text-white">
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
