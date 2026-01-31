import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { sendMagicLink } from '../services/emailService';

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response) => {
  try {
    const { nickname, email } = req.body;

    if (!nickname || !email) {
      return res.status(400).json({ error: 'Nickname and email are required' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR nickname = $2',
      [email, nickname]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or nickname already exists' });
    }

    // Create new user
    const result = await query(
      'INSERT INTO users (nickname, email) VALUES ($1, $2) RETURNING *',
      [nickname, email]
    );

    const user = result.rows[0];

    // Generate magic link token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Save magic link to database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query(
      'INSERT INTO magic_links (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send magic link email
    await sendMagicLink(email, token, nickname);

    res.status(201).json({
      message: 'Account created! Check your email for a login link.',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const user = result.rows[0];

    // Generate magic link token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Save magic link to database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query(
      'INSERT INTO magic_links (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send magic link email
    await sendMagicLink(email, token, user.nickname);

    res.json({ message: 'Check your email for a login link.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to send login link' });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
    };

    // Check if magic link exists and is valid
    const linkResult = await query(
      'SELECT * FROM magic_links WHERE token = $1 AND user_id = $2 AND used = FALSE AND expires_at > NOW()',
      [token, decoded.userId]
    );

    if (linkResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    // Mark link as used
    await query('UPDATE magic_links SET used = TRUE WHERE token = $1', [token]);

    // Get user data
    const userResult = await query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    const user = userResult.rows[0];

    // Generate session token
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } // 7 days session
    );

    res.json({
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatar_url: user.avatar_url,
        total_points: user.total_points
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      avatar_url: user.avatar_url,
      total_points: user.total_points,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Password-based registration
export const registerWithPassword = async (req: Request, res: Response) => {
  try {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Nickname, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR nickname = $2',
      [email, nickname]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or nickname already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user with password
    const result = await query(
      'INSERT INTO users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [nickname, email, passwordHash]
    );

    const user = result.rows[0];

    // Generate session token
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token: sessionToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatar_url: user.avatar_url,
        total_points: user.total_points
      }
    });
  } catch (error) {
    console.error('Password registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Password-based login
export const loginWithPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(400).json({
        error: 'This account uses magic link login. Please use "Send Login Link" instead, or set a password in your profile.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate session token
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatar_url: user.avatar_url,
        total_points: user.total_points
      }
    });
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Set password for existing magic-link user
export const setPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Update user with password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
};
