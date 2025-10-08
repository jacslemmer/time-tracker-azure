import { Pool, QueryResult, QueryResultRow } from 'pg';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { AsyncResult, AppError, databaseError, tryCatch } from './Result';

export type DbConnection = Pool;

// Pure function to create database pool
export const createDbPool = (connectionString: string): DbConnection =>
  new Pool({
    connectionString,
    // SSL disabled for containerized PostgreSQL
    ssl: false,
  });

// Execute query as AsyncResult
export const query = <T extends QueryResultRow = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<AppError, QueryResult<T>> =>
  tryCatch(
    () => pool.query<T>(text, params),
    (error): AppError =>
      databaseError(
        error instanceof Error ? error.message : 'Database query failed'
      )
  );

// Execute query and return rows
export const queryRows = <T extends QueryResultRow = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<AppError, T[]> =>
  pipe(
    query<T>(pool, text, params),
    TE.map((result) => result.rows)
  );

// Execute query and return single row or error
export const queryOne = <T extends QueryResultRow = any>(
  pool: DbConnection,
  text: string,
  params?: any[]
): AsyncResult<AppError, T> =>
  pipe(
    queryRows<T>(pool, text, params),
    TE.chain((rows) =>
      rows.length > 0
        ? TE.right(rows[0])
        : TE.left(databaseError('No rows returned'))
    )
  );

// Execute query expecting exactly one row, else error
export const queryOneOrFail = <T extends QueryResultRow = any>(
  pool: DbConnection,
  text: string,
  params?: any[],
  errorMsg: string = 'Record not found'
): AsyncResult<AppError, T> =>
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
  work: (client: any) => AsyncResult<AppError, T>
): AsyncResult<AppError, T> =>
  pipe(
    tryCatch(
      () => pool.connect(),
      (error): AppError => databaseError(error instanceof Error ? error.message : 'Failed to connect')
    ),
    TE.chain((client) =>
      pipe(
        tryCatch(
          () => client.query('BEGIN'),
          (error): AppError => databaseError(error instanceof Error ? error.message : 'Failed to begin transaction')
        ),
        TE.chain(() => work(client)),
        TE.chainFirst(() =>
          tryCatch(
            () => client.query('COMMIT'),
            (error): AppError => databaseError(error instanceof Error ? error.message : 'Failed to commit')
          )
        ),
        TE.mapLeft((error) => {
          client.query('ROLLBACK').catch(console.error);
          return error;
        }),
        TE.chainFirst(() => TE.fromIO(() => client.release()))
      )
    )
  );
