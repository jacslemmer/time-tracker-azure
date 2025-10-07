import dotenv from 'dotenv';
import { createDbPool, DbConnection } from '../utils/database';

dotenv.config();

// Pure function to get database configuration
export const getDatabaseConfig = (): string => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return connectionString;
};

// Initialize database pool
export const initializeDatabase = (): DbConnection => {
  const connectionString = getDatabaseConfig();
  const pool = createDbPool(connectionString);

  // Set up event handlers
  pool.on('connect', () => {
    console.log('✅ Database connected successfully');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
  });

  return pool;
};
