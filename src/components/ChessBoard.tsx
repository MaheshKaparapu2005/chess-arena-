import React from 'react';
import { Board, Move, PieceColor, MoveAnalysis, MoveClassificationType } from '../models/chess';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  board: Board;
  turn: PieceColor;
  playerColor?: PieceColor;
  selectedSquare: { r: number; c: number } | null;
  legalMoves: Move[];
  lastMove?: Move;
  isCheck: boolean;
  flipped?: boolean;
  showMoves?: boolean;
  suggestedMove?: Move | null;
  onSquareClick: (r: number, c: number) => void;
  disabled?: boolean;
  reviewAnalysis?: MoveAnalysis | null;
  showBestAlternative?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  turn,
  playerColor,
  selectedSquare,
  legalMoves,
  lastMove,
  isCheck,
  flipped = false,
  showMoves = true,
  suggestedMove,
  onSquareClick,
  disabled = false,
  reviewAnalysis,
  showBestAlternative = true,
}) => {
  // Rank and file rows/columns depending on flip
  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const getBadgeContent = (type: MoveClassificationType): { symbol: string; badgeClass: string; squareClass: string } => {
    switch (type) {
      case 'brilliant':
        return {
          symbol: '!!',
          badgeClass: 'bg-teal-400 text-stone-950 shadow-md shadow-teal-400/50 ring-1 ring-white/50',
          squareClass: '!bg-teal-400/40 ring-4 ring-inset ring-teal-400',
        };
      case 'best':
        return {
          symbol: '★',
          badgeClass: 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/50 ring-1 ring-white/50',
          squareClass: '!bg-emerald-500/35 ring-4 ring-inset ring-emerald-500',
        };
      case 'excellent':
        return {
          symbol: '✓',
          badgeClass: 'bg-sky-500 text-white shadow-md shadow-sky-500/40',
          squareClass: '!bg-sky-500/30 ring-4 ring-inset ring-sky-500',
        };
      case 'good':
        return {
          symbol: '✓',
          badgeClass: 'bg-stone-600 text-stone-200',
          squareClass: '!bg-stone-500/25 ring-2 ring-inset ring-stone-400',
        };
      case 'inaccuracy':
        return {
          symbol: '?!',
          badgeClass: 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-400/50 ring-1 ring-stone-900',
          squareClass: '!bg-amber-400/40 ring-4 ring-inset ring-amber-400',
        };
      case 'mistake':
        return {
          symbol: '?',
          badgeClass: 'bg-orange-500 text-white font-black shadow-md shadow-orange-500/50 ring-1 ring-white/50',
          squareClass: '!bg-orange-500/40 ring-4 ring-inset ring-orange-500',
        };
      case 'blunder':
        return {
          symbol: '??',
          badgeClass: 'bg-red-600 text-white font-black shadow-lg shadow-red-600/70 animate-pulse ring-1 ring-white/60',
          squareClass: '!bg-red-600/45 ring-4 ring-inset ring-red-600',
        };
    }
  };

  const isReviewMoveTo = (r: number, c: number) => {
    return reviewAnalysis?.move.to.r === r && reviewAnalysis?.move.to.c === c;
  };

  const isBestMoveFrom = (r: number, c: number) => {
    if (!showBestAlternative || !reviewAnalysis?.bestMove) return false;
    const { from, to } = reviewAnalysis.bestMove;
    const played = reviewAnalysis.move;
    // Only show if best move is different from move played
    const isDifferent = from.r !== played.from.r || from.c !== played.from.c || to.r !== played.to.r || to.c !== played.to.c;
    return isDifferent && from.r === r && from.c === c;
  };

  const isBestMoveTo = (r: number, c: number) => {
    if (!showBestAlternative || !reviewAnalysis?.bestMove) return false;
    const { from, to } = reviewAnalysis.bestMove;
    const played = reviewAnalysis.move;
    const isDifferent = from.r !== played.from.r || from.c !== played.from.c || to.r !== played.to.r || to.c !== played.to.c;
    return isDifferent && to.r === r && to.c === c;
  };

  return (
    <div className="relative select-none w-full max-w-[560px] aspect-square rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-stone-800 to-stone-950 shadow-2xl border border-stone-700/60 flex flex-col justify-center">
      <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border-2 border-stone-800 shadow-inner">
        {rows.map((r, rIdx) =>
          cols.map((c, cIdx) => {
            const piece = board[r][c];
            const isLightSquare = (r + c) % 2 === 0;

            const isSelected =
              selectedSquare?.r === r && selectedSquare?.c === c;

            const isLastMoveFrom =
              lastMove?.from.r === r && lastMove?.from.c === c;
            const isLastMoveTo =
              lastMove?.to.r === r && lastMove?.to.c === c;

            const legalMoveForSquare = legalMoves.find(
              (m) => m.to.r === r && m.to.c === c
            );
            const isLegalDestination = showMoves && !!legalMoveForSquare;
            const isCaptureDestination =
              isLegalDestination && (piece !== null || legalMoveForSquare.isEnPassant);

            const isKingInCheckSquare =
              isCheck &&
              piece?.type === 'k' &&
              piece.color === turn;

            const isSuggestedSource =
              suggestedMove && suggestedMove.from.r === r && suggestedMove.from.c === c;
            const isSuggestedTarget =
              suggestedMove && suggestedMove.to.r === r && suggestedMove.to.c === c;

            const isReviewTarget = isReviewMoveTo(r, c);
            const isBestSource = isBestMoveFrom(r, c);
            const isBestTarget = isBestMoveTo(r, c);

            const reviewBadgeInfo =
              isReviewTarget && reviewAnalysis
                ? getBadgeContent(reviewAnalysis.classification)
                : null;

            // Coordinates labels (ranks on col index 0, files on bottom row index 7)
            const showRank = cIdx === 0;
            const showFile = rIdx === 7;
            const rankLabel = 8 - r;
            const fileLabel = files[c];

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => !disabled && onSquareClick(r, c)}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-150 ${
                  isLightSquare
                    ? 'bg-[#ebecd0] text-[#779556]'
                    : 'bg-[#779556] text-[#ebecd0]'
                } ${
                  isSelected
                    ? '!bg-amber-300/80 ring-4 ring-inset ring-amber-400'
                    : reviewBadgeInfo
                    ? reviewBadgeInfo.squareClass
                    : isLastMoveFrom || isLastMoveTo
                    ? '!bg-lime-200/50'
                    : ''
                } ${
                  isKingInCheckSquare
                    ? '!bg-red-500/80 animate-pulse ring-4 ring-inset ring-red-600'
                    : ''
                } ${
                  isSuggestedSource || isSuggestedTarget
                    ? 'ring-2 ring-inset ring-indigo-400'
                    : ''
                } ${
                  isBestSource
                    ? '!ring-3 !ring-inset !ring-emerald-400 !bg-emerald-500/20'
                    : ''
                } ${
                  isBestTarget
                    ? '!ring-3 !ring-inset !ring-emerald-400 !bg-emerald-500/30'
                    : ''
                }`}
              >
                {/* Square Rank Label */}
                {showRank && (
                  <span className="absolute top-1 left-1.5 text-[10px] sm:text-xs font-semibold select-none opacity-75">
                    {rankLabel}
                  </span>
                )}

                {/* Square File Label */}
                {showFile && (
                  <span className="absolute bottom-0.5 right-1.5 text-[10px] sm:text-xs font-semibold select-none opacity-75">
                    {fileLabel}
                  </span>
                )}

                {/* Engine Review Played Move Badge */}
                {reviewBadgeInfo && (
                  <div
                    className={`absolute top-1 right-1 z-20 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-md text-[11px] font-black pointer-events-none select-none ${reviewBadgeInfo.badgeClass}`}
                    title={`${reviewAnalysis?.classificationLabel}: ${reviewAnalysis?.commentary}`}
                  >
                    {reviewBadgeInfo.symbol}
                  </div>
                )}

                {/* Best Move Alternative Badge */}
                {isBestTarget && (
                  <div className="absolute top-1 right-1 z-20 flex items-center space-x-0.5 px-1 py-0.5 rounded bg-emerald-500 text-stone-950 text-[9px] font-black shadow-md shadow-emerald-500/40 pointer-events-none select-none">
                    <span>BEST</span>
                  </div>
                )}

                {/* Piece Rendering */}
                {piece && (
                  <div
                    className={`w-[85%] h-[85%] transition-transform duration-200 ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Suggested Move Badge */}
                {isSuggestedTarget && (
                  <div className="absolute inset-0 border-2 border-indigo-500 bg-indigo-500/20 rounded pointer-events-none" />
                )}

                {/* Legal Move Indicators */}
                {isLegalDestination && !isCaptureDestination && (
                  <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-stone-900/30 backdrop-blur-xs shadow pointer-events-none" />
                )}

                {isLegalDestination && isCaptureDestination && (
                  <div className="absolute inset-1 rounded-full border-4 border-red-500/60 animate-pulse pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
