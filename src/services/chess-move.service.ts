import {
  Board,
  GameState,
  Move,
  Piece,
  PieceColor,
  PieceType,
  CastlingRights,
} from '../models/chess';

export function algebraicToCoord(sq: string): { r: number; c: number } {
  const c = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(sq[1], 10);
  const r = 8 - rank;
  return { r, c };
}

export function coordToAlgebraic(r: number, c: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + c);
  const rank = 8 - r;
  return `${file}${rank}`;
}

export function createInitialBoard(): Board {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Black pieces (rank 8, r=0)
  board[0][0] = { type: 'r', color: 'b' };
  board[0][1] = { type: 'n', color: 'b' };
  board[0][2] = { type: 'b', color: 'b' };
  board[0][3] = { type: 'q', color: 'b' };
  board[0][4] = { type: 'k', color: 'b' };
  board[0][5] = { type: 'b', color: 'b' };
  board[0][6] = { type: 'n', color: 'b' };
  board[0][7] = { type: 'r', color: 'b' };

  for (let c = 0; c < 8; c++) {
    board[1][c] = { type: 'p', color: 'b' };
  }

  // White pawns (rank 2, r=6)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
  }

  // White pieces (rank 1, r=7)
  board[7][0] = { type: 'r', color: 'w' };
  board[7][1] = { type: 'n', color: 'w' };
  board[7][2] = { type: 'b', color: 'w' };
  board[7][3] = { type: 'q', color: 'w' };
  board[7][4] = { type: 'k', color: 'w' };
  board[7][5] = { type: 'b', color: 'w' };
  board[7][6] = { type: 'n', color: 'w' };
  board[7][7] = { type: 'r', color: 'w' };

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castling: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isGameOver: false,
    winner: null,
  };
}

export function isWithinBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function findKing(board: Board, color: PieceColor): { r: number; c: number } | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        return { r, c };
      }
    }
  }
  return null;
}

export function isSquareAttacked(
  board: Board,
  targetR: number,
  targetC: number,
  byColor: PieceColor
): boolean {
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1;
  const pawnRow = targetR + pawnDir;
  if (isWithinBoard(pawnRow, targetC - 1)) {
    const p = board[pawnRow][targetC - 1];
    if (p && p.color === byColor && p.type === 'p') return true;
  }
  if (isWithinBoard(pawnRow, targetC + 1)) {
    const p = board[pawnRow][targetC + 1];
    if (p && p.color === byColor && p.type === 'p') return true;
  }

  // Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = targetR + dr;
    const nc = targetC + dc;
    if (isWithinBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === 'n') return true;
    }
  }

  // Rook and Queen orthogonal rays
  const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of rookDirs) {
    let nr = targetR + dr;
    let nc = targetC + dc;
    while (isWithinBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // Bishop and Queen diagonal rays
  const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of bishopDirs) {
    let nr = targetR + dr;
    let nc = targetC + dc;
    while (isWithinBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // King moves
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (const [dr, dc] of kingOffsets) {
    const nr = targetR + dr;
    const nc = targetC + dc;
    if (isWithinBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === 'k') return true;
    }
  }

  return false;
}

export function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos.r, kingPos.c, enemyColor);
}

export function getPseudoLegalMoves(
  board: Board,
  r: number,
  c: number,
  castling: CastlingRights,
  enPassantTarget: { r: number; c: number } | null
): Move[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: Move[] = [];
  const color = piece.color;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

  switch (piece.type) {
    case 'p': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;

      // Single forward push
      const forwardR = r + dir;
      if (isWithinBoard(forwardR, c) && board[forwardR][c] === null) {
        if (forwardR === promoRow) {
          ['q', 'r', 'b', 'n'].forEach((pt) => {
            moves.push({
              from: { r, c },
              to: { r: forwardR, c },
              piece,
              promotion: pt as PieceType,
            });
          });
        } else {
          moves.push({
            from: { r, c },
            to: { r: forwardR, c },
            piece,
          });
        }

        // Double forward push from start
        const doubleR = r + 2 * dir;
        if (r === startRow && board[doubleR][c] === null) {
          moves.push({
            from: { r, c },
            to: { r: doubleR, c },
            piece,
          });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const targetC = c + dc;
        if (isWithinBoard(forwardR, targetC)) {
          const targetPiece = board[forwardR][targetC];
          if (targetPiece && targetPiece.color === enemyColor) {
            if (forwardR === promoRow) {
              ['q', 'r', 'b', 'n'].forEach((pt) => {
                moves.push({
                  from: { r, c },
                  to: { r: forwardR, c: targetC },
                  piece,
                  captured: targetPiece,
                  promotion: pt as PieceType,
                });
              });
            } else {
              moves.push({
                from: { r, c },
                to: { r: forwardR, c: targetC },
                piece,
                captured: targetPiece,
              });
            }
          } else if (
            enPassantTarget &&
            enPassantTarget.r === forwardR &&
            enPassantTarget.c === targetC
          ) {
            const capturedPawn = board[r][targetC];
            if (capturedPawn && capturedPawn.type === 'p' && capturedPawn.color === enemyColor) {
              moves.push({
                from: { r, c },
                to: { r: forwardR, c: targetC },
                piece,
                captured: capturedPawn,
                isEnPassant: true,
              });
            }
          }
        }
      }
      break;
    }

    case 'n': {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color === enemyColor) {
            moves.push({
              from: { r, c },
              to: { r: nr, c: nc },
              piece,
              captured: target || undefined,
            });
          }
        }
      }
      break;
    }

    case 'b': {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
          } else {
            if (target.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'r': {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
          } else {
            if (target.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'q': {
      const dirs = [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
          } else {
            if (target.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'k': {
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isWithinBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color === enemyColor) {
            moves.push({
              from: { r, c },
              to: { r: nr, c: nc },
              piece,
              captured: target || undefined,
            });
          }
        }
      }

      // Castling
      const isKingCheck = isSquareAttacked(board, r, c, enemyColor);
      if (!isKingCheck) {
        if (color === 'w' && r === 7 && c === 4) {
          if (
            castling.whiteKingside &&
            board[7][5] === null &&
            board[7][6] === null &&
            board[7][7]?.type === 'r' &&
            board[7][7]?.color === 'w' &&
            !isSquareAttacked(board, 7, 5, 'b') &&
            !isSquareAttacked(board, 7, 6, 'b')
          ) {
            moves.push({
              from: { r, c },
              to: { r: 7, c: 6 },
              piece,
              isCastling: 'kingside',
            });
          }
          if (
            castling.whiteQueenside &&
            board[7][3] === null &&
            board[7][2] === null &&
            board[7][1] === null &&
            board[7][0]?.type === 'r' &&
            board[7][0]?.color === 'w' &&
            !isSquareAttacked(board, 7, 3, 'b') &&
            !isSquareAttacked(board, 7, 2, 'b')
          ) {
            moves.push({
              from: { r, c },
              to: { r: 7, c: 2 },
              piece,
              isCastling: 'queenside',
            });
          }
        } else if (color === 'b' && r === 0 && c === 4) {
          if (
            castling.blackKingside &&
            board[0][5] === null &&
            board[0][6] === null &&
            board[0][7]?.type === 'r' &&
            board[0][7]?.color === 'b' &&
            !isSquareAttacked(board, 0, 5, 'w') &&
            !isSquareAttacked(board, 0, 6, 'w')
          ) {
            moves.push({
              from: { r, c },
              to: { r: 0, c: 6 },
              piece,
              isCastling: 'kingside',
            });
          }
          if (
            castling.blackQueenside &&
            board[0][3] === null &&
            board[0][2] === null &&
            board[0][1] === null &&
            board[0][0]?.type === 'r' &&
            board[0][0]?.color === 'b' &&
            !isSquareAttacked(board, 0, 3, 'w') &&
            !isSquareAttacked(board, 0, 2, 'w')
          ) {
            moves.push({
              from: { r, c },
              to: { r: 0, c: 2 },
              piece,
              isCastling: 'queenside',
            });
          }
        }
      }
      break;
    }
  }

  return moves;
}

export function simulateMove(board: Board, move: Move): Board {
  const nextBoard = cloneBoard(board);
  const { from, to, piece, isEnPassant, isCastling, promotion } = move;

  nextBoard[from.r][from.c] = null;

  if (isEnPassant) {
    const capturedPawnRow = piece.color === 'w' ? to.r + 1 : to.r - 1;
    nextBoard[capturedPawnRow][to.c] = null;
  }

  if (isCastling === 'kingside') {
    const r = from.r;
    nextBoard[r][5] = nextBoard[r][7];
    nextBoard[r][7] = null;
  } else if (isCastling === 'queenside') {
    const r = from.r;
    nextBoard[r][3] = nextBoard[r][0];
    nextBoard[r][0] = null;
  }

  if (promotion) {
    nextBoard[to.r][to.c] = { type: promotion, color: piece.color };
  } else {
    nextBoard[to.r][to.c] = { ...piece };
  }

  return nextBoard;
}

export function getLegalMovesForPiece(
  board: Board,
  r: number,
  c: number,
  castling: CastlingRights,
  enPassantTarget: { r: number; c: number } | null
): Move[] {
  const piece = board[r][c];
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, r, c, castling, enPassantTarget);
  const legalMoves: Move[] = [];

  for (const move of pseudoMoves) {
    const nextBoard = simulateMove(board, move);
    if (!isKingInCheck(nextBoard, piece.color)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

export function getAllLegalMoves(
  board: Board,
  color: PieceColor,
  castling: CastlingRights,
  enPassantTarget: { r: number; c: number } | null
): Move[] {
  const allMoves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMovesForPiece(board, r, c, castling, enPassantTarget);
        allMoves.push(...moves);
      }
    }
  }
  return allMoves;
}

export function moveToSAN(
  board: Board,
  move: Move,
  allLegalMovesForPlayer: Move[]
): string {
  const { from, to, piece, captured, isCastling, promotion } = move;

  if (isCastling === 'kingside') return 'O-O';
  if (isCastling === 'queenside') return 'O-O-O';

  let san = '';
  const toSq = coordToAlgebraic(to.r, to.c);

  if (piece.type === 'p') {
    if (captured || move.isEnPassant) {
      const fromFile = coordToAlgebraic(from.r, from.c)[0];
      san = `${fromFile}x${toSq}`;
    } else {
      san = toSq;
    }
    if (promotion) {
      san += `=${promotion.toUpperCase()}`;
    }
  } else {
    san = piece.type.toUpperCase();

    const duplicates = allLegalMovesForPlayer.filter(
      (m) =>
        m.piece.type === piece.type &&
        m.to.r === to.r &&
        m.to.c === to.c &&
        (m.from.r !== from.r || m.from.c !== from.c)
    );

    if (duplicates.length > 0) {
      const sameFile = duplicates.some((m) => m.from.c === from.c);
      const sameRank = duplicates.some((m) => m.from.r === from.r);
      const fromAlg = coordToAlgebraic(from.r, from.c);

      if (!sameFile) {
        san += fromAlg[0];
      } else if (!sameRank) {
        san += fromAlg[1];
      } else {
        san += fromAlg;
      }
    }

    if (captured) {
      san += 'x';
    }
    san += toSq;
  }

  const nextBoard = simulateMove(board, move);
  const opponentColor: PieceColor = piece.color === 'w' ? 'b' : 'w';
  const enemyInCheck = isKingInCheck(nextBoard, opponentColor);

  if (enemyInCheck) {
    const dummyCastling: CastlingRights = {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    };
    const enemyMoves = getAllLegalMoves(nextBoard, opponentColor, dummyCastling, null);
    if (enemyMoves.length === 0) {
      san += '#';
    } else {
      san += '+';
    }
  }

  return san;
}

export function executeMove(state: GameState, move: Move): GameState {
  const nextBoard = simulateMove(state.board, move);
  const nextTurn: PieceColor = state.turn === 'w' ? 'b' : 'w';

  const nextCastling: CastlingRights = { ...state.castling };
  const { from, to, piece } = move;

  if (piece.type === 'k') {
    if (piece.color === 'w') {
      nextCastling.whiteKingside = false;
      nextCastling.whiteQueenside = false;
    } else {
      nextCastling.blackKingside = false;
      nextCastling.blackQueenside = false;
    }
  }

  if (piece.type === 'r') {
    if (piece.color === 'w') {
      if (from.r === 7 && from.c === 7) nextCastling.whiteKingside = false;
      if (from.r === 7 && from.c === 0) nextCastling.whiteQueenside = false;
    } else {
      if (from.r === 0 && from.c === 7) nextCastling.blackKingside = false;
      if (from.r === 0 && from.c === 0) nextCastling.blackQueenside = false;
    }
  }

  if (to.r === 7 && to.c === 7) nextCastling.whiteKingside = false;
  if (to.r === 7 && to.c === 0) nextCastling.whiteQueenside = false;
  if (to.r === 0 && to.c === 7) nextCastling.blackKingside = false;
  if (to.r === 0 && to.c === 0) nextCastling.blackQueenside = false;

  let nextEnPassant: { r: number; c: number } | null = null;
  if (piece.type === 'p' && Math.abs(to.r - from.r) === 2) {
    nextEnPassant = {
      r: (from.r + to.r) / 2,
      c: from.c,
    };
  }

  const currentLegal = getAllLegalMoves(state.board, state.turn, state.castling, state.enPassantTarget);
  const san = moveToSAN(state.board, move, currentLegal);
  const executedMove: Move = { ...move, san };

  const isEnemyCheck = isKingInCheck(nextBoard, nextTurn);
  const enemyLegalMoves = getAllLegalMoves(nextBoard, nextTurn, nextCastling, nextEnPassant);

  let isCheckmate = false;
  let isStalemate = false;
  let isGameOver = false;
  let winner: PieceColor | 'draw' | null = null;

  if (enemyLegalMoves.length === 0) {
    isGameOver = true;
    if (isEnemyCheck) {
      isCheckmate = true;
      winner = state.turn;
    } else {
      isStalemate = true;
      winner = 'draw';
    }
  }

  return {
    board: nextBoard,
    turn: nextTurn,
    castling: nextCastling,
    enPassantTarget: nextEnPassant,
    halfmoveClock: piece.type === 'p' || move.captured ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: state.turn === 'b' ? state.fullmoveNumber + 1 : state.fullmoveNumber,
    isCheck: isEnemyCheck,
    isCheckmate,
    isStalemate,
    isGameOver,
    winner,
    lastMove: executedMove,
  };
}
