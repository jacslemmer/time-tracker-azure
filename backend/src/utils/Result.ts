import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

// Result type aliases for clarity
export type Result<E, A> = E.Either<E, A>;
export type AsyncResult<E, A> = TE.TaskEither<E, A>;

// Common error types
export interface AppError {
  readonly type: string;
  readonly message: string;
  readonly statusCode: number;
}

export const makeError = (
  type: string,
  message: string,
  statusCode: number = 500
): AppError => ({
  type,
  message,
  statusCode,
});

// Error constructors
export const notFoundError = (message: string): AppError =>
  makeError('NOT_FOUND', message, 404);

export const validationError = (message: string): AppError =>
  makeError('VALIDATION_ERROR', message, 400);

export const authenticationError = (message: string): AppError =>
  makeError('AUTHENTICATION_ERROR', message, 401);

export const databaseError = (message: string): AppError =>
  makeError('DATABASE_ERROR', message, 500);

export const conflictError = (message: string): AppError =>
  makeError('CONFLICT', message, 409);

// Utility functions
export const success = <A>(value: A): Result<AppError, A> => E.right(value);

export const failure = <A = never>(error: AppError): Result<AppError, A> =>
  E.left(error);

export const asyncSuccess = <A>(value: A): AsyncResult<AppError, A> =>
  TE.right(value);

export const asyncFailure = <A = never>(error: AppError): AsyncResult<AppError, A> =>
  TE.left(error);

// Convert Promise to TaskEither
export const tryCatch = <A>(
  f: () => Promise<A>,
  onError: (e: unknown) => AppError
): AsyncResult<AppError, A> => TE.tryCatch(f, onError);

// Export fp-ts utilities for convenience
export { pipe, flow } from 'fp-ts/function';
export { map, chain, fold, getOrElse, mapLeft } from 'fp-ts/Either';
export {
  map as mapAsync,
  chain as chainAsync,
  fold as foldAsync,
  getOrElse as getOrElseAsync,
  mapLeft as mapLeftAsync,
} from 'fp-ts/TaskEither';
