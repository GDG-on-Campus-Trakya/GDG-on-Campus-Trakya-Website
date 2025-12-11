import { NextResponse } from "next/server";
import { getDatabase, getFirestore, verifyIdToken } from "@/utils/firebaseAdmin";

const clampNumber = (value, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
};

const calculateServerScore = (timeLimit, timeSpent, isCorrect) => {
  if (!isCorrect) return 0;

  const MAX_POINTS = 1000;
  const safeLimit = Math.max(1, Number(timeLimit) || 0); // prevent divide by zero
  const timeBonus = Math.max(0, (safeLimit - timeSpent) / safeLimit);
  const points = Math.round(MAX_POINTS * (0.5 + 0.5 * timeBonus));

  return Math.max(500, points);
};

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { gameId, playerId, questionIndex, answerIndex, timeSpent } = body || {};

    if (!gameId || typeof playerId !== "string") {
      return NextResponse.json({ error: "Missing game or player" }, { status: 400 });
    }

    if (playerId !== `player_${userId}`) {
      return NextResponse.json({ error: "Invalid player" }, { status: 403 });
    }

    const dbAdmin = getDatabase();
    const firestoreAdmin = getFirestore();

    if (!dbAdmin || !firestoreAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const gameRef = dbAdmin.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.get();

    if (!gameSnapshot.exists()) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = gameSnapshot.val();

    if (game.status !== "playing") {
      return NextResponse.json({ error: "Game not in playing state" }, { status: 400 });
    }

    const currentQuestionIndex = game.currentQuestion;
    const requestedQuestionIndex = Number(questionIndex);

    if (!Number.isInteger(requestedQuestionIndex) || requestedQuestionIndex !== currentQuestionIndex) {
      return NextResponse.json({ error: "Question index mismatch" }, { status: 400 });
    }

    if (!game.quizId) {
      return NextResponse.json({ error: "Quiz reference missing" }, { status: 400 });
    }

    const quizDoc = await firestoreAdmin.doc(`quizzes/${game.quizId}`).get();
    if (!quizDoc.exists) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = quizDoc.data();
    const question = quiz?.questions?.[requestedQuestionIndex];

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const selectedAnswerIndex = Number(answerIndex);
    if (!Number.isInteger(selectedAnswerIndex)) {
      return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
    }

    const isCorrect = selectedAnswerIndex === question.correctAnswer;
    const safeTimeSpent = clampNumber(timeSpent, 0, Number(question.timeLimit) || 0);
    const pointsEarned = calculateServerScore(question.timeLimit, safeTimeSpent, isCorrect);

    const playerRef = dbAdmin.ref(`games/${gameId}/players/${playerId}`);
    const playerSnapshot = await playerRef.get();

    if (!playerSnapshot.exists()) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = playerSnapshot.val();

    if (player.answers && player.answers[requestedQuestionIndex]) {
      return NextResponse.json({ error: "Already answered" }, { status: 400 });
    }

    const currentScore = player.score || 0;

    const updates = {};
    updates[`players/${playerId}/answers/${requestedQuestionIndex}`] = {
      answer: selectedAnswerIndex,
      isCorrect,
      timeSpent: safeTimeSpent,
      pointsEarned,
      answeredAt: Date.now()
    };
    updates[`players/${playerId}/score`] = currentScore + pointsEarned;

    await gameRef.update(updates);

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsEarned
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

