import express from 'express';
import {
  getLeaderboard,
  getTopThree,
  getUserRank
} from '../controllers/leaderboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', getLeaderboard);
router.get('/top-three', getTopThree);
router.get('/rank', authenticate, getUserRank);

export default router;
