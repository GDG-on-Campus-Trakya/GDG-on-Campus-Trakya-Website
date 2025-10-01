"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole } from "../../../utils/roleUtils";
import {
  createPoll,
  getAllPolls,
  updatePollStatus,
  deletePoll,
  clearFinishedPolls,
  subscribeToPoll,
  startNextMatch,
  completeCurrentMatch,
  getCurrentMatch,
  createTournamentBracket
} from "../../../utils/pollUtils";
import { getAllDatasets, getRandomItemsFromDataset } from "../../../utils/datasetUtils";
import TournamentPollCreator from "../../../components/TournamentPollCreator";

export default function AdminPollsPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  const [polls, setPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [itemCount, setItemCount] = useState(8);
  const [datasets, setDatasets] = useState([]);

  // Selected poll for monitoring
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollStats, setPollStats] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      const role = await checkUserRole(user.email);
      if (!role) {
        router.push("/");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userRole) {
      loadPolls();
      loadDatasets();
    }
  }, [userRole]);

  const loadDatasets = async () => {
    try {
      const allDatasets = await getAllDatasets();
      setDatasets(allDatasets);
    } catch (error) {
      console.error("Error loading datasets:", error);
      toast.error("Veri setleri yüklenemedi!");
    }
  };

  // Subscribe to selected poll for real-time updates
  useEffect(() => {
    if (!selectedPoll) return;

    const unsubscribe = subscribeToPoll(selectedPoll.id, (pollData) => {
      if (pollData) {
        setSelectedPoll(pollData);
        setPollStats({
          totalVotes: (pollData.votes?.left || 0) + (pollData.votes?.right || 0),
          totalParticipants: Object.keys(pollData.participants || {}).length,
          leftVotes: pollData.votes?.left || 0,
          rightVotes: pollData.votes?.right || 0
        });
      }
    });

    return unsubscribe;
  }, [selectedPoll?.id]);

  const loadPolls = async () => {
    try {
      setLoadingPolls(true);
      const allPolls = await getAllPolls();
      setPolls(allPolls);
    } catch (error) {
      console.error("Error loading polls:", error);
      toast.error("Oylamalar yüklenemedi!");
    } finally {
      setLoadingPolls(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();

    if (!title.trim() || !selectedDatasetId) {
      toast.error("Lütfen başlık ve veri seti seçin!");
      return;
    }

    try {
      setCreating(true);

      // Get random items from dataset
      const randomItems = await getRandomItemsFromDataset(selectedDatasetId, itemCount);

      // Create tournament bracket
      const tournament = createTournamentBracket(randomItems);

      // Generate poll code
      const pollCode = Math.floor(100000 + Math.random() * 900000).toString();
      const pollId = `poll_${Date.now()}_${pollCode}`;

      // Create tournament poll
      const pollData = {
        title: title.trim(),
        description: description.trim(),
        pollCode,
        type: "tournament",
        status: "waiting",
        createdAt: Date.now(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdByEmail: user.email,
        participants: {},
        messages: {},
        tournament,
        datasetId: selectedDatasetId,
        itemCount
      };

      const { ref: dbRef, set } = await import("firebase/database");
      const { realtimeDb } = await import("../../../firebase");
      await set(dbRef(realtimeDb, `polls/${pollId}`), pollData);

      toast.success("Turnuva oylaması oluşturuldu!");

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedDatasetId("");
      setItemCount(8);
      setShowCreateForm(false);

      // Reload polls
      await loadPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error(error.message || "Oylama oluşturulurken hata oluştu!");
    } finally {
      setCreating(false);
    }
  };

  const handleStartPoll = async (pollId) => {
    // Check if there's already an active poll
    const activePoll = polls.find(p => p.status === "active");
    if (activePoll && activePoll.id !== pollId) {
      toast.error("Zaten aktif bir oylama var! Önce onu bitirin.");
      return;
    }

    try {
      await updatePollStatus(pollId, "active");
      toast.success("Oylama başlatıldı!");
      await loadPolls();
    } catch (error) {
      console.error("Error starting poll:", error);
      toast.error("Oylama başlatılamadı!");
    }
  };

  const handleEndPoll = async (pollId) => {
    try {
      await updatePollStatus(pollId, "finished");
      toast.success("Oylama sonlandırıldı!");
      await loadPolls();
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error("Oylama sonlandırılamadı!");
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!confirm("Bu oylamayı silmek istediğinize emin misiniz?")) return;

    try {
      await deletePoll(pollId);
      toast.success("Oylama silindi!");
      await loadPolls();
      if (selectedPoll?.id === pollId) {
        setSelectedPoll(null);
        setPollStats(null);
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Oylama silinemedi!");
    }
  };

  const handleStartTournamentMatch = async (pollId) => {
    // Check if there's already an active poll
    const activePoll = polls.find(p => p.status === "active");
    if (activePoll && activePoll.id !== pollId) {
      toast.error("Zaten aktif bir oylama var! Önce onu bitirin.");
      return;
    }

    try {
      await updatePollStatus(pollId, "active");
      await startNextMatch(pollId);
      toast.success("Turnuva maçı başlatıldı!");
      await loadPolls();
    } catch (error) {
      console.error("Error starting tournament match:", error);
      toast.error("Maç başlatılamadı: " + error.message);
    }
  };

  const handleCompleteTournamentMatch = async (pollId) => {
    try {
      const result = await completeCurrentMatch(pollId);

      if (result.tournamentComplete) {
        toast.success(`🏆 Turnuva tamamlandı! Kazanan: ${result.winner.name}`);
      } else if (result.roundComplete) {
        toast.success(`Tur ${result.nextRound - 1} tamamlandı! Sonraki tura geçiliyor...`);
        // Automatically start next match
        await startNextMatch(pollId);
        toast.info("Sonraki maç başlatıldı!");
      } else if (result.nextMatch !== undefined) {
        toast.success("Maç tamamlandı! Sonraki maça geçiliyor...");
        // Automatically start next match
        await startNextMatch(pollId);
        toast.info("Sonraki maç başlatıldı!");
      }

      await loadPolls();
    } catch (error) {
      console.error("Error completing match:", error);
      toast.error("Maç tamamlanamadı: " + error.message);
    }
  };

  const handleClearFinished = async () => {
    if (!confirm("Tüm bitmiş oylamaları silmek istediğinize emin misiniz?")) return;

    try {
      const count = await clearFinishedPolls();
      toast.success(`${count} oylama silindi!`);
      await loadPolls();
    } catch (error) {
      console.error("Error clearing polls:", error);
      toast.error("Oylamalar silinemedi!");
    }
  };

  if (loading || loadingPolls) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-red-400">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Oylama Yönetimi
            </h1>
            <p className="text-gray-400 mt-2">Canlı oylamalar oluşturun ve yönetin</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl transition-colors"
          >
            ← Geri Dön
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg"
          >
            {showCreateForm ? "İptal" : "+ Yeni Oylama"}
          </button>
          {polls.some(p => p.status === "finished") && (
            <button
              onClick={handleClearFinished}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold"
            >
              🗑️ Bitmişleri Temizle
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Poll List & Create Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">🏆 Yeni Turnuva Oylaması Oluştur</h2>

              <form onSubmit={handleCreatePoll} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Turnuva başlığı"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Turnuva açıklaması (opsiyonel)"
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Veri Seti *
                  </label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Veri seti seçin</option>
                    {datasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.items?.length || 0} item)
                      </option>
                    ))}
                  </select>
                  {datasets.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Henüz veri seti yok. <a href="/admin/datasets" className="underline">Veri seti oluşturun</a>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Item Sayısı *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[8, 16, 32, 64].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setItemCount(count)}
                        className={`py-3 rounded-xl font-semibold transition-all ${
                          itemCount === count
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-gray-900 text-gray-400 border border-gray-700 hover:border-purple-500"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Veri setinden rastgele {itemCount} item seçilecek
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={creating || datasets.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-semibold disabled:cursor-not-allowed shadow-lg"
                >
                  {creating ? "Oluşturuluyor..." : "🏆 Turnuva Oluştur"}
                </button>
              </form>
            </div>
          )}

          {/* Polls List */}
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Tüm Oylamalar</h2>

            {polls.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400">Henüz oylama yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => {
                  const isTournament = poll.type === "tournament";
                  let totalVotes = 0;
                  let currentMatchInfo = null;

                  if (isTournament && poll.tournament) {
                    const currentMatch = getCurrentMatch(poll.tournament);
                    if (currentMatch) {
                      totalVotes = (currentMatch.votes?.item1 || 0) + (currentMatch.votes?.item2 || 0);
                      currentMatchInfo = currentMatch;
                    }
                  } else {
                    totalVotes = (poll.votes?.option1 || 0) + (poll.votes?.option2 || 0);
                  }

                  const participantCount = Object.keys(poll.participants || {}).length;

                  return (
                    <div
                      key={poll.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedPoll?.id === poll.id
                          ? isTournament ? "border-purple-500 bg-purple-900/30" : "border-blue-500 bg-blue-900/30"
                          : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedPoll(poll)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isTournament && <span className="text-xl">🏆</span>}
                            <h3 className="font-bold text-lg text-white">{poll.title}</h3>
                          </div>
                          {poll.description && (
                            <p className="text-sm text-gray-400">{poll.description}</p>
                          )}
                          {isTournament && poll.tournament && (
                            <p className="text-xs text-purple-400 mt-1">
                              Tur {poll.tournament.currentRound}/{poll.tournament.totalRounds} •
                              Maç {poll.tournament.currentMatchIndex + 1}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          poll.status === "active"
                            ? "bg-green-900/50 text-green-400 border border-green-700"
                            : poll.status === "finished"
                            ? "bg-red-900/50 text-red-400 border border-red-700"
                            : "bg-yellow-900/50 text-yellow-400 border border-yellow-700"
                        }`}>
                          {poll.status === "active" ? "Aktif" : poll.status === "finished" ? "Bitti" : "Bekliyor"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>👥 {participantCount} katılımcı</span>
                        <span>🗳️ {totalVotes} oy{isTournament ? " (bu maç)" : ""}</span>
                        <span>🔑 {poll.pollCode}</span>
                        {isTournament && <span className="text-purple-400 font-semibold">🏆 Turnuva</span>}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {poll.status === "waiting" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isTournament) {
                                handleStartTournamentMatch(poll.id);
                              } else {
                                handleStartPoll(poll.id);
                              }
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            ▶️ {isTournament ? "Maçı Başlat" : "Başlat"}
                          </button>
                        )}
                        {poll.status === "active" && isTournament && currentMatchInfo?.status === "active" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTournamentMatch(poll.id);
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            ✅ Maçı Bitir
                          </button>
                        )}
                        {poll.status === "active" && !isTournament && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEndPoll(poll.id);
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            ⏹️ Bitir
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePoll(poll.id);
                          }}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right - Selected Poll Stats */}
        <div className="lg:col-span-1">
          {selectedPoll ? (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl sticky top-4">
              <h2 className="text-xl font-bold text-white mb-4">
                {selectedPoll.status === "active" ? "📊 Canlı İstatistikler" : "📊 İstatistikler"}
              </h2>

              <div className="space-y-4">
                {/* Poll Info */}
                <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                  <h3 className="font-bold text-white mb-1">{selectedPoll.title}</h3>
                  {selectedPoll.description && (
                    <p className="text-sm text-gray-400">{selectedPoll.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-300">
                    🔑 Kod: <span className="font-bold text-blue-400">{selectedPoll.pollCode}</span>
                  </div>
                </div>

                {/* Stats */}
                {pollStats && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-purple-900/30 border border-purple-700 rounded-xl text-center">
                        <div className="text-3xl font-bold text-purple-400">{pollStats.totalVotes}</div>
                        <div className="text-sm text-gray-400">Toplam Oy</div>
                      </div>
                      <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl text-center">
                        <div className="text-3xl font-bold text-blue-400">{pollStats.totalParticipants}</div>
                        <div className="text-sm text-gray-400">Katılımcı</div>
                      </div>
                    </div>

                    {/* Vote Results */}
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⬅️</span>
                            <span className="font-semibold text-white">{selectedPoll.option1} (Sol)</span>
                          </div>
                          <span className="text-blue-400 font-bold">{pollStats.leftVotes}</span>
                        </div>
                        {pollStats.totalVotes > 0 && (
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((pollStats.leftVotes / pollStats.totalVotes) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-700 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">➡️</span>
                            <span className="font-semibold text-white">{selectedPoll.option2} (Sağ)</span>
                          </div>
                          <span className="text-red-600 font-bold">{pollStats.rightVotes}</span>
                        </div>
                        {pollStats.totalVotes > 0 && (
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((pollStats.rightVotes / pollStats.totalVotes) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Copy Link Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/poll/join`);
                    toast.success("Link kopyalandı!");
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg"
                >
                  🔗 Katılım Linkini Kopyala
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-400">Detayları görmek için bir oylama seçin</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="light"
      />
    </div>
  );
}
