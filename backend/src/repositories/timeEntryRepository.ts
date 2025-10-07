import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { DbConnection, queryRows, queryOneOrFail, query } from '../utils/database';
import { AsyncResult, notFoundError } from '../utils/Result';
import { TimeEntry } from '../domain/timeEntry';

export const findAllByUserId =
  (pool: DbConnection) =>
  (userId: string): AsyncResult<any, ReadonlyArray<TimeEntry>> =>
    queryRows<TimeEntry>(
      pool,
      'SELECT * FROM time_entries WHERE user_id = $1 ORDER BY start_time DESC',
      [userId]
    );

export const findAllByProjectId =
  (pool: DbConnection) =>
  (projectId: string, userId: string): AsyncResult<any, ReadonlyArray<TimeEntry>> =>
    queryRows<TimeEntry>(
      pool,
      'SELECT * FROM time_entries WHERE project_id = $1 AND user_id = $2 ORDER BY start_time DESC',
      [projectId, userId]
    );

export const findById =
  (pool: DbConnection) =>
  (id: string, userId: string): AsyncResult<any, TimeEntry> =>
    queryOneOrFail<TimeEntry>(
      pool,
      'SELECT * FROM time_entries WHERE id = $1 AND user_id = $2',
      [id, userId],
      'Time entry not found'
    );

export const create =
  (pool: DbConnection) =>
  (entry: Omit<TimeEntry, 'created_at'>): AsyncResult<any, TimeEntry> =>
    pipe(
      query<TimeEntry>(
        pool,
        `INSERT INTO time_entries
         (id, project_id, user_id, seconds, start_time, end_time, is_manual)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          entry.id,
          entry.project_id,
          entry.user_id,
          entry.seconds,
          entry.start_time,
          entry.end_time,
          entry.is_manual,
        ]
      ),
      TE.map((result) => result.rows[0])
    );

export const updateSeconds =
  (pool: DbConnection) =>
  (id: string, userId: string, seconds: number): AsyncResult<any, TimeEntry> =>
    pipe(
      query<TimeEntry>(
        pool,
        'UPDATE time_entries SET seconds = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [seconds, id, userId]
      ),
      TE.chain((result) =>
        result.rows.length > 0
          ? TE.right(result.rows[0])
          : TE.left(notFoundError('Time entry not found'))
      )
    );

export const deleteById =
  (pool: DbConnection) =>
  (id: string, userId: string): AsyncResult<any, TimeEntry> =>
    pipe(
      query<TimeEntry>(
        pool,
        'DELETE FROM time_entries WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      ),
      TE.chain((result) =>
        result.rows.length > 0
          ? TE.right(result.rows[0])
          : TE.left(notFoundError('Time entry not found'))
      )
    );

export const deleteAllByProjectId =
  (pool: DbConnection) =>
  (projectId: string, userId: string): AsyncResult<any, number> =>
    pipe(
      query(
        pool,
        'DELETE FROM time_entries WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      ),
      TE.map((result) => result.rowCount || 0)
    );
