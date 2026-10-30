import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  X,
  Play,
  Sparkles,
  Clock,
  Swords,
  ShieldAlert,
  Trophy,
  Sliders,
  Check,
  Zap,
  Radio,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';
import { soundManager, SoundTheme } from '../services/sound.service';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ isOpen, onClose }) => {
  const [prefs, setPrefs] = useState(() => soundManager.getPreferences());

  useEffect(() => {
    return soundManager.subscribe(() => {
      setPrefs(soundManager.getPreferences());
    });
  }, []);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setVolume(val);
    if (prefs.muted && val > 0) {
      soundManager.setMuted(false);
    }
  };

  const handleToggleMute = () => {
    soundManager.toggleMute();
  };

  const handleThemeChange = (newTheme: SoundTheme) => {
    soundManager.setTheme(newTheme);
  };

  const themes: { id: SoundTheme; title: string; desc: string; icon: string; tag: string }[] = [
    {
      id: 'wood',
      title: 'Classic Wood',
      desc: 'Handcrafted Staunton acoustic felt drop & hollow tournament board body',
      icon: '🪵',
      tag: 'Acoustic',
    },
    {
      id: 'glass',
      title: 'Modern Glass',
      desc: 'Crystalline marble taps with singing bowl chime harmonics',
      icon: '💎',
      tag: 'Harmonic',
    },
    {
      id: 'arcade',
      title: 'Arcade 8-Bit',
      desc: 'Retro chiptune synthesizer and punchy digital gaming bites',
      icon: '👾',
      tag: 'Retro',
    },
    {
      id: 'scifi',
      title: 'Sci-Fi Synth',
      desc: 'Futuristic FM electronic pulses and cybernetic threat alarms',
      icon: '⚡',
      tag: 'Electronic',
    },
    {
      id: 'minimal',
      title: 'Minimalist Soft',
      desc: 'Calming dampened organic clicks with gentle ambient feedback',
      icon: '🌿',
      tag: 'Zen',
    },
  ];

  const cueGroups = [
    {
      title: 'Tactical Board Cues',
      cues: [
        { label: 'Pawn Move', icon: Swords, action: () => soundManager.playMove('p'), color: 'text-stone-300' },
        { label: 'Heavy Move (Q/R)', icon: Swords, action: () => soundManager.playMove('q'), color: 'text-amber-300' },
        { label: 'Piece Capture', icon: Swords, action: () => soundManager.playCapture('p'), color: 'text-orange-400' },
        { label: 'Queen Capture', icon: Swords, action: () => soundManager.playCapture('q'), color: 'text-red-400' },
        { label: 'Castling', icon: Swords, action: () => soundManager.playCastle(), color: 'text-sky-400' },
        { label: 'Promotion', icon: Sparkles, action: () => soundManager.playPromotion('q'), color: 'text-indigo-400' },
      ],
    },
    {
      title: 'Check & Threat Alerts',
      cues: [
        { label: 'Check Alert', icon: ShieldAlert, action: () => soundManager.playCheck(false), color: 'text-amber-400' },
        { label: 'Double Check!', icon: AlertTriangle, action: () => soundManager.playCheck(true), color: 'text-red-400' },
        { label: 'Blunder Stinger', icon: Flame, action: () => soundManager.playBlunderAlert(), color: 'text-rose-400' },
        { label: 'Brilliant Flourish', icon: Award, action: () => soundManager.playBrilliantMove(), color: 'text-teal-400' },
      ],
    },
    {
      title: 'Game End States',
      cues: [
        { label: 'Victory Fanfare', icon: Trophy, action: () => soundManager.playVictory(), color: 'text-emerald-400' },
        { label: 'Defeat Cadence', icon: X, action: () => soundManager.playDefeat(), color: 'text-rose-400' },
        { label: 'Draw / Stalemate', icon: Check, action: () => soundManager.playDraw(), color: 'text-stone-400' },
        { label: 'Timeout Siren', icon: Clock, action: () => soundManager.playTimeout(), color: 'text-yellow-400' },
      ],
    },
    {
      title: 'Clocks & Ambient',
      cues: [
        { label: 'Clock Tick (≤15s)', icon: Clock, action: () => soundManager.playClockTick(false), color: 'text-stone-300' },
        { label: 'Urgent Tick (≤5s)', icon: Clock, action: () => soundManager.playClockTick(true), color: 'text-red-400' },
        { label: 'Game Start Gong', icon: Radio, action: () => soundManager.playGameStart(), color: 'text-emerald-400' },
        { label: 'Illegal Thud', icon: X, action: () => soundManager.playIllegal(), color: 'text-stone-500' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-700/80 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Sound Manager</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Web Audio Engine
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Acoustic physical feedback for piece moves, captures, checks, and game results
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Volume Section */}
        <div className="space-y-3 bg-stone-950/70 p-4 rounded-2xl border border-stone-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center space-x-2">
              {prefs.muted || prefs.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : prefs.volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <span>Master Sound Volume</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-amber-400">
                {prefs.muted ? 'Muted' : `${Math.round(prefs.volume * 100)}%`}
              </span>
              <button
                onClick={handleToggleMute}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                  prefs.muted
                    ? 'bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {prefs.muted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={prefs.muted ? 0 : prefs.volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Sound Theme Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-200 uppercase tracking-wider block">
              Acoustic Palette Theme
            </label>
            <span className="text-[10px] text-stone-400">Selects synthesized sound signature</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {themes.map((t) => {
              const isSelected = prefs.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                      {t.tag}
                    </span>
                  </div>
                  <span className={`text-xs font-bold flex items-center justify-between w-full ${isSelected ? 'text-amber-300' : 'text-stone-200'}`}>
                    <span>{t.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </span>
                  <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Granular Audio Category Toggles */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-stone-200 uppercase tracking-wider block">
            Tactical Feedback Cues
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Move Sounds */}
            <button
              onClick={() => soundManager.setMoveSoundsEnabled(!prefs.moveSoundsEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.moveSoundsEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>Piece Movements</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.moveSoundsEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.moveSoundsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Captures */}
            <button
              onClick={() => soundManager.setCaptureSoundsEnabled(!prefs.captureSoundsEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.captureSoundsEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Swords className="w-3.5 h-3.5 text-red-400" />
                <span>Piece Captures</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.captureSoundsEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.captureSoundsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Checks & Threat Alerts */}
            <button
              onClick={() => soundManager.setCheckSoundsEnabled(!prefs.checkSoundsEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.checkSoundsEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Check & Danger Stingers</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.checkSoundsEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.checkSoundsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Game End States */}
            <button
              onClick={() => soundManager.setGameEndSoundsEnabled(!prefs.gameEndSoundsEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.gameEndSoundsEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Game End Outcomes</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.gameEndSoundsEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.gameEndSoundsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Clock Ticks */}
            <button
              onClick={() => soundManager.setClockTickEnabled(!prefs.clockTickEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.clockTickEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Low Time Clock Ticks (≤15s)</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.clockTickEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.clockTickEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Special FX */}
            <button
              onClick={() => soundManager.setSpecialFxEnabled(!prefs.specialFxEnabled)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                prefs.specialFxEnabled
                  ? 'bg-stone-800/80 border-amber-500/40 text-stone-200'
                  : 'bg-stone-950/50 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Castling & Promotions</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prefs.specialFxEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-500'}`}>
                {prefs.specialFxEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Audio Cue Preview & Test Soundboard */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Soundboard</span>
            </span>
            <span className="text-[10px] text-stone-400">Click any stinger to test acoustic output</span>
          </div>

          <div className="space-y-3">
            {cueGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                  <span>{group.title}</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {group.cues.map((btn, idx) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={idx}
                        onClick={btn.action}
                        className="flex items-center space-x-1.5 p-2 rounded-xl bg-stone-950/70 hover:bg-stone-800 border border-stone-800/90 text-stone-300 text-xs font-medium transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${btn.color}`} />
                        <span className="truncate">{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Acoustic sound effects synthesized client-side in Web Audio
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
