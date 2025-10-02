import { ref, set, get, update, remove, onValue, off } from "firebase/database";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { realtimeDb, db } from "../firebase";

/**
 * Generate a unique 6-digit game code
 */
export const generateGameCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate points based on time spent and correctness
 * @param {number} timeLimit - Question time limit in seconds
 * @param {number} timeSpent - Time taken to answer in seconds
 * @param {boolean} isCorrect - Whether answer is correct
 * @returns {number} Points earned
 */
export const calculateScore = (timeLimit, timeSpent, isCorrect) => {
  if (!isCorrect) return 0;

  const MAX_POINTS = 1000;
  const timeBonus = Math.max(0, (timeLimit - timeSpent) / timeLimit);
  const points = Math.round(MAX_POINTS * (0.5 + 0.5 * timeBonus));

  return Math.max(500, points); // Minimum 500 points for correct answer
};

/**
 * Create a new game session
 * @param {Object} gameData - Game configuration
 * @returns {Promise<string>} Game ID
 */
export const createGame = async (gameData) => {
  const gameCode = generateGameCode();
  const gameId = `game_${Date.now()}_${gameCode}`;
  const gameRef = ref(realtimeDb, `games/${gameId}`);

  const game = {
    ...gameData,
    gameCode,
    status: "waiting",
    currentQuestion: -1, // -1 means not started
    questionStartedAt: null,
    createdAt: Date.now(),
    players: {},
    leaderboard: []
  };

  await set(gameRef, game);
  return gameId;
};

/**
 * @param {string} gameCode - 6-digit game code
 * @returns {Promise<Object|null>} Game data with ID
 */
export const findGameByCode = async (gameCode) => {
  try {
    const gamesRef = ref(realtimeDb, 'games');
    const snapshot = await get(gamesRef);

    if (!snapshot.exists()) return null;

    const games = snapshot.val();

    // Optimize: Early return if no games
    if (!games || typeof games !== 'object') return null;

    // Optimize: Use for...of instead of find for better performance
    const entries = Object.entries(games);
    for (const [id, game] of entries) {
      if (game && game.gameCode === gameCode) {
        return {
          id,
          ...game
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding game by code:', error);
    return null;
  }
};

/**
 * Add player to game
 * @param {string} gameId - Game ID
 * @param {Object} playerData - Player information
 * @returns {Promise<string>} Player ID
 */
export const addPlayerToGame = async (gameId, playerData) => {
  const playerId = `player_${playerData.userId}`;
  const playerRef = ref(realtimeDb, `games/${gameId}/players/${playerId}`);

  const player = {
    ...playerData,
    score: 0,
    answers: {},
    joinedAt: Date.now(),
    isConnected: true
  };

  await set(playerRef, player);
  return playerId;
};

/**
 * Update game status
 * @param {string} gameId - Game ID
 * @param {string} status - New status (waiting, playing, question_review, finished)
 */
export const updateGameStatus = async (gameId, status) => {
  const statusRef = ref(realtimeDb, `games/${gameId}/status`);
  await set(statusRef, status);
};

/**
 * Move to next question
 * @param {string} gameId - Game ID
 * @param {number} questionIndex - Next question index
 */
export const nextQuestion = async (gameId, questionIndex) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);
  await update(gameRef, {
    currentQuestion: questionIndex,
    questionStartedAt: Date.now(),
    status: "playing"
  });
};

/**
 * Submit player answer
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {number} questionIndex - Question index
 * @param {Object} answerData - Answer details
 */
export const submitAnswer = async (gameId, playerId, questionIndex, answerData) => {
  const answerRef = ref(realtimeDb, `games/${gameId}/players/${playerId}/answers/${questionIndex}`);
  await set(answerRef, {
    ...answerData,
    answeredAt: Date.now()
  });

  // Update player score
  if (answerData.isCorrect) {
    const playerRef = ref(realtimeDb, `games/${gameId}/players/${playerId}`);
    const playerSnapshot = await get(playerRef);
    const currentScore = playerSnapshot.val().score || 0;
    await update(playerRef, {
      score: currentScore + answerData.pointsEarned
    });
  }
};

/**
 * Calculate and update leaderboard
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} Updated leaderboard
 */
export const updateLeaderboard = async (gameId) => {
  const playersRef = ref(realtimeDb, `games/${gameId}/players`);
  const snapshot = await get(playersRef);

  if (!snapshot.exists()) return [];

  const players = snapshot.val();
  const leaderboard = Object.entries(players)
    .map(([id, player]) => {
      const correctAnswers = Object.values(player.answers || {})
        .filter(a => a.isCorrect).length;

      return {
        userId: player.userId,
        name: player.name,
        score: player.score || 0,
        correctAnswers,
        avatar: player.avatar
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));

  const leaderboardRef = ref(realtimeDb, `games/${gameId}/leaderboard`);
  await set(leaderboardRef, leaderboard);

  return leaderboard;
};

/**
 * Check if all players have answered current question
 * @param {string} gameId - Game ID
 * @param {number} questionIndex - Current question index
 * @returns {Promise<boolean>}
 */
export const allPlayersAnswered = async (gameId, questionIndex) => {
  const playersRef = ref(realtimeDb, `games/${gameId}/players`);
  const snapshot = await get(playersRef);

  if (!snapshot.exists()) return true;

  const players = snapshot.val();
  const connectedPlayers = Object.values(players).filter(p => p.isConnected);

  if (connectedPlayers.length === 0) return true;

  const answeredCount = connectedPlayers.filter(
    player => player.answers && player.answers[questionIndex]
  ).length;

  return answeredCount === connectedPlayers.length;
};

/**
 * Save game results to Firestore
 * @param {string} gameId - Game ID
 * @returns {Promise<string>} Result document ID
 */
export const saveGameResults = async (gameId) => {
  try {
    // Get full game data from Realtime DB
    const gameRef = ref(realtimeDb, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.val();
    const players = game.players || {};
    const leaderboard = game.leaderboard || [];

    // Calculate detailed statistics
    const playerStats = Object.entries(players).map(([id, player]) => {
      const answers = player.answers || {};
      const correctAnswers = Object.values(answers).filter(a => a.isCorrect).length;
      const totalAnswers = Object.keys(answers).length;
      const averageTimeSpent = totalAnswers > 0
        ? Object.values(answers).reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAnswers
        : 0;

      return {
        userId: player.userId,
        name: player.name,
        email: player.email,
        faculty: player.faculty || "",
        department: player.department || "",
        score: player.score || 0,
        correctAnswers,
        totalAnswers,
        averageTimeSpent: Math.round(averageTimeSpent * 10) / 10,
        rank: leaderboard.find(l => l.userId === player.userId)?.rank || 999
      };
    });

    // Sort by rank
    playerStats.sort((a, b) => a.rank - b.rank);

    // Get winner
    const winner = playerStats.length > 0 ? playerStats[0] : null;

    // Calculate game statistics
    const totalPlayers = playerStats.length;
    const averageScore = totalPlayers > 0
      ? Math.round(playerStats.reduce((sum, p) => sum + p.score, 0) / totalPlayers)
      : 0;
    const averageCorrectAnswers = totalPlayers > 0
      ? Math.round((playerStats.reduce((sum, p) => sum + p.correctAnswers, 0) / totalPlayers) * 10) / 10
      : 0;

    // Prepare result document
    const resultData = {
      gameId,
      gameCode: game.gameCode,
      quizId: game.quizId,
      quizTitle: game.quizTitle,
      hostId: game.hostId,
      hostName: game.hostName,

      // Game info
      totalQuestions: game.totalQuestions,
      createdAt: Timestamp.fromMillis(game.createdAt),
      finishedAt: Timestamp.now(),
      duration: Date.now() - game.createdAt, // in milliseconds

      // Winner info
      winner: winner ? {
        userId: winner.userId,
        name: winner.name,
        score: winner.score,
        correctAnswers: winner.correctAnswers
      } : null,

      // Top 3 players
      topThree: playerStats.slice(0, 3).map(p => ({
        userId: p.userId,
        name: p.name,
        score: p.score,
        rank: p.rank
      })),

      // All players detailed stats
      players: playerStats,

      // Overall statistics
      stats: {
        totalPlayers,
        averageScore,
        averageCorrectAnswers,
        highestScore: winner?.score || 0,
        lowestScore: playerStats.length > 0 ? playerStats[playerStats.length - 1].score : 0
      }
    };

    // Save to Firestore
    const resultsRef = collection(db, "gameResults");
    const docRef = await addDoc(resultsRef, resultData);

    console.log("Game results saved to Firestore:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving game results:", error);
    throw error;
  }
};

/**
 * End game and clean up
 * @param {string} gameId - Game ID
 */
export const endGame = async (gameId) => {
  await updateLeaderboard(gameId);
  await updateGameStatus(gameId, "finished");

  // Save results to Firestore
  try {
    await saveGameResults(gameId);

    // Clean up Realtime DB after successful save to Firestore
    // Wait a bit to ensure clients can see final state
    setTimeout(async () => {
      try {
        await deleteGame(gameId);
        console.log(`Game ${gameId} cleaned up from Realtime DB`);
      } catch (error) {
        console.error("Failed to cleanup game from Realtime DB:", error);
      }
    }, 30000); // Wait 30 seconds before cleanup
  } catch (error) {
    console.error("Failed to save game results:", error);
    // Don't throw error, game still ends successfully
  }
};

/**
 * Delete game (cleanup)
 * @param {string} gameId - Game ID
 */
export const deleteGame = async (gameId) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);
  await remove(gameRef);
};

/**
 * Subscribe to game updates
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGame = (gameId, callback) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);

  onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: gameId, ...snapshot.val() });
    } else {
      callback(null);
    }
  });

  return () => off(gameRef);
};

/**
 * Subscribe to players updates
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPlayers = (gameId, callback) => {
  const playersRef = ref(realtimeDb, `games/${gameId}/players`);

  onValue(playersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(playersRef);
};

/**
 * Subscribe to leaderboard updates
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToLeaderboard = (gameId, callback) => {
  const leaderboardRef = ref(realtimeDb, `games/${gameId}/leaderboard`);

  onValue(leaderboardRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  });

  return () => off(leaderboardRef);
};

/**
 * Update player connection status
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {boolean} isConnected - Connection status
 */
export const updatePlayerConnection = async (gameId, playerId, isConnected) => {
  const connectionRef = ref(realtimeDb, `games/${gameId}/players/${playerId}/isConnected`);
  await set(connectionRef, isConnected);
};

/**
 * Get game statistics
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Game statistics
 */
export const getGameStats = async (gameId) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) return null;

  const game = snapshot.val();
  const players = game.players || {};
  const playerList = Object.values(players);

  return {
    totalPlayers: playerList.length,
    connectedPlayers: playerList.filter(p => p.isConnected).length,
    averageScore: playerList.reduce((sum, p) => sum + (p.score || 0), 0) / playerList.length || 0,
    questionsCompleted: game.currentQuestion + 1,
    totalQuestions: game.totalQuestions
  };
};
