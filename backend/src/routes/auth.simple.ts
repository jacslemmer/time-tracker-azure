import { Router } from 'express';
import { DbConnection } from '../utils/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const createAuthRouter = (pool: DbConnection): Router => {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );

      const user = result.rows[0];

      // Generate token
      const secret = process.env.JWT_SECRET!;
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn } as jwt.SignOptions);

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown'
      });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      console.log('Login attempt:', { email: req.body?.email });
      const { email, password } = req.body;

      // Validate
      if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Find user
      console.log('Querying user:', email);
      const result = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email]
      );

      console.log('Query result rows:', result.rows.length);
      if (result.rows.length === 0) {
        console.log('User not found');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      console.log('User found:', { id: user.id, email: user.email });

      // Verify password
      console.log('Verifying password...');
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log('Password valid:', isValid);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      console.log('Generating token...');
      const secret = process.env.JWT_SECRET!;
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn } as jwt.SignOptions);

      console.log('Login successful');
      res.json({
        token,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown'
      });
    }
  });

  return router;
};
