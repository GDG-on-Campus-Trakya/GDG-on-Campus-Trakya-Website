"use client";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { findPollByCode, addPlayerToPoll } from "../../../utils/pollUtils";

export default function JoinPollPage() {
  const [user, loading] = useAuthState(auth);
  const [pollCode, setPollCode] = useState("");
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const handleJoinPoll = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Poll'a katılmak için giriş yapmalısınız!");
      router.push("/");
      return;
    }

    if (pollCode.length !== 6) {
      toast.error("Poll kodu 6 haneli olmalıdır!");
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

      // Find poll
      const poll = await findPollByCode(pollCode);

      if (!poll) {
        toast.error("Poll bulunamadı! Kodu kontrol edin.");
        setJoining(false);
        return;
      }

      if (poll.status === "finished") {
        toast.error("Bu poll sona ermiş!");
        setJoining(false);
        return;
      }

      // Check if already joined
      const playerId = `player_${user.uid}`;
      if (poll.players && poll.players[playerId]) {
        toast.info("Bu poll'a zaten katıldınız!");
        router.push(`/poll/room/${poll.id}`);
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

      await addPlayerToPoll(poll.id, playerData);
      toast.success("Poll'a katıldınız!");
      router.push(`/poll/room/${poll.id}`);
    } catch (error) {
      console.error("Error joining poll:", error);
      toast.error("Poll'a katılırken hata oluştu!");
      setJoining(false);
    }
  };

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPollCode(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">Poll!</h1>
          <p className="text-xl text-white/80">Oylamaya katılmak için kodu girin</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <form onSubmit={handleJoinPoll} className="space-y-6">
            <div>
              <label className="block text-white mb-3 text-lg font-semibold">
                Poll Kodu
              </label>
              <input
                type="text"
                value={pollCode}
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
                  Oylamaya katılmak için önce giriş yapmalısınız
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!user || pollCode.length !== 6 || joining}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-colors font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Katılınıyor..." : "Oylamaya Katıl"}
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
