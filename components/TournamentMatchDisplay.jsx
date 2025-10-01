"use client";

export default function TournamentMatchDisplay({ poll, currentMatch, hasVoted, onVote }) {
  if (!currentMatch || !poll) return null;

  const totalVotes = (currentMatch.votes?.item1 || 0) + (currentMatch.votes?.item2 || 0);
  const item1Percentage = totalVotes > 0 ? Math.round((currentMatch.votes?.item1 || 0) / totalVotes * 100) : 0;
  const item2Percentage = totalVotes > 0 ? Math.round((currentMatch.votes?.item2 || 0) / totalVotes * 100) : 0;

  const isActive = currentMatch.status === "active";

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {poll.title}
        </h2>
        <p className="text-gray-300">
          Tur {poll.tournament.currentRound}/{poll.tournament.totalRounds} •
          Maç {poll.tournament.currentMatchIndex + 1}
        </p>
      </div>

      {/* Match Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item 1 */}
        <button
          onClick={() => !hasVoted && isActive && onVote(1)}
          disabled={hasVoted || !isActive}
          className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all ${
            hasVoted || !isActive
              ? "border-white/20 opacity-75 cursor-not-allowed"
              : "border-blue-500 hover:border-blue-400 hover:scale-105 cursor-pointer"
          }`}
        >
          {/* Image */}
          <div className="mb-4">
            <img
              src={currentMatch.item1.imageUrl}
              alt={currentMatch.item1.name}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold text-white mb-3 text-center">
            {currentMatch.item1.name}
          </h3>

          {/* Vote Badge */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
            1
          </div>

          {/* Vote Count */}
          <div className="flex items-center justify-between text-white font-semibold">
            <span>{currentMatch.votes?.item1 || 0} oy</span>
            <span>{item1Percentage}%</span>
          </div>

          {/* Progress Bar */}
          {totalVotes > 0 && (
            <div className="w-full bg-white/20 rounded-full h-3 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${item1Percentage}%` }}
              />
            </div>
          )}
        </button>

        {/* Item 2 */}
        {currentMatch.item2 ? (
          <button
            onClick={() => !hasVoted && isActive && onVote(2)}
            disabled={hasVoted || !isActive}
            className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 transition-all ${
              hasVoted || !isActive
                ? "border-white/20 opacity-75 cursor-not-allowed"
                : "border-purple-500 hover:border-purple-400 hover:scale-105 cursor-pointer"
            }`}
          >
            {/* Image */}
            <div className="mb-4">
              <img
                src={currentMatch.item2.imageUrl}
                alt={currentMatch.item2.name}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>

            {/* Name */}
            <h3 className="text-2xl font-bold text-white mb-3 text-center">
              {currentMatch.item2.name}
            </h3>

            {/* Vote Badge */}
            <div className="absolute top-4 left-4 bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
              2
            </div>

            {/* Vote Count */}
            <div className="flex items-center justify-between text-white font-semibold">
              <span>{currentMatch.votes?.item2 || 0} oy</span>
              <span>{item2Percentage}%</span>
            </div>

            {/* Progress Bar */}
            {totalVotes > 0 && (
              <div className="w-full bg-white/20 rounded-full h-3 mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${item2Percentage}%` }}
                />
              </div>
            )}
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">⏭️</div>
              <p className="text-white font-semibold">Bye</p>
              <p className="text-gray-400 text-sm">Otomatik geçiş</p>
            </div>
          </div>
        )}
      </div>

      {/* Vote Status */}
      {hasVoted && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-white font-semibold">Oyunuz Alındı!</p>
          <p className="text-gray-300 text-sm">Maç sonucu için bekleyin</p>
        </div>
      )}

      {!isActive && !hasVoted && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-white font-semibold">Maç Başlamayı Bekliyor</p>
        </div>
      )}

      {/* Instructions */}
      {isActive && !hasVoted && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-blue-400 mb-1">Nasıl Oy Verilir?</p>
              <p>Resme tıklayın veya chat'e <span className="font-bold text-white">1</span> veya <span className="font-bold text-white">2</span> yazın.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
