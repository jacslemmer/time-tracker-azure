import { Pool, QueryResult } from 'pg';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { AsyncResult, databaseError, tryCatch } from './Result';

export type DbConnection = Pool;

// Pure function to create database pool
export const createDbPool = (connectionString: string): DbConnection =>
  new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

// Execute query as AsyncResult
export const query = <T = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<any, QueryResult<T>> =>
  tryCatch(
    () => pool.query<T>(text, params),
    (error) =>
      databaseError(
        error instanceof Error ? error.message : 'Database query failed'
      )
  );

// Execute query and return rows
export const queryRows = <T = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<any, T[]> =>
  pipe(
    query<T>(pool, text, params),
    TE.map((result) => result.rows)
  );

// Execute query and return single row or error
export const queryOne = <T = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<any, T> =>
  pipe(
    queryRows<T>(pool, text, params),
    TE.chain((rows) =>
      rows.length > 0
        ? TE.right(rows[0])
        : TE.left(databaseError('No rows returned'))
    )
  );

// Execute query expecting exactly one row, else error
export const queryOneOrFail = <T = any>(
  pool: DbConnection,
  text: string,
  params?: any[],
  errorMsg: string = 'Record not found'
): AsyncResult<any, T> =>
  pipe(
    queryRows<T>(pool, text, params),
    TE.chain((rows) =>
      rows.length === 1
        ? TE.right(rows[0])
        : TE.left(databaseError(errorMsg))
    )
  );

// Transaction helper
export const withTransaction = <T>(
  pool: DbConnection,
  work: (client: any) => AsyncResult<any, T>
): AsyncResult<any, T> =>
  pipe(
    tryCatch(() => pool.connect(), databaseError),
    TE.chain((client) =>
      pipe(
        tryCatch(() => client.query('BEGIN'), databaseError),
        TE.chain(() => work(client)),
        TE.chainFirst(() =>
          tryCatch(() => client.query('COMMIT'), databaseError)
        ),
        TE.mapLeft((error) => {
          client.query('ROLLBACK').catch(console.error);
          return error;
        }),
        TE.chainFirst(() => TE.fromIO(() => client.release()))
      )
    )
  );
