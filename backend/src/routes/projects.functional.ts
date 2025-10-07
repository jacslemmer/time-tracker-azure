import { Router } from 'express';
import { DbConnection } from '../utils/database';
import { makeHandler, makeHandlerWithStatus } from '../utils/handler';
import { AuthRequest } from '../middleware/auth';
import * as ProjectService from '../services/projectService';
import * as TimeEntryService from '../services/timeEntryService';
import { createTrackedEntry } from '../domain/timeEntry';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as TimeEntryRepo from '../repositories/timeEntryRepository';

export const createProjectRouter = (pool: DbConnection): Router => {
  const router = Router();
  const deps = { pool };

  // GET /api/projects
  router.get(
    '/',
    makeHandler((req: AuthRequest) =>
      ProjectService.getAllProjects(deps)(req.user!.id)
    )
  );

  // POST /api/projects
  router.post(
    '/',
    makeHandlerWithStatus((req: AuthRequest) => {
      const { name, clientName, hourlyRate, budget } = req.body;
      return ProjectService.createProject(deps)(req.user!.id, {
        name,
        clientName: clientName || '',
        hourlyRate: parseFloat(hourlyRate),
        budget: parseFloat(budget),
      });
    }, 201)
  );

  // PUT /api/projects/:id
  router.put(
    '/:id',
    makeHandler((req: AuthRequest) => {
      const { name, clientName, hourlyRate, budget } = req.body;
      return ProjectService.updateProject(deps)(req.params.id, req.user!.id, {
        name,
        clientName,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
      });
    })
  );

  // DELETE /api/projects/:id
  router.delete(
    '/:id',
    makeHandler((req: AuthRequest) =>
      pipe(
        ProjectService.deleteProject(deps)(req.params.id, req.user!.id),
        TE.map(() => ({ success: true }))
      )
    )
  );

  // POST /api/projects/:id/timer/start
  router.post(
    '/:id/timer/start',
    makeHandler((req: AuthRequest) =>
      ProjectService.startProjectTimer(deps)(req.params.id, req.user!.id)
    )
  );

  // POST /api/projects/:id/timer/stop
  router.post(
    '/:id/timer/stop',
    makeHandler((req: AuthRequest) =>
      pipe(
        ProjectService.stopProjectTimer(deps)(req.params.id, req.user!.id),
        TE.chain(({ project, elapsed }) => {
          const entry = createTrackedEntry(
            project.id,
            req.user!.id,
            project.start_time!,
            Date.now()
          );

          return pipe(
            TimeEntryRepo.create(pool)(entry),
            TE.map((createdEntry) => ({
              project,
              entry: createdEntry,
            }))
          );
        })
      )
    )
  );

  // GET /api/projects/:id/timer/current
  router.get(
    '/:id/timer/current',
    makeHandler((req: AuthRequest) =>
      ProjectService.getCurrentTimerSeconds(deps)(req.params.id, req.user!.id)
    )
  );

  return router;
};
