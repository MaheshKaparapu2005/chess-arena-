import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Board,
  GameState,
  Move,
  Piece,
  PieceColor,
  PieceType,
  GameMode,
  AIDifficulty,
  BestMoveEvaluation,
  User,
  GameAnalysisReport,
} from '../models/chess';
import {
  createInitialGameState,
  getLegalMovesForPiece,
  getAllLegalMoves,
  executeMove,
  isKingInCheck,
} from '../services/chess-move.service';
import {
  getBestMoveSuggestion,
  getComputerMove,
  calculateMaterial,
  analyzeGame,
} from '../services/chess-eval.service';
import { soundService } from '../services/sound.service';
import { gameService } from '../services/game.service';
import { socketService } from '../services/socket.service';

import { ChessBoard } from '../components/ChessBoard';
import { GameClock } from '../components/GameClock';
import { MoveHistory } from '../components/MoveHistory';
import { CapturedPieces } from '../components/CapturedPieces';
import { MoveAssistPanel } from '../components/MoveAssistPanel';
import { PromotionModal } from '../components/PromotionModal';
import { GameResultModal } from '../components/GameResultModal';
import { SoundSettingsModal } from '../components/SoundSettingsModal';
import { EngineReviewPanel } from '../components/EngineReviewPanel';
import { PgnViewerPanel } from '../components/PgnViewerPanel';
import { EvaluationBar } from '../components/EvaluationBar';
import { isPuzzleMoveCorrect } from '../services/chess-puzzle.service';

import {
  RotateCcw,
  Flag,
  Handshake,
  Repeat,
  Send,
  Users,
  Copy,
  Check,
  Bot,
  Settings2,
  Volume2,
  Sliders,
  Eye,
  SkipForward,
  Cpu,
  BarChart2,
  FileText,
  History,
} from 'lucide-react';

interface GamePageProps {
  initialMode?: GameMode;
  currentUser: User | null;
  onGoHome: () => void;
  onRefreshProfile?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  initialMode = 'computer',
  currentUser,
  onGoHome,
  onRefreshProfile,
}) => {
  // Game Setup State
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [timeControl, setTimeControl] = useState<number>(600); // 10 minutes default
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [flipped, setFlipped] = useState<boolean>(false);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<Piece[]>([]);

  // Promotion State
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: { r: number; c: number };
    to: { r: number; c: number };
    piece: Piece;
    captured?: Piece;
  } | null>(null);

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Assist & Settings
  const [showMoves, setShowMoves] = useState<boolean>(() => {
    return localStorage.getItem('chess_arena_show_moves') !== 'false';
  });
  const [showEvalBar, setShowEvalBar] = useState<boolean>(() => {
    return localStorage.getItem('chess_arena_show_eval_bar') !== 'false';
  });
  const [bestMove, setBestMove] = useState<BestMoveEvaluation | null>(null);
  const [isLoadingBestMove, setIsLoadingBestMove] = useState<boolean>(false);

  // Modals & Dialogs
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [gameEndReason, setGameEndReason] = useState<string>('');
  const [confirmResign, setConfirmResign] = useState<boolean>(false);
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);

  // Online Multiplayer State
  const [roomId, setRoomId] = useState<string>(
    () => `arena_${Math.random().toString(36).substring(2, 8)}`
  );
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [isOnlineJoined, setIsOnlineJoined] = useState<boolean>(false);
  const [onlineOpponent, setOnlineOpponent] = useState<{ username: string; rating?: number } | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [drawOfferReceived, setDrawOfferReceived] = useState<boolean>(false);
  const [roomCopied, setRoomCopied] = useState<boolean>(false);

  const gameIdRef = useRef<string>(`game_${Date.now()}`);

  // Material evaluation
  const material = calculateMaterial(gameState.board);

  // Move History Review State
  const [reviewStep, setReviewStep] = useState<number | null>(null);

  // Side Panel Tab: 'moves' (Score Sheet) or 'pgn' (PGN Notation View)
  const [sidePanelTab, setSidePanelTab] = useState<'moves' | 'pgn'>('moves');

  // Engine Review Mode State
  const [isEngineReviewOpen, setIsEngineReviewOpen] = useState<boolean>(false);
  const [showBestAlternative, setShowBestAlternative] = useState<boolean>(true);

  // Compute snapshot of GameState after each move
  const historyStates = useMemo(() => {
    const states: GameState[] = [createInitialGameState()];
    let current = states[0];
    for (const move of moveHistory) {
      current = executeMove(current, move);
      states.push(current);
    }
    return states;
  }, [moveHistory]);

  // Compute Engine Review Analysis report when enabled or moves change
  const engineAnalysisReport: GameAnalysisReport | null = useMemo(() => {
    if (!isEngineReviewOpen || moveHistory.length === 0) return null;
    return analyzeGame(moveHistory, historyStates);
  }, [isEngineReviewOpen, moveHistory, historyStates]);

  const currentStep =
    reviewStep !== null
      ? Math.min(reviewStep, historyStates.length - 1)
      : historyStates.length - 1;
  const isReviewing = (reviewStep !== null && reviewStep < historyStates.length - 1) || isEngineReviewOpen;
  const shouldShowEvalBar = showEvalBar && (isReviewing || isEngineReviewOpen || gameState.isGameOver || mode === 'computer');
  const displayState = historyStates[currentStep] || gameState;
  const displayMaterial = calculateMaterial(displayState.board);

  // Current move analysis for the active step in review mode
  const currentReviewMoveAnalysis = useMemo(() => {
    if (!engineAnalysisReport || currentStep <= 0 || currentStep > engineAnalysisReport.moves.length) {
      return null;
    }
    return engineAnalysisReport.moves[currentStep - 1];
  }, [engineAnalysisReport, currentStep]);

  // Compute captured pieces matching historical review step
  const displayCapturedPieces = useMemo(() => {
    if (!isReviewing) return capturedPieces;
    const list: Piece[] = [];
    for (let i = 0; i < currentStep; i++) {
      if (moveHistory[i]?.captured) {
        list.push(moveHistory[i].captured!);
      }
    }
    return list;
  }, [isReviewing, currentStep, moveHistory, capturedPieces]);

  // Step navigation handlers
  const handleSelectStep = (step: number) => {
    if (step >= historyStates.length - 1) {
      setReviewStep(null);
    } else {
      setReviewStep(Math.max(0, step));
    }
    soundService.playSelect();
  };

  const handleGoToStart = () => {
    setReviewStep(0);
    soundService.playSelect();
  };

  const handleGoToPrev = () => {
    const current = reviewStep !== null ? reviewStep : historyStates.length - 1;
    const next = Math.max(0, current - 1);
    setReviewStep(next);
    soundService.playSelect();
  };

  const handleGoToNext = () => {
    const current = reviewStep !== null ? reviewStep : historyStates.length - 1;
    const next = current + 1;
    if (next >= historyStates.length - 1) {
      setReviewStep(null);
    } else {
      setReviewStep(next);
    }
    soundService.playSelect();
  };

  const handleGoToLive = () => {
    setReviewStep(null);
    soundService.playSelect();
  };

  // Determine game result string for PGN export
  const gameResultStr = useMemo(() => {
    if (!gameState.isGameOver) return '*';
    if (gameState.winner === 'w') return '1-0';
    if (gameState.winner === 'b') return '0-1';
    return '1/2-1/2';
  }, [gameState.isGameOver, gameState.winner]);

  // Handle importing custom PGN moves into active game
  const handleImportPgn = (movesSans: string[]) => {
    let simState = createInitialGameState();
    const executedMoves: Move[] = [];
    const captured: Piece[] = [];

    for (const san of movesSans) {
      const turn = simState.turn;
      let foundMove: Move | null = null;

      outerSearch:
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = simState.board[r][c];
          if (piece && piece.color === turn) {
            const legals = getLegalMovesForPiece(
              simState.board,
              r,
              c,
              simState.castling,
              simState.enPassantTarget
            );
            for (const m of legals) {
              if (isPuzzleMoveCorrect(m, san)) {
                foundMove = m;
                break outerSearch;
              }
            }
          }
        }
      }

      if (foundMove) {
        if (foundMove.captured) {
          captured.push(foundMove.captured);
        }
        simState = executeMove(simState, foundMove);
        executedMoves.push(foundMove);
      } else {
        break;
      }
    }

    if (executedMoves.length > 0) {
      setGameState(simState);
      setMoveHistory(executedMoves);
      setCapturedPieces(captured);
      setReviewStep(executedMoves.length);
      setSelectedSquare(null);
      setLegalMoves([]);
      soundService.playVictory();
    }
  };

  // Keyboard navigation for step review (Arrow keys, Home, End)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleGoToPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleGoToNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleGoToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        handleGoToLive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewStep, historyStates.length]);

  // Save preference for showing moves
  const toggleShowMoves = () => {
    const next = !showMoves;
    setShowMoves(next);
    localStorage.setItem('chess_arena_show_moves', String(next));
  };

  // Clock countdown interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockRunning && !gameState.isGameOver) {
      interval = setInterval(() => {
        if (gameState.turn === 'w') {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              handleTimeout('w');
              return 0;
            }
            if (prev <= 15) {
              soundService.playClockTick(prev <= 5);
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              handleTimeout('b');
              return 0;
            }
            if (prev <= 15) {
              soundService.playClockTick(prev <= 5);
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockRunning, gameState.turn, gameState.isGameOver]);

  // Timeout handler
  const handleTimeout = useCallback(
    (colorLost: PieceColor) => {
      const winnerColor: PieceColor = colorLost === 'w' ? 'b' : 'w';
      setGameState((prev) => ({
        ...prev,
        isGameOver: true,
        winner: winnerColor,
      }));
      setGameEndReason(`Time Out (${colorLost === 'w' ? 'White' : 'Black'} ran out of time)`);
      setShowResultModal(true);
      soundService.playTimeout();
      const isPlayerWin = !playerColor || winnerColor === playerColor;
      if (isPlayerWin) {
        soundService.playVictory();
      } else {
        soundService.playDefeat();
      }
      saveGameToBackend(winnerColor, 'Timeout');
    },
    [gameState, playerColor]
  );

  // Save game to backend REST API
  const saveGameToBackend = async (
    winner: PieceColor | 'draw' | null,
    reason: string
  ) => {
    const resultStr = winner === 'w' ? 'white' : winner === 'b' ? 'black' : 'draw';
    await gameService.saveGame({
      _id: gameIdRef.current,
      whitePlayer: {
        id: currentUser?.id || 'guest_white',
        username: currentUser?.username || 'White',
        rating: currentUser?.rating || 1200,
      },
      blackPlayer: {
        id: mode === 'computer' ? 'computer' : onlineOpponent?.username || 'Black',
        username: mode === 'computer' ? `ChessBot (${aiDifficulty})` : onlineOpponent?.username || 'Black',
        rating: mode === 'computer' ? 1400 : onlineOpponent?.rating || 1200,
      },
      moves: moveHistory.map((m, idx) => ({
        moveNumber: Math.floor(idx / 2) + 1,
        san: m.san || 'move',
        from: `${m.from.r},${m.from.c}`,
        to: `${m.to.r},${m.to.c}`,
        piece: m.piece.type,
        captured: m.captured?.type,
        color: m.piece.color,
      })),
      boardState: gameState.board,
      result: resultStr,
      status: 'completed',
      reason,
      timeControl,
      startedAt: new Date(Date.now() - (timeControl - whiteTime) * 1000).toISOString(),
      endedAt: new Date().toISOString(),
    });

    if (onRefreshProfile) {
      onRefreshProfile();
    }
  };

  // Reset or Start New Game
  const startNewGame = useCallback(
    (newMode = mode, newTimeControl = timeControl) => {
      const fresh = createInitialGameState();
      setGameState(fresh);
      setSelectedSquare(null);
      setLegalMoves([]);
      setMoveHistory([]);
      setCapturedPieces([]);
      setWhiteTime(newTimeControl);
      setBlackTime(newTimeControl);
      setIsClockRunning(false);
      setBestMove(null);
      setShowResultModal(false);
      setConfirmResign(false);
      setPendingPromotionMove(null);
      setReviewStep(null);
      setIsEngineReviewOpen(false);
      gameIdRef.current = `game_${Date.now()}`;
      soundService.playGameStart();
    },
    [mode, timeControl]
  );

  // Execute a verified legal move
  const applyMove = useCallback(
    (move: Move) => {
      // Start clock on first move
      if (!isClockRunning) {
        setIsClockRunning(true);
      }

      // Ensure user is on live position when a move is executed
      setReviewStep(null);

      // Play appropriate sound with piece specificity
      if (move.isCastling) {
        soundService.playCastle();
      } else if (move.promotion) {
        soundService.playPromotion(move.promotion);
      } else if (move.captured || move.isEnPassant) {
        soundService.playCapture(move.captured?.type, move.piece.type);
      } else {
        soundService.playMove(move.piece.type);
      }

      // Record captured piece
      if (move.captured) {
        setCapturedPieces((prev) => [...prev, move.captured!]);
      }

      // Update state
      const nextState = executeMove(gameState, move);
      setGameState(nextState);
      setMoveHistory((prev) => [...prev, nextState.lastMove || move]);
      setSelectedSquare(null);
      setLegalMoves([]);
      setBestMove(null);

      // Check sound / game over sound
      if (nextState.isCheckmate) {
        const isPlayerWin = !playerColor || nextState.winner === playerColor;
        if (isPlayerWin) {
          soundService.playVictory();
        } else {
          soundService.playDefeat();
        }
        setGameEndReason('Checkmate');
        setShowResultModal(true);
        saveGameToBackend(nextState.winner, 'Checkmate');
      } else if (nextState.isStalemate) {
        soundService.playDraw();
        setGameEndReason('Stalemate');
        setShowResultModal(true);
        saveGameToBackend('draw', 'Stalemate');
      } else if (nextState.isCheck) {
        soundService.playCheck();
      }

      // Broadcast move if online multiplayer
      if (mode === 'online') {
        socketService.sendMove(roomId, move);
      }
    },
    [gameState, isClockRunning, mode, roomId, playerColor]
  );

  // Computer AI move trigger
  useEffect(() => {
    if (
      mode === 'computer' &&
      gameState.turn !== playerColor &&
      !gameState.isGameOver &&
      !pendingPromotionMove
    ) {
      const timer = setTimeout(() => {
        const aiMove = getComputerMove(gameState, aiDifficulty);
        if (aiMove) {
          applyMove(aiMove);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mode, gameState, playerColor, aiDifficulty, applyMove, pendingPromotionMove]);

  // Online Socket.IO Events listener
  useEffect(() => {
    if (mode === 'online') {
      const socket = socketService.connect();

      socket.on('joined_room', (data) => {
        setIsOnlineJoined(true);
        setPlayerColor(data.color);
        setFlipped(data.color === 'b');
        if (data.color === 'w' && data.black) {
          setOnlineOpponent(data.black);
        } else if (data.color === 'b' && data.white) {
          setOnlineOpponent(data.white);
        }
      });

      socket.on('room_update', (data) => {
        if (playerColor === 'w' && data.black) {
          setOnlineOpponent(data.black);
        } else if (playerColor === 'b' && data.white) {
          setOnlineOpponent(data.white);
        }
      });

      socket.on('move_made', (data) => {
        // If move was made by opponent, apply it locally
        if (data.move && data.gameState) {
          setGameState(data.gameState);
          setMoveHistory((prev) => [...prev, data.move]);
          if (data.move.captured) {
            setCapturedPieces((prev) => [...prev, data.move.captured]);
          }
          if (data.move.isCastling) soundService.playCastle();
          else if (data.move.promotion) soundService.playPromotion(data.move.promotion);
          else if (data.move.captured) soundService.playCapture(data.move.captured.type);
          else soundService.playMove(data.move.piece?.type);

          if (data.gameState.isCheckmate) {
            const isWinner = data.gameState.winner === playerColor;
            if (isWinner) soundService.playVictory();
            else soundService.playDefeat();
            setGameEndReason('Checkmate');
            setShowResultModal(true);
          } else if (data.gameState.isStalemate) {
            soundService.playDraw();
            setGameEndReason('Stalemate');
            setShowResultModal(true);
          } else if (data.gameState.isCheck) {
            soundService.playCheck();
          }
        }
      });

      socket.on('game_ended', (data) => {
        const winner = data.winner === 'white' ? 'w' : data.winner === 'black' ? 'b' : 'draw';
        setGameState((prev) => ({
          ...prev,
          isGameOver: true,
          winner,
        }));
        setGameEndReason(data.reason);
        setShowResultModal(true);
        if (winner === 'draw') {
          soundService.playDraw();
        } else if (winner === playerColor) {
          soundService.playVictory();
        } else {
          soundService.playDefeat();
        }
      });

      socket.on('draw_offered', () => {
        setDrawOfferReceived(true);
      });

      socket.on('chat_message', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      return () => {
        socket.off('joined_room');
        socket.off('room_update');
        socket.off('move_made');
        socket.off('game_ended');
        socket.off('draw_offered');
        socket.off('chat_message');
      };
    }
  }, [mode, playerColor]);

  // Click on chessboard square
  const handleSquareClick = (r: number, c: number) => {
    // If reviewing past moves, clicking any square snaps back to live game
    if (isReviewing) {
      setReviewStep(null);
      soundService.playSelect();
      return;
    }

    if (gameState.isGameOver) return;

    // In computer mode, prevent moving during AI turn
    if (mode === 'computer' && gameState.turn !== playerColor) return;

    // In online mode, prevent moving if not your color or opponent hasn't joined
    if (mode === 'online' && (gameState.turn !== playerColor || !isOnlineJoined)) return;

    const clickedPiece = gameState.board[r][c];

    // If square is already selected, unselect or switch to friendly piece
    if (selectedSquare) {
      // Check if clicked square is one of legal destinations
      const legalDestination = legalMoves.find((m) => m.to.r === r && m.to.c === c);

      if (legalDestination) {
        // Check if pawn promotion
        const isPromotion =
          legalDestination.piece.type === 'p' &&
          ((legalDestination.piece.color === 'w' && r === 0) ||
            (legalDestination.piece.color === 'b' && r === 7));

        if (isPromotion) {
          setPendingPromotionMove({
            from: legalDestination.from,
            to: legalDestination.to,
            piece: legalDestination.piece,
            captured: legalDestination.captured,
          });
          return;
        }

        applyMove(legalDestination);
        return;
      }

      // If clicking another piece of current player's color, select that piece instead
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

      // Clicked on empty or invalid square, clear selection with subtle illegal feedback
      soundService.playIllegal();
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // No piece selected yet: only select piece belonging to current player
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

  // Pawn promotion choice chosen
  const handlePromotionSelect = (type: PieceType) => {
    if (!pendingPromotionMove) return;

    const move: Move = {
      from: pendingPromotionMove.from,
      to: pendingPromotionMove.to,
      piece: pendingPromotionMove.piece,
      captured: pendingPromotionMove.captured,
      promotion: type,
    };

    setPendingPromotionMove(null);
    applyMove(move);
  };

  // Best Move recommendation button
  const handleSuggestBestMove = () => {
    setIsLoadingBestMove(true);
    setTimeout(() => {
      const suggestion = getBestMoveSuggestion(gameState);
      setBestMove(suggestion);
      setIsLoadingBestMove(false);
    }, 250);
  };

  // Resign button
  const handleResign = () => {
    const winnerColor: PieceColor = gameState.turn === 'w' ? 'b' : 'w';
    setGameState((prev) => ({
      ...prev,
      isGameOver: true,
      winner: winnerColor,
    }));
    const reasonText = `${gameState.turn === 'w' ? 'White' : 'Black'} Resigned`;
    setGameEndReason(reasonText);
    setShowResultModal(true);
    soundService.playDefeat();
    setConfirmResign(false);

    if (mode === 'online') {
      socketService.resign(roomId);
    }

    saveGameToBackend(winnerColor, reasonText);
  };

  // Draw Offer button
  const handleOfferDraw = () => {
    if (mode === 'computer') {
      // Simple heuristic: accept if material is even and evaluation is close
      if (Math.abs(material.diff) <= 1) {
        setGameState((prev) => ({
          ...prev,
          isGameOver: true,
          winner: 'draw',
        }));
        setGameEndReason('Draw Agreed with Computer');
        setShowResultModal(true);
        soundService.playDraw();
        saveGameToBackend('draw', 'Draw Agreed');
      } else {
        alert('Computer bot declined the draw offer.');
      }
    } else if (mode === 'local') {
      const accept = window.confirm('Black accepts the draw offer?');
      if (accept) {
        setGameState((prev) => ({
          ...prev,
          isGameOver: true,
          winner: 'draw',
        }));
        setGameEndReason('Mutual Draw Agreed');
        setShowResultModal(true);
        soundService.playDraw();
        saveGameToBackend('draw', 'Draw Agreed');
      }
    } else if (mode === 'online') {
      socketService.offerDraw(roomId);
      alert('Draw offer sent to opponent.');
    }
  };

  // Online Multiplayer Room Join
  const handleJoinOnlineRoom = () => {
    const targetRoom = inputRoomId.trim() || roomId;
    socketService.joinGame(targetRoom, {
      username: currentUser?.username || 'Challenger',
      userId: currentUser?.id,
      rating: currentUser?.rating || 1200,
      timeControl: timeControl / 60,
    });
    setRoomId(targetRoom);
    setIsOnlineJoined(true);
  };

  // Copy Room ID
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setRoomCopied(true);
    setTimeout(() => setRoomCopied(false), 2000);
  };

  // In-Game Chat Send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketService.sendChat(roomId, chatInput.trim(), currentUser?.username || 'Me');
    setChatInput('');
  };

  const selectedPiece = selectedSquare
    ? gameState.board[selectedSquare.r][selectedSquare.c]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Top Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm">
        {/* Mode & Difficulty Badges */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            {mode === 'computer' && <Bot className="w-4 h-4" />}
            {mode === 'local' && <Users className="w-4 h-4" />}
            <span>
              {mode === 'computer' ? 'vs Computer Bot' : mode === 'local' ? 'Pass & Play' : 'Online Room'}
            </span>
          </span>

          {mode === 'computer' && (
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as AIDifficulty)}
              className="text-xs font-semibold bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value="easy">Easy (1000 ELO)</option>
              <option value="medium">Medium (1400 ELO)</option>
              <option value="hard">Hard (1800 ELO)</option>
            </select>
          )}

          {/* Time control selector if game hasn't started */}
          {!isClockRunning && moveHistory.length === 0 && (
            <select
              value={timeControl}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTimeControl(val);
                setWhiteTime(val);
                setBlackTime(val);
              }}
              className="text-xs font-semibold bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value={60}>1 Min (Bullet)</option>
              <option value={180}>3 Min (Blitz)</option>
              <option value={300}>5 Min (Rapid)</option>
              <option value={600}>10 Min (Classical)</option>
            </select>
          )}
        </div>

        {/* Flip Board, Sound, Engine Review & Reset Controls */}
        <div className="flex items-center space-x-2">
          {/* Engine Review Toggle */}
          <button
            onClick={() => {
              if (moveHistory.length === 0) return;
              const next = !isEngineReviewOpen;
              setIsEngineReviewOpen(next);
              if (next && reviewStep === null) {
                setReviewStep(historyStates.length - 1);
              }
              soundService.playSelect();
            }}
            disabled={moveHistory.length === 0}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isEngineReviewOpen
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700 disabled:opacity-40'
            }`}
            title={moveHistory.length === 0 ? 'Make moves to enable engine review' : 'Toggle Engine Review & Blunder Analysis'}
          >
            <Cpu className={`w-3.5 h-3.5 ${isEngineReviewOpen ? 'text-white' : 'text-emerald-400'}`} />
            <span>{isEngineReviewOpen ? 'Review Mode' : 'Engine Review'}</span>
          </button>

          {/* Quick PGN Notation Mode Toggle */}
          <button
            onClick={() => {
              setSidePanelTab(sidePanelTab === 'pgn' ? 'moves' : 'pgn');
              soundService.playSelect();
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              sidePanelTab === 'pgn'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title="Toggle PGN Notation Side Panel"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">PGN</span>
          </button>

          {/* Quick Engine Evaluation Bar Toggle */}
          <button
            onClick={() => {
              const next = !showEvalBar;
              setShowEvalBar(next);
              localStorage.setItem('chess_arena_show_eval_bar', String(next));
              soundService.playSelect();
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showEvalBar
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title="Toggle Visual Engine Evaluation Bar"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Eval</span>
          </button>

          <button
            onClick={() => setShowSoundModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            title="Audio & Sound FX Settings"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          <button
            onClick={() => setFlipped(!flipped)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            title="Flip board perspective"
          >
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Flip</span>
          </button>

          <button
            onClick={() => startNewGame()}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            title="Start new game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Online Room Info Banner if in Online Mode */}
      {mode === 'online' && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-indigo-300">Room Code:</span>
            <code className="px-2 py-0.5 rounded bg-indigo-900/60 font-mono text-white text-xs">
              {roomId}
            </code>
            <button
              onClick={handleCopyRoomId}
              className="p-1 rounded bg-indigo-800/60 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              title="Copy room code"
            >
              {roomCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isOnlineJoined ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter room code to join..."
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="px-2.5 py-1 rounded bg-stone-900 border border-stone-700 text-stone-200 text-xs outline-none"
              />
              <button
                onClick={handleJoinOnlineRoom}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected as {playerColor === 'w' ? 'White' : 'Black'}</span>
            </div>
          )}
        </div>
      )}

      {/* Draw Offer Notification Banner */}
      {drawOfferReceived && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500 text-xs flex items-center justify-between">
          <span className="text-amber-200 font-medium">
            Opponent has offered a Draw. Do you accept?
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                socketService.respondDraw(roomId, true);
                setDrawOfferReceived(false);
              }}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={() => {
                socketService.respondDraw(roomId, false);
                setDrawOfferReceived(false);
              }}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Main Arena Layout: Board on left, Panels on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Board & Clocks Column */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center space-y-3">
          {/* Top Clock (Opponent or Black if not flipped) */}
          <div className="w-full max-w-[560px]">
            <GameClock
              color={flipped ? 'w' : 'b'}
              timeRemaining={flipped ? whiteTime : blackTime}
              isActive={gameState.turn === (flipped ? 'w' : 'b')}
              playerName={
                flipped
                  ? currentUser?.username || 'White'
                  : mode === 'computer'
                  ? `ChessBot (${aiDifficulty})`
                  : onlineOpponent?.username || 'Black'
              }
              playerRating={
                flipped
                  ? currentUser?.rating || 1200
                  : mode === 'computer'
                  ? 1400
                  : onlineOpponent?.rating || 1200
              }
              materialAdvantage={
                flipped
                  ? displayMaterial.diff > 0 ? displayMaterial.diff : 0
                  : displayMaterial.diff < 0 ? Math.abs(displayMaterial.diff) : 0
              }
            />
            {/* Captured Pieces for top player */}
            <div className="px-2 pt-1">
              <CapturedPieces captured={displayCapturedPieces} forColor={flipped ? 'w' : 'b'} />
            </div>
          </div>

          {/* Review Mode Banner on Board */}
          {isReviewing && (
            <div className="w-full max-w-[560px] flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs shadow-md backdrop-blur-xs">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  Reviewing{' '}
                  <strong className="text-amber-300">
                    {currentStep === 0
                      ? 'Initial Position'
                      : `Move ${Math.ceil(currentStep / 2)}: ${moveHistory[currentStep - 1]?.san || 'Move'}`}
                  </strong>{' '}
                  <span className="text-amber-400/80 font-mono text-[11px]">
                    ({currentStep} / {moveHistory.length} ply)
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const next = !showEvalBar;
                    setShowEvalBar(next);
                    localStorage.setItem('chess_arena_show_eval_bar', String(next));
                    soundService.playSelect();
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    showEvalBar
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                  title="Toggle Visual Engine Evaluation Bar"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Eval Bar</span>
                </button>
                <button
                  onClick={handleGoToLive}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                  title="Resume live gameplay"
                >
                  <span>Resume Live</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Chessboard and Side Engine Evaluation Bar Container */}
          <div className="relative flex items-stretch justify-center gap-2 sm:gap-3 w-full max-w-[620px]">
            {/* Visual Engine Evaluation Bar on the side of the chess board during analysis */}
            {shouldShowEvalBar && (
              <div className="flex flex-col justify-center py-2.5 sm:py-3 shrink-0">
                <EvaluationBar
                  board={displayState.board}
                  gameState={displayState}
                  flipped={flipped}
                  className="h-full"
                />
              </div>
            )}

            <div className="w-full max-w-[560px]">
              <ChessBoard
                board={displayState.board}
                turn={displayState.turn}
                playerColor={playerColor}
                selectedSquare={isReviewing ? null : selectedSquare}
                legalMoves={isReviewing ? [] : legalMoves}
                lastMove={displayState.lastMove}
                isCheck={displayState.isCheck}
                flipped={flipped}
                showMoves={showMoves}
                suggestedMove={isReviewing ? undefined : bestMove?.move}
                onSquareClick={handleSquareClick}
                disabled={gameState.isGameOver || isReviewing}
                reviewAnalysis={currentReviewMoveAnalysis}
                showBestAlternative={showBestAlternative}
              />
            </div>
          </div>

          {/* Bottom Clock (Player or White if not flipped) */}
          <div className="w-full max-w-[560px]">
            {/* Captured Pieces for bottom player */}
            <div className="px-2 pb-1">
              <CapturedPieces captured={displayCapturedPieces} forColor={flipped ? 'b' : 'w'} />
            </div>
            <GameClock
              color={flipped ? 'b' : 'w'}
              timeRemaining={flipped ? blackTime : whiteTime}
              isActive={gameState.turn === (flipped ? 'b' : 'w')}
              playerName={
                flipped
                  ? mode === 'computer'
                    ? `ChessBot (${aiDifficulty})`
                    : onlineOpponent?.username || 'Black'
                  : currentUser?.username || 'White'
              }
              playerRating={
                flipped
                  ? mode === 'computer'
                    ? 1400
                    : onlineOpponent?.rating || 1200
                  : currentUser?.rating || 1200
              }
              materialAdvantage={
                flipped
                  ? displayMaterial.diff < 0 ? Math.abs(displayMaterial.diff) : 0
                  : displayMaterial.diff > 0 ? displayMaterial.diff : 0
              }
            />
          </div>

          {/* Bottom Action Bar: Resign, Draw, New Game */}
          <div className="w-full max-w-[560px] flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setConfirmResign(true)}
              disabled={gameState.isGameOver}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-red-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              <Flag className="w-3.5 h-3.5 text-red-400" />
              <span>Resign</span>
            </button>

            <button
              onClick={handleOfferDraw}
              disabled={gameState.isGameOver}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Offer Draw</span>
            </button>

            <button
              onClick={() => startNewGame()}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-sky-400 border border-stone-800 transition-colors text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>New Game</span>
            </button>
          </div>
        </div>

        {/* Side Panels Column: Engine Review, Move History, Move Assist, Chat */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 w-full">
          {/* Engine Review Panel if active */}
          {isEngineReviewOpen && engineAnalysisReport && (
            <div className="w-full">
              <EngineReviewPanel
                report={engineAnalysisReport}
                currentStep={currentStep}
                totalSteps={historyStates.length - 1}
                whitePlayerName={currentUser?.username || 'White'}
                blackPlayerName={
                  mode === 'computer'
                    ? `ChessBot (${aiDifficulty})`
                    : onlineOpponent?.username || 'Black'
                }
                onSelectStep={handleSelectStep}
                onCloseReview={() => setIsEngineReviewOpen(false)}
                showBestAlternative={showBestAlternative}
                onToggleBestAlternative={() => setShowBestAlternative((prev) => !prev)}
                showEvalBar={showEvalBar}
                onToggleEvalBar={() => {
                  const next = !showEvalBar;
                  setShowEvalBar(next);
                  localStorage.setItem('chess_arena_show_eval_bar', String(next));
                  soundService.playSelect();
                }}
              />
            </div>
          )}

          {/* Side-Panel Tab Switcher: Score Sheet Table vs PGN Notation */}
          <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                setSidePanelTab('moves');
                soundService.playSelect();
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sidePanelTab === 'moves'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Score Sheet</span>
            </button>
            <button
              onClick={() => {
                setSidePanelTab('pgn');
                soundService.playSelect();
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sidePanelTab === 'pgn'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PGN Notation</span>
            </button>
          </div>

          {/* Move History / PGN Side Panel */}
          <div className="w-full">
            {sidePanelTab === 'moves' ? (
              <MoveHistory
                moves={moveHistory}
                currentStep={currentStep}
                onSelectStep={handleSelectStep}
                onGoToStart={handleGoToStart}
                onGoToPrev={handleGoToPrev}
                onGoToNext={handleGoToNext}
                onGoToLive={handleGoToLive}
                isLive={!isReviewing}
                whitePlayerName={currentUser?.username || 'White'}
                blackPlayerName={
                  mode === 'computer'
                    ? `ChessBot (${aiDifficulty})`
                    : onlineOpponent?.username || 'Black'
                }
                analysisReport={engineAnalysisReport}
              />
            ) : (
              <PgnViewerPanel
                moves={moveHistory}
                currentStep={currentStep}
                onSelectStep={handleSelectStep}
                onGoToStart={handleGoToStart}
                onGoToPrev={handleGoToPrev}
                onGoToNext={handleGoToNext}
                onGoToLive={handleGoToLive}
                isLive={!isReviewing}
                whitePlayerName={currentUser?.username || 'White'}
                blackPlayerName={
                  mode === 'computer'
                    ? `ChessBot (${aiDifficulty})`
                    : onlineOpponent?.username || 'Black'
                }
                gameResult={gameResultStr}
                onImportPgn={handleImportPgn}
              />
            )}
          </div>

          {/* Move Assist & Mentor */}
          {!isEngineReviewOpen && (
            <MoveAssistPanel
              showMoves={showMoves}
              onToggleShowMoves={toggleShowMoves}
              selectedPiece={selectedPiece}
              legalMovesCount={legalMoves.length}
              bestMove={bestMove}
              onSuggestBestMove={handleSuggestBestMove}
              isLoadingBestMove={isLoadingBestMove}
            />
          )}

          {/* In-Game Chat if Online Mode */}
          {mode === 'online' && (
            <div className="flex flex-col bg-stone-900/80 border border-stone-800 rounded-xl p-3 shadow-md space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Arena Live Chat
              </span>
              <div className="h-28 overflow-y-auto space-y-1.5 text-xs p-2 rounded bg-stone-950/70 border border-stone-800/80">
                {chatMessages.length === 0 ? (
                  <div className="text-stone-500 italic text-center py-4">No messages yet. Say hi!</div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className="flex items-baseline space-x-1.5 leading-snug">
                      <span className="font-bold text-amber-400 text-[11px]">{m.sender}:</span>
                      <span className="text-stone-200 text-xs">{m.text}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="Type a chat message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Pawn Promotion Modal */}
      <PromotionModal
        color={pendingPromotionMove?.piece.color || 'w'}
        isOpen={!!pendingPromotionMove}
        onSelect={handlePromotionSelect}
      />

      {/* Resignation Confirmation Modal */}
      {confirmResign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Resign Game?</h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to resign this game? The victory will be awarded to your opponent.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleResign}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
              >
                Yes, Resign
              </button>
              <button
                onClick={() => setConfirmResign(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResultModal}
        winner={gameState.winner}
        reason={gameEndReason}
        totalMoves={moveHistory.length}
        playerColor={playerColor}
        onPlayAgain={() => startNewGame()}
        onClose={() => setShowResultModal(false)}
        onGoHome={onGoHome}
        onReviewGame={() => {
          setShowResultModal(false);
          setIsEngineReviewOpen(true);
          setReviewStep(historyStates.length - 1);
        }}
      />

      {/* Sound & Audio FX Settings Modal */}
      <SoundSettingsModal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
      />
    </div>
  );
};
