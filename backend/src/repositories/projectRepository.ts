import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { DbConnection, queryRows, queryOneOrFail, query } from '../utils/database';
import { AsyncResult, notFoundError } from '../utils/Result';
import { Project, CreateProjectData } from '../domain/project';

// Pure repository functions
export const findAllByUserId =
  (pool: DbConnection) =>
  (userId: string): AsyncResult<any, ReadonlyArray<Project>> =>
    queryRows<Project>(
      pool,
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

export const findById =
  (pool: DbConnection) =>
  (id: string, userId: string): AsyncResult<any, Project> =>
    queryOneOrFail<Project>(
      pool,
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId],
      'Project not found'
    );

export const create =
  (pool: DbConnection) =>
  (
    id: string,
    userId: string,
    data: CreateProjectData
  ): AsyncResult<any, Project> =>
    pipe(
      query<Project>(
        pool,
        `INSERT INTO projects
         (id, user_id, name, client_name, hourly_rate, budget, total_seconds, is_running)
         VALUES ($1, $2, $3, $4, $5, $6, 0, false)
         RETURNING *`,
        [id, userId, data.name, data.clientName, data.hourlyRate, data.budget]
      ),
      TE.map((result) => result.rows[0])
    );

export const update =
  (pool: DbConnection) =>
  (
    id: string,
    userId: string,
    updates: Record<string, any>
  ): AsyncResult<any, Project> => {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    });

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    return pipe(
      query<Project>(
        pool,
        `UPDATE projects SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        values
      ),
      TE.chain((result) =>
        result.rows.length > 0
          ? TE.right(result.rows[0])
          : TE.left(notFoundError('Project not found'))
      )
    );
  };

export const deleteById =
  (pool: DbConnection) =>
  (id: string, userId: string): AsyncResult<any, boolean> =>
    pipe(
      query(pool, 'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id', [
        id,
        userId,
      ]),
      TE.map((result) => result.rows.length > 0)
    );

export const findRunningProjects =
  (pool: DbConnection) =>
  (userId: string): AsyncResult<any, ReadonlyArray<Project>> =>
    queryRows<Project>(
      pool,
      'SELECT * FROM projects WHERE user_id = $1 AND is_running = true',
      [userId]
    );

export const startTimer =
  (pool: DbConnection) =>
  (id: string, userId: string, startTime: number): AsyncResult<any, Project> =>
    update(pool)(id, userId, { is_running: true, start_time: startTime });

export const stopTimer =
  (pool: DbConnection) =>
  (
    id: string,
    userId: string,
    addedSeconds: number
  ): AsyncResult<any, Project> =>
    pipe(
      query<Project>(
        pool,
        `UPDATE projects
         SET is_running = false,
             start_time = NULL,
             total_seconds = total_seconds + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [addedSeconds, id, userId]
      ),
      TE.chain((result) =>
        result.rows.length > 0
          ? TE.right(result.rows[0])
          : TE.left(notFoundError('Project not found'))
      )
    );
