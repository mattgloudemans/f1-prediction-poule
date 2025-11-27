import express from 'express';
import { uploadAvatar, deleteAvatar } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);

export default router;
