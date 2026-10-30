import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'chess-arena-db.json');

export interface IUserDoc {
  _id: string;
  username: string;
  email: string;
  password: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  rating: number;
  createdAt: Date | string;
}

export interface IGameDoc {
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
    timestamp?: string;
  }>;
  boardState: any;
  result: 'white' | 'black' | 'draw' | 'ongoing';
  status: 'completed' | 'in_progress' | 'resigned' | 'timeout' | 'stalemate' | 'abandoned';
  reason?: string;
  timeControl: number; // in seconds
  startedAt: Date | string;
  endedAt?: Date | string;
}

interface DBStorage {
  users: IUserDoc[];
  games: IGameDoc[];
}

let memoryDb: DBStorage = {
  users: [],
  games: [],
};

let isMongoConnected = false;

// Seed initial users with realistic chess ratings and stats
function seedInitialData() {
  if (memoryDb.users.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = (pw: string) => bcrypt.hashSync(pw, salt);

    const seedUsers: IUserDoc[] = [
      {
        _id: 'user_gm_magnus',
        username: 'MagnusC',
        email: 'magnus@chessarena.com',
        password: hash('ChessPass123!'),
        gamesPlayed: 54,
        gamesWon: 45,
        gamesLost: 5,
        gamesDrawn: 4,
        rating: 2840,
        createdAt: new Date('2026-01-10').toISOString(),
      },
      {
        _id: 'user_gm_hikaru',
        username: 'HikaruN',
        email: 'hikaru@chessarena.com',
        password: hash('ChessPass123!'),
        gamesPlayed: 48,
        gamesWon: 38,
        gamesLost: 6,
        gamesDrawn: 4,
        rating: 2810,
        createdAt: new Date('2026-01-12').toISOString(),
      },
      {
        _id: 'user_gm_gukesh',
        username: 'GukeshD',
        email: 'gukesh@chessarena.com',
        password: hash('ChessPass123!'),
        gamesPlayed: 36,
        gamesWon: 27,
        gamesLost: 5,
        gamesDrawn: 4,
        rating: 2785,
        createdAt: new Date('2026-01-15').toISOString(),
      },
      {
        _id: 'user_master_alex',
        username: 'QueenSlayer',
        email: 'alex@chessarena.com',
        password: hash('ChessPass123!'),
        gamesPlayed: 25,
        gamesWon: 16,
        gamesLost: 6,
        gamesDrawn: 3,
        rating: 1850,
        createdAt: new Date('2026-02-01').toISOString(),
      },
      {
        _id: 'user_novice_player',
        username: 'DemoPlayer',
        email: 'demo@chessarena.com',
        password: hash('Demo1234!'),
        gamesPlayed: 12,
        gamesWon: 7,
        gamesLost: 4,
        gamesDrawn: 1,
        rating: 1420,
        createdAt: new Date('2026-02-15').toISOString(),
      },
    ];

    const seedGames: IGameDoc[] = [
      {
        _id: 'game_seed_1',
        whitePlayer: { id: 'user_gm_magnus', username: 'MagnusC', rating: 2840 },
        blackPlayer: { id: 'user_gm_hikaru', username: 'HikaruN', rating: 2810 },
        moves: [
          { moveNumber: 1, san: 'e4', from: 'e2', to: 'e4', piece: 'p', color: 'w' },
          { moveNumber: 1, san: 'e5', from: 'e7', to: 'e5', piece: 'p', color: 'b' },
          { moveNumber: 2, san: 'Nf3', from: 'g1', to: 'f3', piece: 'n', color: 'w' },
          { moveNumber: 2, san: 'Nc6', from: 'b8', to: 'c6', piece: 'n', color: 'b' },
          { moveNumber: 3, san: 'Bb5', from: 'f1', to: 'b5', piece: 'b', color: 'w' },
          { moveNumber: 3, san: 'a6', from: 'a7', to: 'a6', piece: 'p', color: 'b' },
          { moveNumber: 4, san: 'Ba4', from: 'b5', to: 'a4', piece: 'b', color: 'w' },
          { moveNumber: 4, san: 'Nf6', from: 'g8', to: 'f6', piece: 'n', color: 'b' },
          { moveNumber: 5, san: 'O-O', from: 'e1', to: 'g1', piece: 'k', color: 'w' },
          { moveNumber: 5, san: 'Be7', from: 'f8', to: 'e7', piece: 'b', color: 'b' },
        ],
        boardState: {},
        result: 'white',
        status: 'completed',
        reason: 'Checkmate',
        timeControl: 600,
        startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        endedAt: new Date(Date.now() - 86400000 * 2 + 1200000).toISOString(),
      },
      {
        _id: 'game_seed_2',
        whitePlayer: { id: 'user_master_alex', username: 'QueenSlayer', rating: 1850 },
        blackPlayer: { id: 'user_novice_player', username: 'DemoPlayer', rating: 1420 },
        moves: [
          { moveNumber: 1, san: 'd4', from: 'd2', to: 'd4', piece: 'p', color: 'w' },
          { moveNumber: 1, san: 'd5', from: 'd7', to: 'd5', piece: 'p', color: 'b' },
          { moveNumber: 2, san: 'c4', from: 'c2', to: 'c4', piece: 'p', color: 'w' },
          { moveNumber: 2, san: 'e6', from: 'e7', to: 'e6', piece: 'p', color: 'b' },
          { moveNumber: 3, san: 'Nc3', from: 'b1', to: 'c3', piece: 'n', color: 'w' },
          { moveNumber: 3, san: 'Nf6', from: 'g8', to: 'f6', piece: 'n', color: 'b' },
        ],
        boardState: {},
        result: 'draw',
        status: 'completed',
        reason: 'Mutual Draw',
        timeControl: 300,
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        endedAt: new Date(Date.now() - 86400000 + 400000).toISOString(),
      },
    ];

    memoryDb.users = seedUsers;
    memoryDb.games = seedGames;
    saveMemoryDb();
  }
}

function loadMemoryDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[DB] Could not load existing DB file, starting clean:', err);
  }
  seedInitialData();
}

function saveMemoryDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to persist data to disk:', err);
  }
}

export async function initializeDatabase() {
  loadMemoryDb();

  const mongoUri = process.env.MONGO_URI;
  if (mongoUri) {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      isMongoConnected = true;
      console.log('[DB] Connected to MongoDB database successfully.');
    } catch (err) {
      console.log('[DB] MongoDB server not reachable, using built-in persistent store.');
      isMongoConnected = false;
    }
  } else {
    console.log('[DB] No MONGO_URI provided, using built-in persistent store.');
  }
}

// Data Store Accessors
export const dbStore = {
  isMongo: () => isMongoConnected,
  getUsers: () => memoryDb.users,
  findUserById: (id: string) => memoryDb.users.find((u) => u._id === id),
  findUserByEmail: (email: string) =>
    memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findUserByUsername: (username: string) =>
    memoryDb.users.find((u) => u.username.toLowerCase() === username.toLowerCase()),
  createUser: (user: IUserDoc) => {
    memoryDb.users.push(user);
    saveMemoryDb();
    return user;
  },
  updateUser: (id: string, updates: Partial<IUserDoc>) => {
    const idx = memoryDb.users.findIndex((u) => u._id === id);
    if (idx !== -1) {
      memoryDb.users[idx] = { ...memoryDb.users[idx], ...updates };
      saveMemoryDb();
      return memoryDb.users[idx];
    }
    return null;
  },
  getGames: () => memoryDb.games,
  findGameById: (id: string) => memoryDb.games.find((g) => g._id === id),
  findGamesByUser: (userId: string) =>
    memoryDb.games.filter(
      (g) => g.whitePlayer.id === userId || g.blackPlayer.id === userId
    ),
  createGame: (game: IGameDoc) => {
    memoryDb.games.unshift(game);
    saveMemoryDb();
    return game;
  },
  updateGame: (id: string, updates: Partial<IGameDoc>) => {
    const idx = memoryDb.games.findIndex((g) => g._id === id);
    if (idx !== -1) {
      memoryDb.games[idx] = { ...memoryDb.games[idx], ...updates };
      saveMemoryDb();
      return memoryDb.games[idx];
    }
    return null;
  },
};
