import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err.message);
  console.error('❌ Stack:', err.stack);
  console.error('❌ Request path:', req.path);
  console.error('❌ Request method:', req.method);

  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
    path: req.path
  });
};
