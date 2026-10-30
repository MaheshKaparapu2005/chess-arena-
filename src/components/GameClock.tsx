import React from 'react';
import { PieceColor } from '../models/chess';
import { Clock, ShieldAlert } from 'lucide-react';

interface GameClockProps {
  color: PieceColor;
  timeRemaining: number; // in seconds
  isActive: boolean;
  playerName: string;
  playerRating?: number;
  materialAdvantage?: number;
}

export const GameClock: React.FC<GameClockProps> = ({
  color,
  timeRemaining,
  isActive,
  playerName,
  playerRating = 1200,
  materialAdvantage = 0,
}) => {
  const isWhite = color === 'w';

  const formatTime = (secs: number) => {
    const clamped = Math.max(0, Math.floor(secs));
    const mins = Math.floor(clamped / 60);
    const remainingSecs = clamped % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs
      .toString()
      .padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining <= 30 && timeRemaining > 0;
  const isExpired = timeRemaining <= 0;

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
        isActive
          ? 'bg-stone-800/90 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
          : 'bg-stone-900/60 border-stone-800 text-stone-300'
      }`}
    >
      {/* Player identity */}
      <div className="flex items-center space-x-2.5">
        <div
          className={`w-4 h-4 rounded-full border shadow-sm ${
            isWhite ? 'bg-white border-stone-300' : 'bg-stone-950 border-stone-700'
          }`}
        />
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-sm text-stone-100 max-w-[130px] truncate">
              {playerName}
            </span>
            {materialAdvantage > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                +{materialAdvantage}
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400">
            Rating: <strong className="text-stone-300">{playerRating}</strong>
          </span>
        </div>
      </div>

      {/* Clock display */}
      <div
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-base transition-colors ${
          isExpired
            ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
            : isLowTime
            ? 'bg-red-900/40 text-red-300 border border-red-500/50 animate-pulse'
            : isActive
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-stone-950/70 text-stone-300 border border-stone-800'
        }`}
      >
        {isLowTime ? (
          <ShieldAlert className="w-4 h-4 text-red-400" />
        ) : (
          <Clock className={`w-4 h-4 ${isActive ? 'text-amber-400 animate-spin-slow' : 'text-stone-400'}`} />
        )}
        <span>{formatTime(timeRemaining)}</span>
      </div>
    </div>
  );
};
