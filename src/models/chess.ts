export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface Move {
  from: { r: number; c: number };
  to: { r: number; c: number };
  piece: Piece;
  captured?: Piece;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  promotion?: PieceType;
  san?: string;
}

export interface GameState {
  board: Board;
  turn: PieceColor;
  castling: CastlingRights;
  enPassantTarget: { r: number; c: number } | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
  winner: PieceColor | 'draw' | null;
  lastMove?: Move;
}

export type GameMode = 'local' | 'computer' | 'online';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  createdAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  rating: number;
  title: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: string;
}

export interface GameRecord {
  _id: string;
  whitePlayer: { id: string; username: string; rating?: number };
  blackPlayer: { id: string; username: string; rating?: number };
  moves: Array<{
    moveNumber: number;
    san: string;
    from: string;
    to: string;
    piece: string;
    captured?: string;
    color: 'w' | 'b';
  }>;
  boardState: any;
  result: 'white' | 'black' | 'draw' | 'ongoing';
  status: string;
  reason?: string;
  timeControl: number;
  startedAt: string;
  endedAt?: string;
}

export interface BestMoveEvaluation {
  move: Move;
  score: number;
  reason: string;
  san: string;
}

export type MoveClassificationType =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface MoveAnalysis {
  moveIndex: number;
  ply: number;
  move: Move;
  turn: PieceColor;
  evalBefore: number; // in pawns from White's perspective (+ White, - Black)
  evalAfter: number; // in pawns from White's perspective
  evalDelta: number; // relative to player whose turn it was (e.g. -1.5 pawns means dropped 1.5 pawns)
  classification: MoveClassificationType;
  classificationLabel: string;
  bestMove: Move;
  bestMoveSan: string;
  bestMoveReason: string;
  commentary: string;
}

export interface GameAnalysisReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteCounts: Record<MoveClassificationType, number>;
  blackCounts: Record<MoveClassificationType, number>;
  moves: MoveAnalysis[];
  evaluations: number[]; // Evaluation in pawns for step 0 (initial) through step N
}

