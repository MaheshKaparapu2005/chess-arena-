import React, { useMemo } from 'react';
import { Board, GameState } from '../models/chess';
import { getEngineEvaluation, EngineEvaluationResult } from '../services/chess-eval.service';
import { Sparkles, Trophy } from 'lucide-react';

export interface EvaluationBarProps {
  board: Board;
  gameState?: Partial<GameState>;
  flipped?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  board,
  gameState,
  flipped = false,
  className = '',
  showDetails = true,
}) => {
  const evalResult: EngineEvaluationResult = useMemo(() => {
    return getEngineEvaluation(board, gameState);
  }, [board, gameState]);

  const {
    pawns,
    centipawns,
    formattedScore,
    whiteWinPercentage,
    blackWinPercentage,
    isCheckmate,
    advantage,
    assessment,
  } = evalResult;

  // Percentage height of the bottom color
  // If not flipped, bottom is White (whiteWinPercentage)
  // If flipped, bottom is Black (blackWinPercentage)
  const bottomBarPercentage = flipped ? blackWinPercentage : whiteWinPercentage;

  // Score badge color and position
  // If White is leading (+ score):
  //   In normal view, White is at the bottom, so badge displays on the white section.
  // If Black is leading (- score):
  //   In normal view, Black is at the top, so badge displays on the black section.
  const isWhiteDominant = centipawns >= 0;

  return (
    <div
      className={`relative flex flex-col items-center select-none group ${className}`}
      title={`Engine Evaluation: ${centipawns >= 0 ? '+' : ''}${centipawns} cp (${formattedScore} pawns) • ${assessment}`}
    >
      {/* Vertical Thermometer Bar */}
      <div className="relative w-6 sm:w-8 h-full min-h-[320px] rounded-xl overflow-hidden bg-stone-900 border border-stone-700/80 shadow-2xl flex flex-col justify-end">
        {/* Top background color (Black if normal, White if flipped) */}
        <div
          className={`absolute inset-0 ${
            flipped ? 'bg-slate-100 text-stone-900' : 'bg-stone-900 text-slate-100'
          }`}
        />

        {/* Bottom filling bar (White if normal, Black if flipped) */}
        <div
          className={`relative w-full transition-all duration-300 ease-out ${
            flipped
              ? 'bg-stone-900 border-t border-stone-800'
              : 'bg-slate-100 border-t border-slate-300'
          }`}
          style={{ height: `${bottomBarPercentage}%` }}
        />

        {/* 50% Equality Center Line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-amber-400/70 z-10 pointer-events-none shadow-sm"
          title="Equality line (0.00)"
        />

        {/* Score Badges */}
        {/* Top Badge: Shows when the top side is leading or equal */}
        {((!flipped && !isWhiteDominant) || (flipped && isWhiteDominant)) && (
          <div className="absolute top-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <span
              className={`px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-black font-mono leading-none shadow-md ${
                flipped
                  ? 'bg-stone-950/90 text-amber-300 border border-amber-500/30'
                  : 'bg-stone-950/95 text-stone-100 border border-stone-700'
              }`}
            >
              {formattedScore}
            </span>
          </div>
        )}

        {/* Bottom Badge: Shows when the bottom side is leading or equal */}
        {((!flipped && isWhiteDominant) || (flipped && !isWhiteDominant)) && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <span
              className={`px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-black font-mono leading-none shadow-md ${
                flipped
                  ? 'bg-stone-950/95 text-stone-100 border border-stone-700'
                  : 'bg-stone-900 text-amber-400 font-bold border border-stone-700'
              }`}
            >
              {formattedScore}
            </span>
          </div>
        )}

        {/* Ticks for ±1, ±3, ±5 */}
        <div className="absolute inset-y-0 right-0.5 flex flex-col justify-between py-6 pointer-events-none opacity-40 text-[7px] font-mono text-stone-400">
          <span>+5</span>
          <span>+3</span>
          <span className="text-amber-400 font-bold">0</span>
          <span>-3</span>
          <span>-5</span>
        </div>
      </div>

      {/* Floating Detailed Hover Card */}
      {showDetails && (
        <div className="absolute -left-2 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none min-w-[190px]">
          <div className="bg-stone-900 border border-amber-500/40 rounded-xl p-2.5 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1">
              <span className="font-bold text-amber-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Engine Score</span>
              </span>
              <span className="font-mono font-black text-white text-xs px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                {formattedScore}
              </span>
            </div>

            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between text-stone-300">
                <span>Centipawns:</span>
                <span className="font-mono font-bold text-stone-100">
                  {centipawns >= 0 ? `+${centipawns}` : centipawns} cp
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>White Win %:</span>
                <span className="font-mono font-semibold text-slate-200">{whiteWinPercentage}%</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Black Win %:</span>
                <span className="font-mono font-semibold text-slate-200">{blackWinPercentage}%</span>
              </div>
            </div>

            <p className="text-[10px] text-amber-200/90 italic pt-0.5 border-t border-stone-800">
              {assessment}
            </p>
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-stone-900 border-r border-b border-amber-500/40 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
};
