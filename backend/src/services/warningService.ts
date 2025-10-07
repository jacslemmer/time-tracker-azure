import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { DbConnection, queryRows } from '../utils/database';
import { AsyncResult } from '../utils/Result';
import { isLongRunningSession } from '../domain/time';

export interface WarningServiceDeps {
  readonly pool: DbConnection;
}

export interface Warning {
  readonly type: 'long-session';
  readonly message: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly hours: string;
}

interface RunningProject {
  readonly id: string;
  readonly name: string;
  readonly start_time: number | null;
  readonly is_running: boolean;
}

// Pure function to create warning
const createWarning = (project: RunningProject, elapsed: number): Warning => {
  const hours = (elapsed / (1000 * 60 * 60)).toFixed(1);
  return {
    type: 'long-session',
    message: `Timer has been running for ${hours} hours. Did you forget to stop it?`,
    projectId: project.id,
    projectName: project.name,
    hours,
  };
};

// Pure function to filter and map projects to warnings
const projectsToWarnings = (projects: ReadonlyArray<RunningProject>): ReadonlyArray<Warning> =>
  projects
    .filter((project) => project.start_time && isLongRunningSession(project.start_time, 8))
    .map((project) => {
      const elapsed = Date.now() - project.start_time!;
      return createWarning(project, elapsed);
    });

// Get warnings for user
export const getWarnings =
  ({ pool }: WarningServiceDeps) =>
  (userId: string): AsyncResult<any, ReadonlyArray<Warning>> =>
    pipe(
      queryRows<RunningProject>(
        pool,
        `SELECT id, name, start_time, is_running
         FROM projects
         WHERE user_id = $1 AND is_running = true`,
        [userId]
      ),
      TE.map(projectsToWarnings)
    );
