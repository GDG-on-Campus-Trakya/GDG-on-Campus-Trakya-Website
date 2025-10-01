"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getActivePoll, addParticipantToPoll } from "../../../utils/pollUtils";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

export default function PollJoinPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [checkingPoll, setCheckingPoll] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Giriş yapmalısınız!");
      router.push("/");
      return;
    }

    if (user) {
      checkForActivePoll();
    }
  }, [user, loading, router]);

  const checkForActivePoll = async () => {
    try {
      setCheckingPoll(true);
      const poll = await getActivePoll();
      setActivePoll(poll);
    } catch (error) {
      console.error("Error checking for active poll:", error);
    } finally {
      setCheckingPoll(false);
    }
  };

  const handleJoinPoll = async () => {
    if (!user || !activePoll) return;

    try {
      setJoining(true);

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Add participant to poll
      await addParticipantToPoll(activePoll.id, {
        userId: user.uid,
        name: userData.name || user.displayName || "Anonymous",
        email: user.email,
        photoURL: userData.photoURL || user.photoURL || "/default-profile.png",
        faculty: userData.faculty || "",
        department: userData.department || ""
      });

      toast.success("Oylamaya katıldınız!");

      // Redirect to poll room
      setTimeout(() => {
        router.push(`/poll/room/${activePoll.id}`);
      }, 1000);
    } catch (error) {
      console.error("Error joining poll:", error);
      toast.error("Katılırken hata oluştu: " + error.message);
      setJoining(false);
    }
  };

  if (loading || checkingPoll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg text-white">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🗳️</div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Oylamaya Katıl
            </h1>
            <p className="text-lg text-gray-300">
              Aktif oylamaya katılın ve görüşlerinizi belirtin
            </p>
          </div>

          {/* Active Poll Info or No Poll Message */}
          {activePoll ? (
            <div className="space-y-6">
              {/* Poll Details */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {activePoll.title}
                    </h2>
                    <p className="text-gray-300">
                      {activePoll.description}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    Aktif
                  </span>
                </div>

                {/* Options Preview */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">1️⃣</div>
                    <p className="text-white font-semibold">{activePoll.option1}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">2️⃣</div>
                    <p className="text-white font-semibold">{activePoll.option2}</p>
                  </div>
                </div>

                {/* Poll Stats */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {Object.keys(activePoll.participants || {}).length}
                      </div>
                      <div className="text-sm text-gray-400">Katılımcı</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(activePoll.votes?.option1 || 0) + (activePoll.votes?.option2 || 0)}
                      </div>
                      <div className="text-sm text-gray-400">Toplam Oy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinPoll}
                disabled={joining}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-bold text-xl shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Katılınıyor...
                  </span>
                ) : (
                  "Oylamaya Katıl"
                )}
              </button>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">Nasıl Oy Verilir?</p>
                    <p>Oylamaya katıldıktan sonra chat'e <span className="font-bold text-white">1</span> veya <span className="font-bold text-white">2</span> yazarak oyunuzu kullanabilirsiniz.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😴</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Aktif Oylama Yok
              </h2>
              <p className="text-gray-400 mb-6">
                Şu anda aktif bir oylama bulunmuyor. Lütfen daha sonra tekrar deneyin.
              </p>
              <button
                onClick={checkForActivePoll}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold"
              >
                Yenile
              </button>
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        theme="dark"
      />
    </div>
  );
}
