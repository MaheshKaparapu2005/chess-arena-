import { Router } from 'express';
import {
  createGame,
  getGames,
  getGameById,
  saveCompletedGame,
} from '../controllers/gameController';

const router = Router();

router.post('/', createGame as any);
router.get('/', getGames as any);
router.get('/:id', getGameById as any);
router.put('/:id', saveCompletedGame as any);
router.post('/:id/save', saveCompletedGame as any);

export default router;
