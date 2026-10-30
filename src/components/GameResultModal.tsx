import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, Home, BarChart2, X } from 'lucide-react';
import { PieceColor } from '../models/chess';

interface GameResultModalProps {
  isOpen: boolean;
  winner: PieceColor | 'draw' | null;
  reason?: string;
  totalMoves: number;
  playerColor?: PieceColor;
  onPlayAgain: () => void;
  onClose: () => void;
  onGoHome: () => void;
  onReviewGame?: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  winner,
  reason = 'Game finished',
  totalMoves,
  playerColor,
  onPlayAgain,
  onClose,
  onGoHome,
  onReviewGame,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      const isPlayerWin = !playerColor || winner === playerColor;
      if (isPlayerWin && winner !== 'draw') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [isOpen, winner, playerColor]);

  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const isWhiteWin = winner === 'w';
  const isBlackWin = winner === 'b';

  let title = 'Game Finished';
  let badgeColor = 'bg-stone-700 text-stone-200';

  if (isDraw) {
    title = 'Game Drawn!';
    badgeColor = 'bg-amber-900/60 text-amber-300 border-amber-500/40';
  } else if (isWhiteWin) {
    title = 'White Triumphs!';
    badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
  } else if (isBlackWin) {
    title = 'Black Triumphs!';
    badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
          {isDraw ? (
            <Award className="w-8 h-8" />
          ) : (
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-1 capitalize shadow-xs">
            {reason}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-300">
          <div>
            <div className="text-stone-500 text-[11px]">Total Moves</div>
            <div className="text-base font-bold text-stone-100">{totalMoves}</div>
          </div>
          <div>
            <div className="text-stone-500 text-[11px]">Decision</div>
            <div className="text-base font-bold text-stone-100">{reason}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {onReviewGame && totalMoves > 0 && (
            <button
              onClick={onReviewGame}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Review Game (Engine Analysis)</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-700 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
