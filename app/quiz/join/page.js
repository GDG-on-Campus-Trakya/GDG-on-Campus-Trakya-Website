"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { findGameByCode, addPlayerToGame } from "../../../utils/quizUtils";

export default function JoinGamePage() {
  const [user, loading] = useAuthState(auth);
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const router = useRouter();

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

    setJoining(true);

    try {
      // Get user data
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error("Profil bilgileriniz bulunamadı. Lütfen profil sayfanızı doldurun.");
        router.push("/profile");
        return;
      }

      const userData = userDoc.data();

      // Find game
      const game = await findGameByCode(gameCode);

      if (!game) {
        toast.error("Oyun bulunamadı! Kodu kontrol edin.");
        setJoining(false);
        return;
      }

      if (game.status === "finished") {
        toast.error("Bu oyun sona ermiş!");
        setJoining(false);
        return;
      }

      // Check if already joined
      const playerId = `player_${user.uid}`;
      if (game.players && game.players[playerId]) {
        toast.info("Bu oyuna zaten katıldınız!");
        router.push(`/quiz/play/${game.id}`);
        return;
      }

      // Add player
      const playerData = {
        userId: user.uid,
        name: userData.name || user.displayName || "Anonim",
        email: user.email,
        avatar: user.photoURL || "",
        faculty: userData.faculty || "",
        department: userData.department || ""
      };

      await addPlayerToGame(game.id, playerData);
      toast.success("Oyuna katıldınız!");
      router.push(`/quiz/play/${game.id}`);
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Oyuna katılırken hata oluştu!");
      setJoining(false);
    }
  };

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setGameCode(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">Quiz!</h1>
          <p className="text-xl text-white/80">Oyuna katılmak için kodu girin</p>
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
                disabled={joining}
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
              disabled={!user || gameCode.length !== 6 || joining}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Katılınıyor..." : "Oyuna Katıl"}
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
