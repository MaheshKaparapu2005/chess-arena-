import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  createInitialGameState,
  getAllLegalMoves,
  makeMove,
  GameState,
  PieceColor,
  Move,
} from '../services/chessEngine';
import { dbStore, IGameDoc } from '../config/db';

interface RoomPlayer {
  socketId: string;
  userId?: string;
  username: string;
  rating?: number;
  color: PieceColor;
}

interface Room {
  id: string;
  white?: RoomPlayer;
  black?: RoomPlayer;
  gameState: GameState;
  timeControl: number; // in seconds
  whiteTime: number;
  blackTime: number;
  lastTimerTick?: number;
  timerInterval?: NodeJS.Timeout;
  moves: Array<{
    moveNumber: number;
    san: string;
    from: string;
    to: string;
    piece: string;
    captured?: string;
    color: 'w' | 'b';
  }>;
  drawOfferedBy?: PieceColor | null;
}

const activeRooms = new Map<string, Room>();

export function setupChessSockets(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // 1. Create or join room
    socket.on('join_game', ({ roomId, username, userId, rating, preferredColor, timeControl }) => {
      let room = activeRooms.get(roomId);

      if (!room) {
        const initialTime = (timeControl || 10) * 60;
        room = {
          id: roomId,
          gameState: createInitialGameState(),
          timeControl: initialTime,
          whiteTime: initialTime,
          blackTime: initialTime,
          moves: [],
          drawOfferedBy: null,
        };
        activeRooms.set(roomId, room);
      }

      socket.join(roomId);

      // Assign player color
      let assignedColor: PieceColor = 'w';
      if (room.white && !room.black) {
        assignedColor = 'b';
        room.black = { socketId: socket.id, username, userId, rating, color: 'b' };
      } else if (!room.white && room.black) {
        assignedColor = 'w';
        room.white = { socketId: socket.id, username, userId, rating, color: 'w' };
      } else if (!room.white && !room.black) {
        assignedColor = preferredColor === 'b' ? 'b' : 'w';
        if (assignedColor === 'w') {
          room.white = { socketId: socket.id, username, userId, rating, color: 'w' };
        } else {
          room.black = { socketId: socket.id, username, userId, rating, color: 'b' };
        }
      }

      const isReady = !!(room.white && room.black);

      socket.emit('joined_room', {
        roomId,
        color: assignedColor,
        white: room.white,
        black: room.black,
        gameState: room.gameState,
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
        isReady,
      });

      io.to(roomId).emit('room_update', {
        roomId,
        white: room.white,
        black: room.black,
        isReady,
        gameState: room.gameState,
      });
    });

    // 2. Player makes a move
    socket.on('player_move', ({ roomId, move }: { roomId: string; move: Move }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const playerColor = socket.id === room.white?.socketId ? 'w' : socket.id === room.black?.socketId ? 'b' : null;
      if (!playerColor || room.gameState.turn !== playerColor) {
        socket.emit('move_rejected', { reason: "Not your turn or spectator" });
        return;
      }

      if (room.gameState.isGameOver) {
        socket.emit('move_rejected', { reason: "Game is already finished" });
        return;
      }

      // Validate move against server rule engine
      const legalMoves = getAllLegalMoves(
        room.gameState.board,
        room.gameState.turn,
        room.gameState.castling,
        room.gameState.enPassantTarget
      );

      const isValid = legalMoves.some(
        (m) =>
          m.from.r === move.from.r &&
          m.from.c === move.from.c &&
          m.to.r === move.to.r &&
          m.to.c === move.to.c &&
          (!move.promotion || m.promotion === move.promotion)
      );

      if (!isValid) {
        socket.emit('move_rejected', { reason: "Illegal chess move" });
        return;
      }

      // Execute verified legal move
      const nextState = makeMove(room.gameState, move);
      room.gameState = nextState;
      room.drawOfferedBy = null;

      if (nextState.lastMove) {
        room.moves.push({
          moveNumber: Math.ceil(room.moves.length / 2) + 1,
          san: nextState.lastMove.san || 'move',
          from: `${move.from.r},${move.from.c}`,
          to: `${move.to.r},${move.to.c}`,
          piece: move.piece.type,
          captured: move.captured?.type,
          color: playerColor,
        });
      }

      io.to(roomId).emit('move_made', {
        move: nextState.lastMove,
        gameState: room.gameState,
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
      });

      // Save game if finished
      if (nextState.isGameOver) {
        saveSocketGame(room);
      }
    });

    // 3. Resign game
    socket.on('resign', ({ roomId }: { roomId: string }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.gameState.isGameOver) return;

      const playerColor = socket.id === room.white?.socketId ? 'w' : socket.id === room.black?.socketId ? 'b' : null;
      if (!playerColor) return;

      const winnerColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
      room.gameState.isGameOver = true;
      room.gameState.winner = winnerColor;

      io.to(roomId).emit('game_ended', {
        reason: 'Resignation',
        winner: winnerColor === 'w' ? 'white' : 'black',
        gameState: room.gameState,
      });

      saveSocketGame(room);
    });

    // 4. Offer Draw
    socket.on('offer_draw', ({ roomId }: { roomId: string }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const playerColor = socket.id === room.white?.socketId ? 'w' : socket.id === room.black?.socketId ? 'b' : null;
      if (!playerColor) return;

      room.drawOfferedBy = playerColor;
      socket.to(roomId).emit('draw_offered', { fromColor: playerColor });
    });

    // 5. Respond to Draw
    socket.on('respond_draw', ({ roomId, accept }: { roomId: string; accept: boolean }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      if (accept && room.drawOfferedBy) {
        room.gameState.isGameOver = true;
        room.gameState.winner = 'draw';
        room.gameState.isStalemate = true;

        io.to(roomId).emit('game_ended', {
          reason: 'Draw Agreed',
          winner: 'draw',
          gameState: room.gameState,
        });

        saveSocketGame(room);
      } else {
        room.drawOfferedBy = null;
        socket.to(roomId).emit('draw_declined');
      }
    });

    // 6. Time sync update from host
    socket.on('sync_timer', ({ roomId, whiteTime, blackTime }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;
      room.whiteTime = whiteTime;
      room.blackTime = blackTime;
      socket.to(roomId).emit('timer_updated', { whiteTime, blackTime });
    });

    // 7. In-game Chat message
    socket.on('send_chat', ({ roomId, text, sender }) => {
      io.to(roomId).emit('chat_message', {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // 8. Disconnect handling
    socket.on('disconnect', () => {
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.white?.socketId === socket.id || room.black?.socketId === socket.id) {
          io.to(roomId).emit('player_disconnected', {
            socketId: socket.id,
          });
        }
      }
    });
  });
}

function saveSocketGame(room: Room) {
  try {
    const gameResult = room.gameState.winner === 'w' ? 'white' : room.gameState.winner === 'b' ? 'black' : 'draw';
    const newGame: IGameDoc = {
      _id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      whitePlayer: {
        id: room.white?.userId || 'guest_white',
        username: room.white?.username || 'White',
        rating: room.white?.rating || 1200,
      },
      blackPlayer: {
        id: room.black?.userId || 'guest_black',
        username: room.black?.username || 'Black',
        rating: room.black?.rating || 1200,
      },
      moves: room.moves,
      boardState: room.gameState.board,
      result: gameResult,
      status: 'completed',
      reason: room.gameState.isCheckmate ? 'Checkmate' : room.gameState.isStalemate ? 'Stalemate' : 'Resignation / Draw',
      timeControl: room.timeControl,
      startedAt: new Date(Date.now() - 300000).toISOString(),
      endedAt: new Date().toISOString(),
    };

    dbStore.createGame(newGame);
  } catch (err) {
    console.error('Failed to save socket game:', err);
  }
}
