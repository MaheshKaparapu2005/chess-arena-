import { Router } from 'express';
import { getUserStats } from '../controllers/statsController';

const router = Router();

router.get('/:id/stats', getUserStats);

export default router;
