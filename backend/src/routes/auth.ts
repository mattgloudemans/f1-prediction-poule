import express from 'express';
import {
  getProfile,
  registerWithPassword,
  loginWithPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Password authentication
router.post('/register-password', registerWithPassword);
router.post('/login-password', loginWithPassword);

// Profile
router.get('/profile', authenticate, getProfile);

export default router;
