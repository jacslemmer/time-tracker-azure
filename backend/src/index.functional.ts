import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { initializeDatabase } from './config/database.functional';
import { createProjectRouter } from './routes/projects.functional';
import { createTimeEntryRouter } from './routes/timeEntries.functional';
import { createAuthRouter } from './routes/auth.functional';
import { createWarningRouter } from './routes/warnings.functional';
import reportRoutes from './routes/reports';

dotenv.config();

// Pure configuration functions
const getPort = (): number => parseInt(process.env.PORT || '3000', 10);

const getCorsOrigin = (): string =>
  process.env.CORS_ORIGIN || 'http://localhost:5173';

// Application factory function
const createApp = () => {
  const app = express();
  const pool = initializeDatabase();

  // Middleware
  app.use(
    cors({
      origin: getCorsOrigin(),
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', createAuthRouter(pool));
  app.use('/api/projects', authenticate, createProjectRouter(pool));
  app.use('/api/time-entries', authenticate, createTimeEntryRouter(pool));
  app.use('/api/reports', authenticate, reportRoutes);
  app.use('/api/warnings', authenticate, createWarningRouter(pool));

  // Error handler
  app.use(errorHandler);

  return { app, pool };
};

// Start server function
const startServer = (port: number) => {
  const { app } = createApp();

  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
  });
};

// Run if this is the main module
if (require.main === module) {
  const port = getPort();
  startServer(port);
}

export { createApp, startServer };
