import { Request, Response } from 'express';
import { dbStore } from '../config/db';

export async function getUserStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = dbStore.findUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userGames = dbStore.findGamesByUser(id);

    const winRate =
      user.gamesPlayed > 0
        ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
        : 0;

    let title = 'Novice';
    if (user.rating >= 2500) title = 'Grandmaster (GM)';
    else if (user.rating >= 2200) title = 'International Master (IM)';
    else if (user.rating >= 2000) title = 'Candidate Master (CM)';
    else if (user.rating >= 1700) title = 'Expert';
    else if (user.rating >= 1400) title = 'Intermediate';

    return res.status(200).json({
      stats: {
        userId: user._id,
        username: user.username,
        rating: user.rating,
        title,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
        gamesDrawn: user.gamesDrawn,
        winRate,
        recentGames: userGames.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
}
