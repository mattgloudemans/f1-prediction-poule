import { Request, Response } from 'express';
import { query } from '../config/database';
import path from 'path';

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate avatar URL
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user's avatar in database
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Remove avatar from database
    await query(
      'UPDATE users SET avatar_url = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
};
