import React from 'react';
import { BestMoveEvaluation, Piece } from '../models/chess';
import { Sparkles, Eye, EyeOff, Lightbulb, Compass } from 'lucide-react';
import { getPieceName } from '../services/chess-eval.service';

interface MoveAssistPanelProps {
  showMoves: boolean;
  onToggleShowMoves: () => void;
  selectedPiece: Piece | null;
  legalMovesCount: number;
  bestMove: BestMoveEvaluation | null;
  onSuggestBestMove: () => void;
  isLoadingBestMove?: boolean;
}

export const MoveAssistPanel: React.FC<MoveAssistPanelProps> = ({
  showMoves,
  onToggleShowMoves,
  selectedPiece,
  legalMovesCount,
  bestMove,
  onSuggestBestMove,
  isLoadingBestMove = false,
}) => {
  return (
    <div className="flex flex-col bg-stone-900/80 border border-stone-800 rounded-xl p-3 shadow-md space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-stone-200 font-semibold text-xs uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Move Assist & Mentor</span>
        </div>
        <button
          onClick={onToggleShowMoves}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            showMoves
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'
          }`}
          title="Toggle legal move dots"
        >
          {showMoves ? (
            <>
              <Eye className="w-3 h-3 text-amber-400" />
              <span>Moves: ON</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 text-stone-500" />
              <span>Moves: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Selected Piece status */}
      <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-stone-950/60 border border-stone-800/80">
        <div className="text-stone-400">
          Selected:{' '}
          <strong className="text-stone-200">
            {selectedPiece ? getPieceName(selectedPiece.type) : 'None'}
          </strong>
        </div>
        <div className="text-stone-400">
          Legal Moves:{' '}
          <strong className="text-amber-400">{legalMovesCount}</strong>
        </div>
      </div>

      {/* Suggest Best Move action */}
      <div className="flex flex-col space-y-1.5">
        <button
          onClick={onSuggestBestMove}
          disabled={isLoadingBestMove}
          className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 hover:text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isLoadingBestMove ? 'Analyzing Board...' : 'Suggest Best Move'}</span>
        </button>

        {bestMove && (
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span className="flex items-center space-x-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommendation:</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 font-mono">
                {bestMove.san}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed italic">
              "{bestMove.reason}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
