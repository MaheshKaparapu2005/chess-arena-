import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  EndgameLesson,
  ENDGAME_LESSONS,
  getCompletedEndgameIds,
  markEndgameCompleted,
} from '../services/chess-endgame.service';
import { GameState, Move, PieceColor } from '../models/chess';
import {
  fenToGameState,
  isPuzzleMoveCorrect,
} from '../services/chess-puzzle.service';
import {
  getLegalMovesForPiece,
  executeMove,
  coordToAlgebraic,
} from '../services/chess-move.service';
import { soundService } from '../services/sound.service';
import { ChessBoard } from '../components/ChessBoard';
import {
  BookOpen,
  Award,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Flame,
  Zap,
  Target,
  GraduationCap,
} from 'lucide-react';

interface EndgameLabPageProps {
  onGoHome?: () => void;
  onNavigateOpenings?: () => void;
}

export const EndgameLabPage: React.FC<EndgameLabPageProps> = ({ onGoHome, onNavigateOpenings }) => {
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedEndgameIds());
  const [selectedLesson, setSelectedLesson] = useState<EndgameLesson>(ENDGAME_LESSONS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mode, setMode] = useState<'practice' | 'walkthrough'>('practice');

  // Interactive practice state
  const [gameState, setGameState] = useState<GameState>(() => fenToGameState(selectedLesson.fen));
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [status, setStatus] = useState<'playing' | 'solved' | 'failed'>('playing');
  const [feedback, setFeedback] = useState<string>('');
  const [lastMove, setLastMove] = useState<Move | undefined>(undefined);

  // Walkthrough step state
  const [walkthroughPly, setWalkthroughPly] = useState<number>(0);
  const [walkthroughHistory, setWalkthroughHistory] = useState<{ gameState: GameState; lastMove?: Move }[]>([]);

  // Load lesson
  const loadLesson = useCallback((lesson: EndgameLesson) => {
    setSelectedLesson(lesson);
    const initial = fenToGameState(lesson.fen);
    setGameState(initial);
    setMoveIndex(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    setStatus('playing');
    setFeedback(`Objective: ${lesson.objective}`);
    setLastMove(undefined);

    // Build walkthrough history
    let simState = fenToGameState(lesson.fen);
    const history: { gameState: GameState; lastMove?: Move }[] = [{ gameState: simState }];

    for (let i = 0; i < lesson.moves.length; i++) {
      const san = lesson.moves[i];
      const turn = simState.turn;
      let foundMove: Move | null = null;

      outer:
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = simState.board[r][c];
          if (piece && piece.color === turn) {
            const moves = getLegalMovesForPiece(
              simState.board,
              r,
              c,
              simState.castling,
              simState.enPassantTarget
            );
            for (const m of moves) {
              if (isPuzzleMoveCorrect(m, san)) {
                foundMove = m;
                break outer;
              }
            }
          }
        }
      }

      if (foundMove) {
        simState = executeMove(simState, foundMove);
        history.push({ gameState: simState, lastMove: foundMove });
      } else {
        break;
      }
    }

    setWalkthroughHistory(history);
    setWalkthroughPly(0);
  }, []);

  useEffect(() => {
    loadLesson(selectedLesson);
  }, [selectedLesson, loadLesson]);

  // Categories
  const filteredLessons = useMemo(() => {
    if (activeCategory === 'all') return ENDGAME_LESSONS;
    return ENDGAME_LESSONS.filter((l) => l.category === activeCategory);
  }, [activeCategory]);

  // Practice Move handler
  const handlePlayerMove = (move: Move) => {
    const expectedMove = selectedLesson.moves[moveIndex];

    if (isPuzzleMoveCorrect(move, expectedMove)) {
      // Correct technique!
      const afterPlayerState = executeMove(gameState, move);
      setGameState(afterPlayerState);
      setLastMove(move);
      setSelectedSquare(null);
      setLegalMoves([]);

      if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }

      const nextIndex = moveIndex + 1;
      setMoveIndex(nextIndex);

      const annotation = selectedLesson.stepAnnotations[moveIndex] || `Technique executed: ${expectedMove}`;
      setFeedback(`✓ Correct! ${annotation}`);

      // Check if finished
      if (nextIndex >= selectedLesson.moves.length) {
        setStatus('solved');
        soundService.playVictory();
        const updated = markEndgameCompleted(selectedLesson.id);
        setCompletedIds(updated);
        setFeedback(`★ Mastery Achieved! You perfectly executed ${selectedLesson.title}!`);
        return;
      }

      // Play computer defensive reply
      setTimeout(() => {
        const computerExpected = selectedLesson.moves[nextIndex];
        const computerTurn = afterPlayerState.turn;
        let compMove: Move | null = null;

        findCompMove:
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = afterPlayerState.board[r][c];
            if (piece && piece.color === computerTurn) {
              const moves = getLegalMovesForPiece(
                afterPlayerState.board,
                r,
                c,
                afterPlayerState.castling,
                afterPlayerState.enPassantTarget
              );
              for (const m of moves) {
                if (isPuzzleMoveCorrect(m, computerExpected)) {
                  compMove = m;
                  break findCompMove;
                }
              }
            }
          }
        }

        if (compMove) {
          const afterCompState = executeMove(afterPlayerState, compMove);
          setGameState(afterCompState);
          setLastMove(compMove);

          if (compMove.captured) {
            soundService.playCapture();
          } else {
            soundService.playMove();
          }

          const compIndex = nextIndex + 1;
          setMoveIndex(compIndex);

          if (compIndex >= selectedLesson.moves.length) {
            setStatus('solved');
            soundService.playVictory();
            const updated = markEndgameCompleted(selectedLesson.id);
            setCompletedIds(updated);
            setFeedback(`★ Mastery Achieved! You perfectly converted ${selectedLesson.title}!`);
          } else {
            const compAnno = selectedLesson.stepAnnotations[nextIndex] || `Defender plays ${computerExpected}.`;
            setFeedback(`${compAnno} Your turn!`);
          }
        }
      }, 500);
    } else {
      // Inaccuracy or blunder in endgame technique
      soundService.playBlunder();
      setStatus('failed');
      setFeedback(`Inaccuracy: In theoretical endgames, precise calculation is required. The master move here is ${expectedMove}. Try again!`);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleSquareClick = (r: number, c: number) => {
    if (mode !== 'practice') return;
    if (status === 'solved') return;
    if (gameState.turn !== selectedLesson.playerColor) return;

    const clickedPiece = gameState.board[r][c];

    if (selectedSquare) {
      const destination = legalMoves.find((m) => m.to.r === r && m.to.c === c);
      if (destination) {
        handlePlayerMove(destination);
        return;
      }

      if (clickedPiece && clickedPiece.color === gameState.turn) {
        setSelectedSquare({ r, c });
        soundService.playSelect();
        const moves = getLegalMovesForPiece(
          gameState.board,
          r,
          c,
          gameState.castling,
          gameState.enPassantTarget
        );
        setLegalMoves(moves);
        return;
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (clickedPiece && clickedPiece.color === gameState.turn) {
      setSelectedSquare({ r, c });
      soundService.playSelect();
      const moves = getLegalMovesForPiece(
        gameState.board,
        r,
        c,
        gameState.castling,
        gameState.enPassantTarget
      );
      setLegalMoves(moves);
    }
  };

  const handleResetPractice = () => {
    soundService.playSelect();
    loadLesson(selectedLesson);
  };

  // Walkthrough navigation
  const activeWalkthrough = walkthroughHistory[walkthroughPly] || walkthroughHistory[0] || { gameState };

  const handleWalkthroughPrev = () => {
    if (walkthroughPly > 0) {
      soundService.playMove();
      setWalkthroughPly((p) => p - 1);
    }
  };

  const handleWalkthroughNext = () => {
    if (walkthroughPly < walkthroughHistory.length - 1) {
      soundService.playMove();
      setWalkthroughPly((p) => p + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-emerald-950/40 border border-stone-800">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Grandmaster Endgame Academy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Theoretical Endgame Laboratory</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
            Learn and master the decisive theoretical endgames: Lucena, Philidor, Key Squares, Opposition, and checkmate mechanics.
          </p>
        </div>

        {/* Mode Selector & Stats Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-stone-300">Mastered:</span>
            <span className="font-mono font-bold text-amber-400">
              {completedIds.length} / {ENDGAME_LESSONS.length}
            </span>
          </div>

          <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                setMode('practice');
                soundService.playSelect();
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'practice'
                  ? 'bg-emerald-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive Drill</span>
            </button>
            <button
              onClick={() => {
                setMode('walkthrough');
                soundService.playSelect();
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'walkthrough'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Walkthrough</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'Rook Endgames', 'King & Pawn', 'Checkmate Techniques', 'Queen Endgames'].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              soundService.playSelect();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-stone-900/60 text-stone-400 border border-stone-800/80 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            {cat === 'all' ? 'All Endgame Studies' : cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lesson Selection */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1 flex items-center justify-between">
            <span>Essential Studies</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{filteredLessons.length} lessons</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredLessons.map((lesson) => {
              const isSelected = lesson.id === selectedLesson.id;
              const isDone = completedIds.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    loadLesson(lesson);
                    soundService.playSelect();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-850/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        lesson.difficulty === 'Essential'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : lesson.difficulty === 'Intermediate'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {lesson.difficulty}
                    </span>
                    {isDone ? (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">{lesson.category}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-stone-100 line-clamp-1">{lesson.title}</h4>
                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                    {lesson.objective}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Board */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-xs font-bold text-stone-200">
              {selectedLesson.title}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Playing as: {selectedLesson.playerColor === 'w' ? 'White ♔' : 'Black ♚'}
            </span>
          </div>

          {/* Chessboard */}
          <div className="relative">
            <ChessBoard
              board={mode === 'practice' ? gameState.board : activeWalkthrough.gameState.board}
              turn={mode === 'practice' ? gameState.turn : activeWalkthrough.gameState.turn}
              playerColor={selectedLesson.playerColor}
              selectedSquare={mode === 'practice' ? selectedSquare : null}
              legalMoves={mode === 'practice' ? legalMoves : []}
              lastMove={mode === 'practice' ? lastMove : activeWalkthrough.lastMove}
              isCheck={mode === 'practice' ? gameState.isCheck : activeWalkthrough.gameState.isCheck}
              onSquareClick={handleSquareClick}
              disabled={mode === 'walkthrough'}
            />
          </div>

          {/* Practice Feedback Banner */}
          {mode === 'practice' && (
            <div
              className={`w-full p-3 rounded-xl border text-xs flex items-center space-x-2.5 transition-all ${
                status === 'solved'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold'
                  : status === 'failed'
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              {status === 'solved' && <Trophy className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />}
              {status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {status === 'playing' && <Zap className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span className="flex-1">{feedback}</span>
              <button
                onClick={handleResetPractice}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Restart this endgame drill"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Walkthrough Controls */}
          {mode === 'walkthrough' && (
            <div className="w-full flex items-center justify-between bg-stone-900/90 border border-stone-800 p-2.5 rounded-2xl">
              <button
                onClick={() => {
                  setWalkthroughPly(0);
                  soundService.playSelect();
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleWalkthroughPrev}
                  disabled={walkthroughPly === 0}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-mono font-bold text-stone-400 px-2">
                  Step {walkthroughPly} / {selectedLesson.moves.length}
                </span>

                <button
                  onClick={handleWalkthroughNext}
                  disabled={walkthroughPly >= walkthroughHistory.length - 1}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-stone-950 text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Move Walkthrough Annotation */}
          {mode === 'walkthrough' && (
            <div className="w-full p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300">
              {walkthroughPly === 0 ? (
                <p className="text-stone-400 italic">
                  Press "Next Step" to observe the grandmaster technique move-by-move.
                </p>
              ) : (
                <p className="leading-relaxed">
                  <span className="font-bold text-emerald-400 mr-1.5">
                    Move {walkthroughPly}:
                  </span>
                  {selectedLesson.stepAnnotations[walkthroughPly - 1]}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Theoretical Foundations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Key Principle Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-900/80 border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Core Principle</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                {selectedLesson.category}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
              {selectedLesson.keyConcept}
            </p>
          </div>

          {/* Why It Matters In Tournaments */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Why This Endgame Matters</span>
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              {selectedLesson.whyItMatters}
            </p>
          </div>

          {/* Step-by-Step Annotated Move List */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2.5 max-h-[220px] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Master Solution Sequence</span>
            </h3>
            <div className="space-y-1.5">
              {selectedLesson.moves.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 text-xs py-1 border-b border-stone-850 last:border-0"
                >
                  <span className="font-mono text-stone-500 shrink-0 w-5">
                    {idx + 1}.
                  </span>
                  <span className="font-mono font-bold text-amber-400 shrink-0">
                    {m}
                  </span>
                  <span className="text-stone-300 text-[11px] leading-snug">
                    {selectedLesson.stepAnnotations[idx] || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
