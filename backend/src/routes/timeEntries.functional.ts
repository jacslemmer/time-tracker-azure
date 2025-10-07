import { Router } from 'express';
import { DbConnection } from '../utils/database';
import { makeHandler, makeHandlerWithStatus } from '../utils/handler';
import { AuthRequest } from '../middleware/auth';
import * as TimeEntryService from '../services/timeEntryService';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

export const createTimeEntryRouter = (pool: DbConnection): Router => {
  const router = Router();
  const deps = { pool };

  // GET /api/time-entries
  router.get(
    '/',
    makeHandler((req: AuthRequest) => {
      const { projectId } = req.query;

      return projectId
        ? TimeEntryService.getProjectTimeEntries(deps)(
            projectId as string,
            req.user!.id
          )
        : TimeEntryService.getAllTimeEntries(deps)(req.user!.id);
    })
  );

  // POST /api/time-entries/:projectId/manual
  router.post(
    '/:projectId/manual',
    makeHandlerWithStatus((req: AuthRequest) => {
      const { hours } = req.body;
      return TimeEntryService.addManualTimeEntry(deps)(
        req.params.projectId,
        req.user!.id,
        parseFloat(hours)
      );
    }, 201)
  );

  // PUT /api/time-entries/:id
  router.put(
    '/:id',
    makeHandler((req: AuthRequest) => {
      const { hours } = req.body;
      return pipe(
        TimeEntryService.updateTimeEntryHours(deps)(
          req.params.id,
          req.user!.id,
          parseFloat(hours)
        ),
        TE.map(({ project }) => ({ success: true, project }))
      );
    })
  );

  // DELETE /api/time-entries/:id
  router.delete(
    '/:id',
    makeHandler((req: AuthRequest) =>
      pipe(
        TimeEntryService.deleteTimeEntry(deps)(req.params.id, req.user!.id),
        TE.map(({ project }) => ({ success: true, project }))
      )
    )
  );

  return router;
};
