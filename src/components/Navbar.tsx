import React, { useState, useEffect } from 'react';
import { Crown, Volume2, VolumeX, Trophy, BookOpen, User as UserIcon, LogOut, Swords, Monitor, Globe, Sliders, Target, GraduationCap, Compass, ShieldCheck, Eye } from 'lucide-react';
import { User, GameMode } from '../models/chess';
import { soundService } from '../services/sound.service';
import { SoundSettingsModal } from './SoundSettingsModal';
import { VisionTrainerModal } from './VisionTrainerModal';

interface NavbarProps {
  currentUser: User | null;
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentMode,
  onSelectMode,
  onNavigate,
  currentPage,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showLearnDropdown, setShowLearnDropdown] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);

  useEffect(() => {
    return soundService.subscribe(() => {
      setIsMuted(soundService.getMuted());
    });
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    soundService.setMuted(next);
    setIsMuted(next);
  };

  return (
    <nav className="w-full bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 shadow-md group-hover:scale-105 transition-transform">
            <Crown className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-white tracking-wide">
              CHESS <span className="text-amber-400">ARENA</span>
            </span>
            <span className="text-[10px] text-stone-400 tracking-wider font-semibold uppercase -mt-1">
              MEAN Stack Engine
            </span>
          </div>
        </div>

        {/* Center Nav items */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {/* Game Modes Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === 'game'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Play Chess</span>
            </button>

            {showModeDropdown && (
              <div
                className="absolute left-0 mt-2 w-52 bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowModeDropdown(false)}
              >
                <button
                  onClick={() => {
                    onSelectMode('computer');
                    onNavigate('game');
                    setShowModeDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentMode === 'computer'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="font-semibold">vs Computer AI</div>
                    <div className="text-[10px] text-stone-400">Play against educational bot</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectMode('local');
                    onNavigate('game');
                    setShowModeDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentMode === 'local'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Swords className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-semibold">Pass & Play (Local)</div>
                    <div className="text-[10px] text-stone-400">Two players on one device</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectMode('online');
                    onNavigate('game');
                    setShowModeDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentMode === 'online'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <div className="font-semibold">Online Room (Socket.IO)</div>
                    <div className="text-[10px] text-stone-400">Live real-time match</div>
                  </div>
                </button>

                <div className="my-1 border-t border-stone-800" />

                <button
                  onClick={() => {
                    onNavigate('puzzles');
                    setShowModeDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentPage === 'puzzles'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Target className="w-4 h-4 text-rose-400" />
                  <div className="text-left">
                    <div className="font-semibold">Tactics & Puzzles</div>
                    <div className="text-[10px] text-stone-400">Daily chess puzzles & challenges</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Learn & Master Academy Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLearnDropdown(!showLearnDropdown)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                ['openings', 'endgames', 'rules'].includes(currentPage)
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Learn Chess</span>
            </button>

            {showLearnDropdown && (
              <div
                className="absolute left-0 mt-2 w-64 bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowLearnDropdown(false)}
              >
                <button
                  onClick={() => {
                    onNavigate('openings');
                    setShowLearnDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentPage === 'openings'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="font-semibold">Opening Repertoire & Trainer</div>
                    <div className="text-[10px] text-stone-400">Master Ruy Lopez, Sicilian, KID & plans</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate('endgames');
                    setShowLearnDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentPage === 'endgames'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-semibold">Theoretical Endgame Lab</div>
                    <div className="text-[10px] text-stone-400">Lucena, Philidor, Opposition & King+Pawn</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowVisionModal(true);
                    setShowLearnDropdown(false);
                  }}
                  className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-stone-300 hover:bg-stone-800"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <div className="text-left">
                    <div className="font-semibold">Board Vision & Coordinate Drill</div>
                    <div className="text-[10px] text-stone-400">30s rapid algebraic sight training</div>
                  </div>
                </button>

                <div className="my-1 border-t border-stone-800" />

                <button
                  onClick={() => {
                    onNavigate('rules');
                    setShowLearnDropdown(false);
                  }}
                  className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    currentPage === 'rules'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-stone-400" />
                  <div className="text-left">
                    <div className="font-semibold">Rules & Move Guides</div>
                    <div className="text-[10px] text-stone-400">Castling, En Passant & Checkmate</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('openings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'openings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Openings</span>
          </button>

          <button
            onClick={() => onNavigate('endgames')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'endgames'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Endgames</span>
          </button>

          <button
            onClick={() => onNavigate('puzzles')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'puzzles'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Target className="w-4 h-4 text-rose-400" />
            <span>Tactics</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Daily
            </span>
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Vision Drill Button */}
          <button
            onClick={() => setShowVisionModal(true)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-stone-950/70 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="30s Board Vision & Coordinate Recognition Drill"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Vision Drill</span>
          </button>

          {/* Audio Controls */}
          <div className="flex items-center bg-stone-950/60 border border-stone-800 rounded-xl p-0.5">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-850 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setShowSoundModal(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-850 transition-colors cursor-pointer"
              title="Sound Effects & Audio Theme Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User auth state */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 text-xs font-bold">
                  {currentUser.username[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-stone-200 leading-tight">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold font-mono leading-tight">
                    {currentUser.rating} ELO
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer shadow-sm"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio Immersion & Sound Effect Settings Modal */}
      <SoundSettingsModal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
      />

      {/* High-Speed Board Vision & Coordinate Drill Modal */}
      <VisionTrainerModal
        isOpen={showVisionModal}
        onClose={() => setShowVisionModal(false)}
      />
    </nav>
  );
};
