"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../../firebase";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  subscribeToPoll,
  subscribeToMessages,
  sendMessage,
  submitVote,
  updateParticipantConnection,
  getCurrentMatch
} from "../../../../utils/pollUtils";
import TournamentMatchDisplay from "../../../../components/TournamentMatchDisplay";

export default function PollRoomPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const pollId = params.pollId;

  const [poll, setPoll] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const participantId = user ? `participant_${user.uid}` : null;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;

    const unsubscribePoll = subscribeToPoll(pollId, (pollData) => {
      if (!pollData) {
        toast.error("Oylama bulunamadı!");
        router.push("/poll/join");
        return;
      }

      setPoll(pollData);

      // Check if user has voted
      if (user) {
        if (pollData.type === "tournament" && pollData.tournament) {
          const currentMatch = getCurrentMatch(pollData.tournament);
          if (currentMatch && currentMatch.votedUsers?.[user.uid]) {
            setHasVoted(true);
          } else {
            setHasVoted(false);
          }
        } else if (pollData.votedUsers?.[user.uid]) {
          setHasVoted(true);
        }
      }
    });

    const unsubscribeMessages = subscribeToMessages(pollId, (messagesData) => {
      setMessages(messagesData);
    });

    return () => {
      unsubscribePoll();
      unsubscribeMessages();
    };
  }, [pollId, router, user]);

  // Update participant connection status
  useEffect(() => {
    if (!pollId || !participantId || !user) return;

    updateParticipantConnection(pollId, participantId, true);

    const handleBeforeUnload = () => {
      updateParticipantConnection(pollId, participantId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updateParticipantConnection(pollId, participantId, false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pollId, participantId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || sending || !user || !poll) return;

    const trimmedMessage = messageInput.trim();

    try {
      setSending(true);

      // Regular message
      await sendMessage(pollId, {
        userId: user.uid,
        userName: poll.participants?.[participantId]?.name || user.displayName || "Anonymous",
        message: trimmedMessage,
        type: "message"
      });

      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Mesaj gönderilemedi!");
    } finally {
      setSending(false);
    }
  };

  const handleVoteClick = async (voteOption) => {
    if (hasVoted || !user || poll.status !== "active") return;

    try {
      await submitVote(pollId, user.uid, voteOption);
      setHasVoted(true);
      const optionName = voteOption === "left" ? poll.option1 : poll.option2;
      toast.success(`${optionName} seçeneğine oy verdiniz!`);
    } catch (error) {
      console.error("Error voting:", error);
      toast.error(error.message || "Oy kullanılamadı!");
    }
  };

  if (loading || !poll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg text-white">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Giriş yapmalısınız!</p>
      </div>
    );
  }

  // Check poll type
  const isTournament = poll.type === "tournament";
  const currentMatch = isTournament ? getCurrentMatch(poll.tournament) : null;

  // Calculate vote stats
  let totalVotes = 0;
  let leftVotes = 0;
  let rightVotes = 0;
  let leftPercentage = 0;
  let rightPercentage = 0;

  if (isTournament && currentMatch) {
    totalVotes = (currentMatch.votes?.item1 || 0) + (currentMatch.votes?.item2 || 0);
    leftVotes = currentMatch.votes?.item1 || 0;
    rightVotes = currentMatch.votes?.item2 || 0;
  } else if (!isTournament) {
    totalVotes = (poll.votes?.left || 0) + (poll.votes?.right || 0);
    leftVotes = poll.votes?.left || 0;
    rightVotes = poll.votes?.right || 0;
  }

  if (totalVotes > 0) {
    leftPercentage = Math.round((leftVotes / totalVotes) * 100);
    rightPercentage = Math.round((rightVotes / totalVotes) * 100);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md p-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {isTournament && <span className="text-2xl">🏆</span>}
                <h1 className="text-2xl font-bold text-white">{poll.title}</h1>
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
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                poll.status === "active"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : poll.status === "finished"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}>
                {poll.status === "active" ? "🟢 Aktif" : poll.status === "finished" ? "🔴 Bitti" : "🟡 Bekliyor"}
              </div>
              <button
                onClick={() => router.push("/poll/join")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* A vs B Display */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10">
          {/* Title and Round Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {poll.title}
            </h2>
            {isTournament && poll.tournament && (
              <p className="text-sm text-purple-400">
                Rounds of {poll.tournament.totalRounds} Match {poll.tournament.currentMatchIndex + 1}
              </p>
            )}
          </div>

          {/* A vs B Images */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Left Option */}
            <div className="relative group">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30">
                {poll.option1Image ? (
                  <img
                    src={poll.option1Image}
                    alt={poll.option1}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-blue-400">
                    📷
                  </div>
                )}
                {/* Zoom Icon */}
                <div className="absolute top-3 left-3 bg-black/50 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => handleVoteClick("left")}
                disabled={hasVoted || poll.status !== "active"}
                className="w-full mt-3 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-bold text-lg shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {poll.option1}
              </button>
            </div>

            {/* VS Divider */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-4xl font-black px-6 py-3 rounded-2xl shadow-2xl border-4 border-white/20">
                VS
              </div>
            </div>

            {/* Right Option */}
            <div className="relative group">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/30">
                {poll.option2Image ? (
                  <img
                    src={poll.option2Image}
                    alt={poll.option2}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-red-400">
                    📷
                  </div>
                )}
                {/* Zoom Icon */}
                <div className="absolute top-3 right-3 bg-black/50 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => handleVoteClick("right")}
                disabled={hasVoted || poll.status !== "active"}
                className="w-full mt-3 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-bold text-lg shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {poll.option2}
              </button>
            </div>
          </div>

          {/* Vote Stats */}
          {totalVotes > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>{leftVotes} oy ({leftPercentage}%)</span>
                <span>{rightVotes} oy ({rightPercentage}%)</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${leftPercentage}%` }}
                />
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${rightPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Vote Status */}
          <div className={`mt-4 rounded-xl p-3 border text-center ${
            hasVoted
              ? "bg-green-500/10 border-green-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}>
            <p className="text-sm font-semibold text-white">
              {hasVoted ? "✅ Oyunuz Alındı" : "⏳ Lütfen bir seçenek seçin"}
            </p>
          </div>
        </div>

        {/* Chat Room */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 flex flex-col" style={{ height: "400px" }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              💬 Sohbet Odası
              <span className="text-sm font-normal text-gray-400">
                ({messages.length} mesaj)
              </span>
            </h2>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-2">💬</div>
                <p>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isVote = msg.type === "vote";
                const isCurrentUser = msg.userId === user.uid;

                return (
                  <div
                    key={msg.id || msg.timestamp}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isVote
                          ? msg.voteDirection === "left"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : isCurrentUser
                          ? "bg-blue-600 text-white"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {msg.userName}
                      </div>
                      <div className={isVote ? "font-bold" : ""}>
                        {isVote ? `${msg.voteDirection === "left" ? "⬅️" : "➡️"} ${msg.message}` : msg.message}
                      </div>
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Mesajınızı yazın..."
                disabled={sending || poll.status === "finished"}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim() || poll.status === "finished"}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-semibold disabled:cursor-not-allowed"
              >
                {sending ? "..." : "Gönder"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        theme="dark"
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
