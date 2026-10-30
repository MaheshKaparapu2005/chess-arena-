import { Board, GameState, Move, PieceColor, PieceType } from '../models/chess';
import { algebraicToCoord, coordToAlgebraic, isKingInCheck, executeMove } from './chess-move.service';

export interface ChessPuzzle {
  id: string;
  title: string;
  theme: 'checkmate' | 'fork' | 'pin' | 'discovered_attack' | 'deflection' | 'sacrifice' | 'promotion';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  fen: string;
  playerColor: PieceColor;
  goal: string;
  moves: string[]; // Solution moves in SAN (e.g. ["Qxd8+", "Rxd8", "Rxd8#"])
  hint: string;
  explanation: string;
}

export interface PuzzleStats {
  rating: number;
  solvedCount: number;
  streak: number;
  solvedIds: string[];
  lastSolvedDate?: string;
}

export const PUZZLE_DATABASE: ChessPuzzle[] = [
  {
    id: 'puz-001',
    title: 'Queen Deflection & Back-Rank Mate',
    theme: 'deflection',
    difficulty: 'Intermediate',
    rating: 1450,
    fen: '3r2k1/5ppp/8/q7/8/8/3Q1PPP/3R2K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 2',
    moves: ['Qxd8+', 'Rxd8', 'Rxd8#'],
    hint: 'Black is defending their vulnerable back rank with only one rook. Can you deflect it with a royal sacrifice?',
    explanation:
      'White plays 1. Qxd8+!, sacrificing the Queen. Black is forced to recapture with 1... Rxd8. White then delivers the back-rank checkmate with 2. Rxd8# because the Black pawns trap their own King!',
  },
  {
    id: 'puz-002',
    title: "Scholar's Tactical Strike",
    theme: 'checkmate',
    difficulty: 'Beginner',
    rating: 1050,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['Qxf7#'],
    hint: "Notice the undefended f7 square right next to Black's king.",
    explanation:
      'White plays 1. Qxf7#. The Queen delivers checkmate with the Bishop on c4 defending her. The King cannot escape or capture the Queen.',
  },
  {
    id: 'puz-003',
    title: "Anastasia's Mate",
    theme: 'checkmate',
    difficulty: 'Advanced',
    rating: 1750,
    fen: '7k/4Nppp/8/8/8/7Q/5PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 2',
    moves: ['Qxh7+', 'Kxh7', 'Rh1#'],
    hint: "The Knight on e7 cuts off the g8 and g6 escape squares. Sacrifice your heavy piece on the h-file!",
    explanation:
      "White delivers Anastasia's Mate: 1. Qxh7+! forces 1... Kxh7. Then 2. Rh1# checkmates along the h-file because the Knight on e7 covers both g8 and g6.",
  },
  {
    id: 'puz-004',
    title: 'Pawn Promotion Finish',
    theme: 'promotion',
    difficulty: 'Beginner',
    rating: 1100,
    fen: '5r1k/4P1pp/8/8/8/8/5PPP/6K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['exf8=Q#'],
    hint: 'Your e7 pawn is one step from queen promotion, and the enemy rook is blocking the back rank.',
    explanation:
      'White plays 1. exf8=Q# (or exf8=R#), capturing the rook and promoting to a Queen with checkmate!',
  },
  {
    id: 'puz-005',
    title: 'The Greedy Queen Trap',
    theme: 'checkmate',
    difficulty: 'Beginner',
    rating: 1150,
    fen: '6k1/5ppp/8/8/2B5/8/q4PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['Re8#'],
    hint: "Black's Queen grabbed a pawn on a2 and left their King completely unprotected on the 8th rank.",
    explanation:
      "White plays 1. Re8#. Black's Queen is stranded on a2 and cannot help defend their back-rank weakness.",
  },
  {
    id: 'puz-006',
    title: 'Black Back-Rank Counter-Punch',
    theme: 'checkmate',
    difficulty: 'Intermediate',
    rating: 1350,
    fen: '3rr1k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1',
    playerColor: 'b',
    goal: 'Black to move and checkmate in 2',
    moves: ['Rd1+', 'Rxd1', 'Rxd1#'],
    hint: "White forgot to create 'luft' (an escape square) for their king. Invade with both rooks!",
    explanation:
      'Black plays 1... Rd1+!, forcing 2. Rxd1, followed by 2... Rxd1# deliver a classic doubled rook back-rank mate.',
  },
  {
    id: 'puz-007',
    title: 'Royal Knight Fork',
    theme: 'fork',
    difficulty: 'Beginner',
    rating: 1200,
    fen: '1q2k3/8/8/3N4/8/8/5PPP/6K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and win the enemy Queen',
    moves: ['Nc7+', 'Kf7', 'Nxb8'],
    hint: 'Which square allows the Knight to check the King and attack the Queen simultaneously?',
    explanation:
      'White plays 1. Nc7+! delivering a royal fork against King and Queen. After Black moves the King, White captures with 2. Nxb8.',
  },
  {
    id: 'puz-008',
    title: 'Back-Rank Decoy Sacrifice',
    theme: 'deflection',
    difficulty: 'Advanced',
    rating: 1800,
    fen: '2r3k1/5ppp/8/8/8/8/1Q4PP/2R3K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 2',
    moves: ['Rxc8+', 'Qxc8', 'Qxg7#'],
    hint: 'Can you deflect Black’s defender from guarding the critical mating square?',
    explanation:
      'White plays 1. Rxc8+! removing Black’s defender. After 1... Qxc8, White lands the winning blow with 2. Qxg7# checkmate.',
  },
  {
    id: 'puz-009',
    title: 'Smothered King Nightmare',
    theme: 'checkmate',
    difficulty: 'Intermediate',
    rating: 1500,
    fen: '6k1/5ppp/8/8/8/5N2/5PPP/1Q4K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['Qb8#'],
    hint: 'Look for an unobstructed path for the Queen to reach the 8th rank.',
    explanation:
      'White plays 1. Qb8# checkmate! The Black pawns on f7, g7, and h7 completely smother their own King.',
  },
  {
    id: 'puz-010',
    title: 'Corner Pin & Rook Infiltration',
    theme: 'pin',
    difficulty: 'Intermediate',
    rating: 1400,
    fen: '5rk1/5ppp/8/8/8/8/1Q3PPP/1R4K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['Qb8'],
    hint: 'Pin the enemy rook against the King by placing the Queen on the 8th rank file.',
    explanation:
      'White plays 1. Qb8! pinning and overwhelming the f8 rook. Black cannot prevent checkmate on the next turn.',
  },
  {
    id: 'puz-011',
    title: 'Double Attack on King & Rook',
    theme: 'fork',
    difficulty: 'Beginner',
    rating: 1180,
    fen: 'r3k3/8/8/8/4Q3/8/5PPP/6K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and win the rook',
    moves: ['Qxa8+'],
    hint: 'Can the Queen check the King and capture an unprotected piece in the corner simultaneously?',
    explanation:
      'White plays 1. Qxa8+, capturing the undefended rook with check and winning decisive material!',
  },
  {
    id: 'puz-012',
    title: "Morphy's Bishop Battery",
    theme: 'sacrifice',
    difficulty: 'Advanced',
    rating: 1650,
    fen: 'r1b2rk1/pp3ppp/2n5/8/2B5/5Q2/PP3PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    goal: 'White to move and checkmate in 1',
    moves: ['Qxf7+'],
    hint: 'Sacrifice the Queen on the weak f7 square where the Bishop protects her.',
    explanation:
      'White plays 1. Qxf7+! Rxf7 2. Re8# delivering an inescapable back-rank checkmate because the rook is pinned!',
  },
];

/**
 * Parse FEN string into an active GameState
 */
export function fenToGameState(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  const boardStr = parts[0];
  const turn = (parts[1] === 'b' ? 'b' : 'w') as PieceColor;
  const castlingStr = parts[2] || '-';
  const enPassantStr = parts[3] || '-';
  const halfmoveClock = parseInt(parts[4] || '0', 10);
  const fullmoveNumber = parseInt(parts[5] || '1', 10);

  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const rows = boardStr.split('/');
  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r] || '';
    let c = 0;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char >= '1' && char <= '8') {
        c += parseInt(char, 10);
      } else {
        const isUpper = char === char.toUpperCase();
        const color: PieceColor = isUpper ? 'w' : 'b';
        const type = char.toLowerCase() as PieceType;
        if (c < 8) {
          board[r][c] = { type, color };
          c++;
        }
      }
    }
  }

  const castling = {
    whiteKingside: castlingStr.includes('K'),
    whiteQueenside: castlingStr.includes('Q'),
    blackKingside: castlingStr.includes('k'),
    blackQueenside: castlingStr.includes('q'),
  };

  const enPassantTarget = enPassantStr !== '-' ? algebraicToCoord(enPassantStr) : null;
  const inCheck = isKingInCheck(board, turn);

  return {
    board,
    turn,
    castling,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    isCheck: inCheck,
    isCheckmate: false,
    isStalemate: false,
    isGameOver: false,
    winner: null,
  };
}

/**
 * Check if the player move matches the puzzle expected move
 */
export function isPuzzleMoveCorrect(actualMove: Move, expectedMoveStr: string): boolean {
  if (!expectedMoveStr) return false;

  const actualSan = actualMove.san || '';
  const cleanActualSan = actualSan.replace(/[+#x=]/g, '').toLowerCase();
  const cleanExpectedSan = expectedMoveStr.replace(/[+#x=]/g, '').toLowerCase();

  const fromAlg = coordToAlgebraic(actualMove.from.r, actualMove.from.c);
  const toAlg = coordToAlgebraic(actualMove.to.r, actualMove.to.c);
  const coordNotation = `${fromAlg}${toAlg}`.toLowerCase();

  return (
    actualSan === expectedMoveStr ||
    cleanActualSan === cleanExpectedSan ||
    coordNotation === cleanExpectedSan ||
    toAlg === cleanExpectedSan
  );
}

const STATS_KEY = 'chess_arena_puzzle_stats';

/**
 * Retrieve user puzzle stats from localStorage
 */
export function getUserPuzzleStats(): PuzzleStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }

  return {
    rating: 1200,
    solvedCount: 0,
    streak: 0,
    solvedIds: [],
  };
}

/**
 * Record puzzle solved / failed
 */
export function recordPuzzleResult(
  puzzleId: string,
  isCorrect: boolean,
  puzzleRating: number
): PuzzleStats {
  const stats = getUserPuzzleStats();
  const today = new Date().toISOString().slice(0, 10);

  if (isCorrect) {
    if (!stats.solvedIds.includes(puzzleId)) {
      stats.solvedIds.push(puzzleId);
      stats.solvedCount += 1;
    }
    stats.streak += 1;

    // Rating gain calculation
    const delta = Math.max(10, Math.min(30, Math.round(15 + (puzzleRating - stats.rating) / 20)));
    stats.rating += delta;
    stats.lastSolvedDate = today;
  } else {
    stats.streak = 0;
    stats.rating = Math.max(800, stats.rating - 8);
  }

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    // ignore
  }

  return stats;
}

/**
 * Deterministically get the daily puzzle based on current calendar date
 */
export function getDailyPuzzle(): ChessPuzzle {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = Math.abs(dayOfYear) % PUZZLE_DATABASE.length;
  return PUZZLE_DATABASE[index];
}
