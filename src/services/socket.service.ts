import { io, Socket } from 'socket.io-client';
import { GameState, Move, PieceColor } from '../models/chess';

export interface RoomState {
  roomId: string;
  color: PieceColor;
  white?: { username: string; rating?: number };
  black?: { username: string; rating?: number };
  gameState: GameState;
  whiteTime: number;
  blackTime: number;
  isReady: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
      });
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinGame(
    roomId: string,
    playerInfo: {
      username: string;
      userId?: string;
      rating?: number;
      preferredColor?: PieceColor;
      timeControl?: number;
    }
  ) {
    const s = this.connect();
    this.currentRoom = roomId;
    s.emit('join_game', {
      roomId,
      ...playerInfo,
    });
  }

  public sendMove(roomId: string, move: Move) {
    if (this.socket) {
      this.socket.emit('player_move', { roomId, move });
    }
  }

  public resign(roomId: string) {
    if (this.socket) {
      this.socket.emit('resign', { roomId });
    }
  }

  public offerDraw(roomId: string) {
    if (this.socket) {
      this.socket.emit('offer_draw', { roomId });
    }
  }

  public respondDraw(roomId: string, accept: boolean) {
    if (this.socket) {
      this.socket.emit('respond_draw', { roomId, accept });
    }
  }

  public sendChat(roomId: string, text: string, sender: string) {
    if (this.socket) {
      this.socket.emit('send_chat', { roomId, text, sender });
    }
  }

  public syncTimer(roomId: string, whiteTime: number, blackTime: number) {
    if (this.socket) {
      this.socket.emit('sync_timer', { roomId, whiteTime, blackTime });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
  }
}

export const socketService = new SocketService();
