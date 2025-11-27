import express from 'express';
import {
  getRaces,
  getRace,
  getNextRace,
  getUpcomingRaces,
  getRaceResults,
  getQualifyingOrder,
  syncRaces,
  syncRaceResults
} from '../controllers/raceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', getRaces);
router.get('/next', getNextRace);
router.get('/upcoming', getUpcomingRaces);
router.get('/:id', getRace);
router.get('/:id/results', getRaceResults);
router.get('/:id/qualifying', getQualifyingOrder);
router.post('/sync', authenticate, syncRaces); // Protected: admin use
router.post('/:id/sync-results', authenticate, syncRaceResults); // Protected: admin use

export default router;
