import { Router, Request } from 'express';
import { DbConnection } from '../utils/database';
import { makeHandler, makeHandlerWithStatus } from '../utils/handler';
import * as AuthService from '../services/authService';

export const createAuthRouter = (pool: DbConnection): Router => {
  const router = Router();
  const deps = { pool };

  // POST /api/auth/register
  router.post(
    '/register',
    makeHandlerWithStatus((req: Request) => {
      const { email, password } = req.body;
      return AuthService.register(deps)(email, password);
    }, 201)
  );

  // POST /api/auth/login
  router.post(
    '/login',
    makeHandler((req: Request) => {
      const { email, password } = req.body;
      return AuthService.login(deps)(email, password);
    })
  );

  return router;
};
