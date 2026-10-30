import { GameRecord, LeaderboardEntry } from '../models/chess';
import { authService } from './auth.service';

class GameService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      return data.leaderboard || [];
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      return [];
    }
  }

  public async getUserStats(userId: string): Promise<any> {
    try {
      const res = await fetch(`/api/users/${userId}/stats`);
      if (!res.ok) throw new Error('Failed to fetch user stats');
      const data = await res.json();
      return data.stats;
    } catch (err) {
      console.error('Error fetching user stats:', err);
      return null;
    }
  }

  public async getGames(userId?: string): Promise<GameRecord[]> {
    try {
      const url = userId ? `/api/games?userId=${userId}` : '/api/games';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch games');
      const data = await res.json();
      return data.games || [];
    } catch (err) {
      console.error('Error fetching games:', err);
      return [];
    }
  }

  public async getGameById(id: string): Promise<GameRecord | null> {
    try {
      const res = await fetch(`/api/games/${id}`);
      if (!res.ok) throw new Error('Failed to fetch game');
      const data = await res.json();
      return data.game;
    } catch (err) {
      console.error('Error fetching game:', err);
      return null;
    }
  }

  public async saveGame(gameData: Partial<GameRecord>): Promise<GameRecord | null> {
    try {
      const gameId = gameData._id || `game_${Date.now()}`;
      const res = await fetch(`/api/games/${gameId}/save`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(gameData),
      });
      if (!res.ok) throw new Error('Failed to save game');
      const data = await res.json();
      return data.game;
    } catch (err) {
      console.error('Error saving game:', err);
      return null;
    }
  }
}

export const gameService = new GameService();
