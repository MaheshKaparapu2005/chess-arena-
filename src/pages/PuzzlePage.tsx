import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChessPuzzle,
  PUZZLE_DATABASE,
  getDailyPuzzle,
  fenToGameState,
  isPuzzleMoveCorrect,
  getUserPuzzleStats,
  recordPuzzleResult,
  PuzzleStats,
} from '../services/chess-puzzle.service';
import { GameState, Move, PieceColor } from '../models/chess';
import {
  getLegalMovesForPiece,
  executeMove,
} from '../services/chess-move.service';
import { soundService } from '../services/sound.service';
import { ChessBoard } from '../components/ChessBoard';
import {
  Target,
  Flame,
  Award,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  Trophy,
  Filter,
  Check,
  Zap,
} from 'lucide-react';

interface PuzzlePageProps {
  onGoHome?: () => void;
}

export const PuzzlePage: React.FC<PuzzlePageProps> = () => {
  const [stats, setStats] = useState<PuzzleStats>(() => getUserPuzzleStats());
  const [activeTab, setActiveTab] = useState<'daily' | 'browse'>('daily');

  // Currently selected puzzle
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle>(() => getDailyPuzzle());
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'solved' | 'failed'>('playing');

  // Board interactive state
  const [gameState, setGameState] = useState<GameState>(() => fenToGameState(currentPuzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);

  // Hints and feedback
  const [hintLevel, setHintLevel] = useState<number>(0); // 0: none, 1: piece, 2: full explanation
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Filters for browse tab
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');

  // Load a new puzzle
  const loadPuzzle = useCallback((puzzle: ChessPuzzle) => {
    setCurrentPuzzle(puzzle);
    setGameState(fenToGameState(puzzle.fen));
    setMoveIndex(0);
    setPuzzleStatus('playing');
    setSelectedSquare(null);
    setLegalMoves([]);
    setHintLevel(0);
    setFeedbackMessage('');
    setIsRevealed(false);
  }, []);

  // Filtered puzzle list for the browse gym
  const filteredPuzzles = useMemo(() => {
    return PUZZLE_DATABASE.filter((p) => {
      if (difficultyFilter !== 'all' && p.difficulty.toLowerCase() !== difficultyFilter) return false;
      if (themeFilter !== 'all' && p.theme !== themeFilter) return false;
      return true;
    });
  }, [difficultyFilter, themeFilter]);

  // Handle Square click on the board
  const handleSquareClick = (r: number, c: number) => {
    if (puzzleStatus === 'solved' || isRevealed) return;

    // Only allow player to move if it's their turn
    if (gameState.turn !== currentPuzzle.playerColor) return;

    const clickedPiece = gameState.board[r][c];

    // If square already selected
    if (selectedSquare) {
      const legalDestination = legalMoves.find((m) => m.to.r === r && m.to.c === c);

      if (legalDestination) {
        // Execute player's move
        handlePlayerMove(legalDestination);
        return;
      }

      // If clicked another friendly piece, re-select
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

      // Clear selection
      soundService.playIllegal();
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Select piece
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

  // Process move and check correctness
  const handlePlayerMove = (move: Move) => {
    const nextState = executeMove(gameState, move);
    setGameState(nextState);
    setSelectedSquare(null);
    setLegalMoves([]);

    const expectedMove = currentPuzzle.moves[moveIndex];
    const isCorrect = isPuzzleMoveCorrect(nextState.lastMove || move, expectedMove);

    if (isCorrect) {
      // Sound feedback
      if (move.captured) soundService.playCapture(move.captured.type);
      else if (move.isCastling) soundService.playCastle();
      else soundService.playMove(move.piece.type);

      const nextMoveIdx = moveIndex + 1;

      // Check if all moves in puzzle are completed
      if (nextMoveIdx >= currentPuzzle.moves.length) {
        // Puzzle solved!
        setPuzzleStatus('solved');
        setFeedbackMessage('Brilliant! Puzzle Solved!');
        soundService.playVictory();

        if (!isRevealed) {
          const updated = recordPuzzleResult(currentPuzzle.id, true, currentPuzzle.rating);
          setStats(updated);
        }
      } else {
        // Multi-move puzzle: computer responds with next defensive move
        setMoveIndex(nextMoveIdx);
        setFeedbackMessage('Great move! Keep going...');

        const computerMoveStr = currentPuzzle.moves[nextMoveIdx];
        setTimeout(() => {
          playComputerResponse(nextState, computerMoveStr, nextMoveIdx + 1);
        }, 500);
      }
    } else {
      // Incorrect move
      soundService.playIllegal();
      setFeedbackMessage("That's not the best tactic. Try again!");

      // Revert after brief display
      setTimeout(() => {
        // Reset back to before this move
        soundService.playDefeat();
      }, 400);
    }
  };

  // Play the opponent's reply in multi-move tactics
  const playComputerResponse = (
    currentState: GameState,
    expectedMoveStr: string,
    nextPlayerIdx: number
  ) => {
    // Find matching legal move for opponent
    let matchedMove: Move | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentState.board[r][c];
        if (p && p.color === currentState.turn) {
          const legals = getLegalMovesForPiece(
            currentState.board,
            r,
            c,
            currentState.castling,
            currentState.enPassantTarget
          );
          for (const m of legals) {
            const testState = executeMove(currentState, m);
            if (isPuzzleMoveCorrect(testState.lastMove || m, expectedMoveStr)) {
              matchedMove = m;
              break;
            }
          }
        }
        if (matchedMove) break;
      }
      if (matchedMove) break;
    }

    if (matchedMove) {
      const afterComputerState = executeMove(currentState, matchedMove);
      setGameState(afterComputerState);
      setMoveIndex(nextPlayerIdx);

      if (matchedMove.captured) soundService.playCapture(matchedMove.captured.type);
      else soundService.playMove(matchedMove.piece.type);

      if (afterComputerState.isCheck) soundService.playCheck();
    }
  };

  // Restart current puzzle
  const handleRestart = () => {
    setGameState(fenToGameState(currentPuzzle.fen));
    setMoveIndex(0);
    setPuzzleStatus('playing');
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedbackMessage('');
    soundService.playSelect();
  };

  // Request Hint
  const handleHint = () => {
    if (hintLevel === 0) {
      setHintLevel(1);
      soundService.playHint();
    } else if (hintLevel === 1) {
      setHintLevel(2);
      soundService.playHint();
    }
  };

  // Reveal Solution step-by-step
  const handleRevealSolution = () => {
    setIsRevealed(true);
    soundService.playSelect();
    let current = fenToGameState(currentPuzzle.fen);
    setGameState(current);
    setMoveIndex(0);

    // Step through each move with timeout
    currentPuzzle.moves.forEach((moveStr, idx) => {
      setTimeout(() => {
        let best: Move | null = null;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = current.board[r][c];
            if (p && p.color === current.turn) {
              const legals = getLegalMovesForPiece(
                current.board,
                r,
                c,
                current.castling,
                current.enPassantTarget
              );
              for (const m of legals) {
                const test = executeMove(current, m);
                if (isPuzzleMoveCorrect(test.lastMove || m, moveStr)) {
                  best = m;
                  break;
                }
              }
            }
            if (best) break;
          }
          if (best) break;
        }

        if (best) {
          current = executeMove(current, best);
          setGameState(current);
          if (best.captured) soundService.playCapture(best.captured.type);
          else soundService.playMove(best.piece.type);
        }

        if (idx === currentPuzzle.moves.length - 1) {
          setPuzzleStatus('solved');
          setFeedbackMessage('Solution Walkthrough Complete');
        }
      }, (idx + 1) * 700);
    });
  };

  // Next puzzle
  const handleNextPuzzle = () => {
    const curIdx = PUZZLE_DATABASE.findIndex((p) => p.id === currentPuzzle.id);
    const nextIdx = (curIdx + 1) % PUZZLE_DATABASE.length;
    loadPuzzle(PUZZLE_DATABASE[nextIdx]);
    soundService.playSelect();
  };

  const isDaily = currentPuzzle.id === getDailyPuzzle().id;
  const isSolved = stats.solvedIds.includes(currentPuzzle.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Stats Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white tracking-wide">CHESS TACTICS ARENA</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PUZZLE MODE
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Sharpen your tactical vision with daily mating patterns, forks, pins, and sacrifices.
            </p>
          </div>
        </div>

        {/* User Stats Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-stone-400">Rating:</span>
            <span className="font-bold text-amber-300 font-mono">{stats.rating}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-stone-400">Streak:</span>
            <span className="font-bold text-orange-400 font-mono">{stats.streak}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-stone-400">Solved:</span>
            <span className="font-bold text-emerald-400 font-mono">{stats.solvedCount}</span>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => {
            setActiveTab('daily');
            loadPuzzle(getDailyPuzzle());
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Challenge</span>
        </button>

        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'browse'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Tactics Gym ({PUZZLE_DATABASE.length})</span>
        </button>
      </div>

      {/* Main Puzzle Area: Board on left, Mission on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Chess Board */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center space-y-3">
          {/* Turn and Objective Top Banner */}
          <div className="w-full max-w-[560px] flex items-center justify-between p-3 rounded-xl bg-stone-900/90 border border-stone-800">
            <div className="flex items-center space-x-2">
              <span
                className={`w-3.5 h-3.5 rounded-full border ${
                  currentPuzzle.playerColor === 'w'
                    ? 'bg-white border-stone-300'
                    : 'bg-stone-900 border-stone-600'
                }`}
              />
              <span className="text-xs font-bold text-white">
                {currentPuzzle.playerColor === 'w' ? 'White to Move' : 'Black to Move'}
              </span>
            </div>

            <span className="text-xs font-semibold text-amber-400">{currentPuzzle.goal}</span>
          </div>

          {/* Chess Board Component */}
          <ChessBoard
            board={gameState.board}
            turn={gameState.turn}
            playerColor={currentPuzzle.playerColor}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={gameState.lastMove}
            isCheck={gameState.isCheck}
            flipped={currentPuzzle.playerColor === 'b'}
            showMoves={true}
            onSquareClick={handleSquareClick}
            disabled={puzzleStatus === 'solved' || isRevealed}
          />

          {/* Quick controls bar under board */}
          <div className="w-full max-w-[560px] flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            <button
              onClick={handleHint}
              disabled={hintLevel >= 2}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-sky-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{hintLevel === 0 ? 'Hint' : hintLevel === 1 ? 'More Hint' : 'Hint Shown'}</span>
            </button>

            <button
              onClick={handleRevealSolution}
              disabled={puzzleStatus === 'solved' || isRevealed}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              <span>Solution</span>
            </button>

            <button
              onClick={handleNextPuzzle}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors text-xs font-bold cursor-pointer shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Tactical Mission & Feedback Card */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 w-full">
          {/* Mission Card */}
          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">{currentPuzzle.title}</h2>
                  {isDaily && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      DAILY
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">Rating: {currentPuzzle.rating} ELO</p>
              </div>

              {/* Solved checkmark */}
              {isSolved && (
                <div className="flex items-center space-x-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Solved</span>
                </div>
              )}
            </div>

            {/* Badges: Difficulty & Theme */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  currentPuzzle.difficulty === 'Beginner'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : currentPuzzle.difficulty === 'Intermediate'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {currentPuzzle.difficulty}
              </span>

              <span className="px-2 py-0.5 rounded-md font-semibold bg-stone-800 text-stone-300 border border-stone-700 uppercase">
                #{currentPuzzle.theme}
              </span>
            </div>

            {/* Status / Feedback Banner */}
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                puzzleStatus === 'solved'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                  : feedbackMessage.includes('not the best')
                  ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                  : feedbackMessage.includes('Great move')
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200'
                  : 'bg-stone-950 border border-stone-800 text-stone-300'
              }`}
            >
              {puzzleStatus === 'solved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : feedbackMessage.includes('not the best') ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {puzzleStatus === 'solved'
                    ? 'Tactical Triumph!'
                    : feedbackMessage || 'Your Move!'}
                </div>
                <div className="text-[11px] font-normal opacity-90 mt-0.5">
                  {puzzleStatus === 'solved'
                    ? `You gained rating and kept your streak alive!`
                    : feedbackMessage || `Find the strongest legal continuation.`}
                </div>
              </div>
            </div>

            {/* Hint Box */}
            {hintLevel > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center space-x-1.5 font-bold text-amber-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Tactical Clue:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  {hintLevel === 1 ? currentPuzzle.hint : currentPuzzle.explanation}
                </p>
              </div>
            )}

            {/* Solved Explanation Walkthrough */}
            {(puzzleStatus === 'solved' || isRevealed) && (
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-2">
                <span className="font-bold text-stone-200 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Grandmaster Explanation:</span>
                </span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {currentPuzzle.explanation}
                </p>
                <div className="text-[11px] font-mono text-amber-300 pt-1">
                  Solution Moves: {currentPuzzle.moves.join(' → ')}
                </div>
              </div>
            )}
          </div>

          {/* Tactics Gym Browser if active tab */}
          {activeTab === 'browse' && (
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                  Tactics Collection
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {filteredPuzzles.length} Available
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="flex-1 text-xs bg-stone-950 border border-stone-800 text-stone-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={themeFilter}
                  onChange={(e) => setThemeFilter(e.target.value)}
                  className="flex-1 text-xs bg-stone-950 border border-stone-800 text-stone-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="all">All Themes</option>
                  <option value="checkmate">Checkmates</option>
                  <option value="fork">Forks</option>
                  <option value="pin">Pins</option>
                  <option value="deflection">Deflections</option>
                  <option value="promotion">Promotions</option>
                </select>
              </div>

              {/* Puzzle List Items */}
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                {filteredPuzzles.map((p) => {
                  const active = p.id === currentPuzzle.id;
                  const solved = stats.solvedIds.includes(p.id);

                  return (
                    <button
                      key={p.id}
                      onClick={() => loadPuzzle(p)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        active
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-stone-950/60 border-stone-850 hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-semibold truncate flex items-center space-x-1.5">
                          <span>{p.title}</span>
                          {p.id === getDailyPuzzle().id && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold">
                              DAILY
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {p.difficulty} • {p.rating} ELO • {p.goal}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-1">
                        {solved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
