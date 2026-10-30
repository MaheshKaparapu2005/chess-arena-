import { Request, Response } from 'express';
import { dbStore, IGameDoc } from '../config/db';
import { GameModel } from '../models/Game';
import { AuthRequest } from '../middleware/auth';

// Standard ELO rating update calculation
function calculateEloChange(ratingA: number, ratingB: number, scoreA: number, kFactor = 32): number {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(kFactor * (scoreA - expectedA));
}

export async function createGame(req: AuthRequest, res: Response) {
  try {
    const { whitePlayer, blackPlayer, timeControl, mode } = req.body;

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newGame: IGameDoc = {
      _id: gameId,
      whitePlayer: whitePlayer || { id: req.user?.id || 'guest_white', username: req.user?.username || 'White' },
      blackPlayer: blackPlayer || { id: 'computer', username: 'ChessBot (1400)' },
      moves: [],
      boardState: {},
      result: 'ongoing',
      status: 'in_progress',
      timeControl: timeControl || 600,
      startedAt: new Date().toISOString(),
    };

    dbStore.createGame(newGame);

    if (dbStore.isMongo()) {
      try {
        await GameModel.create(newGame);
      } catch (err) {
        console.warn('Mongo background game create warning:', err);
      }
    }

    return res.status(201).json({ message: 'Game initialized', game: newGame });
  } catch (error) {
    console.error('Error creating game:', error);
    return res.status(500).json({ message: 'Failed to create game' });
  }
}

export async function getGames(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    if (userId) {
      const userGames = dbStore.findGamesByUser(userId);
      return res.status(200).json({ games: userGames });
    }
    const allGames = dbStore.getGames().slice(0, 50);
    return res.status(200).json({ games: allGames });
  } catch (error) {
    console.error('Error fetching games:', error);
    return res.status(500).json({ message: 'Failed to fetch games' });
  }
}

export async function getGameById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const game = dbStore.findGameById(id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    return res.status(200).json({ game });
  } catch (error) {
    console.error('Error fetching game by id:', error);
    return res.status(500).json({ message: 'Failed to fetch game' });
  }
}

export async function saveCompletedGame(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { moves, result, status, reason, endedAt, boardState } = req.body;

    const game = dbStore.findGameById(id);
    if (!game) {
      // If not existing, create it
      const newGame: IGameDoc = {
        _id: id,
        whitePlayer: req.body.whitePlayer || { id: 'player_w', username: 'White' },
        blackPlayer: req.body.blackPlayer || { id: 'player_b', username: 'Black' },
        moves: moves || [],
        boardState: boardState || {},
        result: result || 'draw',
        status: status || 'completed',
        reason: reason || 'Game finished',
        timeControl: req.body.timeControl || 600,
        startedAt: req.body.startedAt || new Date().toISOString(),
        endedAt: endedAt || new Date().toISOString(),
      };
      dbStore.createGame(newGame);
      updatePlayersStats(newGame);
      return res.status(201).json({ message: 'Game saved', game: newGame });
    }

    const updated = dbStore.updateGame(id, {
      moves: moves || game.moves,
      result: result || game.result,
      status: status || game.status,
      reason: reason || game.reason,
      endedAt: endedAt || new Date().toISOString(),
      boardState: boardState || game.boardState,
    });

    if (updated) {
      updatePlayersStats(updated);
    }

    return res.status(200).json({ message: 'Game updated', game: updated });
  } catch (error) {
    console.error('Error saving game:', error);
    return res.status(500).json({ message: 'Failed to save game' });
  }
}

function updatePlayersStats(game: IGameDoc) {
  const whiteUser = dbStore.findUserById(game.whitePlayer.id);
  const blackUser = dbStore.findUserById(game.blackPlayer.id);

  if (whiteUser) {
    let won = whiteUser.gamesWon;
    let lost = whiteUser.gamesLost;
    let drawn = whiteUser.gamesDrawn;
    let elo = whiteUser.rating;

    if (game.result === 'white') {
      won += 1;
      const opponentRating = blackUser ? blackUser.rating : 1400;
      elo += Math.max(8, calculateEloChange(whiteUser.rating, opponentRating, 1));
    } else if (game.result === 'black') {
      lost += 1;
      const opponentRating = blackUser ? blackUser.rating : 1400;
      elo = Math.max(400, elo + calculateEloChange(whiteUser.rating, opponentRating, 0));
    } else if (game.result === 'draw') {
      drawn += 1;
      const opponentRating = blackUser ? blackUser.rating : 1400;
      elo += calculateEloChange(whiteUser.rating, opponentRating, 0.5);
    }

    dbStore.updateUser(whiteUser._id, {
      gamesPlayed: whiteUser.gamesPlayed + 1,
      gamesWon: won,
      gamesLost: lost,
      gamesDrawn: drawn,
      rating: elo,
    });
  }

  if (blackUser) {
    let won = blackUser.gamesWon;
    let lost = blackUser.gamesLost;
    let drawn = blackUser.gamesDrawn;
    let elo = blackUser.rating;

    if (game.result === 'black') {
      won += 1;
      const opponentRating = whiteUser ? whiteUser.rating : 1400;
      elo += Math.max(8, calculateEloChange(blackUser.rating, opponentRating, 1));
    } else if (game.result === 'white') {
      lost += 1;
      const opponentRating = whiteUser ? whiteUser.rating : 1400;
      elo = Math.max(400, elo + calculateEloChange(blackUser.rating, opponentRating, 0));
    } else if (game.result === 'draw') {
      drawn += 1;
      const opponentRating = whiteUser ? whiteUser.rating : 1400;
      elo += calculateEloChange(blackUser.rating, opponentRating, 0.5);
    }

    dbStore.updateUser(blackUser._id, {
      gamesPlayed: blackUser.gamesPlayed + 1,
      gamesWon: won,
      gamesLost: lost,
      gamesDrawn: drawn,
      rating: elo,
    });
  }
}
