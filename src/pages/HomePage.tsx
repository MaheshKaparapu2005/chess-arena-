import React from 'react';
import { GameMode } from '../models/chess';
import {
  Swords,
  Monitor,
  Globe,
  Trophy,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  BookOpen,
  Target,
  Compass,
  GraduationCap,
  Eye,
  Award,
} from 'lucide-react';

interface HomePageProps {
  onStartGame: (mode: GameMode, options?: any) => void;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartGame, onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Hero Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Chess Arena • Grandmaster Educational Academy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Master Every Move in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              Chess Arena
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
            A premier chess platform with full FIDE rules, sound effects, daily tactics,
            interactive opening repertoire training, and theoretical endgame mastery.
          </p>

          {/* Quick Play & Learn Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => onStartGame('computer')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer group"
            >
              <Monitor className="w-6 h-6 mb-1.5 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">vs Computer</span>
              <span className="text-[10px] font-medium opacity-85">Play AI bot</span>
            </button>

            <button
              onClick={() => onNavigate('openings')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-amber-500/30 text-amber-300 font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md"
            >
              <Compass className="w-6 h-6 mb-1.5 text-amber-400 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">Opening Explorer</span>
              <span className="text-[10px] text-stone-400 font-medium">Repertoire Theory</span>
            </button>

            <button
              onClick={() => onNavigate('endgames')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-emerald-500/30 text-emerald-300 font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-6 h-6 mb-1.5 text-emerald-400 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">Endgame Lab</span>
              <span className="text-[10px] text-stone-400 font-medium">Lucena & Philidor</span>
            </button>

            <button
              onClick={() => onNavigate('puzzles')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 border border-rose-500/50 text-white font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-rose-950/40"
            >
              <Target className="w-6 h-6 mb-1.5 text-rose-200 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">Daily Tactics</span>
              <span className="text-[10px] text-rose-200 font-medium">Puzzles & Streaks</span>
            </button>

            <button
              onClick={() => onStartGame('online')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-100 font-bold transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Globe className="w-6 h-6 mb-1.5 text-indigo-400 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">Online Match</span>
              <span className="text-[10px] text-stone-400 font-medium">Socket.IO Rooms</span>
            </button>

            <button
              onClick={() => onStartGame('local')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-100 font-bold transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Swords className="w-6 h-6 mb-1.5 text-emerald-400 stroke-[2.2]" />
              <span className="text-xs sm:text-sm">Pass & Play</span>
              <span className="text-[10px] text-stone-400 font-medium">Local 2-Player</span>
            </button>
          </div>
        </div>

        {/* Right Hero Graphic Showcase */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[400px] aspect-square rounded-3xl p-3 bg-gradient-to-tr from-stone-900 to-stone-800 border-2 border-stone-700 shadow-2xl overflow-hidden group">
            {/* Visual Board Mockup */}
            <div className="w-full h-full grid grid-cols-4 grid-rows-4 rounded-2xl overflow-hidden opacity-90">
              {[...Array(16)].map((_, i) => {
                const r = Math.floor(i / 4);
                const c = i % 4;
                const isLight = (r + c) % 2 === 0;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center ${
                      isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'
                    }`}
                  >
                    {i === 2 && <span className="text-3xl filter drop-shadow">♞</span>}
                    {i === 5 && <span className="text-3xl filter drop-shadow">♛</span>}
                    {i === 10 && <span className="text-3xl filter drop-shadow">♚</span>}
                    {i === 13 && <span className="text-3xl filter drop-shadow">♜</span>}
                  </div>
                );
              })}
            </div>

            {/* Floating Overlays */}
            <div className="absolute top-5 right-5 p-2.5 rounded-xl bg-stone-900/90 border border-amber-500/40 text-xs shadow-xl flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-stone-200">Legal Move Engine Active</span>
            </div>

            <div className="absolute bottom-5 left-5 p-2.5 rounded-xl bg-stone-900/90 border border-indigo-500/40 text-xs shadow-xl flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-stone-200">Educational Best-Move Mentor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Academy Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <span>Chess Arena Learning Academy</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Transform your game with deep strategic theory, practical endgame drills, and tactical sight.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Openings */}
          <div
            onClick={() => onNavigate('openings')}
            className="p-5 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-900/60 border border-amber-500/30 hover:border-amber-500/60 shadow-lg hover:scale-[1.01] transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Interactive Drill
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 group-hover:text-amber-300 transition-colors">
                Opening Explorer & Trainer
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed mt-1">
                Explore the deep plans behind the Ruy Lopez, Sicilian Najdorf, French Defense, and King's Indian. Test your memory against book moves!
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Study Repertoire</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Endgame Lab */}
          <div
            onClick={() => onNavigate('endgames')}
            className="p-5 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-900/60 border border-emerald-500/30 hover:border-emerald-500/60 shadow-lg hover:scale-[1.01] transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Essential Mastery
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 group-hover:text-emerald-300 transition-colors">
                Theoretical Endgame Lab
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed mt-1">
                Master the fundamental endgames every player must know: Building the Bridge in Lucena, the Philidor Defense, Opposition, and Rook checkmates.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Endgame Lab</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Daily Tactics */}
          <div
            onClick={() => onNavigate('puzzles')}
            className="p-5 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-900/60 border border-rose-500/30 hover:border-rose-500/60 shadow-lg hover:scale-[1.01] transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                Daily Rating
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 group-hover:text-rose-300 transition-colors">
                Tactical Puzzles & Gym
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed mt-1">
                Sharpen pattern recognition with forks, pins, deflection sacrifices, and back-rank checkmates with progressive hints and rating tracking.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Solve Tactics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 border-t border-stone-800/80">
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-100">100% Rule Compliance</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Strict legal validation: en passant, castling with attacked-square checks, pawn promotions, and absolute king safety.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-100">Educational Move Assist & Review</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Toggle move indicators, post-game engine review with blunder alerts, and rule-based best move suggestions with tactical reasoning.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-100">Persistent ELO & Stats</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Track wins, losses, win rates, and climb the dynamic leaderboard powered by MongoDB and REST APIs.
          </p>
        </div>
      </div>
    </div>
  );
};
