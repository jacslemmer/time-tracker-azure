import { Request, Response } from 'express';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { AsyncResult, AppError } from './Result';

// Helper to handle AsyncResult and send response
export const handleAsyncResult =
  <T>(asyncResult: AsyncResult<AppError, T>) =>
  async (res: Response): Promise<void> => {
    const result = await asyncResult();

    pipe(
      result,
      (either) => {
        if (either._tag === 'Left') {
          const error = either.left;
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.json(either.right);
        }
      }
    );
  };

// Helper to create route handler from AsyncResult
export const makeHandler =
  <T>(
    fn: (req: Request) => AsyncResult<AppError, T>
  ) =>
  async (req: Request, res: Response): Promise<void> => {
    await handleAsyncResult(fn(req))(res);
  };

// Helper for handlers that need to return specific status codes
export const makeHandlerWithStatus =
  <T>(
    fn: (req: Request) => AsyncResult<AppError, T>,
    successStatus: number = 200
  ) =>
  async (req: Request, res: Response): Promise<void> => {
    const result = await fn(req)();

    pipe(
      result,
      (either) => {
        if (either._tag === 'Left') {
          const error = either.left;
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(successStatus).json(either.right);
        }
      }
    );
  };
