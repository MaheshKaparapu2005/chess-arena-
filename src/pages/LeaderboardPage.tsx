import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../models/chess';
import { gameService } from '../services/game.service';
import { Trophy, Medal, Search, TrendingUp, RefreshCw } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    const data = await gameService.getLeaderboard();
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filtered = entries.filter((e) =>
    e.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Rankings</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Arena Leaderboard</h1>
          <p className="text-xs text-stone-400">
            Real-time player ratings calculated dynamically from completed tournament games.
          </p>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs outline-none focus:border-amber-400 transition-colors w-48 sm:w-60"
            />
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Rating (ELO)</th>
                <th className="py-3 px-4">Games</th>
                <th className="py-3 px-4">W / L / D</th>
                <th className="py-3 px-4">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Loading rankings from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No players found matching "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((player) => {
                  const isTop3 = player.rank <= 3;
                  const rankBadgeClass =
                    player.rank === 1
                      ? 'bg-amber-500 text-stone-950 shadow-amber-500/30'
                      : player.rank === 2
                      ? 'bg-slate-300 text-stone-950'
                      : player.rank === 3
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-stone-800 text-stone-400';

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-stone-800/40 transition-colors text-stone-200"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-bold">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${rankBadgeClass}`}
                        >
                          {player.rank}
                        </div>
                      </td>

                      {/* Player info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-stone-100 text-sm">
                            {player.username}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-stone-700">
                            {player.title}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-100">
                        {player.rating}
                      </td>

                      {/* Games Played */}
                      <td className="py-3.5 px-4 text-stone-300">
                        {player.gamesPlayed}
                      </td>

                      {/* W / L / D */}
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-bold">{player.gamesWon}</span>
                        <span className="text-stone-500 mx-1">/</span>
                        <span className="text-red-400 font-bold">{player.gamesLost}</span>
                        <span className="text-stone-500 mx-1">/</span>
                        <span className="text-stone-400 font-bold">{player.gamesDrawn}</span>
                      </td>

                      {/* Win Rate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{player.winRate}</span>
                        </div>
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
  );
};
