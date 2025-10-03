"use client";
import { useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { findGameByCode, addPlayerToGame } from "../../utils/quizUtils";
import { findPollByCode, addPlayerToPoll } from "../../utils/pollUtils";
import { debounce, withTimeout, isSafari } from "../../utils/debounce";

export default function GameJoinPage() {
  const [user, loading] = useAuthState(auth);
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();

  const handleJoinGame = useCallback(async (e) => {
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

    setJoining(true);

    try {
      // Safari için özel timeout süresi
      const timeoutDuration = isSafari() ? 8000 : 10000;

      // Paralel olarak user data ve game/poll search yap (BÜYÜK PERFORMANS ARTIŞ)
      const [userDoc, game, poll] = await withTimeout(
        Promise.all([
          getDoc(doc(db, "users", user.uid)),
          findGameByCode(gameCode),
          findPollByCode(gameCode)
        ]),
        timeoutDuration,
        "İşlem çok uzun sürdü. Lütfen tekrar deneyin."
      );

      if (!userDoc.exists()) {
        toast.error("Profil bilgileriniz bulunamadı. Lütfen profil sayfanızı doldurun.");
        router.push("/profile");
        setJoining(false);
        return;
      }

      const userData = userDoc.data();

      // Prepare player data
      const playerData = {
        userId: user.uid,
        name: userData.name || user.displayName || "Anonim",
        email: user.email,
        avatar: user.photoURL || "",
        faculty: userData.faculty || "",
        department: userData.department || ""
      };

      const playerId = `player_${user.uid}`;

      // Check quiz game
      if (game) {
        if (game.status === "finished") {
          toast.error("Bu oyun sona ermiş!");
          setJoining(false);
          return;
        }

        if (game.players && game.players[playerId]) {
          toast.info("Bu oyuna zaten katıldınız!");
          router.push(`/quiz/play/${game.id}`);
          return;
        }

        await withTimeout(
          addPlayerToGame(game.id, playerData),
          5000,
          "Oyuna katılma işlemi zaman aşımına uğradı"
        );
        toast.success("Oyuna katıldınız!");
        router.push(`/quiz/play/${game.id}`);
        return;
      }

      // Check poll
      if (poll) {
        if (poll.status === "finished") {
          toast.error("Bu oyun sona ermiş!");
          setJoining(false);
          return;
        }

        if (poll.players && poll.players[playerId]) {
          toast.info("Bu oyuna zaten katıldınız!");
          router.push(`/poll/room/${poll.id}`);
          return;
        }

        await withTimeout(
          addPlayerToPoll(poll.id, playerData),
          5000,
          "Oyuna katılma işlemi zaman aşımına uğradı"
        );
        toast.success("Oyuna katıldınız!");
        router.push(`/poll/room/${poll.id}`);
        return;
      }

      // Neither found
      toast.error("Oyun bulunamadı! Kodu kontrol edin.");
      setJoining(false);
    } catch (error) {
      logger.error("Error joining game:", error);
      const errorMessage = error.message === "İşlem çok uzun sürdü. Lütfen tekrar deneyin."
        ? error.message
        : "Oyuna katılırken hata oluştu!";
      toast.error(errorMessage);
      setJoining(false);
    }
  }, [user, gameCode, router]);

  // Debounced input handler for better performance
  const handleCodeInput = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setGameCode(value);

    // Show typing indicator
    setIsTyping(true);

    // Clear typing indicator after user stops typing
    const clearTyping = debounce(() => {
      setIsTyping(false);
    }, 500);

    clearTyping();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
        <div className="max-w-md w-full px-4 sm:px-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 animate-pulse">
            <div className="space-y-5 sm:space-y-6">
              {/* Title skeleton */}
              <div className="h-6 sm:h-8 bg-white/20 rounded-xl w-3/4 mx-auto"></div>
              <div className="h-5 sm:h-6 bg-white/20 rounded-xl w-1/2 mx-auto"></div>

              {/* Input skeleton */}
              <div className="space-y-2 sm:space-y-3 mt-6 sm:mt-8">
                <div className="h-4 sm:h-5 bg-white/20 rounded w-20 sm:w-24"></div>
                <div className="h-12 sm:h-16 bg-white/20 rounded-xl"></div>
              </div>

              {/* Button skeleton */}
              <div className="h-12 sm:h-14 bg-white/20 rounded-xl mt-5 sm:mt-6"></div>
            </div>
          </div>

          {/* Loading text */}
          <p className="text-center text-sm sm:text-base text-white/80 mt-5 sm:mt-6">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-3 sm:mb-4">Oyun!</h1>
          <p className="text-base sm:text-xl text-white/80">Oyuna katılmak için kodu girin</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20">
          <form onSubmit={handleJoinGame} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-white mb-2 sm:mb-3 text-base sm:text-lg font-semibold">
                Oyun Kodu
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={handleCodeInput}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-center text-2xl sm:text-4xl font-bold bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white tracking-widest"
                placeholder="000000"
                maxLength="6"
                required
                disabled={joining}
              />
            </div>

            {!user && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 sm:p-4">
                <p className="text-yellow-200 text-xs sm:text-sm text-center">
                  Oyuna katılmak için önce giriş yapmalısınız
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!user || gameCode.length !== 6 || joining}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-bold text-base sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Katılınıyor...
                </span>
              ) : (
                "Oyuna Katıl"
              )}
            </button>
          </form>

          {!user && (
            <div className="mt-5 sm:mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm sm:text-base text-white hover:text-white/80 underline"
              >
                Giriş Yap
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm sm:text-base text-white/70 hover:text-white transition-colors"
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
