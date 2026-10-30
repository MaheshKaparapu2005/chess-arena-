import { Request, Response } from 'express';
import { dbStore } from '../config/db';

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const users = dbStore.getUsers();

    // Sort by rating descending, then wins descending
    const sorted = [...users].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.gamesWon - a.gamesWon;
    });

    const leaderboard = sorted.map((u, index) => {
      const winRate =
        u.gamesPlayed > 0 ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0;

      let title = 'Novice';
      if (u.rating >= 2500) title = 'Grandmaster (GM)';
      else if (u.rating >= 2200) title = 'International Master (IM)';
      else if (u.rating >= 2000) title = 'Candidate Master (CM)';
      else if (u.rating >= 1700) title = 'Expert';
      else if (u.rating >= 1400) title = 'Intermediate';

      return {
        rank: index + 1,
        id: u._id,
        username: u.username,
        rating: u.rating,
        title,
        gamesPlayed: u.gamesPlayed,
        gamesWon: u.gamesWon,
        gamesLost: u.gamesLost,
        gamesDrawn: u.gamesDrawn,
        winRate: `${winRate}%`,
      };
    });

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ message: 'Failed to generate leaderboard' });
  }
}
