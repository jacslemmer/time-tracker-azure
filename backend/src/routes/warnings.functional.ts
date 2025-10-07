import { Router } from 'express';
import { DbConnection } from '../utils/database';
import { makeHandler } from '../utils/handler';
import { AuthRequest } from '../middleware/auth';
import * as WarningService from '../services/warningService';

export const createWarningRouter = (pool: DbConnection): Router => {
  const router = Router();
  const deps = { pool };

  // GET /api/warnings
  router.get(
    '/',
    makeHandler((req: AuthRequest) =>
      WarningService.getWarnings(deps)(req.user!.id)
    )
  );

  return router;
};
