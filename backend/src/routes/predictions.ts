import express from 'express';
import {
  submitPrediction,
  getPrediction,
  getUserPredictions
} from '../controllers/predictionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, submitPrediction);
router.get('/user', authenticate, getUserPredictions);
router.get('/:raceId', authenticate, getPrediction);

export default router;
