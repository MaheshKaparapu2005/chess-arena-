import {
  Board,
  GameState,
  Move,
  PieceColor,
  PieceType,
  BestMoveEvaluation,
  MoveClassificationType,
  MoveAnalysis,
  GameAnalysisReport,
} from '../models/chess';
import {
  getAllLegalMoves,
  simulateMove,
  isKingInCheck,
  coordToAlgebraic,
  executeMove,
} from './chess-move.service';

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (White perspective, rank 0 = 8th rank, rank 7 = 1st rank)
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST = [
  [0, 0, 0, 5, 5, 0, 0, 0],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MID_PST = [
  [20, 30, 10, 0, 0, 10, 30, 20],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
];

export function calculateMaterial(board: Board): { white: number; black: number; diff: number } {
  let white = 0;
  let black = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        if (piece.color === 'w') white += val;
        else black += val;
      }
    }
  }

  // difference from white's perspective in pawn units
  const diff = Math.round((white - black) / 100);
  return { white, black, diff };
}

// Center control squares
const CENTER_SQUARES = [
  { r: 3, c: 3 }, // d5
  { r: 3, c: 4 }, // e5
  { r: 4, c: 3 }, // d4
  { r: 4, c: 4 }, // e4
];

const EXTENDED_CENTER = [
  { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 5 },
  { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 5 },
  { r: 3, c: 2 }, { r: 3, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 5 },
];

/**
 * Returns static positional evaluation of the board from White's perspective in pawn units.
 * E.g., +1.5 means White is ahead by 1.5 pawns, -2.1 means Black is ahead by 2.1 pawns.
 */
export function evaluatePosition(board: Board, state?: Partial<GameState>): number {
  if (state?.isCheckmate) {
    return state.winner === 'w' ? 100 : -100;
  }
  if (state?.isStalemate) {
    return 0;
  }

  let centipawns = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece.color === 'w';
      const baseVal = PIECE_VALUES[piece.type] || 0;

      // PST lookup: for Black, mirror the row index (7 - r)
      const tableRow = isWhite ? r : 7 - r;
      let positionalBonus = 0;

      switch (piece.type) {
        case 'p':
          positionalBonus = PAWN_PST[tableRow][c];
          break;
        case 'n':
          positionalBonus = KNIGHT_PST[tableRow][c];
          break;
        case 'b':
          positionalBonus = BISHOP_PST[tableRow][c];
          break;
        case 'r':
          positionalBonus = ROOK_PST[tableRow][c];
          break;
        case 'q':
          positionalBonus = QUEEN_PST[tableRow][c];
          break;
        case 'k':
          positionalBonus = KING_MID_PST[tableRow][c];
          break;
      }

      const totalPieceVal = baseVal + positionalBonus;
      if (isWhite) {
        centipawns += totalPieceVal;
      } else {
        centipawns -= totalPieceVal;
      }
    }
  }

  // Bonus for check
  if (state?.isCheck) {
    if (state.turn === 'b') centipawns += 40; // White is checking Black
    else centipawns -= 40; // Black is checking White
  }

  // Convert centipawns to pawns and round to 2 decimals
  const pawns = Math.round((centipawns / 100) * 10) / 10;
  return pawns;
}

// Rule-based evaluation function for a candidate move
export function evaluateMove(
  board: Board,
  move: Move,
  color: PieceColor
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const { from, to, piece, captured, isCastling, promotion } = move;

  // 1. Material Gain / Captures
  if (captured) {
    const valGain = (PIECE_VALUES[captured.type] || 0) - (PIECE_VALUES[piece.type] || 0) * 0.1;
    score += valGain * 1.5;
    const capturedName = getPieceName(captured.type);
    reasons.push(`Captures ${capturedName} (+${Math.round(valGain / 100)} pts)`);
  }

  // 2. Pawn Promotion
  if (promotion) {
    score += PIECE_VALUES[promotion] * 1.2;
    reasons.push(`Promotes pawn to powerful ${getPieceName(promotion)}`);
  }

  // 3. Center Control
  const isDirectCenter = CENTER_SQUARES.some((sq) => sq.r === to.r && sq.c === to.c);
  if (isDirectCenter) {
    score += 45;
    reasons.push('Occupies key central square');
  } else {
    const isExtendedCenter = EXTENDED_CENTER.some((sq) => sq.r === to.r && sq.c === to.c);
    if (isExtendedCenter) {
      score += 20;
    }
  }

  // 4. Minor Piece Development
  if ((piece.type === 'n' || piece.type === 'b') && ((color === 'w' && from.r === 7) || (color === 'b' && from.r === 0))) {
    score += 40;
    reasons.push(`Develops ${getPieceName(piece.type)} from initial rank`);
  }

  // 5. Castling / King Safety
  if (isCastling) {
    score += 75;
    reasons.push('Safeguards king and activates rook via castling');
  }

  // 6. Check Opponent King
  const simulated = simulateMove(board, move);
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';
  const checksEnemy = isKingInCheck(simulated, enemyColor);
  if (checksEnemy) {
    score += 35;
    reasons.push('Delivers check to enemy king');
  }

  // 7. Penalize reckless king moves early in game
  if (piece.type === 'k' && !isCastling && (from.r === 7 || from.r === 0)) {
    score -= 30;
  }

  const primaryReason =
    reasons.length > 0
      ? reasons.join('. ') + '.'
      : `Solid positional move with ${getPieceName(piece.type)} to ${coordToAlgebraic(to.r, to.c)}.`;

  return { score, reason: primaryReason };
}

export function getPieceName(type: PieceType): string {
  switch (type) {
    case 'p': return 'Pawn';
    case 'n': return 'Knight';
    case 'b': return 'Bishop';
    case 'r': return 'Rook';
    case 'q': return 'Queen';
    case 'k': return 'King';
  }
}

// Returns the best evaluated move with human-readable explanation
export function getBestMoveSuggestion(state: GameState): BestMoveEvaluation | null {
  const legalMoves = getAllLegalMoves(state.board, state.turn, state.castling, state.enPassantTarget);
  if (legalMoves.length === 0) return null;

  let bestMove: Move = legalMoves[0];
  let highestScore = -Infinity;
  let bestReason = '';

  for (const move of legalMoves) {
    const { score, reason } = evaluateMove(state.board, move, state.turn);
    if (score > highestScore) {
      highestScore = score;
      bestMove = move;
      bestReason = reason;
    }
  }

  const pieceName = getPieceName(bestMove.piece.type);
  const toSquare = coordToAlgebraic(bestMove.to.r, bestMove.to.c);
  const san = bestMove.san || `${pieceName} → ${toSquare}`;

  return {
    move: bestMove,
    score: highestScore,
    reason: bestReason,
    san,
  };
}

// Educational Computer AI Move Selection
export function getComputerMove(
  state: GameState,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Move | null {
  const legalMoves = getAllLegalMoves(state.board, state.turn, state.castling, state.enPassantTarget);
  if (legalMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 40% chance of random move
    if (Math.random() < 0.4) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }

  // Scored moves
  const evaluated = legalMoves.map((m) => {
    const { score } = evaluateMove(state.board, m, state.turn);
    const jitter = (Math.random() - 0.5) * 15;
    return { move: m, score: score + jitter };
  });

  evaluated.sort((a, b) => b.score - a.score);

  if (difficulty === 'hard') {
    return evaluated[0].move;
  }

  // Medium: pick from top 3 moves
  const topSlice = evaluated.slice(0, Math.min(3, evaluated.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)].move;
}

/**
 * Calculates winning probability (0-100%) from mover's perspective given eval in pawns
 */
function getWinChance(pawnScore: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * (pawnScore * 100))) - 1);
}

/**
 * Performs full engine review analysis of a game, evaluating each move, classifying
 * blunders, mistakes, inaccuracies, and best moves, and computing player accuracy %.
 */
export function analyzeGame(
  moves: Move[],
  historyStates: GameState[]
): GameAnalysisReport {
  const moveAnalyses: MoveAnalysis[] = [];
  const evaluations: number[] = [];

  // Initial position evaluation
  evaluations.push(evaluatePosition(historyStates[0]?.board || []));

  const whiteCounts: Record<MoveClassificationType, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  const blackCounts: Record<MoveClassificationType, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  const whiteAccuracies: number[] = [];
  const blackAccuracies: number[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const stateBefore = historyStates[i];
    const stateAfter = historyStates[i + 1] || executeMove(stateBefore, move);
    const turn = stateBefore.turn;
    const isWhite = turn === 'w';

    const evalBefore = evaluatePosition(stateBefore.board, stateBefore);
    const evalAfter = evaluatePosition(stateAfter.board, stateAfter);
    evaluations.push(evalAfter);

    // Best move search in stateBefore
    const bestMoveSuggestion = getBestMoveSuggestion(stateBefore);
    const bestMove = bestMoveSuggestion?.move || move;
    const bestMoveSan =
      bestMoveSuggestion?.san ||
      `${getPieceName(bestMove.piece.type)} ${coordToAlgebraic(bestMove.to.r, bestMove.to.c)}`;
    const bestMoveReason = bestMoveSuggestion?.reason || 'Maintains position stability.';

    // Check if player played the exact best move
    const isExactBestMove =
      move.from.r === bestMove.from.r &&
      move.from.c === bestMove.from.c &&
      move.to.r === bestMove.to.r &&
      move.to.c === bestMove.to.c;

    // Delta from mover's perspective:
    // For White: evalAfter - evalBefore
    // For Black: evalBefore - evalAfter (since lower is better for Black)
    const moverEvalDelta = isWhite ? evalAfter - evalBefore : evalBefore - evalAfter;

    // Classification determination
    let classification: MoveClassificationType = 'good';
    let label = 'Good';
    let commentary = '';

    // Check for brilliant move: sacrifice that preserves or creates winning advantage
    const isSacrifice =
      move.captured === undefined &&
      (move.piece.type === 'q' || move.piece.type === 'r' || move.piece.type === 'b' || move.piece.type === 'n') &&
      isExactBestMove &&
      (isWhite ? evalAfter >= 1.5 : evalAfter <= -1.5);

    if (isSacrifice) {
      classification = 'brilliant';
      label = 'Brilliant';
      commentary = `Brilliant tactical find! Sacrifices material to gain a decisive positional advantage.`;
    } else if (isExactBestMove || moverEvalDelta >= -0.15) {
      classification = 'best';
      label = 'Best Move';
      commentary = `Top engine recommendation. Optimally coordinates pieces.`;
    } else if (moverEvalDelta >= -0.4) {
      classification = 'excellent';
      label = 'Excellent';
      commentary = `Strong move keeping the balance.`;
    } else if (moverEvalDelta >= -0.85) {
      classification = 'good';
      label = 'Good';
      commentary = `Solid move, though ${bestMoveSan} was slightly more active.`;
    } else if (moverEvalDelta >= -1.6) {
      classification = 'inaccuracy';
      label = 'Inaccuracy';
      commentary = `Inaccuracy. Gives opponent counterplay. Best was ${bestMoveSan} (${bestMoveReason}).`;
    } else if (moverEvalDelta >= -2.8) {
      classification = 'mistake';
      label = 'Mistake';
      commentary = `Mistake. Loses positional control. Recommended was ${bestMoveSan}: ${bestMoveReason}.`;
    } else {
      classification = 'blunder';
      label = 'Blunder';
      commentary = `Blunder! Severely compromises the game. Best alternative was ${bestMoveSan} (${bestMoveReason}).`;
    }

    if (isWhite) {
      whiteCounts[classification]++;
    } else {
      blackCounts[classification]++;
    }

    // Accuracy computation using standard win-probability curve
    const moverEvalBefore = isWhite ? evalBefore : -evalBefore;
    const moverEvalAfter = isWhite ? evalAfter : -evalAfter;
    const winBefore = getWinChance(moverEvalBefore);
    const winAfter = getWinChance(moverEvalAfter);
    const winLoss = Math.max(0, winBefore - winAfter);
    const moveAccuracy = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669));

    if (isWhite) {
      whiteAccuracies.push(moveAccuracy);
    } else {
      blackAccuracies.push(moveAccuracy);
    }

    moveAnalyses.push({
      moveIndex: i,
      ply: i + 1,
      move,
      turn,
      evalBefore,
      evalAfter,
      evalDelta: Math.round(moverEvalDelta * 10) / 10,
      classification,
      classificationLabel: label,
      bestMove,
      bestMoveSan,
      bestMoveReason,
      commentary,
    });
  }

  const whiteAccuracy =
    whiteAccuracies.length > 0
      ? Math.round(whiteAccuracies.reduce((a, b) => a + b, 0) / whiteAccuracies.length * 10) / 10
      : 80.0;

  const blackAccuracy =
    blackAccuracies.length > 0
      ? Math.round(blackAccuracies.reduce((a, b) => a + b, 0) / blackAccuracies.length * 10) / 10
      : 80.0;

  return {
    whiteAccuracy,
    blackAccuracy,
    whiteCounts,
    blackCounts,
    moves: moveAnalyses,
    evaluations,
  };
}

/**
 * Returns formatted score string, e.g. "+1.8", "-0.5", "0.0", or "Mate"
 */
export function formatEvaluation(evalPawns: number): string {
  if (evalPawns >= 50) return '+M';
  if (evalPawns <= -50) return '-M';
  if (Math.abs(evalPawns) < 0.05) return '0.0';
  return evalPawns > 0 ? `+${evalPawns.toFixed(1)}` : evalPawns.toFixed(1);
}

export interface EngineEvaluationResult {
  pawns: number;
  centipawns: number;
  formattedScore: string;
  whiteWinPercentage: number;
  blackWinPercentage: number;
  isCheckmate: boolean;
  isStalemate: boolean;
  advantage: 'white' | 'black' | 'equal';
  assessment: string;
}

/**
 * Calculates current game state evaluation in centipawns, win probabilities,
 * and human-readable score string.
 */
export function getEngineEvaluation(
  board: Board,
  state?: Partial<GameState>
): EngineEvaluationResult {
  const pawns = evaluatePosition(board, state);
  const centipawns = Math.round(pawns * 100);

  const isCheckmate = !!state?.isCheckmate;
  const isStalemate = !!state?.isStalemate;

  // Logistic win probability curve: 50 + 50 * (2 / (1 + e^(-0.00368208 * cp)) - 1)
  let whiteWinPct = 50;
  if (isCheckmate) {
    whiteWinPct = state?.winner === 'w' ? 100 : 0;
  } else if (isStalemate) {
    whiteWinPct = 50;
  } else {
    const raw = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
    whiteWinPct = Math.min(97, Math.max(3, Math.round(raw)));
  }

  const blackWinPct = 100 - whiteWinPct;

  let formattedScore = '0.0';
  if (isCheckmate) {
    formattedScore = state?.winner === 'w' ? '+M' : '-M';
  } else if (isStalemate) {
    formattedScore = '0.0';
  } else {
    const sign = pawns > 0 ? '+' : '';
    formattedScore = `${sign}${pawns.toFixed(1)}`;
  }

  const advantage: 'white' | 'black' | 'equal' =
    centipawns > 35 ? 'white' : centipawns < -35 ? 'black' : 'equal';

  let assessment = 'Equal balance';
  const absCp = Math.abs(centipawns);
  if (isCheckmate) {
    assessment = `${state?.winner === 'w' ? 'White' : 'Black'} has delivered Checkmate`;
  } else if (absCp >= 600) {
    assessment = `${centipawns > 0 ? 'White' : 'Black'} has a decisive winning advantage`;
  } else if (absCp >= 200) {
    assessment = `${centipawns > 0 ? 'White' : 'Black'} is in control with clear advantage`;
  } else if (absCp >= 60) {
    assessment = `${centipawns > 0 ? 'White' : 'Black'} is slightly better`;
  }

  return {
    pawns,
    centipawns,
    formattedScore,
    whiteWinPercentage: whiteWinPct,
    blackWinPercentage: blackWinPct,
    isCheckmate,
    isStalemate,
    advantage,
    assessment,
  };
}
