import { ref, set, get, update, remove, onValue, off, push } from "firebase/database";
import { realtimeDb, storage } from "../firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Generate a unique 6-digit poll code
 */
export const generatePollCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Extract name from filename (remove extension)
 */
const getNameFromFilename = (filename) => {
  return filename.replace(/\.[^/.]+$/, ""); // Remove extension
};

/**
 * Shuffle array randomly
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Create tournament bracket from items
 * @param {Array} items - Array of items with {name, imageUrl}
 * @returns {Object} Tournament structure
 */
export const createTournamentBracket = (items) => {
  // Shuffle items for randomness
  const shuffled = shuffleArray(items);

  // Calculate number of rounds needed
  const numRounds = Math.ceil(Math.log2(shuffled.length));

  // Create initial matchups (Round 1)
  const matchups = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      matchups.push({
        id: `match_${i / 2}`,
        item1: shuffled[i],
        item2: shuffled[i + 1],
        votes: { item1: 0, item2: 0 },
        votedUsers: {},
        status: "waiting", // waiting, active, completed
        winner: null
      });
    } else {
      // Bye - automatically advance
      matchups.push({
        id: `match_${i / 2}`,
        item1: shuffled[i],
        item2: null,
        votes: { item1: 0, item2: 0 },
        votedUsers: {},
        status: "completed",
        winner: shuffled[i]
      });
    }
  }

  return {
    totalRounds: numRounds,
    currentRound: 1,
    currentMatchIndex: 0,
    rounds: {
      1: matchups
    }
  };
};

/**
 * Upload images to Firebase Storage
 * @param {Array} files - Array of File objects
 * @param {string} pollId - Poll ID for folder structure
 * @returns {Promise<Array>} Array of {name, imageUrl}
 */
export const uploadPollImages = async (files, pollId) => {
  const uploadPromises = files.map(async (file) => {
    const fileName = file.name;
    const name = getNameFromFilename(fileName);
    const imageRef = storageRef(storage, `polls/${pollId}/${fileName}`);

    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);

    return { name, imageUrl, fileName };
  });

  return await Promise.all(uploadPromises);
};

/**
 * Create a new tournament poll
 * @param {Object} pollData - Poll configuration with images
 * @returns {Promise<string>} Poll ID
 */
export const createTournamentPoll = async (pollData) => {
  const pollCode = generatePollCode();
  const pollId = `poll_${Date.now()}_${pollCode}`;
  const pollRef = ref(realtimeDb, `polls/${pollId}`);

  // Create tournament bracket
  const tournament = createTournamentBracket(pollData.items);

  const poll = {
    title: pollData.title,
    description: pollData.description || "",
    pollCode,
    type: "tournament", // tournament or simple
    status: "waiting", // waiting, active, finished
    createdAt: Date.now(),
    createdBy: pollData.createdBy,
    createdByName: pollData.createdByName,
    createdByEmail: pollData.createdByEmail,
    participants: {},
    messages: {},
    tournament,
    allItems: pollData.items // Keep all items for reference
  };

  await set(pollRef, poll);
  return pollId;
};

/**
 * Create a simple poll (text-based, 2 options)
 * @param {Object} pollData - Poll configuration
 * @returns {Promise<string>} Poll ID
 */
export const createPoll = async (pollData) => {
  const pollCode = generatePollCode();
  const pollId = `poll_${Date.now()}_${pollCode}`;
  const pollRef = ref(realtimeDb, `polls/${pollId}`);

  const poll = {
    ...pollData,
    pollCode,
    type: "simple",
    status: "waiting",
    createdAt: Date.now(),
    participants: {},
    messages: {},
    votes: {
      option1: 0,
      option2: 0
    },
    votedUsers: {}
  };

  await set(pollRef, poll);
  return pollId;
};

/**
 * Get current active match in tournament
 * @param {Object} tournament - Tournament object
 * @returns {Object|null} Current match or null
 */
export const getCurrentMatch = (tournament) => {
  if (!tournament) return null;

  const currentRound = tournament.rounds[tournament.currentRound];
  if (!currentRound) return null;

  return currentRound[tournament.currentMatchIndex];
};

/**
 * Submit vote for tournament match
 * @param {string} pollId - Poll ID
 * @param {string} userId - User ID
 * @param {number} vote - Vote option (1 or 2)
 * @returns {Promise<boolean>} Success status
 */
export const submitTournamentVote = async (pollId, userId, vote) => {
  try {
    const pollRef = ref(realtimeDb, `polls/${pollId}`);
    const pollSnapshot = await get(pollRef);

    if (!pollSnapshot.exists()) {
      throw new Error("Poll not found");
    }

    const poll = pollSnapshot.val();

    if (poll.status !== "active") {
      throw new Error("Poll is not active");
    }

    const tournament = poll.tournament;
    const currentMatch = getCurrentMatch(tournament);

    if (!currentMatch || currentMatch.status !== "active") {
      throw new Error("No active match");
    }

    // Check if user already voted in this match
    if (currentMatch.votedUsers && currentMatch.votedUsers[userId]) {
      throw new Error("User already voted in this match");
    }

    // Determine which item to vote for
    const voteOption = vote === 1 ? "item1" : "item2";

    // Update votes count in the current match
    const matchPath = `polls/${pollId}/tournament/rounds/${tournament.currentRound}/${tournament.currentMatchIndex}`;
    const votesPath = `${matchPath}/votes/${voteOption}`;
    const votedUsersPath = `${matchPath}/votedUsers/${userId}`;

    const currentVotes = currentMatch.votes?.[voteOption] || 0;
    await set(ref(realtimeDb, votesPath), currentVotes + 1);
    await set(ref(realtimeDb, votedUsersPath), {
      vote,
      votedAt: Date.now()
    });

    // Send vote message to chat
    await sendMessage(pollId, {
      userId,
      userName: poll.participants[`participant_${userId}`]?.name || "Anonymous",
      message: vote.toString(),
      type: "vote"
    });

    return true;
  } catch (error) {
    console.error("Error submitting tournament vote:", error);
    throw error;
  }
};

/**
 * Start next match in tournament
 * @param {string} pollId - Poll ID
 * @returns {Promise<boolean>} Success status
 */
export const startNextMatch = async (pollId) => {
  try {
    const pollRef = ref(realtimeDb, `polls/${pollId}`);
    const pollSnapshot = await get(pollRef);

    if (!pollSnapshot.exists()) {
      throw new Error("Poll not found");
    }

    const poll = pollSnapshot.val();
    const tournament = poll.tournament;
    const currentRound = tournament.rounds[tournament.currentRound];
    const currentMatch = currentRound[tournament.currentMatchIndex];

    // Mark current match as active
    const matchPath = `polls/${pollId}/tournament/rounds/${tournament.currentRound}/${tournament.currentMatchIndex}/status`;
    await set(ref(realtimeDb, matchPath), "active");

    return true;
  } catch (error) {
    console.error("Error starting match:", error);
    throw error;
  }
};

/**
 * Complete current match and determine winner
 * @param {string} pollId - Poll ID
 * @returns {Promise<Object>} Winner and next match info
 */
export const completeCurrentMatch = async (pollId) => {
  try {
    const pollRef = ref(realtimeDb, `polls/${pollId}`);
    const pollSnapshot = await get(pollRef);

    if (!pollSnapshot.exists()) {
      throw new Error("Poll not found");
    }

    const poll = pollSnapshot.val();
    const tournament = poll.tournament;
    const currentRound = tournament.rounds[tournament.currentRound];
    const currentMatch = currentRound[tournament.currentMatchIndex];

    // Determine winner based on votes
    const winner = currentMatch.votes.item1 >= currentMatch.votes.item2
      ? currentMatch.item1
      : currentMatch.item2;

    // Update match status and winner
    const matchPath = `polls/${pollId}/tournament/rounds/${tournament.currentRound}/${tournament.currentMatchIndex}`;
    await update(ref(realtimeDb, matchPath), {
      status: "completed",
      winner
    });

    // Check if round is complete
    const allMatchesComplete = currentRound.every((m, idx) =>
      idx === tournament.currentMatchIndex || m.status === "completed"
    );

    if (allMatchesComplete && tournament.currentMatchIndex === currentRound.length - 1) {
      // Round complete, create next round
      const winners = currentRound.map(m => m.winner || m.item1); // Include byes

      if (winners.length === 1) {
        // Tournament complete!
        await update(ref(realtimeDb, `polls/${pollId}`), {
          status: "finished",
          winner: winners[0]
        });

        return { tournamentComplete: true, winner: winners[0] };
      } else {
        // Create next round
        const nextRound = [];
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            nextRound.push({
              id: `match_${i / 2}`,
              item1: winners[i],
              item2: winners[i + 1],
              votes: { item1: 0, item2: 0 },
              votedUsers: {},
              status: "waiting",
              winner: null
            });
          } else {
            // Bye
            nextRound.push({
              id: `match_${i / 2}`,
              item1: winners[i],
              item2: null,
              votes: { item1: 0, item2: 0 },
              votedUsers: {},
              status: "completed",
              winner: winners[i]
            });
          }
        }

        const nextRoundNumber = tournament.currentRound + 1;
        await set(ref(realtimeDb, `polls/${pollId}/tournament/rounds/${nextRoundNumber}`), nextRound);
        await update(ref(realtimeDb, `polls/${pollId}/tournament`), {
          currentRound: nextRoundNumber,
          currentMatchIndex: 0
        });

        return { roundComplete: true, nextRound: nextRoundNumber };
      }
    } else {
      // Move to next match in current round
      const nextMatchIndex = tournament.currentMatchIndex + 1;
      await set(ref(realtimeDb, `polls/${pollId}/tournament/currentMatchIndex`), nextMatchIndex);

      return { nextMatch: nextMatchIndex };
    }
  } catch (error) {
    console.error("Error completing match:", error);
    throw error;
  }
};

/**
 * Find poll by code
 * @param {string} pollCode - 6-digit poll code
 * @returns {Promise<Object|null>} Poll data with ID
 */
export const findPollByCode = async (pollCode) => {
  const pollsRef = ref(realtimeDb, 'polls');
  const snapshot = await get(pollsRef);

  if (!snapshot.exists()) return null;

  const polls = snapshot.val();
  const pollEntry = Object.entries(polls).find(
    ([id, poll]) => poll.pollCode === pollCode
  );

  if (!pollEntry) return null;

  return {
    id: pollEntry[0],
    ...pollEntry[1]
  };
};

/**
 * Get active poll (only one poll can be active at a time)
 * @returns {Promise<Object|null>} Active poll data with ID
 */
export const getActivePoll = async () => {
  const pollsRef = ref(realtimeDb, 'polls');
  const snapshot = await get(pollsRef);

  if (!snapshot.exists()) return null;

  const polls = snapshot.val();
  const activePollEntry = Object.entries(polls).find(
    ([id, poll]) => poll.status === "active"
  );

  if (!activePollEntry) return null;

  return {
    id: activePollEntry[0],
    ...activePollEntry[1]
  };
};

/**
 * Add participant to poll
 * @param {string} pollId - Poll ID
 * @param {Object} userData - User information
 * @returns {Promise<string>} Participant ID
 */
export const addParticipantToPoll = async (pollId, userData) => {
  const participantId = `participant_${userData.userId}`;
  const participantRef = ref(realtimeDb, `polls/${pollId}/participants/${participantId}`);

  const participant = {
    ...userData,
    joinedAt: Date.now(),
    isConnected: true,
    hasVoted: false
  };

  await set(participantRef, participant);
  return participantId;
};

/**
 * Update poll status
 * @param {string} pollId - Poll ID
 * @param {string} status - New status (waiting, active, finished)
 */
export const updatePollStatus = async (pollId, status) => {
  const statusRef = ref(realtimeDb, `polls/${pollId}/status`);
  await set(statusRef, status);
};

/**
 * Send message to poll chat
 * @param {string} pollId - Poll ID
 * @param {Object} messageData - Message details
 * @returns {Promise<string>} Message ID
 */
export const sendMessage = async (pollId, messageData) => {
  const messagesRef = ref(realtimeDb, `polls/${pollId}/messages`);
  const newMessageRef = push(messagesRef);

  const message = {
    ...messageData,
    timestamp: Date.now(),
    id: newMessageRef.key
  };

  await set(newMessageRef, message);
  return newMessageRef.key;
};

/**
 * Submit vote (for simple polls, "left" or "right")
 * @param {string} pollId - Poll ID
 * @param {string} userId - User ID
 * @param {string} vote - Vote option ("left" or "right")
 * @returns {Promise<boolean>} Success status
 */
export const submitVote = async (pollId, userId, vote) => {
  try {
    // Check if poll is active
    const pollRef = ref(realtimeDb, `polls/${pollId}`);
    const pollSnapshot = await get(pollRef);

    if (!pollSnapshot.exists()) {
      throw new Error("Poll not found");
    }

    const poll = pollSnapshot.val();

    if (poll.status !== "active") {
      throw new Error("Poll is not active");
    }

    // Check poll type and delegate accordingly
    if (poll.type === "tournament") {
      return await submitTournamentVote(pollId, userId, vote === "left" ? 1 : 2);
    }

    // Simple poll logic
    if (poll.votedUsers && poll.votedUsers[userId]) {
      throw new Error("User already voted");
    }

    const voteOption = vote; // "left" or "right"

    const votesRef = ref(realtimeDb, `polls/${pollId}/votes/${voteOption}`);
    const currentVotes = poll.votes?.[voteOption] || 0;
    await set(votesRef, currentVotes + 1);

    const votedUserRef = ref(realtimeDb, `polls/${pollId}/votedUsers/${userId}`);
    await set(votedUserRef, {
      vote,
      votedAt: Date.now()
    });

    const participantRef = ref(realtimeDb, `polls/${pollId}/participants/participant_${userId}/hasVoted`);
    await set(participantRef, true);

    const optionName = vote === "left" ? poll.option1 : poll.option2;
    await sendMessage(pollId, {
      userId,
      userName: poll.participants[`participant_${userId}`]?.name || "Anonymous",
      message: optionName,
      voteDirection: vote,
      type: "vote"
    });

    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
};

/**
 * Update participant connection status
 * @param {string} pollId - Poll ID
 * @param {string} participantId - Participant ID
 * @param {boolean} isConnected - Connection status
 */
export const updateParticipantConnection = async (pollId, participantId, isConnected) => {
  const connectionRef = ref(realtimeDb, `polls/${pollId}/participants/${participantId}/isConnected`);
  await set(connectionRef, isConnected);
};

/**
 * Subscribe to poll updates
 * @param {string} pollId - Poll ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPoll = (pollId, callback) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);

  onValue(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: pollId, ...snapshot.val() });
    } else {
      callback(null);
    }
  });

  return () => off(pollRef);
};

/**
 * Subscribe to poll messages
 * @param {string} pollId - Poll ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessages = (pollId, callback) => {
  const messagesRef = ref(realtimeDb, `polls/${pollId}/messages`);

  onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const messages = snapshot.val();
      const messageArray = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);
      callback(messageArray);
    } else {
      callback([]);
    }
  });

  return () => off(messagesRef);
};

/**
 * End poll and clean up
 * @param {string} pollId - Poll ID
 */
export const endPoll = async (pollId) => {
  await updatePollStatus(pollId, "finished");
};

/**
 * Delete poll (cleanup)
 * @param {string} pollId - Poll ID
 */
export const deletePoll = async (pollId) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);
  await remove(pollRef);
};

/**
 * Get all polls (for admin)
 * @returns {Promise<Array>} Array of polls
 */
export const getAllPolls = async () => {
  const pollsRef = ref(realtimeDb, 'polls');
  const snapshot = await get(pollsRef);

  if (!snapshot.exists()) return [];

  const polls = snapshot.val();
  return Object.entries(polls).map(([id, poll]) => ({
    id,
    ...poll
  })).sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Clear all finished polls (admin utility)
 */
export const clearFinishedPolls = async () => {
  const polls = await getAllPolls();
  const finishedPolls = polls.filter(p => p.status === "finished");

  for (const poll of finishedPolls) {
    await deletePoll(poll.id);
  }

  return finishedPolls.length;
};
