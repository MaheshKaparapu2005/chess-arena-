import React, { useEffect, useState } from 'react';
import { User, GameRecord } from '../models/chess';
import { gameService } from '../services/game.service';
import {
  User as UserIcon,
  Trophy,
  Award,
  TrendingUp,
  History,
  Calendar,
  X,
  Swords,
  Clock,
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User | null;
  onNavigateLogin: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onNavigateLogin }) => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      gameService.getGames(currentUser.id).then((data) => {
        setGames(data);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Player Profile</h2>
        <p className="text-xs text-stone-400 max-w-sm">
          Please log in to view your career statistics, ELO progression, and previous games.
        </p>
        <button
          onClick={onNavigateLogin}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const winRate =
    currentUser.gamesPlayed > 0
      ? Math.round((currentUser.gamesWon / currentUser.gamesPlayed) * 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Player Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-850 border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 text-2xl font-black shadow-inner">
            {currentUser.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{currentUser.username}</h1>
            <p className="text-xs text-stone-400">{currentUser.email}</p>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold text-amber-300">
              {currentUser.rating >= 2500
                ? 'Grandmaster (GM)'
                : currentUser.rating >= 2200
                ? 'International Master (IM)'
                : currentUser.rating >= 1800
                ? 'Expert'
                : 'Tournament Player'}
            </div>
          </div>
        </div>

        {/* Career Rating Badges */}
        <div className="flex items-center space-x-3">
          <div className="text-center px-4 py-2 rounded-2xl bg-stone-950/70 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">ELO Rating</span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {currentUser.rating}
            </div>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl bg-stone-950/70 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">Win Rate</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {winRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-center space-y-1">
          <span className="text-xs font-semibold text-stone-400">Games Played</span>
          <div className="text-2xl font-black text-stone-100">{currentUser.gamesPlayed}</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-center space-y-1">
          <span className="text-xs font-semibold text-emerald-400">Wins</span>
          <div className="text-2xl font-black text-emerald-400">{currentUser.gamesWon}</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-center space-y-1">
          <span className="text-xs font-semibold text-red-400">Losses</span>
          <div className="text-2xl font-black text-red-400">{currentUser.gamesLost}</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-center space-y-1">
          <span className="text-xs font-semibold text-stone-400">Draws</span>
          <div className="text-2xl font-black text-stone-300">{currentUser.gamesDrawn}</div>
        </div>
      </div>

      {/* Game History Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-stone-200 font-bold text-base">
          <History className="w-5 h-5 text-amber-400" />
          <span>Completed Games History</span>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Opponent</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Moves</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      Loading games history...
                    </td>
                  </tr>
                ) : games.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      No completed games recorded yet. Play a game to see your history!
                    </td>
                  </tr>
                ) : (
                  games.map((g) => {
                    const isWhite = g.whitePlayer.id === currentUser.id;
                    const opponent = isWhite ? g.blackPlayer.username : g.whitePlayer.username;
                    const isWin =
                      (g.result === 'white' && isWhite) ||
                      (g.result === 'black' && !isWhite);
                    const isDraw = g.result === 'draw';

                    const resultBadgeClass = isWin
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : isDraw
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : 'bg-red-950 text-red-400 border border-red-500/40';

                    const resultLabel = isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat';

                    return (
                      <tr
                        key={g._id}
                        className="hover:bg-stone-800/40 transition-colors text-stone-300"
                      >
                        <td className="py-3.5 px-4 font-bold text-stone-100">
                          {opponent}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${resultBadgeClass}`}
                          >
                            {resultLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-400">
                          {g.reason || 'Completed'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {g.moves?.length || 0}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500">
                          {new Date(g.startedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedGame(g)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Review Moves
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Game Moves Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedGame.whitePlayer.username} vs {selectedGame.blackPlayer.username}
                </h3>
                <span className="text-xs text-stone-400 capitalize">
                  Result: {selectedGame.result} ({selectedGame.reason})
                </span>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1 font-mono text-xs">
              {selectedGame.moves && selectedGame.moves.length > 0 ? (
                selectedGame.moves.map((m, idx) => (
                  <div key={idx} className="flex space-x-2 text-stone-300">
                    <span className="text-stone-500 w-8">{m.moveNumber}.</span>
                    <span className="font-bold text-amber-300">{m.san}</span>
                    <span className="text-stone-500">({m.from} → {m.to})</span>
                  </div>
                ))
              ) : (
                <div className="text-stone-500 italic">No move notation recorded for this match.</div>
              )}
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedGame(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
