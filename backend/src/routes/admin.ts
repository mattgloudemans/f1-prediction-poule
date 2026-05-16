import express from 'express';
import {
  getAllUsers,
  deleteUser,
  getCronJobs,
  triggerDriverStandingsSync,
  triggerRaceResultsSync,
  sendBroadcastToAllUsers,
  setUserPassword,
  changeAdminPassword
} from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All admin routes require admin authentication
router.get('/users', authenticateAdmin, getAllUsers);
router.delete('/users/:id', authenticateAdmin, deleteUser);
router.post('/users/:userId/password', authenticateAdmin, setUserPassword);
router.post('/admin-password', authenticateAdmin, changeAdminPassword);

// Cronjob management
router.get('/cronjobs', authenticateAdmin, getCronJobs);
router.post('/cronjobs/sync-driver-standings', authenticateAdmin, triggerDriverStandingsSync);
router.post('/cronjobs/sync-race-results', authenticateAdmin, triggerRaceResultsSync);

// Broadcast email
router.post('/broadcast', authenticateAdmin, sendBroadcastToAllUsers);

export default router;
