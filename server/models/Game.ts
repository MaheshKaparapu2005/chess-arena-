import mongoose, { Schema, Document } from 'mongoose';

export interface IGameMove {
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  color: 'w' | 'b';
  timestamp?: string;
}

export interface IGame extends Document {
  whitePlayer: {
    id: string;
    username: string;
    rating?: number;
  };
  blackPlayer: {
    id: string;
    username: string;
    rating?: number;
  };
  moves: IGameMove[];
  boardState: any;
  result: 'white' | 'black' | 'draw' | 'ongoing';
  status: 'completed' | 'in_progress' | 'resigned' | 'timeout' | 'stalemate' | 'abandoned';
  reason?: string;
  timeControl: number;
  startedAt: Date;
  endedAt?: Date;
}

const GameSchema = new Schema<IGame>({
  whitePlayer: {
    id: { type: String, required: true },
    username: { type: String, required: true },
    rating: { type: Number },
  },
  blackPlayer: {
    id: { type: String, required: true },
    username: { type: String, required: true },
    rating: { type: Number },
  },
  moves: [
    {
      moveNumber: { type: Number, required: true },
      san: { type: String, required: true },
      from: { type: String, required: true },
      to: { type: String, required: true },
      piece: { type: String, required: true },
      captured: { type: String },
      color: { type: String, enum: ['w', 'b'], required: true },
      timestamp: { type: String },
    },
  ],
  boardState: { type: Schema.Types.Mixed },
  result: {
    type: String,
    enum: ['white', 'black', 'draw', 'ongoing'],
    default: 'ongoing',
  },
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'resigned', 'timeout', 'stalemate', 'abandoned'],
    default: 'in_progress',
  },
  reason: { type: String },
  timeControl: { type: Number, default: 600 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export const GameModel = mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
