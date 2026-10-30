import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OpeningRepertoire,
  REPERTOIRE_DATABASE,
  OpeningMoveAnnotation,
} from '../services/chess-openings-repertoire';
import { GameState, Move, PieceColor } from '../models/chess';
import {
  createInitialGameState,
  executeMove,
  getLegalMovesForPiece,
  algebraicToCoord,
  coordToAlgebraic,
} from '../services/chess-move.service';
import { isPuzzleMoveCorrect } from '../services/chess-puzzle.service';
import { soundService } from '../services/sound.service';
import { ChessBoard } from '../components/ChessBoard';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Play,
  Compass,
  Zap,
  Swords,
  Target,
  GraduationCap,
} from 'lucide-react';

interface OpeningsPageProps {
  onGoHome?: () => void;
  onNavigateEndgames?: () => void;
}

export const OpeningsPage: React.FC<OpeningsPageProps> = ({ onGoHome, onNavigateEndgames }) => {
  const [selectedOpening, setSelectedOpening] = useState<OpeningRepertoire>(REPERTOIRE_DATABASE[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mode, setMode] = useState<'explore' | 'drill'>('explore');

  // Move playback state
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [boardHistory, setBoardHistory] = useState<{ gameState: GameState; lastMove?: Move }[]>([]);

  // Drill mode interactive state
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [drillFeedback, setDrillFeedback] = useState<{ type: 'idle' | 'correct' | 'wrong' | 'complete'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Build the complete board history for the selected opening
  useEffect(() => {
    let state = createInitialGameState();
    const history: { gameState: GameState; lastMove?: Move }[] = [{ gameState: state }];

    for (let i = 0; i < selectedOpening.moves.length; i++) {
      const san = selectedOpening.moves[i];
      // Find the legal move that produces this SAN
      const turn = state.turn;
      let foundMove: Move | null = null;

      outerLoop:
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = state.board[r][c];
          if (piece && piece.color === turn) {
            const moves = getLegalMovesForPiece(
              state.board,
              r,
              c,
              state.castling,
              state.enPassantTarget
            );
            for (const m of moves) {
              if (isPuzzleMoveCorrect(m, san)) {
                foundMove = m;
                break outerLoop;
              }
            }
          }
        }
      }

      if (foundMove) {
        state = executeMove(state, foundMove);
        history.push({ gameState: state, lastMove: foundMove });
      } else {
        break;
      }
    }

    setBoardHistory(history);
    setCurrentPly(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    setDrillFeedback({
      type: 'idle',
      message: mode === 'drill' ? 'Make the first theoretical move for White!' : '',
    });
  }, [selectedOpening]);

  // Current active game state from playback history
  const activeEntry = boardHistory[currentPly] || boardHistory[0] || { gameState: createInitialGameState() };
  const currentGameState = activeEntry.gameState;
  const currentLastMove = activeEntry.lastMove;

  // Current annotation if available
  const currentAnnotation: OpeningMoveAnnotation | undefined = useMemo(() => {
    if (currentPly === 0) return undefined;
    return selectedOpening.annotations.find((a) => a.ply === currentPly);
  }, [currentPly, selectedOpening]);

  // Category filter
  const filteredOpenings = useMemo(() => {
    if (activeCategory === 'all') return REPERTOIRE_DATABASE;
    return REPERTOIRE_DATABASE.filter((op) => op.category === activeCategory);
  }, [activeCategory]);

  // Step controls
  const handlePrevMove = () => {
    if (currentPly > 0) {
      soundService.playMove();
      setCurrentPly((prev) => prev - 1);
    }
  };

  const handleNextMove = () => {
    if (currentPly < boardHistory.length - 1) {
      const nextPly = currentPly + 1;
      const nextEntry = boardHistory[nextPly];
      if (nextEntry?.lastMove?.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }
      setCurrentPly(nextPly);
    }
  };

  const handleResetToStart = () => {
    soundService.playSelect();
    setCurrentPly(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    if (mode === 'drill') {
      setDrillFeedback({ type: 'idle', message: 'Ready! Play White\'s first move.' });
    }
  };

  // Drill mode board interaction
  const handleSquareClick = (r: number, c: number) => {
    if (mode !== 'drill') return;
    if (drillFeedback.type === 'complete') return;

    // Only allow moves when it's the expected player's turn (White)
    if (currentGameState.turn !== 'w') return;

    const clickedPiece = currentGameState.board[r][c];

    if (selectedSquare) {
      const targetMove = legalMoves.find((m) => m.to.r === r && m.to.c === c);

      if (targetMove) {
        // Test move against the book move
        const expectedSan = selectedOpening.moves[currentPly];

        if (isPuzzleMoveCorrect(targetMove, expectedSan)) {
          // Correct move!
          const nextState = executeMove(currentGameState, targetMove);
          const nextPly = currentPly + 1;

          if (targetMove.captured) {
            soundService.playCapture();
          } else {
            soundService.playMove();
          }

          setCurrentPly(nextPly);
          setSelectedSquare(null);
          setLegalMoves([]);

          const nextAnno = selectedOpening.annotations.find((a) => a.ply === nextPly);
          const moveDesc = nextAnno ? nextAnno.comment : `Move played: ${expectedSan}`;

          // Check if opening line is complete
          if (nextPly >= selectedOpening.moves.length) {
            soundService.playVictory();
            setDrillFeedback({
              type: 'complete',
              message: `Brilliant! You mastered the entire theoretical line of ${selectedOpening.name}!`,
            });
            return;
          }

          setDrillFeedback({
            type: 'correct',
            message: `Well done! ${expectedSan} — ${moveDesc}`,
          });

          // Automatically play Black's reply after a brief realistic pause
          if (nextPly < selectedOpening.moves.length) {
            setTimeout(() => {
              const blackPly = nextPly + 1;
              const blackExpectedSan = selectedOpening.moves[nextPly];
              const blackEntry = boardHistory[blackPly];

              if (blackEntry) {
                if (blackEntry.lastMove?.captured) {
                  soundService.playCapture();
                } else {
                  soundService.playMove();
                }
                setCurrentPly(blackPly);

                if (blackPly >= selectedOpening.moves.length) {
                  soundService.playVictory();
                  setDrillFeedback({
                    type: 'complete',
                    message: `Mastered! You successfully concluded all ${selectedOpening.moves.length} moves of ${selectedOpening.name}!`,
                  });
                } else {
                  setDrillFeedback({
                    type: 'idle',
                    message: `Black responded with ${blackExpectedSan}. Your turn!`,
                  });
                }
              }
            }, 600);
          }
          return;
        } else {
          // Wrong move
          soundService.playBlunder();
          setDrillFeedback({
            type: 'wrong',
            message: `Not quite book theory. In this position, the main line is "${expectedSan}". Try again!`,
          });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }

      // Re-select friendly piece
      if (clickedPiece && clickedPiece.color === currentGameState.turn) {
        setSelectedSquare({ r, c });
        soundService.playSelect();
        const moves = getLegalMovesForPiece(
          currentGameState.board,
          r,
          c,
          currentGameState.castling,
          currentGameState.enPassantTarget
        );
        setLegalMoves(moves);
        return;
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // First click on a piece
    if (clickedPiece && clickedPiece.color === currentGameState.turn) {
      setSelectedSquare({ r, c });
      soundService.playSelect();
      const moves = getLegalMovesForPiece(
        currentGameState.board,
        r,
        c,
        currentGameState.castling,
        currentGameState.enPassantTarget
      );
      setLegalMoves(moves);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-amber-950/40 border border-stone-800">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Master Repertoire & Theory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Opening Explorer & Master Trainer</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
            Study grandmaster openings, uncover the strategic principles behind every move, and drill the mainline repertoire against the engine.
          </p>
        </div>

        {/* Mode Selector and Navigation */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                setMode('explore');
                soundService.playSelect();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'explore'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore & Study</span>
            </button>
            <button
              onClick={() => {
                setMode('drill');
                soundService.playSelect();
                setCurrentPly(0);
                setDrillFeedback({ type: 'idle', message: 'Drill started! Play White\'s opening move.' });
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'drill'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Repertoire Drill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', "King's Pawn (e4)", "Queen's Pawn (d4)", 'Flank / Indian'].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              soundService.playSelect();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-stone-900/60 text-stone-400 border border-stone-800/80 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            {cat === 'all' ? 'All Openings' : cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Repertoire selector + Center Chessboard + Right Strategic Wisdom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Repertoire Library List */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1 flex items-center justify-between">
            <span>Repertoire Book</span>
            <span className="text-[11px] text-amber-400 font-semibold">{filteredOpenings.length} lines</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredOpenings.map((op) => {
              const isSelected = op.id === selectedOpening.id;
              return (
                <div
                  key={op.id}
                  onClick={() => {
                    setSelectedOpening(op);
                    soundService.playSelect();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-850/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-amber-400">
                      {op.eco}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {op.moves.length} plies
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-100 line-clamp-1">{op.name}</h4>
                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                    {op.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Chessboard */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-amber-400 font-mono">
                {selectedOpening.eco}
              </span>
              <span className="text-xs font-bold text-stone-200 truncate max-w-[240px]">
                {selectedOpening.name}
              </span>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              Move {Math.floor(currentPly / 2) + 1}
              {currentPly % 2 === 1 ? ' (Black)' : ' (White)'}
            </span>
          </div>

          {/* Chess Board */}
          <div className="relative">
            <ChessBoard
              board={currentGameState.board}
              turn={currentGameState.turn}
              playerColor="w"
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={currentLastMove}
              isCheck={currentGameState.isCheck}
              onSquareClick={handleSquareClick}
              disabled={mode === 'explore'}
            />
          </div>

          {/* Drill Mode Feedback Banner */}
          {mode === 'drill' && (
            <div
              className={`w-full p-3 rounded-xl border text-xs flex items-center space-x-2.5 transition-all ${
                drillFeedback.type === 'correct'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : drillFeedback.type === 'wrong'
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  : drillFeedback.type === 'complete'
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200 font-bold'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              {drillFeedback.type === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {drillFeedback.type === 'wrong' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {drillFeedback.type === 'complete' && <Trophy className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />}
              {drillFeedback.type === 'idle' && <Zap className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{drillFeedback.message || 'Make White\'s next theoretical book move on the board.'}</span>
            </div>
          )}

          {/* Move Playback Navigation Controls */}
          <div className="w-full flex items-center justify-between bg-stone-900/90 border border-stone-800 p-2 rounded-2xl">
            <button
              onClick={handleResetToStart}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Reset to initial position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMove}
                disabled={currentPly === 0}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Move</span>
              </button>

              <span className="text-xs font-mono font-bold text-stone-400 px-2">
                {currentPly} / {selectedOpening.moves.length}
              </span>

              <button
                onClick={handleNextMove}
                disabled={currentPly >= boardHistory.length - 1}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                <span>Next Move</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Move Sequence Chips */}
          <div className="w-full p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/80 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedOpening.moves.map((san, idx) => {
              const plyNumber = idx + 1;
              const isCurrent = currentPly === plyNumber;
              const isWhite = idx % 2 === 0;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPly(plyNumber);
                    soundService.playMove();
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md scale-105'
                      : plyNumber < currentPly
                      ? 'bg-stone-800 text-stone-200'
                      : 'bg-stone-950/60 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {isWhite ? `${Math.floor(idx / 2) + 1}. ` : ''}
                  {san}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Strategic Breakdown & Commentary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Move Theory Annotation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-900/80 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Move Commentary</span>
              </span>
              {currentAnnotation && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {currentAnnotation.san}
                </span>
              )}
            </div>

            {currentAnnotation ? (
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                {currentAnnotation.comment}
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Step through the moves using the arrows or click any move above to read the master explanation.
              </p>
            )}
          </div>

          {/* Grandmaster Game Plans */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center space-x-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Battle Plans & Strategic Ideas</span>
            </h3>

            {/* White Plan */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>White's Strategic Objective</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed pl-3.5 border-l border-amber-500/30">
                {selectedOpening.whitePlan}
              </p>
            </div>

            {/* Black Plan */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Black's Counter-Strategy</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed pl-3.5 border-l border-emerald-500/30">
                {selectedOpening.blackPlan}
              </p>
            </div>
          </div>

          {/* Key Pawn Breaks & Critical Squares */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Thematic Pawn Breaks
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedOpening.keyPawnBreaks.map((pb, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-200 font-mono"
                  >
                    {pb}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Critical Squares
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedOpening.keySquares.map((sq, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold"
                  >
                    {sq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Historic Master Game Citation */}
          <div className="p-3.5 rounded-xl bg-gradient-to-tr from-stone-900 to-amber-950/20 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
              <span className="flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Classic Master Game</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {selectedOpening.famousGame.result}
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-200">
              {selectedOpening.famousGame.players}
            </p>
            <p className="text-[11px] text-stone-400">
              {selectedOpening.famousGame.event} • {selectedOpening.famousGame.year}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
