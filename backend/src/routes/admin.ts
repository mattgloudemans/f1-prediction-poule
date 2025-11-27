import express from 'express';
import {
  getAllUsers,
  deleteUser,
  getCronJobs,
  triggerDriverStandingsSync,
  triggerRaceResultsSync
} from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All admin routes require admin authentication
router.get('/users', authenticateAdmin, getAllUsers);
router.delete('/users/:id', authenticateAdmin, deleteUser);

// Cronjob management
router.get('/cronjobs', authenticateAdmin, getCronJobs);
router.post('/cronjobs/sync-driver-standings', authenticateAdmin, triggerDriverStandingsSync);
router.post('/cronjobs/sync-race-results', authenticateAdmin, triggerRaceResultsSync);

export default router;
