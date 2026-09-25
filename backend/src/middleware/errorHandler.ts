import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const requestId = (req as any).requestId || `req_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 400 ? 'INVALID_REQUEST' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'INTERNAL_SERVER_ERROR');
  
  const message = err.message || 'An unexpected server error occurred.';

  // Never expose raw stack traces in production
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(`[Error] Request ${requestId} failed:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {})
    },
    requestId
  });
}
