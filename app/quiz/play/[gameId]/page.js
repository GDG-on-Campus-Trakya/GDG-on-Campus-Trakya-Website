"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../../firebase";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import {
  subscribeToGame,
  subscribeToLeaderboard,
  subscribeToQuestionWinners,
  submitAnswer,
  updatePlayerConnection,
  calculateScore
} from "../../../../utils/quizUtils";

export default function PlayGamePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId;

  const [game, setGame] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionWinners, setQuestionWinners] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerRank, setPlayerRank] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);

  const playerId = user ? `player_${user.uid}` : null;

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const unsubscribeGame = subscribeToGame(gameId, (gameData) => {
      if (!gameData) {
        toast.error("Oyun bulunamadı!");
        router.push("/game");
        return;
      }

      setGame(gameData);

      // Update current question
      if (gameData.currentQuestion >= 0 && gameData.questions) {
        const newQuestion = gameData.questions[gameData.currentQuestion];

        // Reset answer state when question changes
        if (currentQuestion?.id !== newQuestion.id) {
          setCurrentQuestion(newQuestion);
          setSelectedAnswer(null);
          setHasAnswered(false);
        }
      }

      // Update player score
      if (playerId && gameData.players?.[playerId]) {
        setPlayerScore(gameData.players[playerId].score || 0);

        // Check if already answered current question
        const questionIndex = gameData.currentQuestion;
        if (gameData.players[playerId].answers?.[questionIndex]) {
          setHasAnswered(true);
          setSelectedAnswer(gameData.players[playerId].answers[questionIndex].answer);
        }
      }
    });

    const unsubscribeLeaderboard = subscribeToLeaderboard(gameId, (leaderboardData) => {
      setLeaderboard(leaderboardData);

      // Find player rank
      if (user) {
        const rank = leaderboardData.findIndex((p) => p.userId === user.uid);
        setPlayerRank(rank >= 0 ? rank + 1 : null);
      }
    });

    const unsubscribeWinners = subscribeToQuestionWinners(gameId, (winnersData) => {
      setQuestionWinners(winnersData);
    });

    return () => {
      unsubscribeGame();
      unsubscribeLeaderboard();
      unsubscribeWinners();
    };
  }, [gameId, router, user, playerId, currentQuestion]);

  // Update player connection status
  useEffect(() => {
    if (!gameId || !playerId || !user) return;

    updatePlayerConnection(gameId, playerId, true);

    const handleBeforeUnload = () => {
      updatePlayerConnection(gameId, playerId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updatePlayerConnection(gameId, playerId, false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameId, playerId, user]);

  // Timer
  useEffect(() => {
    if (!game || game.status !== "playing" || !currentQuestion || hasAnswered) return;

    const questionStartTime = game.questionStartedAt;
    const timeLimit = currentQuestion.timeLimit;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game, currentQuestion, hasAnswered]);

  const handleAnswerSelect = async (answerIndex) => {
    if (hasAnswered || !currentQuestion || !game) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    const questionStartTime = game.questionStartedAt;
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = calculateScore(currentQuestion.timeLimit, timeSpent, isCorrect);

    try {
      await submitAnswer(gameId, playerId, game.currentQuestion, {
        answer: answerIndex,
        isCorrect,
        timeSpent,
        pointsEarned
      });

      if (isCorrect) {
        toast.success(`Doğru! +${pointsEarned} puan`);
      } else {
        toast.error("Yanlış cevap!");
      }
    } catch (error) {
      logger.error("Error submitting answer:", error);
      toast.error("Cevap gönderilirken hata oluştu!");
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  };

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
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

  const optionColors = [
    "from-red-500 to-pink-600",
    "from-blue-500 to-cyan-600",
    "from-yellow-500 to-orange-600",
    "from-green-500 to-emerald-600"
  ];

  const optionShapes = ["🔴", "🔷", "🟡", "🟢"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-white font-bold text-sm sm:text-xl truncate max-w-[120px] sm:max-w-none">{game.quizTitle}</div>
            <div className="text-gray-400 text-xs sm:text-base">
              {game.currentQuestion + 1}/{game.totalQuestions}
            </div>
          </div>
          {/* Only show score/rank in classic mode */}
          {game.gameMode !== "kahoot" && (
            <div className="flex items-center gap-2 sm:gap-4">
              {playerRank && (
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  #{playerRank}
                </div>
              )}
              <div className="text-white font-bold text-sm sm:text-xl">
                {playerScore} <span className="hidden sm:inline">puan</span><span className="sm:hidden">p</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Waiting State */}
          {game.status === "waiting" && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 text-center">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">⏳</div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                Oyun Başlamayı Bekliyor...
              </h2>
              <p className="text-base sm:text-xl text-gray-300">
                Host oyunu başlattığında sorular görünecek
              </p>
            </div>
          )}

          {/* Playing State */}
          {game.status === "playing" && currentQuestion && (
            <div className="space-y-4 sm:space-y-6">
              {/* Timer & Question */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="text-white/70 text-sm sm:text-base">Kalan Süre</div>
                  <div className={`text-3xl sm:text-5xl font-bold ${
                    timeLeft <= 5 ? "text-red-500" : "text-white"
                  }`}>
                    {timeLeft}s
                  </div>
                </div>

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                  <div className="mb-4 sm:mb-6">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="w-full max-w-xl mx-auto h-auto rounded-lg"
                    />
                  </div>
                )}

                <h2 className="text-xl sm:text-3xl font-bold text-white text-center">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Status */}
              {hasAnswered ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 text-center">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✓</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Cevabınız Alındı!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300">
                    Sonuçları görmek için diğer oyuncuları bekleyin
                  </p>
                </div>
              ) : (
                /* Options */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered || timeLeft <= 0}
                      className={`
                        bg-gradient-to-r ${optionColors[index]}
                        p-4 sm:p-8 rounded-xl sm:rounded-2xl text-white font-bold text-base sm:text-xl
                        hover:scale-105 active:scale-95 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2 sm:gap-4
                        ${selectedAnswer === index ? "ring-4 ring-white" : ""}
                      `}
                    >
                      <span className="text-2xl sm:text-4xl">{optionShapes[index]}</span>
                      <span className="text-sm sm:text-xl">{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question Review State */}
          {game.status === "question_review" && currentQuestion && (
            <div className="space-y-4 sm:space-y-6">
              {/* Question Winner (Kahoot Mode) */}
              {game.gameMode === "kahoot" && questionWinners[game.currentQuestion] && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl sm:rounded-3xl p-6 sm:p-12 border-4 border-yellow-300 text-center">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                    {questionWinners[game.currentQuestion].userId === user.uid ? "Kazandınız!" : "Kazanan"}
                  </h2>
                  <div className="text-xl sm:text-3xl font-bold text-white mb-2">
                    {questionWinners[game.currentQuestion].name}
                  </div>
                  <div className="text-base sm:text-xl text-white/90">
                    ⚡ En hızlı doğru cevap: {questionWinners[game.currentQuestion].timeSpent.toFixed(2)} saniye
                  </div>
                </div>
              )}

              {/* Result */}
              <div className={`bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 text-center ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? "border-green-500"
                  : "border-red-500"
              }`}>
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">
                  {selectedAnswer === currentQuestion.correctAnswer ? "🎉" : "😔"}
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? "Doğru Cevap!"
                    : "Yanlış Cevap"}
                </h2>
                <p className="text-base sm:text-xl text-gray-300">
                  Doğru cevap: {currentQuestion.options[currentQuestion.correctAnswer]}
                </p>
              </div>

              {/* Leaderboard Preview (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-center">
                    🏆 İlk 5
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.slice(0, 5).map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                            isCurrentPlayer
                              ? "bg-purple-500/30 border border-purple-500"
                              : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="text-sm sm:text-base text-white font-semibold truncate max-w-[150px] sm:max-w-none">
                              {player.name}
                            </span>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-white">
                            {player.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center text-sm sm:text-base text-gray-300">
                Sonraki soruyu bekleyin...
              </div>
            </div>
          )}

          {/* Finished State */}
          {game.status === "finished" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 text-center">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🎊</div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Oyun Bitti!
                </h2>
                {/* Only show score in classic mode */}
                {game.gameMode !== "kahoot" && (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
                      {playerScore} Puan
                    </div>
                    {playerRank && (
                      <div className="text-lg sm:text-xl text-gray-300">
                        Sıralamanız: #{playerRank}
                      </div>
                    )}
                  </>
                )}
                {/* Kahoot mode - different message */}
                {game.gameMode === "kahoot" && (
                  <div className="text-base sm:text-lg text-gray-300 mt-4">
                    Teşekkürler! Her soru için kazananlar gösterildi.
                  </div>
                )}
              </div>

              {/* Final Leaderboard (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
                    🏆 Final Sıralaması
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                            index === 0
                              ? "bg-yellow-500/20 border-2 border-yellow-500"
                              : index === 1
                              ? "bg-gray-400/20 border-2 border-gray-400"
                              : index === 2
                              ? "bg-orange-500/20 border-2 border-orange-500"
                              : isCurrentPlayer
                              ? "bg-purple-500/30 border border-purple-500"
                              : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-2xl sm:text-3xl font-bold text-white w-8 sm:w-12">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm sm:text-lg text-white font-bold truncate max-w-[150px] sm:max-w-none">
                                {player.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-400">
                                ✅ {player.correctAnswers}/{game.totalQuestions} doğru
                              </div>
                            </div>
                          </div>
                          <div className="text-xl sm:text-2xl font-bold text-white">
                            {player.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push("/quiz/join")}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-bold text-lg sm:text-xl"
              >
                Yeni Oyuna Katıl
              </button>
            </div>
          )}
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
    </div>
  );
}
