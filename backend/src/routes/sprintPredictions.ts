import { Router } from 'express';
import { submitSprintPrediction, getSprintPrediction, getUserSprintPredictions } from '../controllers/sprintPredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.post('/', authenticate, submitSprintPrediction);
router.get('/', authenticate, getUserSprintPredictions);
router.get('/:raceId', authenticate, getSprintPrediction);

export default router;
