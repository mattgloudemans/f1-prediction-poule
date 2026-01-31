import express from 'express';
import {
  register,
  login,
  verify,
  getProfile,
  registerWithPassword,
  loginWithPassword,
  setPassword
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Magic link authentication
router.post('/register', register);
router.post('/login', login);
router.get('/verify', verify);

// Password authentication
router.post('/register-password', registerWithPassword);
router.post('/login-password', loginWithPassword);
router.post('/set-password', authenticate, setPassword);

// Profile
router.get('/profile', authenticate, getProfile);

export default router;
