"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { findGameByCode } from "../../utils/quizUtils";
import { ref, get } from "firebase/database";
import { realtimeDb } from "../../firebase";

export default function GamePage() {
  const [user, loading] = useAuthState(auth);
  const [gameCode, setGameCode] = useState("");
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Giriş yapmalısınız!");
      router.push("/");
    }
  }, [user, loading, router]);

  const handleJoinGame = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Oyuna katılmak için giriş yapmalısınız!");
      router.push("/");
      return;
    }

    if (gameCode.length !== 6) {
      toast.error("Oyun kodu 6 haneli olmalıdır!");
      return;
    }

    setSearching(true);

    try {
      // First, try to find as Quiz
      const quizGame = await findGameByCode(gameCode);

      if (quizGame) {
        toast.success("Quiz bulundu! Yönlendiriliyorsunuz...");
        router.push(`/quiz/play/${quizGame.id}`);
        return;
      }

      // If not found, try to find as Poll
      const pollsRef = ref(realtimeDb, 'polls');
      const pollsSnapshot = await get(pollsRef);

      if (pollsSnapshot.exists()) {
        const polls = pollsSnapshot.val();
        const pollEntry = Object.entries(polls).find(
          ([id, poll]) => poll.pollCode === gameCode
        );

        if (pollEntry) {
          const [pollId, poll] = pollEntry;
          toast.success("Oylama bulundu! Yönlendiriliyorsunuz...");

          // Add participant first
          const { addParticipantToPoll } = await import("../../utils/pollUtils");
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("../../firebase");

          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          await addParticipantToPoll(pollId, {
            userId: user.uid,
            name: userData.name || user.displayName || "Anonymous",
            email: user.email,
            photoURL: userData.photoURL || user.photoURL || ""
          });

          router.push(`/poll/room/${pollId}`);
          return;
        }
      }

      // Not found
      toast.error("Oyun bulunamadı! Kodu kontrol edin.");
    } catch (error) {
      console.error("Error finding game:", error);
      toast.error("Oyun ararken hata oluştu!");
    } finally {
      setSearching(false);
    }
  };

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setGameCode(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-6xl font-bold text-white mb-4">Oyun!</h1>
          <p className="text-xl text-white/80">Oyuna katılmak için kodu girin</p>
          <p className="text-sm text-white/60 mt-2">Quiz veya Oylama</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label className="block text-white mb-3 text-lg font-semibold">
                Oyun Kodu
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={handleCodeInput}
                className="w-full px-6 py-4 text-center text-4xl font-bold bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white tracking-widest"
                placeholder="000000"
                maxLength="6"
                required
                disabled={searching}
              />
            </div>

            {!user && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                <p className="text-yellow-200 text-sm text-center">
                  Oyuna katılmak için önce giriş yapmalısınız
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!user || gameCode.length !== 6 || searching}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {searching ? "Aranıyor..." : "Oyuna Katıl"}
            </button>
          </form>

          {!user && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-white hover:text-white/80 underline"
              >
                Giriş Yap
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
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
