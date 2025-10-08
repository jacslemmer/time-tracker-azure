import { Router } from 'express';
import { DbConnection } from '../utils/database';
import bcrypt from 'bcryptjs';

export const createDebugRouter = (pool?: DbConnection): Router => {
  const router = Router();

  router.get('/debug', (req, res) => {
    res.json({
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? '***set***' : 'NOT SET',
        JWT_SECRET: process.env.JWT_SECRET ? '***set***' : 'NOT SET',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      }
    });
  });

  router.post('/test-db', async (req, res) => {
    if (!pool) {
      return res.status(500).json({ error: 'No database pool' });
    }

    try {
      // Test database connection
      const result = await pool.query('SELECT NOW()');

      // Test bcrypt
      const hash = await bcrypt.hash('test123', 10);
      const isValid = await bcrypt.compare('test123', hash);

      res.json({
        success: true,
        dbTime: result.rows[0].now,
        bcryptWorks: isValid
      });
    } catch (error) {
      res.status(500).json({
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown'
      });
    }
  });

  router.post('/simple-register', async (req, res) => {
    if (!pool) {
      return res.status(500).json({ error: 'No database pool' });
    }

    try {
      const { email, password } = req.body;

      // Validate
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
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

      res.status(201).json({
        success: true,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Simple register error:', error);
      res.status(500).json({
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown'
      });
    }
  });

  return router;
};
