# Chess Arena — Online Chess Game Using Full-Stack Architecture

> A complete, responsive, full-stack chess platform built with Node.js, Express, MongoDB/Mongoose, TypeScript, Socket.IO, and modern reactive architecture.

---

## 1. Project Overview

**Chess Arena** is an academic-grade, production-style web application providing a full-featured chess gaming environment. It strictly enforces official FIDE chess rules, provides interactive move assistance, features an educational rule-based best move advisor, supports passes-and-play, a computer AI opponent, and live online multiplayer with Socket.IO.

### Key Highlights
- **100% Complete Chess Rules Engine**: Validates castling, en passant, pawn promotion, king safety, pins, check, checkmate, and stalemate.
- **Move Suggestion System**: Displays legal move destinations with subtle dots on empty squares and red capture rings on attackable enemy pieces.
- **Educational Best-Move Advisor**: Evaluates board state across material balance, center control, minor piece development, king safety, and check delivery, explaining why each move is advantageous.
- **Computer Opponent**: Educational AI bot with Easy, Medium, and Hard difficulty levels.
- **Real-Time Multiplayer (Socket.IO)**: Join private rooms, synchronize moves, exchange live in-game messages, and handle draw offers/resignations.
- **User Authentication**: Secure user registration and login using **bcrypt** password hashing and **JSON Web Tokens (JWT)**.
- **MongoDB Persistence & Dynamic Leaderboard**: Stores match histories, moves in Standard Algebraic Notation (SAN), player statistics, and automatically calculates dynamic ELO ratings and leaderboard rankings.

---

## 2. Technology Stack

- **Backend**: Node.js & Express.js
- **Database**: MongoDB with Mongoose (with dual-mode fallback to persistent JSON storage)
- **Real-time WebSockets**: Socket.IO
- **Security & Authentication**: bcryptjs, JSON Web Tokens (JWT)
- **Frontend**: TypeScript, React / Angular-modular architecture, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Audio**: Web Audio API (zero external sound dependencies)

---

## 3. Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                 Chess Arena Client UI                       │
│  (ChessBoard, GameClock, MoveHistory, AssistPanel, etc.)    │
└───────────────▲─────────────────────────────▲───────────────┘
                │ REST API (JSON)             │ WebSockets (Socket.IO)
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express Server                    │
│   - Auth Controller (JWT, bcrypt)                           │
│   - Game Controller (Save results, ELO updater)             │
│   - Leaderboard & Stats Controller                          │
│   - Socket Room Manager (Server-authoritative move checks)  │
│   - Chess Rule Engine (Pins, Castling, En Passant)          │
└───────────────────────────────▲─────────────────────────────┘
                                │ Mongoose Models
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Storage                        │
│   - Users Collection (Credentials, Ratings, Win/Loss/Draw)  │
│   - Games Collection (Move History SAN, Results, Clocks)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`username`, `email`, `password`) |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| `GET` | `/api/auth/profile` | Retrieve authenticated user profile (Bearer token required) |

### Games (`/api/games`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/games` | Initialize a new chess game session |
| `GET` | `/api/games` | Retrieve recent public games or filter by `?userId=` |
| `GET` | `/api/games/:id` | Retrieve a specific game with moves and board state |
| `POST` | `/api/games/:id/save` | Persist completed game, moves, outcome, and update ELO |

### Leaderboard & Stats
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leaderboard` | Get ranked leaderboard sorted by ELO rating and win rate |
| `GET` | `/api/users/:id/stats` | Fetch detailed player statistics and recent match records |

---

## 5. Database Schema (MongoDB / Mongoose)

### `User` Collection
```typescript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  gamesLost: { type: Number, default: 0 },
  gamesDrawn: { type: Number, default: 0 },
  rating: { type: Number, default: 1200 },
  createdAt: { type: Date, default: Date.now }
}
```

### `Game` Collection
```typescript
{
  whitePlayer: { id: String, username: String, rating: Number },
  blackPlayer: { id: String, username: String, rating: Number },
  moves: [
    {
      moveNumber: Number,
      san: String,        // e.g. "Nf3", "O-O", "exd5"
      from: String,
      to: String,
      piece: String,
      captured: String,
      color: String
    }
  ],
  boardState: Object,
  result: { type: String, enum: ['white', 'black', 'draw', 'ongoing'] },
  status: { type: String, enum: ['completed', 'in_progress', 'resigned', 'timeout', 'stalemate'] },
  reason: String,
  timeControl: Number, // in seconds
  startedAt: Date,
  endedAt: Date
}
```

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js (version 18 or newer)
- npm or yarn

### 1. Clone repository & install dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
MONGO_URI=mongodb://localhost:27017/chess-arena
JWT_SECRET=your_secure_jwt_secret_key_here
PORT=3000
```
*(Note: If no external MongoDB instance is running, Chess Arena gracefully uses its built-in persistent disk storage layer automatically).*

### 3. Run Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 7. Testing Chess Rules Checklist

- **Pawn**: 1-step advance, 2-step initial jump, diagonal capture, en passant, promotion popup (Queen, Rook, Bishop, Knight).
- **Knight**: L-shape leaps over obstacles, capture enemy pieces only.
- **Bishop & Rook**: Full ray propagation blocked by friendly pieces, capture enemy terminus.
- **Queen**: 8-direction combined movement.
- **King**: Single-step safety. Cannot move to attacked square or through check.
- **Castling**: Kingside & Queenside checks for unattacked transit squares, unmoved king/rook, empty path.
- **King Safety**: Moves leaving king in check are strictly disallowed.
- **Checkmate & Stalemate**: Automatic game termination and modal presentation.
